import type {
  PaperSize,
  PaperOrientation,
  PaperDimensions,
} from "@/types/paper";

// Paper dimensions in millimetres, in canonical PORTRAIT orientation
// (width = short side, height = long side). Use getPaperDimensions to get
// orientation-adjusted values.
//
// Previous version of this table was labeled "pixels at 96 DPI" but the
// values were actually PostScript points and were stored in landscape
// orientation, so getPaperDimensions("A4","portrait") returned a landscape
// shape and PDF export was off by ~6%.
export const PAPER_DIMENSIONS: Record<any, any> = {
  // A series (ISO 216)
  "4A0": { width: 1682, height: 2378 },
  "2A0": { width: 1189, height: 1682 },
  A0: { width: 841, height: 1189 },
  "A0+": { width: 914, height: 1292 },
  A1: { width: 594, height: 841 },
  "A1+": { width: 624, height: 880 },
  A2: { width: 420, height: 594 },
  A3: { width: 297, height: 420 },
  "A3+": { width: 329, height: 483 },
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  A6: { width: 105, height: 148 },
  A7: { width: 74, height: 105 },
  A8: { width: 52, height: 74 },
  A9: { width: 37, height: 52 },
  A10: { width: 26, height: 37 },
  A11: { width: 18, height: 26 },
  A12: { width: 13, height: 18 },
  A13: { width: 9, height: 13 },

  // B series (ISO 216)
  B0: { width: 1000, height: 1414 },
  "B0+": { width: 1118, height: 1580 },
  B1: { width: 707, height: 1000 },
  "B1+": { width: 720, height: 1020 },
  B2: { width: 500, height: 707 },
  "B2+": { width: 520, height: 720 },
  B3: { width: 353, height: 500 },
  B4: { width: 250, height: 353 },
  B5: { width: 176, height: 250 },
  B6: { width: 125, height: 176 },
  B7: { width: 88, height: 125 },
  B8: { width: 62, height: 88 },
  B9: { width: 44, height: 62 },
  B10: { width: 31, height: 44 },
  B11: { width: 22, height: 31 },
  B12: { width: 15, height: 22 },
  B13: { width: 11, height: 15 },

  // C series (ISO 269)
  C0: { width: 917, height: 1297 },
  C1: { width: 648, height: 917 },
  C2: { width: 458, height: 648 },
  C3: { width: 324, height: 458 },
  C4: { width: 229, height: 324 },
  C5: { width: 162, height: 229 },
  C6: { width: 114, height: 162 },
  C7: { width: 81, height: 114 },
  C8: { width: 57, height: 81 },
  C9: { width: 40, height: 57 },
  C10: { width: 28, height: 40 },

  // US sizes (ANSI/ARCH, all converted from inches to mm)
  Letter: { width: 216, height: 279 },
  Legal: { width: 216, height: 356 },
  Tabloid: { width: 279, height: 432 },
  Ledger: { width: 432, height: 279 },
  "Junior Legal": { width: 127, height: 203 },
  "Half Letter": { width: 140, height: 216 },
  "Government Letter": { width: 203, height: 267 },
  "Government Legal": { width: 216, height: 330 },
  "ANSI A": { width: 216, height: 279 },
  "ANSI B": { width: 279, height: 432 },
  "ANSI C": { width: 432, height: 559 },
  "ANSI D": { width: 559, height: 864 },
  "ANSI E": { width: 864, height: 1118 },
  "Arch A": { width: 229, height: 305 },
  "Arch B": { width: 305, height: 457 },
  "Arch C": { width: 457, height: 610 },
  "Arch D": { width: 610, height: 914 },
  "Arch E": { width: 914, height: 1219 },
  "Arch E1": { width: 762, height: 1067 },
  "Arch E2": { width: 660, height: 965 },
  "Arch E3": { width: 686, height: 991 },
};

// Conversion helpers; pagination plugin and PDF export use millimetres.
export const PX_PER_MM = 3.7795275591; // 96 DPI / 25.4 mm per inch
export const mmToPx = (mm: number) => mm * PX_PER_MM;
export const pxToMm = (px: number) => px / PX_PER_MM;

// Default margins: 1 inch = 25.4 mm. Stored in pixels for backward-compat
// with the existing paginationSettings shape (which other code still treats
// as px); the pagination plugin's commands receive the value divided by
// PX_PER_MM.
export const DEFAULT_MARGINS = {
  top: mmToPx(25.4),
  right: mmToPx(25.4),
  bottom: mmToPx(25.4),
  left: mmToPx(25.4),
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
