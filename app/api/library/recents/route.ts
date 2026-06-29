import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/library/recents?limit= — the user's most-recently-updated artifacts, the
 * server source of truth for "Jump back in" and ⌘K (replacing the stale, per-device
 * localStorage list). Owner-scoped, ordered by `updated_at`. (A true "last opened"
 * via an `accessed_at` column is a later additive change; `updated_at` is the right
 * proxy until then.)
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit")) || 12, 1),
    50
  );

  try {
    const { data, error: qError } = await supabase
      .from("canvas")
      .select("id, name, code, canvas_type, folder_id, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (qError) {
      return NextResponse.json({ error: qError.message }, { status: 500 });
    }
    return NextResponse.json({ recents: data ?? [] });
  } catch (error) {
    console.error("Error fetching recents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
