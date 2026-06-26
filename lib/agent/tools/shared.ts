import { createDiagramToolSchema } from "@/lib/services/claude/tool-schemas";
import { improveEdgeHandles } from "@/lib/services/claude/response-processor";
import { DiagramType } from "@/lib/types/diagram-types";
import type { AgentToolContext } from "../registry";

// Reuse the canonical diagram input schema (nodes/edges/nodeStyles) so the agent
// produces diagrams in the exact shape the renderer + processor expect.
export const diagramSchema: any = createDiagramToolSchema(DiagramType.WORKFLOW)[0]
  .input_schema;

// Phase 4: the document BODY is a structured block list (NOT raw Tiptap JSON).
// The apply layer converts it to the editor's content model (lib/agent/
// document-blocks.ts). Kept permissive (array of {type, ...}) so the model isn't
// fighting JSON-schema validation; the per-block fields are documented in the
// tool description and coerced defensively by the converter.
export const documentBodySchema: any = {
  type: "array",
  description:
    'Ordered document blocks. Each is an object with a "type" and type-specific fields:\n' +
    '- { "type":"heading", "level":1|2|3, "text":"..." }\n' +
    '- { "type":"paragraph", "text":"..." }\n' +
    '- { "type":"bullet_list", "items":["...","..."] }\n' +
    '- { "type":"numbered_list", "items":["...","..."] }\n' +
    '- { "type":"task_list", "items":[{"text":"...","checked":false}] }\n' +
    '- { "type":"divider" }\n' +
    '- { "type":"table", "headers":["A","B"], "rows":[["1","2"],["3","4"]] }\n' +
    '- { "type":"embed_flow", "canvasId":"<id of a playbook flow>", "name":"..." } (live flow embed)\n' +
    '- { "type":"embed_table", "tableId":"<id of an EXISTING table artifact>", "columns":["col1","col2"] } (live table embed — columns is REQUIRED, the embed shows nothing without it; for tabular content you are writing yourself use a static "table" block instead)\n' +
    '- { "type":"doc_reference", "docId":"<id of a document>", "refType":"template|policy|standard|checklist|authority|document", "label":"...", "code":"..." } (reference CARD — does NOT transclude)\n' +
    '- { "type":"mention", "id":"<canvas id>", "code":"HR-01", "label":"...", "refType":"depends-on" } (inline link chip)\n' +
    "Use ids/codes from the workspace index — never invent them.",
  items: { type: "object" },
};

/** Confirms a playbook belongs to the user. Returns the row or null. */
export async function assertOwnership(
  ctx: AgentToolContext,
  canvasId: string
): Promise<any | null> {
  const { data } = await ctx.supabase
    .from("canvas")
    .select("id, name, user_id, canvas_type, code")
    .eq("id", canvasId)
    .eq("user_id", ctx.userId)
    .maybeSingle();
  return data ?? null;
}

export function normalizeDiagram(input: any) {
  const cleaned = improveEdgeHandles({
    nodes: input.nodes ?? [],
    edges: input.edges ?? [],
    nodeStyles: input.nodeStyles ?? {},
  });
  return {
    nodes: cleaned.nodes ?? [],
    edges: cleaned.edges ?? [],
    nodeStyles: cleaned.nodeStyles ?? {},
  };
}
