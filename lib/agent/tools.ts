import type { SupabaseClient } from "@supabase/supabase-js";
import { createDiagramToolSchema } from "@/lib/services/claude/tool-schemas";
import { improveEdgeHandles } from "@/lib/services/claude/response-processor";
import { DiagramType } from "@/lib/types/diagram-types";
import { buildWorkspaceIndex } from "./workspace";

// Reuse the canonical diagram input schema (nodes/edges/nodeStyles) so the agent
// produces diagrams in the exact shape the renderer + processor expect.
const diagramSchema: any = createDiagramToolSchema(DiagramType.WORKFLOW)[0]
  .input_schema;

export interface AgentToolContext {
  supabase: SupabaseClient;
  userId: string;
  currentCanvasId?: string | null;
}

export interface ToolProposal {
  kind: "create" | "update";
  name?: string;
  folder_id?: string | null;
  canvas_id?: string | null;
  diagram: { nodes: any[]; edges: any[]; nodeStyles: Record<string, any> };
}

export interface ToolExecutionResult {
  content: string; // tool_result text returned to the model
  proposal?: ToolProposal; // present for propose_* tools → loop emits an SSE event
}

/** Anthropic tool definitions exposed to the agent. */
export const AGENT_TOOLS: any[] = [
  {
    name: "list_canvases",
    description:
      "List all of the user's playbooks (id, name, type, folder). Use this to understand what already exists before creating or editing.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "search_canvases",
    description:
      "Search the user's playbooks by name. Returns matching playbooks with their ids.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Substring to search names for" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_canvas",
    description:
      "Get the full content (nodes, edges, styles) of one playbook by id. Use before editing so you preserve existing structure.",
    input_schema: {
      type: "object",
      properties: {
        canvas_id: { type: "string", description: "The playbook id" },
      },
      required: ["canvas_id"],
    },
  },
  {
    name: "get_canvas_history",
    description:
      "List the version history (version number + timestamp) of one playbook, to understand how it has changed over time.",
    input_schema: {
      type: "object",
      properties: {
        canvas_id: { type: "string", description: "The playbook id" },
      },
      required: ["canvas_id"],
    },
  },
  {
    name: "generate_diagram",
    description:
      "Normalize a diagram you have constructed (cleans up edge handles and styling). Pass the full nodes/edges/nodeStyles; returns the cleaned diagram. Use this before proposing a create/update.",
    input_schema: diagramSchema,
  },
  {
    name: "propose_create_canvas",
    description:
      "Propose creating a NEW playbook. This does NOT save — it shows the user a preview to approve. Provide a name and the full diagram.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name for the new playbook" },
        folder_id: {
          type: "string",
          description: "Optional folder id to place it in",
        },
        ...diagramSchema.properties,
      },
      required: ["name", "nodes", "edges"],
    },
  },
  {
    name: "propose_update_canvas",
    description:
      "Propose updating an EXISTING playbook. This does NOT save — it shows the user a preview to approve. Provide the canvas_id and the full revised diagram.",
    input_schema: {
      type: "object",
      properties: {
        canvas_id: { type: "string", description: "The playbook id to update" },
        ...diagramSchema.properties,
      },
      required: ["canvas_id", "nodes", "edges"],
    },
  },
];

/** Confirms a playbook belongs to the user. Returns the row or null. */
async function assertOwnership(
  ctx: AgentToolContext,
  canvasId: string
): Promise<any | null> {
  const { data } = await ctx.supabase
    .from("canvas")
    .select("id, name, user_id, canvas_type")
    .eq("id", canvasId)
    .eq("user_id", ctx.userId)
    .maybeSingle();
  return data ?? null;
}

function normalizeDiagram(input: any) {
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

/**
 * Executes a tool server-side. Every query re-derives scope from ctx.userId so
 * the agent can never read or write another user's data.
 */
export async function executeAgentTool(
  name: string,
  input: any,
  ctx: AgentToolContext
): Promise<ToolExecutionResult> {
  switch (name) {
    case "list_canvases": {
      const index = await buildWorkspaceIndex(ctx.supabase, ctx.userId);
      return { content: index.text };
    }

    case "search_canvases": {
      const q = String(input?.query ?? "").trim();
      if (!q) return { content: "No query provided." };
      const { data } = await ctx.supabase
        .from("canvas")
        .select("id, name, canvas_type")
        .eq("user_id", ctx.userId)
        .ilike("name", `%${q}%`)
        .limit(25);
      if (!data || data.length === 0)
        return { content: `No playbooks match "${q}".` };
      return {
        content: data
          .map((c: any) => `- [${c.id}] "${c.name}" (${c.canvas_type})`)
          .join("\n"),
      };
    }

    case "get_canvas": {
      const owned = await assertOwnership(ctx, input?.canvas_id);
      if (!owned)
        return { content: "Playbook not found or you don't have access." };
      const { data } = await ctx.supabase
        .from("canvas_data")
        .select("nodes, edges, styles, version")
        .eq("canvas_id", input.canvas_id)
        .maybeSingle();
      return {
        content: JSON.stringify({
          id: input.canvas_id,
          name: owned.name,
          version: data?.version ?? 1,
          nodes: data?.nodes ?? [],
          edges: data?.edges ?? [],
          styles: data?.styles ?? {},
        }),
      };
    }

    case "get_canvas_history": {
      const owned = await assertOwnership(ctx, input?.canvas_id);
      if (!owned)
        return { content: "Playbook not found or you don't have access." };
      const { data } = await ctx.supabase
        .from("canvas_history")
        .select("version, created_at")
        .eq("canvas_id", input.canvas_id)
        .order("version", { ascending: false })
        .limit(50);
      if (!data || data.length === 0)
        return { content: "No history recorded for this playbook yet." };
      return {
        content: data
          .map((h: any) => `- v${h.version} at ${h.created_at}`)
          .join("\n"),
      };
    }

    case "generate_diagram": {
      const diagram = normalizeDiagram(input);
      return { content: JSON.stringify(diagram) };
    }

    case "propose_create_canvas": {
      const diagram = normalizeDiagram(input);
      return {
        content:
          "Proposal prepared. The user will see a preview and choose whether to apply it. Do not assume it is saved.",
        proposal: {
          kind: "create",
          name: input?.name ?? "Untitled Playbook",
          folder_id: input?.folder_id ?? null,
          diagram,
        },
      };
    }

    case "propose_update_canvas": {
      const owned = await assertOwnership(ctx, input?.canvas_id);
      if (!owned)
        return { content: "Playbook not found or you don't have access." };
      const diagram = normalizeDiagram(input);
      return {
        content:
          "Proposal prepared. The user will see a preview and choose whether to apply it. Do not assume it is saved.",
        proposal: {
          kind: "update",
          canvas_id: input.canvas_id,
          diagram,
        },
      };
    }

    default:
      return { content: `Unknown tool: ${name}` };
  }
}
