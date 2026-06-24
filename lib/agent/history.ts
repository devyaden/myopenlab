// Repairs a loaded conversation so the Messages API will accept it on replay.
//
// Why this is needed: legacy turns were persisted as a single batch insert, so
// every row of a turn got an identical `created_at`. `ORDER BY created_at` then
// returns those tied rows in an unspecified (often scrambled) order, which can
// separate an assistant `tool_use` from its matching `tool_result` — and the API
// rejects any transcript where a `tool_result` lacks the `tool_use` in the
// immediately preceding message (or vice versa).
//
// We drop any tool block that isn't validly paired with the adjacent message,
// drop messages that become empty, and ensure the transcript starts with a user
// message. Well-ordered histories (everything written by the current incremental
// persistence) pass through unchanged.

type Msg = { role: string; content: any };

export function sanitizeHistory(messages: Msg[]): Msg[] {
  const kept: Msg[] = [];

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    // Non-array content (plain string user/assistant text) is always valid.
    if (!m || !Array.isArray(m.content)) {
      if (m) kept.push(m);
      continue;
    }

    if (m.role === "assistant") {
      // Keep a tool_use only if the immediately-following message answers it.
      const next = messages[i + 1];
      const answered = new Set<string>();
      if (next && next.role === "user" && Array.isArray(next.content)) {
        for (const b of next.content) {
          if (b && b.type === "tool_result" && b.tool_use_id) {
            answered.add(b.tool_use_id);
          }
        }
      }
      const content = m.content.filter(
        (b: any) => !b || b.type !== "tool_use" || answered.has(b.id)
      );
      if (content.length > 0) kept.push({ ...m, content });
      // An assistant turn that becomes empty (its only blocks were unanswered
      // tool_use) is dropped.
      continue;
    }

    if (m.role === "user") {
      // Keep a tool_result only if the previous KEPT message emitted that tool_use.
      const prev = kept[kept.length - 1];
      const toolUseIds = new Set<string>();
      if (prev && prev.role === "assistant" && Array.isArray(prev.content)) {
        for (const b of prev.content) {
          if (b && b.type === "tool_use" && b.id) toolUseIds.add(b.id);
        }
      }
      const content = m.content.filter(
        (b: any) => !b || b.type !== "tool_result" || toolUseIds.has(b.tool_use_id)
      );
      if (content.length > 0) kept.push({ ...m, content });
      continue;
    }

    kept.push(m);
  }

  // The Messages API requires the first message to be a user turn.
  while (kept.length > 0 && kept[0].role !== "user") kept.shift();
  return kept;
}
