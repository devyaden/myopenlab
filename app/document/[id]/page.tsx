import CanvasNew from "@/components/canvas-new";
import Editor from "@/components/editor";
import { Unauthorized } from "@/components/unauthorized";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SharedCanvas({
  params,
}: {
  params: { id: string };
}) {
  const canvasId = params.id;
  const supabase = createClient();

  // Check if the canvas exists and is public
  const { data: canvas, error } = await supabase
    .from("canvas")
    .select("visibility, user_id")
    .eq("id", canvasId)
    .single();

  // If canvas doesn't exist, redirect to home
  if (error) {
    redirect("/");
  }

  // If canvas is not public, show unauthorized page
  if (canvas.visibility !== "public") {
    return <Unauthorized />;
  }

  // If canvas is public, render it
  return <Editor canvasId={canvasId} />;
}
