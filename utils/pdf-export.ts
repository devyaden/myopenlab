import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { PaperSize, PaperOrientation } from "@/types/paper";
import { getPaperDimensions } from "./paper-sizes";

// Convert pixels to mm (assuming 96 DPI)
const pxToMm = (px: number) => px * 0.264583;

export async function exportToPDF(
  editorContent: HTMLElement,
  fileName = "document.pdf",
  paperSize: PaperSize = "A4",
  orientation: PaperOrientation = "portrait"
): Promise<void> {
  if (!editorContent) return;

  try {
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
          // Minimal changes - only ensure overflow is visible
          const reactFlowElements = element.querySelectorAll(".react-flow");
          reactFlowElements.forEach((el) => {
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

    const dimensions = getPaperDimensions(paperSize, orientation);
    const widthMm = pxToMm(dimensions.width);
    const heightMm = pxToMm(dimensions.height);

    const pdf = new jsPDF({
      orientation: orientation,
      unit: "mm",
      format: [widthMm, heightMm],
    });

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement;

      if (i > 0) {
        pdf.addPage([widthMm, heightMm]);
      }

      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc, element) => {
          // Minimal changes - only ensure overflow is visible
          const reactFlowElements = element.querySelectorAll(".react-flow");
          reactFlowElements.forEach((el) => {
            (el as HTMLElement).style.overflow = "visible";
          });
        },
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, widthMm, heightMm);
    }

    pdf.save(fileName);
    return;
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    throw error;
  }
}

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

  const styleElement = document.createElement("style");
  styleElement.textContent = `
    @media print {
      @page {
        margin: 2mm;
        size: auto;
        counter-increment: page;

        @top-center { 
          content: "Page " counter(page);
          font-family: Arial, sans-serif;
          font-size: 8pt;
          color: #555;
        }
      }

      html, body {
        height: auto;
        margin: 0;
        padding: 0;
        counter-reset: page;
      }

      body {
        font-family: Arial, sans-serif;
        font-size: 12pt;
        color: black;
        padding-bottom: 8mm;
      }

      .page-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 8mm;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8pt;
        color: #555;
        background-color: white;
        padding: 0 2mm;
      }

      .page-footer img {
        max-height: 5mm;
        margin-right: 5px;
      }

      .editor-export-container {
        width: 100%;
        margin: 0;
        padding: 0;
      }

      /* Simplified ReactFlow styling - remove borders but keep background */
      .react-flow-node-wrapper {
        page-break-inside: avoid;
        margin: 10px 0;
        width: 100%;
        border: none;
        background: none;
      }

      .react-flow {
        width: 100%;
        border: none;
        page-break-inside: avoid;
        overflow: visible !important;
      }

      .react-flow__pane {
        overflow: visible !important;
      }

      /* Hide ReactFlow controls in print */
      .react-flow__controls,
      .react-flow__minimap,
      .react-flow__attribution {
        display: none;
      }

      /* Clean node styling without borders but keep content styling */
      .react-flow__node {
        border: none;
        padding: 8px;
        font-size: 12px;
        box-shadow: none;
        border-radius: 0;
      }

      .react-flow__edge-path {
        stroke: #333;
        stroke-width: 2px;
      }

      /* General print optimizations */
      img, table {
        page-break-inside: avoid;
        max-width: 100%;
      }

      /* Hide loading indicators */
      .animate-spin,
      .loading-indicator {
        display: none;
      }
    }
  `;

  // Get existing styles
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
          // ReactFlow enhancement - minimal changes, preserve original layout
          function enhanceReactFlowNodes() {
            const reactFlowContainers = document.querySelectorAll('.react-flow');
            
            reactFlowContainers.forEach((container) => {
              // Only remove borders and ensure overflow is visible - don't touch height
              container.style.border = 'none';
              container.style.overflow = 'visible';
              
              // Hide controls but keep background
              const controls = container.querySelector('.react-flow__controls');
              const minimap = container.querySelector('.react-flow__minimap');
              const attribution = container.querySelector('.react-flow__attribution');
              
              if (controls) controls.style.display = 'none';
              if (minimap) minimap.style.display = 'none';
              if (attribution) attribution.style.display = 'none';
              
              // Only set overflow on pane - preserve original height
              const pane = container.querySelector('.react-flow__pane');
              if (pane) {
                pane.style.overflow = 'visible';
              }

              // Remove borders from nodes but keep their backgrounds
              const nodes = container.querySelectorAll('.react-flow__node');
              nodes.forEach(node => {
                node.style.border = 'none';
                node.style.boxShadow = 'none';
                node.style.borderRadius = '0';
              });
            });

            // Clean up wrapper borders only
            const wrappers = document.querySelectorAll('.react-flow-node-wrapper');
            wrappers.forEach(wrapper => {
              wrapper.style.border = 'none';
              wrapper.style.boxShadow = 'none';
            });
          }

          // Wait for content to load then enhance and print
          setTimeout(() => {
            enhanceReactFlowNodes();
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 1000);
            }, 300);
          }, 500);
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}
