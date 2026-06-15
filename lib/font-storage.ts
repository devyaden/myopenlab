"use client";

import { supabase } from "./supabase/client";

/**
 * Per-user custom-font library backed entirely by Supabase Storage — no DB
 * model needed. Each font file lives at:
 *
 *   user-fonts/<user_id>/<safeFamily>__<weight>__<style>.<ext>
 *
 * where:
 *   safeFamily — family name with whitespace/special chars sanitised
 *   weight     — numeric font weight (100..900), default 400
 *   style      — "normal" | "italic", default "normal"
 *   ext        — woff2 | woff | ttf | otf
 *
 * Listing the prefix yields the full library; metadata is parsed back from
 * the filename. Deletion removes the storage object. Uniqueness is enforced
 * by upsert on the (family,weight,style) tuple — re-uploading replaces.
 */

export const FONT_BUCKET = "yadn-diagrams";
export const FONT_PREFIX = "user-fonts";

export const ALLOWED_FONT_FORMATS = ["woff2", "woff", "ttf", "otf"] as const;
export type FontFormat = (typeof ALLOWED_FONT_FORMATS)[number];

const MAX_FONT_BYTES = 2 * 1024 * 1024; // 2 MB cap per font file

export interface UserFont {
  /** Synthetic id (storage path). Used as react key. */
  id: string;
  /** Storage object path (relative to bucket). */
  path: string;
  /** CSS font-family value applied via FontFamily extension. */
  familyName: string;
  weight: number;
  style: "normal" | "italic";
  format: FontFormat;
  /** Supabase public URL — embedded in @font-face src. */
  url: string;
  createdAt: string;
}

/** Replace anything that's not letter/digit/space/-_ with `_`, collapse whitespace. */
function safeFamilyName(name: string): string {
  return name
    .trim()
    .replace(/[^A-Za-z0-9 _-]+/g, "_")
    .replace(/\s+/g, " ")
    .slice(0, 64);
}

function extOf(file: File): FontFormat {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if ((ALLOWED_FONT_FORMATS as readonly string[]).includes(ext)) {
    return ext as FontFormat;
  }
  // Some browsers send `application/font-*` but no extension; default to woff2.
  return "woff2";
}

function parseFilename(filename: string):
  | {
      familyName: string;
      weight: number;
      style: "normal" | "italic";
      format: FontFormat;
    }
  | null {
  // <safeFamily>__<weight>__<style>.<ext>
  const m = filename.match(/^(.+?)__(\d+)__(normal|italic)\.([a-z0-9]+)$/i);
  if (!m) return null;
  const [, family, weightStr, styleStr, extStr] = m;
  const ext = extStr.toLowerCase() as FontFormat;
  if (!(ALLOWED_FONT_FORMATS as readonly string[]).includes(ext)) return null;
  return {
    familyName: family.replace(/_/g, " ").trim(),
    weight: Number(weightStr),
    style: styleStr.toLowerCase() as "normal" | "italic",
    format: ext,
  };
}

export async function uploadUserFont(opts: {
  file: File;
  userId: string;
  familyName: string;
  weight: number;
  style: "normal" | "italic";
}): Promise<UserFont> {
  const { file, userId, familyName, weight, style } = opts;

  if (file.size > MAX_FONT_BYTES) {
    throw new Error(
      `Font file is ${(file.size / 1024 / 1024).toFixed(2)} MB. Maximum is 2 MB.`
    );
  }

  const ext = extOf(file);
  const safeFamily = safeFamilyName(familyName).replace(/\s+/g, "_");
  if (!safeFamily) {
    throw new Error("Family name cannot be empty.");
  }
  const filename = `${safeFamily}__${weight}__${style}.${ext}`;
  const path = `${FONT_PREFIX}/${userId}/${filename}`;

  const { error } = await supabase.storage
    .from(FONT_BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      upsert: true, // re-uploading same family/weight/style replaces.
      contentType: contentTypeFor(ext),
    });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(FONT_BUCKET).getPublicUrl(path);

  return {
    id: path,
    path,
    familyName: familyName.trim(),
    weight,
    style,
    format: ext,
    url: publicUrl,
    createdAt: new Date().toISOString(),
  };
}

export async function listUserFonts(userId: string): Promise<UserFont[]> {
  const { data, error } = await supabase.storage
    .from(FONT_BUCKET)
    .list(`${FONT_PREFIX}/${userId}`, {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });
  if (error) {
    console.error("[font-storage] list failed", error);
    return [];
  }
  if (!data) return [];

  const fonts: UserFont[] = [];
  for (const obj of data) {
    if (!obj.name || obj.name.endsWith("/")) continue;
    const parsed = parseFilename(obj.name);
    if (!parsed) continue;
    const path = `${FONT_PREFIX}/${userId}/${obj.name}`;
    const {
      data: { publicUrl },
    } = supabase.storage.from(FONT_BUCKET).getPublicUrl(path);
    fonts.push({
      id: path,
      path,
      familyName: parsed.familyName,
      weight: parsed.weight,
      style: parsed.style,
      format: parsed.format,
      url: publicUrl,
      createdAt: obj.created_at ?? new Date().toISOString(),
    });
  }
  return fonts;
}

export async function deleteUserFont(path: string): Promise<void> {
  const { error } = await supabase.storage.from(FONT_BUCKET).remove([path]);
  if (error) throw error;
}

function contentTypeFor(ext: FontFormat): string {
  switch (ext) {
    case "woff2":
      return "font/woff2";
    case "woff":
      return "font/woff";
    case "ttf":
      return "font/ttf";
    case "otf":
      return "font/otf";
  }
}

/**
 * Build a CSS @font-face block that registers every passed font, grouped by
 * family. Used by useUserFonts to keep a single <style id="user-fonts">
 * element in sync with the library.
 */
export function buildFontFaceCSS(fonts: UserFont[]): string {
  return fonts
    .map(
      (f) =>
        `@font-face {\n  font-family: ${JSON.stringify(f.familyName)};\n  src: url(${JSON.stringify(
          f.url
        )}) format(${JSON.stringify(f.format)});\n  font-weight: ${f.weight};\n  font-style: ${f.style};\n  font-display: swap;\n}`
    )
    .join("\n\n");
}
