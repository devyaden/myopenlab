// Dev-only, dependency-light tracing for the agent loop. Everything goes to stdout
// as a single grep-able JSON line (tag "agent.trace") and no-ops in production
// unless AGENT_TRACE=1. It never logs raw bodies/attachments — only summaries — and
// is read back by the dev run-viewer (app/protected/dev/agent-runs).

export function isTraceEnabled(): boolean {
  return process.env.AGENT_TRACE === "1" || process.env.NODE_ENV !== "production";
}

let fallbackCounter = 0;

/** A correlation id for one runAgentLoop invocation. */
export function newRunId(): string {
  const c: any = (globalThis as any).crypto;
  if (c?.randomUUID) {
    try {
      return c.randomUUID();
    } catch {
      /* fall through */
    }
  }
  fallbackCounter += 1;
  return `run-${Date.now()}-${fallbackCounter}`;
}

/**
 * A shallow, size-bounded summary of a tool's input. Arrays collapse to a count,
 * long strings truncate, and we never recurse into nested bodies — enough to debug
 * what was called without dumping a whole document/diagram into the logs.
 */
export function summarizeToolInput(
  _name: string,
  input: any
): Record<string, any> {
  if (input == null || typeof input !== "object") return { value: input };
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input)) {
    if (Array.isArray(v)) out[k] = `[${v.length} items]`;
    else if (typeof v === "string")
      out[k] = v.length > 80 ? `${v.slice(0, 80)}… (${v.length} chars)` : v;
    else if (v != null && typeof v === "object") out[k] = "{…}";
    else out[k] = v;
  }
  return out;
}

export interface ToolTraceRecord {
  runId: string;
  name: string;
  inputSummary: Record<string, any>;
  durationMs: number;
  ok: boolean;
  error?: string;
  proposalKind?: string;
}

export function traceToolCall(rec: ToolTraceRecord): void {
  if (!isTraceEnabled()) return;
  // eslint-disable-next-line no-console
  console.info(JSON.stringify({ tag: "agent.trace", kind: "tool", ...rec }));
}

export interface TurnTraceRecord {
  runId: string;
  iterations: number;
  toolCalls: number;
  proposals: number;
  durationMs: number;
  billableTokens: number;
  contextTokens: number;
}

export function traceTurn(rec: TurnTraceRecord): void {
  if (!isTraceEnabled()) return;
  // eslint-disable-next-line no-console
  console.info(JSON.stringify({ tag: "agent.trace", kind: "turn", ...rec }));
}
