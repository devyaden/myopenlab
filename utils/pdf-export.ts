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
