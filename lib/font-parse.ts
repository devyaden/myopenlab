"use client";

// opentype.js v2 ships named exports only — use the namespace import so
// the typed `Font` class is available alongside `parse`.
import * as opentype from "opentype.js";

export interface ParsedFont {
  familyName: string;
  weight: number;
  style: "normal" | "italic";
  /** True if the values came from the font's binary metadata (opentype.js
   * parsed it). False if we fell back to filename heuristics. */
  fromBinary: boolean;
}

/**
 * Parses font metadata from a File. Tries opentype.js first (works for
 * TTF, OTF, WOFF) and falls back to filename heuristics for WOFF2 (which
 * uses Brotli compression that opentype.js can't decode without a separate
 * wasm decoder).
 *
 * Filename heuristic recognises: Thin, ExtraLight/UltraLight, Light,
 * Regular/Book, Medium, SemiBold/DemiBold, Bold, ExtraBold/Heavy, Black —
 * each optionally followed by Italic/Oblique. Family name is the prefix
 * before the first hyphen-separated weight token.
 */
export async function parseFontFile(file: File): Promise<ParsedFont> {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();

  // opentype.js can't currently decode WOFF2 — it'd need an extra Brotli
  // step. Skip the binary parse for those and rely on filename only.
  if (ext !== "woff2") {
    try {
      const buffer = await file.arrayBuffer();
      const font = opentype.parse(buffer);
      const fromName = readNameTable(font);
      const weight =
        readUsWeightClass(font) ?? guessWeightFromSubfamily(fromName.subfamily);
      const style: "normal" | "italic" = isItalic(font, fromName.subfamily)
        ? "italic"
        : "normal";
      const familyName = fromName.preferredFamily ?? fromName.family;
      if (familyName) {
        return { familyName, weight, style, fromBinary: true };
      }
    } catch (err) {
      console.warn("[font-parse] opentype.js failed, falling back to filename", err);
    }
  }

  return { ...parseFromFilename(file.name), fromBinary: false };
}

interface NameTableInfo {
  family: string;
  subfamily: string;
  preferredFamily?: string;
}

function readNameTable(font: opentype.Font): NameTableInfo {
  const names: any = (font.names as any) ?? {};
  // opentype.js returns names as { en: "Name" } objects. We accept any
  // language present.
  const pick = (entry: any) => {
    if (!entry) return undefined;
    if (typeof entry === "string") return entry;
    return entry.en ?? entry[Object.keys(entry)[0]];
  };
  return {
    family: pick(names.fontFamily) ?? pick(names.preferredFamily) ?? "",
    subfamily: pick(names.fontSubfamily) ?? pick(names.preferredSubfamily) ?? "",
    preferredFamily: pick(names.preferredFamily),
  };
}

function readUsWeightClass(font: opentype.Font): number | null {
  // OS/2 table's usWeightClass is the canonical numeric weight (100..900).
  const tables: any = (font.tables as any) ?? {};
  const os2 = tables.os2;
  if (os2 && typeof os2.usWeightClass === "number") {
    return clampWeight(os2.usWeightClass);
  }
  return null;
}

function isItalic(font: opentype.Font, subfamily: string): boolean {
  const tables: any = (font.tables as any) ?? {};
  const os2 = tables.os2;
  if (os2 && typeof os2.fsSelection === "number") {
    // Bit 0 of fsSelection = italic.
    if ((os2.fsSelection & 0x01) === 0x01) return true;
  }
  return /italic|oblique/i.test(subfamily);
}

function guessWeightFromSubfamily(subfamily: string): number {
  const sub = subfamily.toLowerCase();
  if (/(thin|hairline)/.test(sub)) return 100;
  if (/(extralight|ultralight)/.test(sub)) return 200;
  if (/light/.test(sub)) return 300;
  if (/(medium)/.test(sub)) return 500;
  if (/(semibold|demibold)/.test(sub)) return 600;
  if (/(extrabold|ultrabold|heavy)/.test(sub)) return 800;
  if (/black/.test(sub)) return 900;
  if (/bold/.test(sub)) return 700;
  return 400;
}

function clampWeight(n: number): number {
  if (n < 100) return 100;
  if (n > 900) return 900;
  return Math.round(n / 100) * 100;
}

const WEIGHT_TOKENS: { regex: RegExp; weight: number }[] = [
  { regex: /\b(thin|hairline)\b/i, weight: 100 },
  { regex: /\b(ultralight|extralight)\b/i, weight: 200 },
  { regex: /\b(light)\b/i, weight: 300 },
  { regex: /\b(medium)\b/i, weight: 500 },
  { regex: /\b(semibold|demibold)\b/i, weight: 600 },
  { regex: /\b(extrabold|ultrabold|heavy)\b/i, weight: 800 },
  { regex: /\b(black)\b/i, weight: 900 },
  { regex: /\b(bold)\b/i, weight: 700 },
  { regex: /\b(regular|book|roman|normal)\b/i, weight: 400 },
];

/**
 * Heuristic: split filename on hyphens/underscores/spaces, extract weight
 * + italic tokens, the rest is the family. Examples:
 *   Inter-Bold.ttf            → { Inter, 700, normal }
 *   OpenSans-LightItalic.ttf  → { OpenSans, 300, italic }
 *   Roboto Mono Black.otf     → { Roboto Mono, 900, normal }
 */
function parseFromFilename(filename: string): {
  familyName: string;
  weight: number;
  style: "normal" | "italic";
} {
  const stem = filename.replace(/\.[^.]+$/, "");
  const tokens = stem
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((t) => t.replace(/([a-z])([A-Z])/g, "$1 $2")) // SemiBold → Semi Bold
    .flatMap((t) => t.split(" "));

  let weight = 400;
  let style: "normal" | "italic" = "normal";
  const familyTokens: string[] = [];

  for (const token of tokens) {
    let consumed = false;
    if (/italic|oblique/i.test(token)) {
      style = "italic";
      consumed = true;
    }
    for (const w of WEIGHT_TOKENS) {
      if (w.regex.test(token)) {
        weight = w.weight;
        consumed = true;
        break;
      }
    }
    if (!consumed) familyTokens.push(token);
  }

  const familyName = familyTokens.join(" ").trim() || stem;
  return { familyName, weight, style };
}
