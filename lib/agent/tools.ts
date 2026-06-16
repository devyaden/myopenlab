import type { SupabaseClient } from "@supabase/supabase-js";
import { createDiagramToolSchema } from "@/lib/services/claude/tool-schemas";
import { improveEdgeHandles } from "@/lib/services/claude/response-processor";
import { DiagramType } from "@/lib/types/diagram-types";
import { buildWorkspaceIndex } from "./workspace";
import { reconcileNodeIds } from "./node-ids";
import { resolveCode, listBacklinks } from "@/lib/refs/resolver";
import { tiptapToBlocks, type DocBlock } from "./document-blocks";
import { buildProcessPageBlocks } from "./process-page-template";

// Reuse the canonical diagram input schema (nodes/edges/nodeStyles) so the agent
// produces diagrams in the exact shape the renderer + processor expect.
const diagramSchema: any = createDiagramToolSchema(DiagramType.WORKFLOW)[0]
  .input_schema;

// Phase 4: the document BODY is a structured block list (NOT raw Tiptap JSON).
// The apply layer converts it to the editor's content model (lib/agent/
// document-blocks.ts). Kept permissive (array of {type, ...}) so the model isn't
// fighting JSON-schema validation; the per-block fields are documented in the
// tool description and coerced defensively by the converter.
const documentBodySchema: any = {
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

export interface AgentToolContext {
  supabase: SupabaseClient;
  userId: string;
  currentCanvasId?: string | null;
}

export interface ToolProposal {
  kind: "create" | "update";
  /** Which surface the proposal targets. Absent ⇒ "canvas" (back-compat). */
  target?: "canvas" | "document";
  name?: string;
  code?: string | null;
  folder_id?: string | null;
  canvas_id?: string | null;
  /** Present for canvas (diagram) proposals. */
  diagram?: { nodes: any[]; edges: any[]; nodeStyles: Record<string, any> };
  /** Present for document proposals — the structured block list (see document-blocks.ts). */
  body?: DocBlock[];
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
    name: "resolve_code",
    description:
      "Resolve a human-readable operating-model code (e.g. \"HR-01\") to the playbook it identifies. Use to follow cross-references between artifacts.",
    input_schema: {
      type: "object",
      properties: {
        code: { type: "string", description: "The code to resolve" },
      },
      required: ["code"],
    },
  },
  {
    name: "list_backlinks",
    description:
      "List what references a playbook — by its code and/or id. Answers \"what depends on / points at this?\". Useful before editing so you understand the blast radius.",
    input_schema: {
      type: "object",
      properties: {
        code: { type: "string", description: "The target's code (e.g. \"HR-01\")" },
        canvas_id: { type: "string", description: "The target's playbook id" },
      },
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
        code: {
          type: "string",
          description:
            "Optional human-readable code for the operating-model spine (e.g. \"HR-01\"). Use a function/area prefix + serial. If omitted, the server assigns one. Must be unique in the workspace.",
        },
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
  {
    name: "get_document",
    description:
      "Read a document's current content as a block list (the same shape propose_*_document takes). Use BEFORE editing a document so you preserve its existing structure, embeds, and reference ids.",
    input_schema: {
      type: "object",
      properties: {
        canvas_id: { type: "string", description: "The document id (a canvas of type 'document')" },
      },
      required: ["canvas_id"],
    },
  },
  {
    name: "propose_create_document",
    description:
      "Propose creating a NEW document (a rich page: headings, text, lists, tables, live flow/table embeds, and sub-document reference cards). This does NOT save — it shows the user a preview to approve. A document is the right surface for an operating-model 'process page' that composes a flow + tables + Template/Policy reference cards. Embed/reference EXISTING artifacts by their ids/codes from the workspace.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name/title for the new document" },
        code: {
          type: "string",
          description:
            'Optional operating-model code (e.g. "HR-01-PAGE"). If omitted the server assigns one. Unique in the workspace.',
        },
        folder_id: { type: "string", description: "Optional folder id to place it in" },
        body: documentBodySchema,
      },
      required: ["name", "body"],
    },
  },
  {
    name: "propose_update_document",
    description:
      "Propose updating an EXISTING document. This does NOT save — it shows a preview to approve. Provide the canvas_id and the FULL revised block list (it replaces the document body). Call get_document first and preserve embed/reference ids you keep.",
    input_schema: {
      type: "object",
      properties: {
        canvas_id: { type: "string", description: "The document id to update" },
        body: documentBodySchema,
      },
      required: ["canvas_id", "body"],
    },
  },
  {
    name: "propose_process_page",
    description:
      "Propose a complete operating-model PROCESS PAGE document in one step — the canonical March-style layout: title + code, the live process flow, the Activities/RACI/Deliverables tables, and reference cards to the supporting Templates/Policies/Standards. PREFER this over assembling a process page block-by-block. This does NOT save — it shows a preview to approve. Embed an EXISTING flow via flow_canvas_id; if the flow doesn't exist yet, propose_create_canvas it first, let the user apply it, then call this with its id (the flow section degrades to a placeholder if omitted). Supply the table rows and reference cards you know; omit what you don't (the scaffold leaves guided placeholders).",
    input_schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: 'The process name/title (e.g. "Recruitment & Selection")',
        },
        code: {
          type: "string",
          description:
            'Optional operating-model code (e.g. "HR-01"). If omitted the server assigns one. Unique in the workspace.',
        },
        folder_id: { type: "string", description: "Optional folder id to place it in" },
        flow_canvas_id: {
          type: "string",
          description:
            "Optional id of an EXISTING flow playbook to embed live as the process flow",
        },
        flow_name: {
          type: "string",
          description: "Optional display name for the embedded flow",
        },
        intro: {
          type: "string",
          description: "Optional intro paragraph; a sensible default is used if omitted",
        },
        activities: {
          type: "array",
          description:
            "Optional rows for the Activities table; each row is [Ref, Activity, Owner, Notes]",
          items: { type: "array", items: { type: "string" } },
        },
        raci: {
          type: "array",
          description:
            "Optional rows for the RACI table; each row is [Activity, Responsible, Accountable, Consulted, Informed]",
          items: { type: "array", items: { type: "string" } },
        },
        deliverables: {
          type: "array",
          description:
            "Optional rows for the Deliverables table; each row is [Deliverable, Format, Owner]",
          items: { type: "array", items: { type: "string" } },
        },
        reference_cards: {
          type: "array",
          description:
            "Optional reference cards to supporting sub-documents. Each: { docId?, code?, refType: template|policy|standard|checklist|authority, label? }",
          items: { type: "object" },
        },
      },
      required: ["title"],
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
    .select("id, name, user_id, canvas_type, code")
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

    case "resolve_code": {
      const ent = await resolveCode(ctx.supabase, ctx.userId, input?.code);
      if (!ent)
        return { content: `No playbook has the code "${input?.code}".` };
      return { content: JSON.stringify(ent) };
    }

    case "list_backlinks": {
      const links = await listBacklinks(ctx.supabase, ctx.userId, {
        canvasId: input?.canvas_id ?? null,
        code: input?.code ?? null,
      });
      if (links.length === 0)
        return { content: "Nothing references that yet." };
      return {
        content: links
          .map((l) => {
            const src = l.fromCanvas;
            const label = src
              ? `${src.code ? `[${src.code}] ` : ""}"${src.name}"`
              : l.from_canvas;
            const node = l.from_node ? ` (step ${l.from_node})` : "";
            return `- ${label}${node} --${l.type}-->`;
          })
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
          code: input?.code ?? null,
          folder_id: input?.folder_id ?? null,
          diagram,
        },
      };
    }

    case "propose_update_canvas": {
      const owned = await assertOwnership(ctx, input?.canvas_id);
      if (!owned)
        return { content: "Playbook not found or you don't have access." };

      const normalized = normalizeDiagram(input);

      // Stable node identity: re-anchor the proposed nodes onto the canvas's
      // existing node ids so relation/rollup links and step references survive
      // the edit, even if the model regenerated ids.
      const { data: existing } = await ctx.supabase
        .from("canvas_data")
        .select("nodes")
        .eq("canvas_id", input.canvas_id)
        .maybeSingle();

      const reconciled = reconcileNodeIds({
        existingNodes: Array.isArray(existing?.nodes)
          ? (existing!.nodes as any[])
          : [],
        nodes: normalized.nodes,
        edges: normalized.edges,
        nodeStyles: normalized.nodeStyles,
      });

      const idNote =
        reconciled.remapped > 0
          ? ` (kept ${reconciled.preserved} existing node id(s), recovered ${reconciled.remapped} by label, ${reconciled.minted} new)`
          : "";

      return {
        content:
          "Proposal prepared. The user will see a preview and choose whether to apply it. Do not assume it is saved." +
          idNote,
        proposal: {
          kind: "update",
          canvas_id: input.canvas_id,
          diagram: {
            nodes: reconciled.nodes,
            edges: reconciled.edges,
            nodeStyles: reconciled.nodeStyles,
          },
        },
      };
    }

    case "get_document": {
      const owned = await assertOwnership(ctx, input?.canvas_id);
      if (!owned)
        return { content: "Document not found or you don't have access." };
      const { data } = await ctx.supabase
        .from("document_data")
        .select("lexical_state, version")
        .eq("canvas_id", input.canvas_id)
        .maybeSingle();

      let blocks: DocBlock[] = [];
      if (data?.lexical_state != null) {
        try {
          const wrapper =
            typeof data.lexical_state === "string"
              ? JSON.parse(data.lexical_state)
              : data.lexical_state;
          // The stored shape is { state, json, controls, page }; tolerate a
          // bare doc too.
          const json = wrapper?.json ?? wrapper;
          blocks = tiptapToBlocks(json);
        } catch {
          blocks = [];
        }
      }
      return {
        content: JSON.stringify({
          id: input.canvas_id,
          name: owned.name,
          code: owned.code ?? null,
          version: data?.version ?? 1,
          body: blocks,
        }),
      };
    }

    case "propose_create_document": {
      const body: DocBlock[] = Array.isArray(input?.body) ? input.body : [];
      return {
        content:
          "Proposal prepared. The user will see a preview and choose whether to apply it. Do not assume it is saved.",
        proposal: {
          kind: "create",
          target: "document",
          name: input?.name ?? "Untitled Document",
          code: input?.code ?? null,
          folder_id: input?.folder_id ?? null,
          body,
        },
      };
    }

    case "propose_update_document": {
      const owned = await assertOwnership(ctx, input?.canvas_id);
      if (!owned)
        return { content: "Document not found or you don't have access." };
      const body: DocBlock[] = Array.isArray(input?.body) ? input.body : [];
      return {
        content:
          "Proposal prepared. The user will see a preview and choose whether to apply it. Do not assume it is saved.",
        proposal: {
          kind: "update",
          target: "document",
          canvas_id: input.canvas_id,
          body,
        },
      };
    }

    case "propose_process_page": {
      const title = String(input?.title ?? "").trim() || "Process Page";

      // Resolve any reference cards given by code → its document id, so the card
      // renders as a live reference card (not a degraded inline mention). The
      // builder is pure (no DB), so resolution happens here where ctx exists.
      const rawCards = Array.isArray(input?.reference_cards)
        ? input.reference_cards
        : [];
      const referenceCards = [];
      for (const c of rawCards) {
        if (!c || typeof c !== "object") continue;
        let docId: string | null = c.docId ?? c.id ?? null;
        if (!docId && c.code) {
          const ent = await resolveCode(ctx.supabase, ctx.userId, String(c.code));
          docId = ent?.id ?? null;
        }
        referenceCards.push({
          docId,
          code: c.code ?? null,
          refType: c.refType,
          label: c.label,
        });
      }

      const body = buildProcessPageBlocks({
        title,
        intro: input?.intro,
        flowCanvasId: input?.flow_canvas_id ?? null,
        flowName: input?.flow_name,
        activities: Array.isArray(input?.activities) ? input.activities : undefined,
        raci: Array.isArray(input?.raci) ? input.raci : undefined,
        deliverables: Array.isArray(input?.deliverables)
          ? input.deliverables
          : undefined,
        referenceCards,
      });
      return {
        content:
          "Proposal prepared. The user will see a preview and choose whether to apply it. Do not assume it is saved.",
        proposal: {
          kind: "create",
          target: "document",
          name: title,
          code: input?.code ?? null,
          folder_id: input?.folder_id ?? null,
          body,
        },
      };
    }

    default:
      return { content: `Unknown tool: ${name}` };
  }
}
