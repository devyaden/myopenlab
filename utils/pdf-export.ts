import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { PaperSize, PaperOrientation } from "@/types/paper";
import { getPaperDimensions } from "./paper-sizes";

// Convert pixels to mm (assuming 96 DPI)
const pxToMm = (px: number) => px * 0.264583;

// Prepare ReactFlow diagrams for export
const prepareReactFlowForExport = async (
  container: HTMLElement
): Promise<void> => {
  try {
    // Find all ReactFlow canvases in the document
    const reactFlowNodes = container.querySelectorAll(".react-flow-node");
    console.log(`Found ${reactFlowNodes.length} ReactFlow diagrams to process`);

    // Process each diagram
    await Promise.all(
      Array.from(reactFlowNodes).map(async (node, index) => {
        // Get the diagram name
        const diagramName =
          node.getAttribute("data-name") || `Diagram ${index + 1}`;
        console.log(`Processing diagram: ${diagramName}`);

        // Make all ReactFlow content visible and properly rendered
        const reactFlowContainer = node.querySelector(".react-flow");
        if (reactFlowContainer) {
          // Set explicit size
          (reactFlowContainer as HTMLElement).style.width = "100%";
          (reactFlowContainer as HTMLElement).style.height = "300px";
          (reactFlowContainer as HTMLElement).style.visibility = "visible";
          (reactFlowContainer as HTMLElement).style.overflow = "visible";

          // Hide controls and minimap to avoid clutter
          const controls = reactFlowContainer.querySelector(
            ".react-flow__controls"
          );
          const minimap = reactFlowContainer.querySelector(
            ".react-flow__minimap"
          );
          if (controls) (controls as HTMLElement).style.display = "none";
          if (minimap) (minimap as HTMLElement).style.display = "none";

          // Give time for rendering
          await new Promise((resolve) => setTimeout(resolve, 100));
        } else {
          console.warn(
            `No ReactFlow container found for diagram: ${diagramName}`
          );
        }
      })
    );
  } catch (error) {
    console.error("Error preparing ReactFlow diagrams:", error);
  }
};

export async function exportToPDF(
  editorContent: HTMLElement,
  fileName = "document.pdf",
  paperSize: PaperSize = "A4",
  orientation: PaperOrientation = "portrait"
): Promise<void> {
  if (!editorContent) return;

  try {
    // Prepare ReactFlow diagrams before PDF generation
    await prepareReactFlowForExport(editorContent);

    // Get all pages or the editor content itself if no pages are found
    const pages = editorContent.querySelectorAll(".tiptap-page");

    if (!pages.length) {
      // If no pages are found, use the editor content as a single page
      console.log("No pages found, using editor content as a single page");

      // Get paper dimensions in mm
      const dimensions = getPaperDimensions(paperSize, orientation);
      const widthMm = pxToMm(dimensions.width);
      const heightMm = pxToMm(dimensions.height);

      // Create PDF with the correct dimensions
      const pdf = new jsPDF({
        orientation: orientation,
        unit: "mm",
        format: [widthMm, heightMm],
      });

      // Render the entire editor content to canvas
      const canvas = await html2canvas(editorContent, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc, element) => {
          // Additional processing on the cloned document before rendering
          const reactFlowElements = element.querySelectorAll(".react-flow");
          reactFlowElements.forEach((el) => {
            // Ensure ReactFlow elements are visible in the cloned document
            (el as HTMLElement).style.height = "300px";
            (el as HTMLElement).style.width = "100%";
            (el as HTMLElement).style.overflow = "visible";
          });
        },
      });

      // Add the canvas as an image to the PDF
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, widthMm, heightMm);

      // Save the PDF
      pdf.save(fileName);
      return;
    }

    // If pages are found, process each page as before
    // Get paper dimensions in mm
    const dimensions = getPaperDimensions(paperSize, orientation);
    const widthMm = pxToMm(dimensions.width);
    const heightMm = pxToMm(dimensions.height);

    // Create PDF with the correct dimensions
    const pdf = new jsPDF({
      orientation: orientation,
      unit: "mm",
      format: [widthMm, heightMm],
    });

    // Process each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement;

      // If not the first page, add a new page to the PDF
      if (i > 0) {
        pdf.addPage([widthMm, heightMm]);
      }

      // Render the page to canvas
      const canvas = await html2canvas(page, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc, element) => {
          // Additional processing on the cloned document before rendering
          const reactFlowElements = element.querySelectorAll(".react-flow");
          reactFlowElements.forEach((el) => {
            // Ensure ReactFlow elements are visible in the cloned document
            (el as HTMLElement).style.height = "300px";
            (el as HTMLElement).style.width = "100%";
            (el as HTMLElement).style.overflow = "visible";
          });
        },
      });

      // Add the canvas as an image to the PDF
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, widthMm, heightMm);
    }

    // Save the PDF
    pdf.save(fileName);
    return;
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    throw error;
  }
}

