import type { SupabaseClient } from "@supabase/supabase-js";

export interface WorkspacePlaybook {
  id: string;
  name: string;
  type: string;
  code: string | null;
  folder: string | null;
  updated_at: string;
  /** Phase 5d: 'person' | 'role' when this Table is a directory. */
  directory_kind?: string | null;
}

export interface WorkspaceIndex {
  playbooks: WorkspacePlaybook[];
  text: string;
}

/**
 * Builds a compact index of the user's workspace: every playbook with id, name,
 * type, folder, and last-updated. Deliberately omits node/edge content — the
 * agent pulls full content on demand via the get_canvas tool. This keeps the
 * fixed prompt context small and cacheable.
 */
export async function buildWorkspaceIndex(
  supabase: SupabaseClient,
  userId: string
): Promise<WorkspaceIndex> {
  // Folders (with their playbooks) + root-level playbooks, scoped to the user.
  const [{ data: folders }, { data: rootCanvases }] = await Promise.all([
    supabase
      .from("folder")
      .select(
        "id, name, canvases:canvas(id, name, canvas_type, code, directory_kind, updated_at)"
      )
      .eq("user_id", userId),
    supabase
      .from("canvas")
      .select("id, name, canvas_type, code, directory_kind, updated_at, folder_id")
      .eq("user_id", userId)
      .is("folder_id", null),
  ]);

  const playbooks: WorkspacePlaybook[] = [];

  for (const folder of folders ?? []) {
    for (const c of (folder as any).canvases ?? []) {
      playbooks.push({
        id: c.id,
        name: c.name,
        type: c.canvas_type ?? "hybrid",
        code: c.code ?? null,
        folder: (folder as any).name ?? null,
        updated_at: c.updated_at,
        directory_kind: c.directory_kind ?? null,
      });
    }
  }
  for (const c of rootCanvases ?? []) {
    playbooks.push({
      id: (c as any).id,
      name: (c as any).name,
      type: (c as any).canvas_type ?? "hybrid",
      code: (c as any).code ?? null,
      folder: null,
      updated_at: (c as any).updated_at,
      directory_kind: (c as any).directory_kind ?? null,
    });
  }

  playbooks.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));

  const text =
    playbooks.length === 0
      ? "The user has no playbooks yet."
      : playbooks
          .map(
            (p) =>
              `- [${p.id}]${p.code ? ` {${p.code}}` : ""} "${p.name}" (${
                p.directory_kind ? `${p.directory_kind} directory` : p.type
              }${p.folder ? `, folder: ${p.folder}` : ""})`
          )
          .join("\n");

  return { playbooks, text };
}
