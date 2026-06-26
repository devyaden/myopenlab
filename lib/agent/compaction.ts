// Phase F4: auto-compaction. Every turn replays the whole conversation, so once
// the history approaches the plan's per-conversation context cap we summarize the
// OLDEST turns and replay [recap + recent turns] instead. This module is the pure
// decision logic (no API): a rough token estimate and a SAFE split index that
// never cuts a tool_use/tool_result pair (it snaps to a real user-message boundary).

/** Rough token estimate from serialized content (~4 chars/token). Cheap + good enough. */
export function estimateTokens(messages: any[]): number {
  let chars = 0;
  for (const m of Array.isArray(messages) ? messages : []) {
    const c = (m as any)?.content;
    chars += typeof c === "string" ? c.length : JSON.stringify(c ?? "").length;
  }
  return Math.ceil(chars / 4);
}

/** A genuine user turn (not a tool_result turn, which is also stored as role "user"). */
export function isRealUserMessage(m: any): boolean {
  if (m?.role !== "user") return false;
  const c = m.content;
  if (typeof c === "string") return true;
  return Array.isArray(c) && !c.some((b: any) => b?.type === "tool_result");
}

/**
 * Decide where to compact. Returns the split index — head = messages[0..split)
 * gets summarized, tail = messages[split..] is replayed verbatim — or -1 to skip.
 * Triggers at ~80% of the cap; aims to leave a tail around ~50% of the cap; and
 * snaps the boundary to a real user message so a tool pair is never split.
 */
export function findCompactionSplit(
  messages: any[],
  contextCap: number
): number {
  const msgs = Array.isArray(messages) ? messages : [];
  if (!contextCap || contextCap <= 0) return -1;
  if (estimateTokens(msgs) < contextCap * 0.8) return -1;

  const targetTail = contextCap * 0.5;
  let acc = 0;
  let idx = msgs.length;
  for (let i = msgs.length - 1; i >= 0; i--) {
    acc += estimateTokens([msgs[i]]);
    if (acc >= targetTail) {
      idx = i;
      break;
    }
  }
  // Snap forward to the next real user message so the tail starts cleanly.
  let split = idx;
  while (split < msgs.length && !isRealUserMessage(msgs[split])) split++;
  // Need a non-empty head to summarize and a non-empty tail to keep.
  if (split <= 0 || split >= msgs.length) return -1;
  return split;
}

/** Flatten messages into a compact transcript for the summarizer prompt. */
export function transcriptForSummary(messages: any[], maxChars = 60000): string {
  const lines: string[] = [];
  for (const m of Array.isArray(messages) ? messages : []) {
    const c = (m as any)?.content;
    let text: string;
    if (typeof c === "string") text = c;
    else if (Array.isArray(c))
      text = c
        .map((b: any) =>
          b?.type === "text"
            ? b.text
            : b?.type === "tool_use"
              ? `[tool ${b.name}]`
              : b?.type === "tool_result"
                ? `[tool result]`
                : ""
        )
        .filter(Boolean)
        .join(" ");
    else text = "";
    if (text) lines.push(`${m.role}: ${text}`);
  }
  return lines.join("\n").slice(0, maxChars);
}
