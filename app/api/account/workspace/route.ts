import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in user's workspace settings — name, code/function naming conventions,
 * and default fonts. One row per user, RLS owner-scoped (auth.uid() = user_id), so
 * these routes use the cookie client. The migration backfilled a default row for
 * every existing user; for anyone created since (or missing one) we create it on
 * first touch.
 */
const SELECT = "id, name, conventions, default_fonts, created_at, updated_at";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let { data: workspace } = await supabase
      .from("workspace")
      .select(SELECT)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!workspace) {
      const { data: created, error: insErr } = await supabase
        .from("workspace")
        .insert({ user_id: user.id })
        .select(SELECT)
        .maybeSingle();
      if (insErr) {
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }
      workspace = created;
    }

    return NextResponse.json({ workspace });
  } catch (e) {
    console.error("Error fetching workspace:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Allow-list the editable fields only — never id/user_id/timestamps, so a client
  // can't reassign ownership or forge audit fields.
  const update: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    update.name = body.name.trim().slice(0, 120);
  }
  if (body.conventions && typeof body.conventions === "object") {
    update.conventions = body.conventions;
  }
  if (body.default_fonts && typeof body.default_fonts === "object") {
    update.default_fonts = body.default_fonts;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "No editable fields provided" },
      { status: 400 }
    );
  }
  update.updated_at = new Date().toISOString();

  const { data, error: upErr } = await supabase
    .from("workspace")
    .update(update)
    .eq("user_id", user.id)
    .select(SELECT)
    .maybeSingle();
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }
  if (!data) {
    // No row yet (e.g. a brand-new user that hasn't hit GET) — create with the patch.
    const { data: created, error: insErr } = await supabase
      .from("workspace")
      .insert({ user_id: user.id, ...update })
      .select(SELECT)
      .maybeSingle();
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
    return NextResponse.json({ workspace: created });
  }

  return NextResponse.json({ workspace: data });
}
