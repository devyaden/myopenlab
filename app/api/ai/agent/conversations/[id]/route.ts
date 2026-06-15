import { NextResponse } from "next/server";

// Returns the messages of one conversation (ownership-checked), for rehydrating
// the chat when a user reopens a past conversation.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: convo } = await supabase
    .from("agent_conversation")
    .select("id, title, canvas_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!convo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: messages } = await supabase
    .from("agent_message")
    .select("role, content, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ conversation: convo, messages: messages ?? [] });
}
