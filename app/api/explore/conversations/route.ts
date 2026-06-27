import { NextResponse } from "next/server";
import { requireExploreAccess } from "@/lib/explore/access";

// Lists the current user's exploration conversations (most recent first).
export async function GET() {
  const access = await requireExploreAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const { supabase, user } = access;

  const { data } = await supabase
    .from("explore_conversation")
    .select("id, title, scope_label, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(100);

  return NextResponse.json({ conversations: data ?? [] });
}
