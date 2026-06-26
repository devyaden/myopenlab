import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocBlock } from "./document-blocks";

// ─────────────────────────────────────────────────────────────────────────────
// The agent tool registry. A tool is declared ONCE here as a def+handler pair
// (lib/agent/tools/*), instead of the old parallel "definitions array + a switch"
// that could drift. `executeAgentTool` (lib/agent/tools.ts) dispatches by name
// through `getTool`, and `AGENT_TOOLS` is derived from the same registry, so the
// shape the model sees and the code that runs can never disagree.
// ─────────────────────────────────────────────────────────────────────────────

export interface AgentToolContext {
  supabase: SupabaseClient;
  userId: string;
  currentCanvasId?: string | null;
  /** Phase B: correlates every tool call within a single agent run for tracing. */
  runId?: string;
}

/** A typed cross-reference the agent proposes (Phase D link_artifacts). */
export interface ReferenceSpec {
  fromCanvas: string;
  fromNode?: string | null;
  toCanvas?: string | null;
  toCode?: string | null;
  toNode?: string | null;
  type: string;
}

export interface ToolProposal {
  // create/update = whole-body (macro tools); patch = fine-grained ops re-resolved
  // at apply time (Phase D); link = a typed reference row.
  kind: "create" | "update" | "patch" | "link";
  /** Which surface the proposal targets. Absent ⇒ "canvas" (back-compat). */
  target?: "canvas" | "document" | "directory" | "reference";
  name?: string;
  code?: string | null;
  folder_id?: string | null;
  canvas_id?: string | null;
  /** Present for canvas (diagram) proposals. */
  diagram?: { nodes: any[]; edges: any[]; nodeStyles: Record<string, any> };
  /** Present for document proposals — the structured block list (see document-blocks.ts). */
  body?: DocBlock[];
  /** Present for directory proposals (Phase 5d). */
  directory_kind?: "person" | "role";
  people?: Array<Record<string, any>>;
  /** Present for patch proposals — the ops, authoritative for apply (re-resolved). */
  ops?: any[];
  /** Present for patch proposals — a precomputed before/after snapshot for the diff preview. */
  diff?: { before?: any; after?: any };
  /** Present for link proposals — the reference to create. */
  reference?: ReferenceSpec;
}

export interface ToolExecutionResult {
  content: string; // tool_result text returned to the model
  proposal?: ToolProposal; // present for propose_* tools → loop emits an SSE event
}

/** Coarse grouping used for tracing labels and intent filtering. */
export type ToolCategory = "read" | "write" | "edit" | "link" | "optimize";
/** Maps a tool to a UI intent button (Phase E). */
export type ToolIntent = "create" | "edit" | "link" | "optimize";

/** Anthropic tool definition shape (name/description/input_schema). */
export interface AnthropicToolDef {
  name: string;
  description: string;
  input_schema: any;
}

export interface AgentToolDef {
  name: string;
  category: ToolCategory;
  intent?: ToolIntent;
  definition: AnthropicToolDef;
  handler: (input: any, ctx: AgentToolContext) => Promise<ToolExecutionResult>;
}

// Tool defs, assembled in lib/agent/registry-tools.ts to keep the type module
// free of value imports (avoids any import cycle with the handler files).
import { AGENT_TOOL_REGISTRY } from "./registry-tools";
export { AGENT_TOOL_REGISTRY };

const BY_NAME: Map<string, AgentToolDef> = new Map(
  AGENT_TOOL_REGISTRY.map((t) => [t.name, t])
);

export function getTool(name: string): AgentToolDef | undefined {
  return BY_NAME.get(name);
}

/** The Anthropic `tools` array, in the registry's (cache-stable) order. */
export function buildToolDefs(
  reg: AgentToolDef[] = AGENT_TOOL_REGISTRY
): AnthropicToolDef[] {
  return reg.map((t) => t.definition);
}

/**
 * Bias (not hard-restrict) the tool set for a UI intent: always keep read tools
 * and the propose_* writers so the model is never trapped, and additionally
 * surface the tools tagged for this intent. With no intent, returns everything.
 */
export function toolsForIntent(
  intent?: ToolIntent,
  reg: AgentToolDef[] = AGENT_TOOL_REGISTRY
): AgentToolDef[] {
  if (!intent) return reg;
  return reg.filter(
    (t) =>
      t.category === "read" ||
      t.name.startsWith("propose_") ||
      t.intent === intent
  );
}

/** The Anthropic `tools` array biased for an intent (or all tools when none). */
export function toolDefsForIntent(intent?: ToolIntent): AnthropicToolDef[] {
  return buildToolDefs(toolsForIntent(intent));
}
