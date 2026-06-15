import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  createReference,
  resolveCode,
  listBacklinks,
} from "@/lib/refs/resolver";

/**
 * Phase 3: typed cross-references created from the editor — a typed @-mention or
 * a sub-document reference card produces a `reference` row. Server-authoritative:
 * user_id comes from the session, and the caller must own the source canvas, so
 * the client can never forge a reference on someone else's behalf.
 */

const postSchema = z.object({
  fromCanvas: z.string().uuid(),
  fromNode: z.string().nullable().optional(),
  toCanvas: z.string().uuid().nullable().optional(),
  toCode: z.string().trim().max(64).nullable().optional(),
  type: z.string().trim().min(1).max(40),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.format() },
      { status: 400 }
    );
  }
  const input = parsed.data;
  if (!input.toCanvas && !input.toCode) {
    return NextResponse.json(
      { error: "A target (toCanvas or toCode) is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The user must own the source canvas.
  const { data: src } = await supabase
    .from("canvas")
    .select("id, user_id")
    .eq("id", input.fromCanvas)
    .maybeSingle();
  if (!src || src.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Resolve a canonical target canvas where possible (a code may not resolve
  // yet — that's a deliberately dangling ref the integrity check will flag).
  let toCanvas = input.toCanvas ?? null;
  if (!toCanvas && input.toCode) {
    const resolved = await resolveCode(supabase, user.id, input.toCode);
    toCanvas = resolved?.id ?? null;
  }

  // A reference can't point at itself.
  if (toCanvas && toCanvas === input.fromCanvas) {
    return NextResponse.json(
      { error: "A reference cannot target its own source" },
      { status: 400 }
    );
  }

  // Dedupe: repeated inserts of the same mention/card must not pile up rows.
  let dedupe = supabase
    .from("reference")
    .select("id")
    .eq("user_id", user.id)
    .eq("from_canvas", input.fromCanvas)
    .eq("type", input.type)
    .limit(1);
  dedupe = input.fromNode
    ? dedupe.eq("from_node", input.fromNode)
    : dedupe.is("from_node", null);
  dedupe = toCanvas
    ? dedupe.eq("to_canvas", toCanvas)
    : dedupe.eq("to_code", input.toCode as string);

  const { data: existing } = await dedupe;
  if (existing && existing.length > 0) {
    return NextResponse.json({ id: existing[0].id, deduped: true });
  }

  const row = await createReference(supabase, user.id, {
    fromCanvas: input.fromCanvas,
    fromNode: input.fromNode ?? null,
    toCanvas,
    toCode: input.toCode ?? null,
    type: input.type,
  });
  if (!row) {
    return NextResponse.json(
      { error: "Failed to create reference" },
      { status: 500 }
    );
  }
  return NextResponse.json({ id: row.id, deduped: false });
}

/**
 * Backlinks for an artifact — "what references this?". Powers the Phase 5
 * backlinks panel and is handy for QA. Scoped to the session user.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const canvasId = searchParams.get("canvasId");
  const code = searchParams.get("code");
  if (!canvasId && !code) {
    return NextResponse.json(
      { error: "canvasId or code is required" },
      { status: 400 }
    );
  }

  const backlinks = await listBacklinks(supabase, user.id, {
    canvasId,
    code,
  });
  return NextResponse.json({ backlinks });
}
