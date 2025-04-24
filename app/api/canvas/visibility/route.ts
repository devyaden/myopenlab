import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const supabase = createClient();

  try {
    const { canvasId, visibility } = await request.json();

    if (!canvasId || !visibility) {
      return NextResponse.json(
        { error: "Canvas ID and visibility are required" },
        { status: 400 }
      );
    }

    // Validate that visibility is either 'public' or 'private'
    if (visibility !== "public" && visibility !== "private") {
      return NextResponse.json(
        { error: "Visibility must be either 'public' or 'private'" },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user owns the canvas
    const { data: canvas, error: canvasError } = await supabase
      .from("canvas")
      .select("user_id")
      .eq("id", canvasId)
      .single();

    if (canvasError) {
      return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
    }

    if (canvas.user_id !== user.id) {
      return NextResponse.json(
        {
          error: "You don't have permission to change this canvas's visibility",
        },
        { status: 403 }
      );
    }

    // Update the canvas visibility
    const { error: updateError } = await supabase
      .from("canvas")
      .update({ visibility })
      .eq("id", canvasId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update canvas visibility" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, visibility }, { status: 200 });
  } catch (error) {
    console.error("Error updating canvas visibility:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
