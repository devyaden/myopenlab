import { reconcileNodeIds } from "../node-ids";
import { applyCanvasOps } from "../canvas-patch";
import { autoLayoutNodes } from "../layout";
import type { AgentToolContext, AgentToolDef } from "../registry";
import { diagramSchema, assertOwnership, normalizeDiagram } from "./shared";

/** Read a canvas's current diagram (nodes/edges/styles). */
async function readDiagram(ctx: AgentToolContext, canvasId: string) {
  const { data } = await ctx.supabase
    .from("canvas_data")
    .select("nodes, edges, styles")
    .eq("canvas_id", canvasId)
    .maybeSingle();
  return {
    nodes: Array.isArray(data?.nodes) ? (data!.nodes as any[]) : [],
    edges: Array.isArray(data?.edges) ? (data!.edges as any[]) : [],
    nodeStyles: (data?.styles as Record<string, any>) ?? {},
  };
}

export const proposeCreateCanvasTool: AgentToolDef = {
  name: "propose_create_canvas",
  category: "write",
  intent: "create",
  definition: {
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
  handler: async (input) => {
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
  },
};

export const proposeUpdateCanvasTool: AgentToolDef = {
  name: "propose_update_canvas",
  category: "write",
  intent: "edit",
  definition: {
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
  handler: async (input, ctx) => {
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
  },
};

export const editCanvasTool: AgentToolDef = {
  name: "edit_canvas",
  category: "edit",
  intent: "edit",
  definition: {
    name: "edit_canvas",
    description:
      "Make FINE-GRAINED edits to an existing flow by node/edge ops, instead of rewriting the whole diagram. PREFER this over propose_update_canvas for small changes (rename a step, add/remove a step or connection). Call get_canvas first to get the existing node ids. The user sees a diff; the edit is re-resolved against the latest diagram at apply time.",
    input_schema: {
      type: "object",
      properties: {
        canvas_id: { type: "string", description: "The flow/playbook id to edit" },
        ops: {
          type: "array",
          description:
            "Ordered node/edge ops. Reference existing nodes by their id (from get_canvas). Each op is one of:\n" +
            '- { "op":"add_node", "id":"<optional>", "label":"...", "shape":"rectangle|diamond|...", "position":{"x":0,"y":0} }\n' +
            '- { "op":"update_node", "id":"...", "label":"...", "shape":"...", "position":{...} }\n' +
            '- { "op":"delete_node", "id":"..." } (also removes its edges)\n' +
            '- { "op":"move_node", "id":"...", "position":{"x":0,"y":0} }\n' +
            '- { "op":"add_edge", "source":"<nodeId>", "target":"<nodeId>", "label":"<optional>" }\n' +
            '- { "op":"delete_edge", "id":"<edgeId>" } or { "op":"delete_edge", "source":"...", "target":"..." }\n' +
            "Ops apply in order.",
          items: { type: "object" },
        },
      },
      required: ["canvas_id", "ops"],
    },
  },
  handler: async (input, ctx) => {
    const owned = await assertOwnership(ctx, input?.canvas_id);
    if (!owned)
      return { content: "Playbook not found or you don't have access." };
    const ops = Array.isArray(input?.ops) ? input.ops : [];
    if (ops.length === 0) return { content: "No ops provided." };

    const before = await readDiagram(ctx, input.canvas_id);
    const { state: after, errors } = applyCanvasOps(before, ops);

    const errNote = errors.length
      ? ` Note: ${errors.length} op(s) had problems — ${errors.join("; ")}. Re-check node ids from get_canvas.`
      : "";
    return {
      content:
        `Patch prepared (${ops.length} op(s)). The user will see a diff and choose whether to apply it; it is re-resolved against the latest diagram on apply. Do not assume it is saved.` +
        errNote,
      proposal: {
        kind: "patch",
        target: "canvas",
        canvas_id: input.canvas_id,
        ops,
        diff: { before, after },
      },
    };
  },
};

export const optimizeCanvasTool: AgentToolDef = {
  name: "optimize_canvas",
  category: "optimize",
  intent: "optimize",
  definition: {
    name: "optimize_canvas",
    description:
      "Clean up an existing flow's LAYOUT: auto-arrange the nodes into a tidy left-to-right / top-to-bottom graph and normalize the edges, without changing the steps or their connections. Use when a flow is messy/overlapping. The user sees a preview of the re-laid-out flow to approve.",
    input_schema: {
      type: "object",
      properties: {
        canvas_id: { type: "string", description: "The flow/playbook id to optimize" },
        direction: {
          type: "string",
          enum: ["TB", "LR"],
          description: "Layout direction: TB (top→bottom) or LR (left→right). Default TB.",
        },
      },
      required: ["canvas_id"],
    },
  },
  handler: async (input, ctx) => {
    const owned = await assertOwnership(ctx, input?.canvas_id);
    if (!owned)
      return { content: "Playbook not found or you don't have access." };

    const current = await readDiagram(ctx, input.canvas_id);
    if (current.nodes.length === 0)
      return { content: "This flow has no nodes to lay out yet." };

    const laidOut = autoLayoutNodes(current.nodes, current.edges, {
      rankdir: input?.direction === "LR" ? "LR" : "TB",
    });
    const normalized = normalizeDiagram({
      nodes: laidOut,
      edges: current.edges,
      nodeStyles: current.nodeStyles,
    });

    return {
      content:
        "Proposal prepared (auto-layout). The user will see a preview of the tidied flow and choose whether to apply it. Do not assume it is saved.",
      proposal: {
        kind: "update",
        canvas_id: input.canvas_id,
        diagram: normalized,
      },
    };
  },
};
