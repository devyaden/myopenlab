import type { PaperOrientation, PaperSize } from "@/types/paper";
import { getPaperDimensions } from "./paper-sizes";

export interface PrintToPDFOptions {
  /** The .ProseMirror element (or any element wrapping the document
   * content) that should be cloned into the print window. */
  editorContent: HTMLElement;
  /** Used as the print window's <title>; some browsers default the saved
   * PDF's filename to it. */
  title?: string;
  pageSize: PaperSize;
  orientation: PaperOrientation;
  /** Margins in millimetres. */
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** Document-level text direction. Set on <html dir>. */
  textDirection?: "ltr" | "rtl";
}

/**
 * Open a print window styled with the user's exact paper geometry, then
 * call window.print(). The browser's native print engine handles the
 * actual page splitting, margin boxes, and font rasterisation — we just
 * supply correct CSS.
 *
 * Why this is simple: our editor surface is a continuous flow (Phase
 * 2.5), so the print pipeline doesn't need to know about per-page node
 * structure. It only needs:
 *   1. @page { size: <mm> <mm>; margin: <mm> <mm> <mm> <mm>; }
 *   2. Cloned editor styles + the user-fonts <style id="user-fonts">.
 *   3. document.fonts.ready before window.print() so custom fonts have
 *      been fetched and decoded.
 *   4. <html dir> for RTL.
 */
export async function browserPrintToPDF(
  opts: PrintToPDFOptions
): Promise<void> {
  const {
    editorContent,
    title = "Document",
    pageSize,
    orientation,
    margins,
    textDirection = "ltr",
  } = opts;

  if (!editorContent) return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Allow pop-ups to print this document.");
    return;
  }

  const dims = getPaperDimensions(pageSize, orientation);
  const baseHref = `${window.location.origin}/`;

  // Clone the editor's content. The clone is a static snapshot of the
  // current DOM, including NodeView wrappers (FloatBlock, ResizableImage,
  // etc.). React isn't running in the print window, but the snapshot
  // already has all CSS classes attached, which is what print layout
  // needs.
  const contentClone = editorContent.cloneNode(true) as HTMLElement;

  // Carry over every <style> and <link rel="stylesheet"> from the main
  // document. <link> hrefs may be relative — we add a <base> tag below so
  // they resolve correctly inside the new window's about:blank context.
  const styleTags = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]')
  )
    .map((el) => el.outerHTML)
    .join("\n");

  // The custom-fonts <style id="user-fonts"> element (Phase 5) carries
  // the user's @font-face rules. It's already included in styleTags above
  // (as a regular <style>), but list it explicitly so we can confirm
  // presence in code review.
  // — no extra work needed.

  const printStyles = buildPrintStyles({
    pageSize,
    orientation,
    margins,
    pageWidthMm: dims.width,
    pageHeightMm: dims.height,
  });

  const html = `<!DOCTYPE html>
<html lang="en" dir="${textDirection}">
  <head>
    <meta charset="utf-8" />
    <base href="${escapeHtml(baseHref)}" />
    <title>${escapeHtml(title)}</title>
    ${styleTags}
    <style>${printStyles}</style>
  </head>
  <body>
    <div class="print-root">${contentClone.outerHTML}</div>
    <script>
      (async () => {
        try {
          // Wait for fonts to load (custom user fonts hosted on Supabase
          // need a network round-trip). 3-second cap so a stuck font
          // doesn't block printing forever.
          if (document.fonts && document.fonts.ready) {
            await Promise.race([
              document.fonts.ready,
              new Promise(function(r) { setTimeout(r, 3000); })
            ]);
          }
        } catch (e) {
          console.warn("font load wait failed", e);
        }
        // Small extra tick for layout to settle after late-loaded fonts.
        await new Promise(function(r) { requestAnimationFrame(function() { setTimeout(r, 50); }); });
        window.focus();
        window.print();
        // Some browsers fire afterprint, others don't. Close once printed.
        const close = function() { try { window.close(); } catch (e) {} };
        window.addEventListener("afterprint", close);
        setTimeout(close, 60_000);
      })();
    </script>
  </body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

interface PrintStyleOpts {
  pageSize: PaperSize;
  orientation: PaperOrientation;
  margins: { top: number; right: number; bottom: number; left: number };
  pageWidthMm: number;
  pageHeightMm: number;
}

function buildPrintStyles(opts: PrintStyleOpts): string {
  const { margins, pageWidthMm, pageHeightMm } = opts;
  const { top, right, bottom, left } = margins;

  return `
    @page {
      size: ${pageWidthMm}mm ${pageHeightMm}mm;
      margin: ${top}mm ${right}mm ${bottom}mm ${left}mm;
    }

    /* Strip the editor surface chrome — the browser's print engine adds
       margins via @page; we don't need padding or shadow on the surface
       (it would compound with the @page margins and double-margin the
       output). */
    html, body {
      margin: 0;
      padding: 0;
      background: white;
    }
    .print-root {
      width: 100%;
    }
    .editor-page-surface {
      width: auto !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      box-shadow: none !important;
      background-image: none !important;
    }

    /* Hide the visible chrome that has no business in print. */
    .editor-toolbar,
    .float-block__toolbar,
    .canvas-table-editor-controls,
    [data-print-hidden] {
      display: none !important;
    }

    /* The repeating page-break gradient is gone (Phase 2.6) but defend
       against any stale styles. */

    /* Forced page breaks: any <hr> in the document acts as a page
       break. Authors insert these via Insert > Page Break. */
    .ProseMirror hr {
      visibility: hidden;
      height: 0;
      margin: 0;
      border: 0;
      page-break-after: always;
      break-after: page;
    }

    /* Avoid breaking inside floats and tables when possible. */
    .float-block,
    table {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* File-mention chips: print as text colour with a thin border so the
       link relationship is visible on paper. */
    .file-mention {
      background: transparent !important;
      color: #1f2937 !important;
      border: 1px solid #cbd5e1 !important;
    }

    /* React Flow canvases inside documents: keep their content visible
       and avoid clipping. */
    .react-flow {
      overflow: visible !important;
    }
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
