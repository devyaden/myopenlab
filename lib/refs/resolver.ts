import type { SupabaseClient } from "@supabase/supabase-js";

// Phase 2: the cross-reference spine. A `reference` row links a source
// (canvas + optional node) to a target (canvas/node, or a human code that
// resolves to one) with a type. This module is the resolver: code → entity,
// backlinks ("what references X"), and dangling-ref integrity checks. All
// queries are scoped to userId so a user can never read another's references.

export type ReferenceType =
  | "process-step"
  | "template"
  | "policy"
  | "standard"
  | "checklist"
  | "authority"
  | "person"
  | "role"
  | "depends-on";

export const REFERENCE_TYPES: ReferenceType[] = [
  "process-step",
  "template",
  "policy",
  "standard",
  "checklist",
  "authority",
  "person",
  "role",
  "depends-on",
];

export interface ReferenceInput {
  fromCanvas: string;
  fromNode?: string | null;
  toCanvas?: string | null;
  toNode?: string | null;
  toCode?: string | null;
  type: ReferenceType | string;
}

export interface ReferenceRow {
  id: string;
  user_id: string;
  from_canvas: string;
  from_node: string | null;
  to_canvas: string | null;
  to_node: string | null;
  to_code: string | null;
  type: string;
  created_at: string;
}

export interface ResolvedEntity {
  id: string;
  name: string;
  code: string | null;
  canvas_type: string;
}

/** Resolve a human code (e.g. "HR-01") to its canvas, scoped to the user. */
export async function resolveCode(
  supabase: SupabaseClient,
  userId: string,
  code: string
): Promise<ResolvedEntity | null> {
  const c = String(code ?? "").trim();
  if (!c) return null;
  const { data } = await supabase
    .from("canvas")
    .select("id, name, code, canvas_type")
    .eq("user_id", userId)
    .eq("code", c)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    code: data.code ?? null,
    canvas_type: data.canvas_type,
  };
}

/**
 * Create a typed reference. If only a `toCode` is given it is resolved to a
 * canvas id (the code is also stored so the link survives even if the target is
 * later recoded). Returns the inserted row, or null on error.
 */
export async function createReference(
  supabase: SupabaseClient,
  userId: string,
  ref: ReferenceInput
): Promise<ReferenceRow | null> {
  let toCanvas = ref.toCanvas ?? null;
  if (!toCanvas && ref.toCode) {
    const resolved = await resolveCode(supabase, userId, ref.toCode);
    toCanvas = resolved?.id ?? null;
  }
  const row = {
    id: crypto.randomUUID(),
    user_id: userId,
    from_canvas: ref.fromCanvas,
    from_node: ref.fromNode ?? null,
    to_canvas: toCanvas,
    to_node: ref.toNode ?? null,
    to_code: ref.toCode ?? null,
    type: ref.type,
  };
  const { data, error } = await supabase
    .from("reference")
    .insert(row)
    .select()
    .maybeSingle();
  if (error) {
    console.error("createReference failed:", error.message);
    return null;
  }
  return data as ReferenceRow;
}

export interface Backlink extends ReferenceRow {
  fromCanvas?: ResolvedEntity | null;
}

/**
 * Backlinks: references that point AT a target, by canvas id and/or code, each
 * enriched with its source canvas. This answers "what references HR-01?".
 */
export async function listBacklinks(
  supabase: SupabaseClient,
  userId: string,
  target: { canvasId?: string | null; code?: string | null }
): Promise<Backlink[]> {
  const ors: string[] = [];
  if (target.canvasId) ors.push(`to_canvas.eq.${target.canvasId}`);
  if (target.code) ors.push(`to_code.eq.${target.code}`);
  if (ors.length === 0) return [];

  const { data, error } = await supabase
    .from("reference")
    .select(
      "*, fromCanvas:canvas!reference_from_canvas_fkey(id, name, code, canvas_type)"
    )
    .eq("user_id", userId)
    .or(ors.join(","));
  if (error) {
    console.error("listBacklinks failed:", error.message);
    return [];
  }
  return (data ?? []) as Backlink[];
}

export interface OutgoingReference extends ReferenceRow {
  toCanvas?: ResolvedEntity | null;
}

