import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import type { PaperFormat } from "puppeteer";

export const maxDuration = 300; // Set max duration to 5 minutes for large documents
export const fetchCache = "force-no-store"; // Disable caching for this route
export const revalidate = 0; // Disable revalidation

export async function POST(request: NextRequest) {
  let browser = null;

  try {
    console.log("Starting PDF generation process");

    // Extract HTML content and document options from request
    const { html, title, paperSize, orientation, styleSheet } =
      await request.json();

    if (!html) {
      return NextResponse.json(
        { error: "No HTML content provided" },
        { status: 400 }
      );
    }

    console.log(
      `Generating PDF for document "${title}" with size ${paperSize} in ${orientation} orientation`
    );

    // Define paper size dimensions
    const paperSizes: Record<string, { width: string; height: string }> = {
      A4: { width: "210mm", height: "297mm" },
      A3: { width: "297mm", height: "420mm" },
      Letter: { width: "215.9mm", height: "279.4mm" },
      Legal: { width: "215.9mm", height: "355.6mm" },
    };

    // Get the selected paper size or default to A4
    const selectedPaperSize = paperSizes[paperSize as string] || paperSizes.A4;

    // Apply orientation
    const pageWidth =
      orientation === "landscape"
        ? selectedPaperSize.height
        : selectedPaperSize.width;
    const pageHeight =
      orientation === "landscape"
        ? selectedPaperSize.width
        : selectedPaperSize.height;

    console.log("Preparing HTML content for PDF generation");

    // Build complete HTML with necessary styles for proper rendering
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title || "Exported Document"}</title>
          <style>
            @page {
              size: ${pageWidth} ${pageHeight};
              margin: 0;
            }
            
            body {
              font-family: Arial, Helvetica, sans-serif;
              margin: 0;
              padding: 0;
              width: ${pageWidth};
              height: ${pageHeight};
              box-sizing: border-box;
            }
            
            .editor-export-container {
              padding: 20mm;
              box-sizing: border-box;
            }
            
            .tiptap-page {
              box-sizing: border-box;
              page-break-after: always;
              position: relative;
              width: 100%;
            }
            
            /* TipTap specific styles */
            .ProseMirror {
              outline: none;
            }
            
            .ProseMirror p {
              margin: 1em 0;
            }
            
            /* Table styles */
            .editor-table {
              border-collapse: collapse;
              table-layout: fixed;
              width: 100%;
              margin: 0;
              overflow: hidden;
            }
            
            .editor-table td, 
            .editor-table th {
              min-width: 1em;
              border: 1px solid #ddd;
              padding: 8px;
              position: relative;
              vertical-align: top;
            }
            
            /* Additional styles */
            img {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 10px 0;
            }
            
            .embedded-canvas-image {
              border: 1px solid #eee;
              border-radius: 4px;
              margin: 10px 0;
              max-width: 100%;
              height: auto;
            }
            
            /* Canvas/ReactFlow visualization styles */
            .canvas-visualization {
              border: 1px solid #eee;
              border-radius: 4px;
              margin: 10px 0;
              padding: 15px;
              background-color: #f9f9f9;
            }

            /* ReactFlow node visualization */
            .react-flow-placeholder {
              display: block;
              margin: 20px 0;
              padding: 15px;
              border: 1px solid #ccc;
              border-radius: 6px;
              background-color: #f9f9f9;
              text-align: center;
            }
            
            .react-flow-placeholder-title {
              font-weight: bold;
              margin-bottom: 5px;
              font-size: 1.1em;
            }
            
            .react-flow-placeholder svg {
              max-width: 100%;
              height: auto;
              margin: 10px 0;
            }
            
            .react-flow-placeholder-info {
              color: #666;
              font-style: italic;
              margin-top: 5px;
            }

            /* ReactFlow Node styles */
            .react-flow-node {
              display: block;
              margin: 15px 0;
              border: 1px solid #ddd;
              border-radius: 6px;
              background-color: #f9f9f9;
              padding: 10px;
              max-width: 100%;
              box-sizing: border-box;
            }
            
            ${styleSheet || ""}
          </style>
        </head>
        <body>
          <div class="editor-export-container">
            ${html}
          </div>
        </body>
      </html>
    `;

    console.log("Launching Puppeteer");

    // Launch puppeteer with more robust settings
    browser = await puppeteer
      .launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
          "--window-size=1920x1080",
        ],
        executablePath: process.env.CHROME_PATH || undefined, // Allow custom Chrome path
      })
      .catch(async (error) => {
        console.error("Failed to launch browser:", error);

        // Try alternative launch method
        try {
          return await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
          });
        } catch (retryError) {
          console.error("Failed to launch browser with retry:", retryError);
          throw new Error(
            "Could not launch browser. Please ensure Chrome is installed and accessible."
          );
        }
      });

    console.log("Creating new page");
    const page = await browser.newPage();

    // Set viewport to ensure all content is properly rendered
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2, // Higher resolution for better quality
    });

    // Set the page content
    console.log("Setting page content");
    await page.setContent(fullHtml, {
      waitUntil: "networkidle0",
      timeout: 30000, // Increase timeout for larger documents
    });

    // Process ReactFlow diagrams by replacing them with visually appealing placeholders
    console.log("Processing ReactFlow diagrams");
    await page.evaluate(async () => {
      // Wait for a brief moment to ensure any dynamic content is loaded
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Find all ReactFlow nodes
      const reactFlowNodes = document.querySelectorAll(".react-flow-node");
      console.log(`Found ${reactFlowNodes.length} ReactFlow nodes to process`);

      // Process each ReactFlow node
      Array.from(reactFlowNodes).forEach((node) => {
        try {
          // Extract diagram data from node attributes
          const nodesData = node.getAttribute("data-nodes");
          const edgesData = node.getAttribute("data-edges");
          const canvasName = node.getAttribute("data-name") || "Diagram";

          if (nodesData && edgesData) {
            // Create a visually appealing placeholder with diagram image
            const placeholder = document.createElement("div");
            placeholder.className = "react-flow-placeholder";

            // Parse nodes to determine number of elements
            let nodesCount = 0;
            let edgesCount = 0;

            try {
              // Try to parse the data to get actual counts
              if (nodesData) {
                const parsedNodes = JSON.parse(nodesData);
                nodesCount = Array.isArray(parsedNodes)
                  ? parsedNodes.length
                  : 0;
              }

              if (edgesData) {
                const parsedEdges = JSON.parse(edgesData);
                edgesCount = Array.isArray(parsedEdges)
                  ? parsedEdges.length
                  : 0;
              }
            } catch (parseError) {
              console.error("Error parsing diagram data:", parseError);
            }

            // Create an SVG placeholder that mimics a diagram appearance
            const diagramSvg = `
              <svg width="100%" height="150" viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="10" width="80" height="40" rx="5" fill="#f0f4ff" stroke="#4d7cfe" stroke-width="2"/>
                <rect x="160" y="60" width="80" height="40" rx="5" fill="#f0f4ff" stroke="#4d7cfe" stroke-width="2"/>
                <rect x="310" y="10" width="80" height="40" rx="5" fill="#f0f4ff" stroke="#4d7cfe" stroke-width="2"/>
                <path d="M90 30 L160 80" stroke="#666" stroke-width="2" stroke-dasharray="5,5"/>
                <path d="M240 80 L310 30" stroke="#666" stroke-width="2" stroke-dasharray="5,5"/>
                <text x="50" y="35" font-family="Arial" font-size="12" text-anchor="middle">Node 1</text>
                <text x="200" y="85" font-family="Arial" font-size="12" text-anchor="middle">Node 2</text>
                <text x="350" y="35" font-family="Arial" font-size="12" text-anchor="middle">Node 3</text>
                <text x="200" y="130" font-family="Arial" font-size="10" text-anchor="middle" fill="#666">Diagram Representation</text>
              </svg>
            `;

            placeholder.innerHTML = `
              <div class="react-flow-placeholder-title">${canvasName}</div>
              ${diagramSvg}
              <div class="react-flow-placeholder-info">
                Flow diagram with ${nodesCount} nodes and ${edgesCount} connections
              </div>
            `;

            // Replace the node with the placeholder
            if (node.parentNode) {
              node.parentNode.replaceChild(placeholder, node);
            }
          }
        } catch (error) {
          console.error("Error processing ReactFlow node:", error);
        }
      });
    });

    // Allow content to render
    console.log("Waiting for final rendering");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate PDF with the specified options
    console.log("Generating PDF");
    const pdfBuffer = await page.pdf({
      format: (paperSize as PaperFormat) || "A4",
      landscape: orientation === "landscape",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
    });

    // Close the browser
    console.log("Closing browser");
    if (browser) {
      await browser.close();
      browser = null;
    }

    console.log("PDF generated successfully, returning response");

    // Return the PDF as a downloadable file
    const response = new NextResponse(pdfBuffer as unknown as BodyInit);
    response.headers.set("Content-Type", "application/pdf");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${title?.replace(/\s+/g, "-").toLowerCase() || "document"}.pdf"`
    );

    return response;
  } catch (error) {
    console.error("PDF generation error:", error);

    // Make sure to close the browser if there was an error
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }

    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
