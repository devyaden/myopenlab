import { NextResponse } from "next/server";
import { requireExploreAccess } from "@/lib/explore/access";

// Returns the messages of one exploration conversation (ownership-checked), for
// rehydrating the chat when a user reopens a past conversation. No proposals —
// exploration is read-only.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await requireExploreAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const { supabase, user } = access;

  const { data: convo } = await supabase
    .from("explore_conversation")
    .select("id, title, scope_label")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!convo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: messages } = await supabase
    .from("explore_message")
    .select("role, content, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ conversation: convo, messages: messages ?? [] });
}
