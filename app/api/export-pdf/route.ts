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
              padding: 5px;
              background-color: #fafafa;
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

    // Launch puppeteer with basic settings
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    console.log("Creating new page");
    const page = await browser.newPage();

    // Set the page content
    console.log("Setting page content");
    await page.setContent(fullHtml, {
      waitUntil: "networkidle0",
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
    const response = new NextResponse(pdfBuffer);
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
