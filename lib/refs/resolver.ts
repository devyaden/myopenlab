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

  return refs.filter((r) => {
    if (r.to_canvas) return false; // a live canvas target (FK-guaranteed)
    if (!r.to_code) return true; // points nowhere
    return !validCodes.has(r.to_code); // code no longer resolves
  });
}
