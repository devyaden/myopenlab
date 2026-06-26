// Token accounting for the agent. Anthropic returns per-call usage; we fold every
// call in a turn into one running total and derive a single "billable" number that
// roughly mirrors the price ratio between input, output, cache-write and cache-read
// tokens. The daily/monthly budgets (lib/services/ai-usage.ts) and the in-chat
// context meter are both denominated in these units.

/** The raw `usage` block Anthropic attaches to a (final) message. */
export interface RawUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

export interface TurnUsage {
  /** Non-cached input tokens (Anthropic's input_tokens already excludes cache). */
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  billableTokens: number;
  /** Tokens of context on the LAST model call this turn ≈ current conversation size. */
  contextTokens: number;
}

// Tunable weights, roughly tracking Anthropic's per-token price ratios. Output is
// the dominant cost; cache reads are heavily discounted; cache writes cost a touch
// more than fresh input. Tune in one place as pricing changes.
export const TOKEN_WEIGHTS = {
  output: 5,
  input: 1,
  cacheWrite: 1.25,
  cacheRead: 0.1,
} as const;

export function emptyTurnUsage(): TurnUsage {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    billableTokens: 0,
    contextTokens: 0,
  };
}

/** Weighted "billable" tokens for a usage total. */
export function billableTokens(u: {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}): number {
  const w = TOKEN_WEIGHTS;
  return Math.round(
    u.outputTokens * w.output +
      u.inputTokens * w.input +
      u.cacheCreationTokens * w.input * w.cacheWrite +
      u.cacheReadTokens * w.input * w.cacheRead
  );
}

/**
 * Fold one model call's raw usage into the running turn total. `contextTokens` is
 * set (not added) to the most recent call's full input — on the last iteration that
 * is the whole replayed conversation, which is exactly the context-meter number.
 */
export function accumulateUsage(
  acc: TurnUsage,
  raw: RawUsage | null | undefined
): TurnUsage {
  const input = raw?.input_tokens ?? 0;
  const output = raw?.output_tokens ?? 0;
  const cacheRead = raw?.cache_read_input_tokens ?? 0;
  const cacheCreation = raw?.cache_creation_input_tokens ?? 0;
  const next: TurnUsage = {
    inputTokens: acc.inputTokens + input,
    outputTokens: acc.outputTokens + output,
    cacheReadTokens: acc.cacheReadTokens + cacheRead,
    cacheCreationTokens: acc.cacheCreationTokens + cacheCreation,
    billableTokens: 0,
    contextTokens: input + cacheRead + cacheCreation,
  };
  next.billableTokens = billableTokens(next);
  return next;
}
