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

  // Persisted proposals (with their current status), so reopening a conversation
  // restores the Apply / Open buttons on the right message. Best-effort — if the
  // table isn't present yet, `error` is set and we just return none.
  const { data: proposals } = await supabase
    .from("agent_proposal")
    .select("id, message_ordinal, proposal_index, proposal_json, status, applied_canvas_id")
    .eq("conversation_id", id)
    .order("message_ordinal", { ascending: true })
    .order("proposal_index", { ascending: true });

  return NextResponse.json({
    conversation: convo,
    messages: messages ?? [],
    proposals: proposals ?? [],
  });
}
