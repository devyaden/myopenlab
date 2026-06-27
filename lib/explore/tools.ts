import {
  AGENT_TOOL_REGISTRY,
  buildToolDefs,
  type AgentToolDef,
} from "@/lib/agent/registry";

// The read-only tool subset for governance Q&A. Derived from the shared agent
// registry by category, so it automatically tracks any new read tool added there
// and can NEVER include a propose_*/edit_* writer — exploration is structurally
// incapable of mutating the workspace. `generate_diagram` is a diagram-authoring
// helper (not a question-answering read), so it's excluded.
//
// Resulting set: list_canvases, search_canvases, get_canvas, get_canvas_history,
// resolve_code, list_backlinks, get_document, list_directory.
export const EXPLORE_TOOL_REGISTRY: AgentToolDef[] = AGENT_TOOL_REGISTRY.filter(
  (t) => t.category === "read" && t.name !== "generate_diagram"
);

/** The Anthropic `tools` array passed to runAgentLoop for an exploration turn. */
export const EXPLORE_TOOL_DEFS = buildToolDefs(EXPLORE_TOOL_REGISTRY);
