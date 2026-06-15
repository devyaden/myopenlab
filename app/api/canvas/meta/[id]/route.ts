import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Phase 3: lightweight metadata for a canvas/document, used by document embeds
 * — most notably the sub-document "reference card" (DocReference). Returns just
 * what a card needs (title, human code, type, owner, last-edited, visibility),
 * never the heavy nodes/lexical payload. Scoped to the owner (or a public
 * canvas) so a card can't leak another user's metadata.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    if (!id) {
      return NextResponse.json({ error: "Canvas ID is required" }, { status: 400 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: canvas, error: canvasError } = await supabase
      .from("canvas")
      .select("id, name, code, canvas_type, visibility, updated_at, user_id")
      .eq("id", id)
      .maybeSingle();

    if (canvasError) {
      console.error("Canvas meta error:", canvasError);
      return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
    }
    if (!canvas) {
      return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
    }

    if (canvas.visibility !== "public" && canvas.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Owner name is a nice-to-have on the card; a lookup failure must not break
    // the card, so it's a separate, best-effort query.
    let owner: string | null = null;
    const { data: ownerRow } = await supabase
      .from("user")
      .select("name, email")
      .eq("id", canvas.user_id)
      .maybeSingle();
    if (ownerRow) owner = ownerRow.name || ownerRow.email || null;

    return NextResponse.json({
      id: canvas.id,
      name: canvas.name,
      code: canvas.code ?? null,
      canvas_type: canvas.canvas_type,
      visibility: canvas.visibility,
      updated_at: canvas.updated_at,
      owner,
    });
  } catch (error) {
    console.error("Error fetching canvas meta:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