/**
 * Export document to PDF using browser's print functionality
 * This approach ensures that all reactive content like ReactFlow diagrams
 * are properly rendered in the exported PDF
 */
export async function browserPrintToPDF(
  editorContent: HTMLElement,
  title = "Document"
): Promise<void> {
  // Create a new window for printing
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow pop-ups to use print functionality");
    return;
  }

  // Get the editor content
  if (!editorContent) return;

  // Create a copy of the editor content
  const contentClone = editorContent.cloneNode(true) as HTMLElement;

  // Apply print-specific styling
  const styleElement = document.createElement("style");
  styleElement.textContent = `
    @media print {
      @page {
        /* Margins: top, right, bottom, left */
        margin-top: 0mm; 
        margin-left: 2mm;
        margin-right: 2mm;
        margin-bottom: 2mm; 
        size: auto;
        counter-increment: page; 

        @top-left { /* Display date in top-left margin box */
          content: attr(data-created-at string); /* Pull from data attribute */
          font-family: Arial, sans-serif;
          font-size: 8pt;
          color: #555;
          vertical-align: top;
          padding-top: 0.5mm; 
        }

        @top-center { 
          content: "Page " counter(page);
          font-family: Arial, sans-serif;
          font-size: 8pt;
          color: #555;
          vertical-align: top; 
          padding-top: 0.5mm; 
        }
      }

      html, body {
        height: auto; 
        margin: 0;
        padding: 0;
      }

      html {
        counter-reset: page; 
      }

      body {
        font-family: Arial, sans-serif;
        font-size: 12pt; /* Main content font size */
        color: black;
        padding-top: 0; /* HTML header is gone */
        padding-bottom: 8mm; /* Matches .page-footer height */
        box-sizing: border-box;
      }

      .page-footer {
        position: fixed;
        left: 0; 
        right: 0;
        width: 100%;
        box-sizing: border-box;
        font-size: 8pt;
        color: #555;
        background-color: white; 
        z-index: 1000;
        padding-left: 2mm; 
        padding-right: 2mm; 
        bottom: 0;
        height: 8mm; 
        display: flex;
        flex-direction: row; 
        align-items: center; 
        justify-content: center; 
        text-align: center;
        /* border-top: 0.5pt solid #ccc; /* As per earlier decisions, footer border is removed */
      }

      .page-footer img {
        max-height: 5mm; 
        margin-right: 5px; 
      }
      
      .editor-export-container {
        padding: 0;
        margin: 0;
        width: 100%;
        overflow: visible !important; /* Ensure main content container doesn't clip */
      }
      
      .react-flow-node-wrapper {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        max-width: 100% !important;
        width: 100% !important;
        margin: 15px 0 !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
      }
      
      .react-flow {
        height: 280px !important; /* Reduced height to fit better */
        width: 100% !important;
        max-width: 100% !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        overflow: hidden !important; /* Changed from visible to hidden to prevent overflow */
        box-sizing: border-box !important;
      }
      
      .react-flow__renderer {
        height: 100% !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      
      .react-flow__pane {
        width: 100% !important;
        height: 100% !important;
        max-width: 100% !important;
        overflow: hidden !important;
      }
      
      .react-flow__controls, 
      .react-flow__minimap,
      .react-flow__attribution,
      .react-flow__background {
        display: none !important;
      }
      
      img, table {
        page-break-inside: avoid;
        max-width: 100%;
      }

      .react-flow__node {
        background-color: white !important;
        border: 1px solid #ccc !important;
        border-radius: 4px !important;
        padding: 8px !important; /* Reduced padding */
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.16) !important;
        font-size: 11px !important; /* Smaller font for better fit */
        max-width: 150px !important; /* Limit node width */
        word-wrap: break-word !important;
        overflow: hidden !important;
        /* Preserve colors */
        color: inherit !important;
        /* Ensure custom background colors are maintained */
        background: inherit !important;
      }
      
      /* Preserve specific node colors and styles */
      .react-flow__node[style*="background"] {
        background: var(--node-bg, white) !important;
      }
      
      .react-flow__node[style*="color"] {
        color: var(--node-color, black) !important;
      }
      
      .react-flow__edge-path {
        stroke: #333 !important;
        stroke-width: 2px !important;
        /* Preserve edge colors if specified */
        stroke: var(--edge-color, #333) !important;
      }

      .react-flow-node { /* Style from original PDF export, ensuring it's print-friendly */
        display: block !important;
        margin: 15px 0 !important;
        border: 1px solid #ddd !important;
        border-radius: 6px !important;
        background-color: #f9f9f9 !important;
        padding: 10px !important;
        max-width: 100% !important;
        width: 100% !important;
        box-sizing: border-box !important;
        overflow: hidden !important; /* Ensure content isn't clipped in print */
      }

      /* General page break guidance for print */
      p, div, section, article {
        break-inside: auto; /* Default, but good to be explicit for override cases */
      }
      
      /* Keep these elements from breaking if possible, but be mindful of very tall ones */
      .react-flow-node-wrapper, 
      .react-flow, 
      img, 
      table,
      figure, 
      blockquote {
        break-inside: avoid; /* Removed !important for now, let specificity handle it if possible */
      }

      .editor-export-container > *:first-child {
        margin-top: 0 !important;
        padding-top: 0 !important;
      }

      /* Loading indicator should be hidden in print */
      .animate-spin,
      .loading-indicator {
        display: none !important;
      }
    }
  `;

  // Get additional required styles from the document
  const existingStyles = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]')
  ).map((style) => style.cloneNode(true) as HTMLElement);

  // Write content to the print window
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${styleElement.outerHTML}
        ${existingStyles.map((style) => style.outerHTML).join("")}
      </head>
      <body>
        <div class="editor-export-container">
          ${contentClone.innerHTML}
        </div>

        <div class="page-footer">
          <img src="/assets/global/app-logo.svg" alt="OLAB Logo">
          <span>Created with OLAB</span>
        </div>

        <script>
          // Helper function to make ReactFlow nodes visible and properly sized
          function enhanceReactFlowNodes() {
            const reactFlowNodes = document.querySelectorAll('.react-flow-node-wrapper');
            console.log('Found ReactFlow nodes:', reactFlowNodes.length);
            
            reactFlowNodes.forEach((node, index) => {
              node.style.width = '100%';
              node.style.maxWidth = '100%';
              node.style.overflow = 'hidden';
              node.style.boxSizing = 'border-box';
              
              const reactFlowContainer = node.querySelector('.react-flow');
              if (reactFlowContainer) {
                reactFlowContainer.style.width = '100%';
                reactFlowContainer.style.height = '280px';
                reactFlowContainer.style.maxWidth = '100%';
                reactFlowContainer.style.visibility = 'visible';
                reactFlowContainer.style.overflow = 'hidden';
                reactFlowContainer.style.boxSizing = 'border-box';
                
                const pane = reactFlowContainer.querySelector('.react-flow__pane');
                if (pane) {
                  pane.style.width = '100%';
                  pane.style.height = '100%';
                  pane.style.maxWidth = '100%';
                  pane.style.overflow = 'hidden';
                }
                
                // Preserve original edge colors and styles
                const edgePaths = reactFlowContainer.querySelectorAll('.react-flow__edge-path');
                edgePaths.forEach(path => {
                  // Only set stroke if it's not already set
                  if (!path.getAttribute('stroke') || path.getAttribute('stroke') === 'none') {
                    path.setAttribute('stroke', '#333');
                  }
                  if (!path.getAttribute('stroke-width')) {
                    path.setAttribute('stroke-width', '2');
                  }
                });
                
                // Preserve original node styles while ensuring they fit
                const flowNodes = reactFlowContainer.querySelectorAll('.react-flow__node');
                flowNodes.forEach(flowNode => {
                  // Only override sizing, preserve colors and backgrounds
                  flowNode.style.maxWidth = '150px';
                  flowNode.style.fontSize = '11px';
                  flowNode.style.padding = '8px';
                  flowNode.style.wordWrap = 'break-word';
                  flowNode.style.overflow = 'hidden';
                  
                  // Preserve any existing background color or other styling
                  const existingBg = flowNode.style.backgroundColor || getComputedStyle(flowNode).backgroundColor;
                  const existingColor = flowNode.style.color || getComputedStyle(flowNode).color;
                  
                  if (existingBg && existingBg !== 'rgba(0, 0, 0, 0)' && existingBg !== 'transparent') {
                    flowNode.style.setProperty('--node-bg', existingBg);
                  }
                  if (existingColor && existingColor !== 'rgba(0, 0, 0, 0)') {
                    flowNode.style.setProperty('--node-color', existingColor);
                  }
                });
                
                const controls = reactFlowContainer.querySelector('.react-flow__controls');
                const minimap = reactFlowContainer.querySelector('.react-flow__minimap');
                const attribution = reactFlowContainer.querySelector('.react-flow__attribution');
                if (controls) controls.style.display = 'none';
                if (minimap) minimap.style.display = 'none';
                if (attribution) attribution.style.display = 'none';
                
                if (!node.classList.contains('enhanced')) {
                  node.classList.add('enhanced');
                  node.style.backgroundColor = '#f9f9f9';
                  node.style.border = '1px solid #ddd';
                  node.style.borderRadius = '6px';
                  node.style.padding = '10px';
                }
              }
            });
          }

          function setupHeaderFooter() {
            const now = new Date();
            const formattedDate = \`\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, '0')}-\${String(now.getDate()).padStart(2, '0')} \${String(now.getHours()).padStart(2, '0')}:\${String(now.getMinutes()).padStart(2, '0')}:\${String(now.getSeconds()).padStart(2, '0')}\`;
            if (document.documentElement) {
                document.documentElement.setAttribute('data-created-at', formattedDate);
            }
          }
          
          // Simple approach - just enhance and print
          setTimeout(() => {
            enhanceReactFlowNodes();
            setupHeaderFooter();
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 1000);
            }, 500);
          }, 800);
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}
