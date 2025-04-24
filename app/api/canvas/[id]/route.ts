import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient();

  try {
    // Get the canvas ID from the URL parameter
    const { id: canvasId } = await params;

    if (!canvasId) {
      return NextResponse.json(
        { error: "Canvas ID is required" },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("User error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the canvas
    const { data: canvas, error: canvasError } = await supabase
      .from("canvas")
      .select(
        "id, name, description, user_id, folder_id, visibility, created_at, updated_at, canvas_type"
      )
      .eq("id", canvasId)
      .single();

    if (canvasError) {
      console.error("Canvas error:", canvasError);
      return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
    }

    return NextResponse.json(canvas);
  } catch (error) {
    console.error("Error fetching canvas:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
