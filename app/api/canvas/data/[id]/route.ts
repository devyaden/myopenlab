import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: canvasId } = await params;
  const supabase = await createClient();

  try {
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

    if (userError || !user) {
      console.error("User error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the canvas to check visibility and ownership
    const { data: canvas, error: canvasError } = await supabase
      .from("canvas")
      .select("id, user_id, visibility")
      .eq("id", canvasId)
      .single();

    if (canvasError) {
      console.error("Canvas error:", canvasError);
      return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
    }

    // Check if user has access to the canvas
    if (canvas.visibility !== "public" && canvas.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch the canvas data
    const { data: canvasData, error: dataError } = await supabase
      .from("canvas_data")
      .select("nodes, edges, styles, version, updated_at")
      .eq("canvas_id", canvasId)
      .single();

    if (dataError && dataError.code !== "PGRST116") {
      console.error("Canvas data error:", dataError);
      return NextResponse.json(
        { error: "Canvas data not found" },
        { status: 404 }
      );
    }

    // Return the canvas data with additional metadata
    return NextResponse.json({
      id: canvasId,
      nodes: canvasData?.nodes || [],
      edges: canvasData?.edges || [],
      styles: canvasData?.styles || {},
      version: canvasData?.version || 1,
      updated_at: canvasData?.updated_at || new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching canvas data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
