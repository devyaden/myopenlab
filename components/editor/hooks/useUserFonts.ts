"use client";

import {
  buildFontFaceCSS,
  deleteUserFont,
  listUserFonts,
  uploadUserFont,
  type UserFont,
} from "@/lib/font-storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STYLE_ELEMENT_ID = "user-fonts";

interface UseUserFontsResult {
  fonts: UserFont[];
  /** Distinct family names available — what the toolbar dropdown lists. */
  families: string[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  upload: (input: {
    file: File;
    familyName: string;
    weight: number;
    style: "normal" | "italic";
  }) => Promise<void>;
  remove: (font: UserFont) => Promise<void>;
}

/**
 * Owns the per-user font library: fetches the listing on mount, keeps a
 * `<style id="user-fonts">` element in `document.head` in sync with the
 * current library, and exposes upload/remove. Apply a font in the editor
 * via the existing FontFamily extension (it just sets `font-family: …`).
 */
export function useUserFonts(userId: string | null | undefined): UseUserFontsResult {
  const [fonts, setFonts] = useState<UserFont[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) {
      setFonts([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await listUserFonts(userId);
      if (!isMountedRef.current) return;
      setFonts(list);
    } catch (err) {
      console.error("[useUserFonts] failed to load", err);
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to load fonts");
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Keep a single <style> tag in the document head that registers every
  // font via @font-face. Re-runs on any change to the list. The element is
  // not torn down on unmount because multiple editors on the same page
  // would all expect their fonts to remain registered globally.
  useEffect(() => {
    if (typeof document === "undefined") return;
    let style = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ELEMENT_ID;
      document.head.appendChild(style);
    }
    style.textContent = buildFontFaceCSS(fonts);
  }, [fonts]);

  const upload = useCallback<UseUserFontsResult["upload"]>(
    async (input) => {
      if (!userId) throw new Error("Sign in to upload fonts.");
      const font = await uploadUserFont({ ...input, userId });
      // Optimistic update — replace existing entry for the same triple.
      setFonts((prev) => {
        const filtered = prev.filter(
          (f) =>
            !(
              f.familyName.toLowerCase() === font.familyName.toLowerCase() &&
              f.weight === font.weight &&
              f.style === font.style
            )
        );
        return [font, ...filtered];
      });
    },
    [userId]
  );

  const remove = useCallback<UseUserFontsResult["remove"]>(
    async (font) => {
      await deleteUserFont(font.path);
      setFonts((prev) => prev.filter((f) => f.path !== font.path));
    },
    []
  );

  const families = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const f of fonts) {
      const key = f.familyName.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(f.familyName);
    }
    return out;
  }, [fonts]);

  return { fonts, families, loading, error, refresh, upload, remove };
}
