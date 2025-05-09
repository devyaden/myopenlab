import type {
  PaperSize,
  PaperOrientation,
  PaperDimensions,
} from "@/types/paper";

// Paper dimensions in pixels at 96 DPI
export const PAPER_DIMENSIONS: Record<any, any> = {
  // A series
  "4A0": { width: 4768, height: 6741 },
  "2A0": { width: 3370, height: 4768 },
  A0: { width: 3370, height: 2384 },
  "A0+": { width: 3648, height: 2384 },
  A1: { width: 2384, height: 1684 },
  "A1+": { width: 2592, height: 1684 },
  A2: { width: 1684, height: 1191 },
  A3: { width: 1191, height: 842 },
  "A3+": { width: 1328, height: 932 },
  A4: { width: 842, height: 595 },
  A5: { width: 595, height: 420 },
  A6: { width: 420, height: 298 },
  A7: { width: 298, height: 210 },
  A8: { width: 210, height: 148 },
  A9: { width: 148, height: 105 },
  A10: { width: 105, height: 74 },
  A11: { width: 74, height: 52 },
  A12: { width: 52, height: 37 },
  A13: { width: 37, height: 26 },

  // B series
  B0: { width: 4015, height: 2835 },
  "B0+": { width: 4354, height: 2835 },
  B1: { width: 2835, height: 2004 },
  "B1+": { width: 3090, height: 2004 },
  B2: { width: 2004, height: 1417 },
  "B2+": { width: 2188, height: 1417 },
  B3: { width: 1417, height: 1001 },
  B4: { width: 1001, height: 709 },
  B5: { width: 709, height: 499 },
  B6: { width: 499, height: 354 },
  B7: { width: 354, height: 249 },
  B8: { width: 249, height: 176 },
  B9: { width: 176, height: 125 },
  B10: { width: 125, height: 88 },
  B11: { width: 88, height: 62 },
  B12: { width: 62, height: 44 },
  B13: { width: 44, height: 31 },

  // C series
  C0: { width: 3694, height: 2607 },
  C1: { width: 2607, height: 1842 },
  C2: { width: 1842, height: 1302 },
  C3: { width: 1302, height: 921 },
  C4: { width: 921, height: 649 },
  C5: { width: 649, height: 459 },
  C6: { width: 459, height: 323 },
  C7: { width: 323, height: 228 },
  C8: { width: 228, height: 162 },
  C9: { width: 162, height: 114 },
  C10: { width: 114, height: 81 },

  // US sizes
  Letter: { width: 816, height: 1056 },
  Legal: { width: 816, height: 1344 },
  Tabloid: { width: 1056, height: 1632 },
  Ledger: { width: 1632, height: 1056 },
  "Junior Legal": { width: 576, height: 912 },
  "Half Letter": { width: 528, height: 816 },
  "Government Letter": { width: 792, height: 1224 },
  "Government Legal": { width: 816, height: 1296 },
  "ANSI A": { width: 816, height: 1056 },
  "ANSI B": { width: 1056, height: 1632 },
  "ANSI C": { width: 1632, height: 2112 },
  "ANSI D": { width: 2112, height: 3264 },
  "ANSI E": { width: 3264, height: 4224 },
  "Arch A": { width: 864, height: 1104 },
  "Arch B": { width: 1104, height: 1728 },
  "Arch C": { width: 1728, height: 2208 },
  "Arch D": { width: 2208, height: 3456 },
  "Arch E": { width: 3456, height: 4608 },
  "Arch E1": { width: 3648, height: 4800 },
  "Arch E2": { width: 3648, height: 5424 },
  "Arch E3": { width: 3648, height: 6912 },
};

// Default margins in pixels (1 inch = 96px)
export const DEFAULT_MARGINS = {
  top: 96,
  right: 96,
  bottom: 96,
  left: 96,
};

// Get dimensions for a paper size with orientation
export function getPaperDimensions(
  size: PaperSize,
  orientation: PaperOrientation = "portrait"
): PaperDimensions {
  const dimensions = PAPER_DIMENSIONS[size];

  if (!dimensions) {
    throw new Error(`Unknown paper size: ${size}`);
  }

  if (orientation === "landscape") {
    return {
      width: dimensions.height,
      height: dimensions.width,
    };
  }

  return dimensions;
}

// Group paper sizes by category for UI display
export const PAPER_SIZE_GROUPS = {
  "A Series": [
    "A0",
    "A1",
    "A2",
    "A3",
    "A4",
    "A5",
    "A6",
    "A7",
    "A8",
    "A3+",
    "A0+",
    "A1+",
    "2A0",
    "4A0",
  ],
  "B Series": [
    "B0",
    "B1",
    "B2",
    "B3",
    "B4",
    "B5",
    "B6",
    "B7",
    "B8",
    "B0+",
    "B1+",
    "B2+",
  ],
  "C Series": ["C0", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"],
  "US Sizes": [
    // "Letter",
    // "Legal",
    // "Tabloid",
    "Ledger",
    "Half Letter",
    "ANSI A",
    "ANSI B",
    "ANSI C",
    "ANSI D",
    "ANSI E",
  ],
  Architectural: ["Arch A", "Arch B", "Arch C", "Arch D", "Arch E", "Arch E1"],
};

// Common paper sizes for quick access
export const COMMON_PAPER_SIZES: PaperSize[] = [
  "A4",
  "A3",
  "Letter",
  "Legal",
  "Tabloid",
];

// Paper orientation options
export const PAPER_ORIENTATIONS = [
  { orientation: "portrait" as PaperOrientation, label: "Portrait" },
  { orientation: "landscape" as PaperOrientation, label: "Landscape" },
];
