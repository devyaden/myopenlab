import { NextResponse } from "next/server";

// Dev-only run inspector: returns a per-turn, tool-call-level view of one
// conversation, derived from the stored agent_message content (which already holds
// the full tool_use / tool_result blocks) plus its agent_proposal rows. 404s in
// production and is scoped to the signed-in owner — it exposes workspace internals,
// so it must never be reachable for real users.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.NODE_ENV === "production" && process.env.AGENT_TRACE !== "1") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
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
    .select("id, title, canvas_id, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!convo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: rows } = await supabase
    .from("agent_message")
    .select("role, content, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  const { data: proposals } = await supabase
    .from("agent_proposal")
    .select("message_ordinal, proposal_index, proposal_json, status, applied_canvas_id")
    .eq("conversation_id", id)
    .order("message_ordinal", { ascending: true })
    .order("proposal_index", { ascending: true });

  // Derive a flat, readable trace: text snippets, tool_use calls (with a short
  // input summary), tool_result outcomes, and thinking markers.
  const blocks: any[] = [];
  for (const r of rows ?? []) {
    const content = (r as any).content;
    if (typeof content === "string") {
      blocks.push({ role: r.role, type: "text", text: truncate(content) });
      continue;
    }
    for (const b of Array.isArray(content) ? content : []) {
      if (b?.type === "text")
        blocks.push({ role: r.role, type: "text", text: truncate(b.text) });
      else if (b?.type === "tool_use")
        blocks.push({
          role: r.role,
          type: "tool_use",
          name: b.name,
          input: summarize(b.input),
        });
      else if (b?.type === "tool_result")
        blocks.push({
          role: r.role,
          type: "tool_result",
          is_error: Boolean(b.is_error),
          content: truncate(
            typeof b.content === "string" ? b.content : JSON.stringify(b.content)
          ),
        });
      else if (b?.type === "thinking")
        blocks.push({ role: r.role, type: "thinking" });
    }
  }

  return NextResponse.json({
    conversation: convo,
    blocks,
    proposals: proposals ?? [],
  });
}

function truncate(s: string | null | undefined, max = 600): string {
  const v = String(s ?? "");
  return v.length > max ? `${v.slice(0, max)}… (${v.length} chars)` : v;
}

function summarize(input: any): Record<string, any> {
  if (input == null || typeof input !== "object") return { value: input };
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input)) {
    if (Array.isArray(v)) out[k] = `[${v.length} items]`;
    else if (typeof v === "string")
      out[k] = v.length > 80 ? `${v.slice(0, 80)}…` : v;
    else if (v != null && typeof v === "object") out[k] = "{…}";
    else out[k] = v;
  }
  return out;
}