/** References that originate FROM a canvas (optionally a specific node). */
export async function listOutgoingReferences(
  supabase: SupabaseClient,
  userId: string,
  canvasId: string,
  fromNode?: string | null
): Promise<OutgoingReference[]> {
  let q = supabase
    .from("reference")
    .select(
      "*, toCanvas:canvas!reference_to_canvas_fkey(id, name, code, canvas_type)"
    )
    .eq("user_id", userId)
    .eq("from_canvas", canvasId);
  if (fromNode) q = q.eq("from_node", fromNode);
  const { data, error } = await q;
  if (error) {
    console.error("listOutgoingReferences failed:", error.message);
    return [];
  }
  return (data ?? []) as OutgoingReference[];
}

/**
 * Integrity check: references whose target no longer resolves. The FK cascade
 * keeps `to_canvas` valid (a deleted canvas's incoming refs are removed), so a
 * dangler is a reference that points nowhere, or one keyed on a `to_code` that
 * no longer matches any canvas in the workspace (e.g. the target was recoded or
 * never created). This is the seed of the drift-detection moat.
 */
export async function findDanglingReferences(
  supabase: SupabaseClient,
  userId: string
): Promise<ReferenceRow[]> {
  const { data } = await supabase
    .from("reference")
    .select("*")
    .eq("user_id", userId);
  const refs = (data ?? []) as ReferenceRow[];
  if (refs.length === 0) return [];

  const { data: coded } = await supabase
    .from("canvas")
    .select("code")
    .eq("user_id", userId)
    .not("code", "is", null);
  const validCodes = new Set((coded ?? []).map((r: any) => r.code));

  // Phase 5d: node-level (person/role) refs point at a row WITHIN a live canvas.
  // The FK keeps to_canvas valid, but the row (node) could have been deleted, so
  // validate to_node against the target canvas's current nodes. Batch-load each
  // distinct target canvas's node ids once.
  const distinct = Array.from(
    new Set(
      refs.filter((r) => r.to_canvas && r.to_node).map((r) => r.to_canvas as string)
    )
  );
  const nodeMembership = new Map<string, Set<string>>();
  for (const cid of distinct) {
    const { data: cd } = await supabase
      .from("canvas_data")
      .select("nodes")
      .eq("canvas_id", cid)
      .maybeSingle();
    const ids = new Set(
      (Array.isArray(cd?.nodes) ? (cd!.nodes as any[]) : [])
        .map((n: any) => String(n?.id))
        .filter(Boolean)
    );
    nodeMembership.set(cid, ids);
  }

  return refs.filter((r) => {
    if (r.to_canvas) {
      if (r.to_node) {
        const ids = nodeMembership.get(r.to_canvas);
        return ids ? !ids.has(r.to_node) : false; // row deleted ⇒ dangling
      }
      return false; // a live canvas target (FK-guaranteed)
    }
    if (!r.to_code) return true; // points nowhere
    return !validCodes.has(r.to_code); // code no longer resolves
  });
}

// ── Phase 5d: the Employee/Org directory ────────────────────────────────────

export interface Directory {
  id: string; // the directory canvas id
  name: string;
  code: string | null;
  kind: string; // 'person' | 'role'
}

export interface DirectoryRow {
  id: string; // the row's node id
  label: string; // display name (node.data.label)
  data: Record<string, any>;
}

/** Canvases the user has designated as people/role directories. */
export async function listDirectories(
  supabase: SupabaseClient,
  userId: string,
  kind?: "person" | "role"
): Promise<Directory[]> {
  let q = supabase
    .from("canvas")
    .select("id, name, code, directory_kind")
    .eq("user_id", userId)
    .not("directory_kind", "is", null);
  if (kind) q = q.eq("directory_kind", kind);
  const { data, error } = await q;
  if (error) {
    console.error("listDirectories failed:", error.message);
    return [];
  }
  return (data ?? []).map((d: any) => ({
    id: d.id,
    name: d.name,
    code: d.code ?? null,
    kind: d.directory_kind,
  }));
}

/** The rows (people/roles) of a directory, read from its canvas_data nodes. */
export async function listDirectoryRows(
  supabase: SupabaseClient,
  userId: string,
  directoryId: string
): Promise<DirectoryRow[]> {
  // The directory must belong to the user (the data read isn't user-scoped).
  const { data: owned } = await supabase
    .from("canvas")
    .select("id")
    .eq("id", directoryId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!owned) return [];
  const { data } = await supabase
    .from("canvas_data")
    .select("nodes")
    .eq("canvas_id", directoryId)
    .maybeSingle();
  const nodes = Array.isArray(data?.nodes) ? (data!.nodes as any[]) : [];
  return nodes
    .filter((n) => n && n.id)
    .map((n) => ({
      id: String(n.id),
      label: String(n.data?.label ?? "Untitled"),
      data: (n.data ?? {}) as Record<string, any>,
    }));
}
