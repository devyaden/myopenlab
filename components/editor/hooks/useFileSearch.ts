"use client";

import { supabase } from "@/lib/supabase/client";

export interface MentionFile {
  id: string;
  name: string;
  canvas_type: string | null;
  folder_name: string | null;
  /** Phase 3: human-readable code (e.g. "HR-01"), so `@` can resolve by code. */
  code: string | null;
}

/**
 * Module-level cache + fetcher for the current user's canvases. Used by
 * the Tiptap suggestion plugin's `items({ query })` callback, which runs
 * outside React and so can't consume hooks. The cache is invalidated on
 * window focus (handled by editor mount in index.tsx) so files created
 * elsewhere appear without a full reload.
 *
 * Reuses the scoping pattern from useDocumentStore.loadFolderCanvases
 * (user_id filter) but spans every folder so @-mentions can reach any
 * file the user owns.
 */

let cache: MentionFile[] | null = null;
let inflight: Promise<MentionFile[]> | null = null;

async function fetchAll(): Promise<MentionFile[]> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("canvas")
      .select(
        `
        id,
        name,
        code,
        canvas_type,
        folder:folder!canvas_folder_id_fkey(name)
      `
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("[useFileSearch] failed to load canvases", error);
      return [];
    }

    const files: MentionFile[] = (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name ?? "Untitled",
      canvas_type: row.canvas_type ?? null,
      folder_name: row.folder?.name ?? null,
      code: row.code ?? null,
    }));
    cache = files;
    return files;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export async function searchFiles(query: string): Promise<MentionFile[]> {
  const files = await fetchAll();
  const q = query.trim().toLowerCase();
  if (!q) return files.slice(0, 10);
  // Match on name OR human code, so `@HR-01` resolves the coded playbook.
  return files
    .filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.code ?? "").toLowerCase().includes(q)
    )
    .slice(0, 10);
}

export function preloadFiles(): void {
  void fetchAll();
}

/** Drop the cache so the next searchFiles() refetches from Supabase. */
export function invalidateFileCache(): void {
  cache = null;
}
