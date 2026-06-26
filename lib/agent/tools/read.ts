import { buildWorkspaceIndex } from "../workspace";
import {
  resolveCode,
  listBacklinks,
  listDirectories,
  listDirectoryRows,
} from "@/lib/refs/resolver";
import { tiptapToBlocks, type DocBlock } from "../document-blocks";
import { indexBlocks } from "../document-patch";
import type { AgentToolDef } from "../registry";
import { diagramSchema, assertOwnership, normalizeDiagram } from "./shared";

export const listCanvasesTool: AgentToolDef = {
  name: "list_canvases",
  category: "read",
  definition: {
    name: "list_canvases",
    description:
      "List all of the user's playbooks (id, name, type, folder). Use this to understand what already exists before creating or editing.",
    input_schema: { type: "object", properties: {} },
  },
  handler: async (_input, ctx) => {
    const index = await buildWorkspaceIndex(ctx.supabase, ctx.userId);
    return { content: index.text };
  },
};

export const searchCanvasesTool: AgentToolDef = {
  name: "search_canvases",
  category: "read",
  definition: {
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
  handler: async (input, ctx) => {
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
  },
};

export const getCanvasTool: AgentToolDef = {
  name: "get_canvas",
  category: "read",
  definition: {
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
  handler: async (input, ctx) => {
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
  },
};

export const getCanvasHistoryTool: AgentToolDef = {
  name: "get_canvas_history",
  category: "read",
  definition: {
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
  handler: async (input, ctx) => {
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
  },
};

export const resolveCodeTool: AgentToolDef = {
  name: "resolve_code",
  category: "read",
  definition: {
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
  handler: async (input, ctx) => {
    const ent = await resolveCode(ctx.supabase, ctx.userId, input?.code);
    if (!ent) return { content: `No playbook has the code "${input?.code}".` };
    return { content: JSON.stringify(ent) };
  },
};

export const listBacklinksTool: AgentToolDef = {
  name: "list_backlinks",
  category: "read",
  definition: {
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
  handler: async (input, ctx) => {
    const links = await listBacklinks(ctx.supabase, ctx.userId, {
      canvasId: input?.canvas_id ?? null,
      code: input?.code ?? null,
    });
    if (links.length === 0) return { content: "Nothing references that yet." };
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
  },
};

export const generateDiagramTool: AgentToolDef = {
  name: "generate_diagram",
  category: "read",
  definition: {
    name: "generate_diagram",
    description:
      "Normalize a diagram you have constructed (cleans up edge handles and styling). Pass the full nodes/edges/nodeStyles; returns the cleaned diagram. Use this before proposing a create/update.",
    input_schema: diagramSchema,
  },
  handler: async (input) => {
    const diagram = normalizeDiagram(input);
    return { content: JSON.stringify(diagram) };
  },
};

export const getDocumentTool: AgentToolDef = {
  name: "get_document",
  category: "read",
  definition: {
    name: "get_document",
    description:
      "Read a document's current content as a block list (the same shape propose_*_document takes). Each block is annotated with an `index` (its position) and a stable `anchor` (a short content hash) — pass either to edit_document_blocks to target it. Use BEFORE editing a document so you preserve its existing structure, embeds, and reference ids.",
    input_schema: {
      type: "object",
      properties: {
        canvas_id: { type: "string", description: "The document id (a canvas of type 'document')" },
      },
      required: ["canvas_id"],
    },
  },
  handler: async (input, ctx) => {
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
        // Annotate with index + anchor so the model can address blocks with
        // edit_document_blocks (Phase D fine-grained editing).
        body: indexBlocks(blocks),
      }),
    };
  },
};

export const listDirectoryTool: AgentToolDef = {
  name: "list_directory",
  category: "read",
  definition: {
    name: "list_directory",
    description:
      "List the user's people/role DIRECTORIES (and optionally the rows of one). Use this to find who/what you can assign as an owner, approver, or RACI participant. With no directory_id it lists the directories; with a directory_id it lists that directory's rows (each row has a stable node id you can reference).",
    input_schema: {
      type: "object",
      properties: {
        directory_id: {
          type: "string",
          description:
            "Optional: a directory's id — returns its rows (people/roles) instead of the list of directories.",
        },
        kind: {
          type: "string",
          enum: ["person", "role"],
          description: "Optional filter when listing directories.",
        },
      },
    },
  },
  handler: async (input, ctx) => {
    if (input?.directory_id) {
      const rows = await listDirectoryRows(
        ctx.supabase,
        ctx.userId,
        String(input.directory_id)
      );
      if (rows.length === 0)
        return { content: "That directory has no rows (or wasn't found)." };
      return {
        content: rows
          .map((r) => {
            const extra = Object.entries(r.data)
              .filter(([k]) => k !== "label" && k !== "shape")
              .filter(([, v]) => v != null && v !== "")
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ");
            return `- [${r.id}] ${r.label}${extra ? ` (${extra})` : ""}`;
          })
          .join("\n"),
      };
    }
    const dirs = await listDirectories(
      ctx.supabase,
      ctx.userId,
      input?.kind === "role" || input?.kind === "person" ? input.kind : undefined
    );
    if (dirs.length === 0)
      return {
        content:
          "No directories yet. Use propose_create_directory to create a people or role directory.",
      };
    return {
      content: dirs
        .map(
          (d) =>
            `- [${d.id}]${d.code ? ` {${d.code}}` : ""} "${d.name}" (${d.kind} directory)`
        )
        .join("\n"),
    };
  },
};
