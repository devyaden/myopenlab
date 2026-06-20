"use client";

import { supabase } from "@/lib/supabase/client";

export interface MentionFile {
  id: string;
  name: string;
  canvas_type: string | null;
  folder_name: string | null;
  /** Phase 3: human-readable code (e.g. "HR-01"), so `@` can resolve by code. */
  code: string | null;
  /**
   * Phase 5d: when this entry is a directory row, `kind` is 'person'|'role' and
   * `directoryId`/`nodeId` point at the row so `@`-mentioning it records a typed
   * person/role reference. For ordinary canvases these are undefined.
   */
  kind?: "person" | "role";
  directoryId?: string | null;
  nodeId?: string | null;
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

// The base cache is CANVASES ONLY. Directory people/roles are a separate cache
// surfaced ONLY in the @-mention path (searchFiles with includePeople) — never
// in getAllFiles()/the Cmd+K palette or the doc-reference picker, which would
// otherwise navigate/embed a non-canvas `dirId::nodeId` id and break.
let cache: MentionFile[] | null = null;
let inflight: Promise<MentionFile[]> | null = null;
let peopleCache: MentionFile[] | null = null;
let peopleInflight: Promise<MentionFile[]> | null = null;

async function fetchCanvases(): Promise<MentionFile[]> {
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

/** Phase 5d: directory rows (people/roles) flattened into mention candidates. */
async function fetchPeople(): Promise<MentionFile[]> {
  if (peopleCache) return peopleCache;
  if (peopleInflight) return peopleInflight;

  peopleInflight = (async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: dirs, error } = await supabase
      .from("canvas")
      .select("id, name, directory_kind, canvas_data(nodes)")
      .eq("user_id", user.id)
      .not("directory_kind", "is", null);
    if (error) {
      console.error("[useFileSearch] failed to load directories", error);
      return [];
    }

    const people: MentionFile[] = [];
    for (const dir of dirs ?? []) {
      const kind = (dir as any).directory_kind as "person" | "role";
      // canvas_data is a 1:1 relation → Supabase returns an object or array.
      const cd = (dir as any).canvas_data;
      const nodes = Array.isArray(cd) ? cd[0]?.nodes : cd?.nodes;
      for (const n of Array.isArray(nodes) ? nodes : []) {
        if (!n?.id) continue;
        people.push({
          id: `${(dir as any).id}::${n.id}`, // unique list key (NOT a canvas id)
          name: String(n?.data?.label ?? "Untitled"),
          canvas_type: kind, // 'person' | 'role' → drives the icon
          folder_name: (dir as any).name ?? null, // which directory
          code: null,
          kind,
          directoryId: (dir as any).id,
          nodeId: String(n.id),
        });
      }
    }
    peopleCache = people;
    return people;
  })();

  try {
    return await peopleInflight;
  } finally {
    peopleInflight = null;
  }
}

/**
 * Search the user's canvases by name/code. With `includePeople` it also returns
 * directory people/roles (the @-mention pipeline passes true) — every other
 * consumer (Cmd+K palette, doc-reference picker) gets canvases only.
 */
export async function searchFiles(
  query: string,
  includePeople = false
): Promise<MentionFile[]> {
  const [canvases, people] = await Promise.all([
    fetchCanvases(),
    includePeople ? fetchPeople() : Promise.resolve([] as MentionFile[]),
  ]);
  const files = includePeople ? [...canvases, ...people] : canvases;
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

/** The full cached canvas list (cross-folder) for the Cmd+K palette — NO people. */
export async function getAllFiles(): Promise<MentionFile[]> {
  return fetchCanvases();
}

export function preloadFiles(): void {
  void fetchCanvases();
}

/** Drop both caches so the next search refetches from Supabase. */
export function invalidateFileCache(): void {
  cache = null;
  peopleCache = null;
}
