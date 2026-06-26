import { resolveCode } from "@/lib/refs/resolver";
import type { AgentToolDef } from "../registry";
import { assertOwnership } from "./shared";

// Phase D: the agent can create typed cross-references directly — including
// node-level ones (a person/role/process-step link attached to a specific node),
// which the document-body reconcile deliberately leaves alone. For links that are
// reference CARDS or @-mentions inside a document body, use edit_document_blocks to
// insert a doc_reference/mention block instead; this tool writes a `reference` row.

export const linkArtifactsTool: AgentToolDef = {
  name: "link_artifacts",
  category: "link",
  intent: "link",
  definition: {
    name: "link_artifacts",
    description:
      "Create a typed cross-reference between artifacts (powers backlinks / dependency tracking). Use this for node-level links — e.g. assigning a person/role to a specific flow step, or marking that a step depends on a policy. The user approves it before it is written. (To embed a reference CARD or an @-mention inside a document's text, use edit_document_blocks with a doc_reference/mention block instead.)",
    input_schema: {
      type: "object",
      properties: {
        from_canvas: {
          type: "string",
          description: "Id of the artifact the link originates FROM (e.g. a flow or document).",
        },
        from_node: {
          type: "string",
          description: "Optional: a node id WITHIN from_canvas — for a link attached to a specific step/row.",
        },
        to_canvas: {
          type: "string",
          description: "Id of the target artifact to link TO. Provide this OR to_code.",
        },
        to_code: {
          type: "string",
          description: 'Human code of the target (e.g. "HR-01"), resolved server-side. Provide this OR to_canvas.',
        },
        to_node: {
          type: "string",
          description: "Optional: a node id within the target (e.g. a person/role row).",
        },
        type: {
          type: "string",
          description:
            "Reference type: process-step | template | policy | standard | checklist | authority | person | role | depends-on",
        },
      },
      required: ["from_canvas", "type"],
    },
  },
  handler: async (input, ctx) => {
    const owned = await assertOwnership(ctx, input?.from_canvas);
    if (!owned)
      return { content: "Source artifact not found or you don't have access." };

    let toCanvas: string | null = input?.to_canvas ?? null;
    const toCode: string | null = input?.to_code ?? null;
    if (!toCanvas && toCode) {
      const ent = await resolveCode(ctx.supabase, ctx.userId, String(toCode));
      if (!ent)
        return { content: `No artifact has the code "${toCode}".` };
      toCanvas = ent.id;
    }
    if (!toCanvas && !toCode)
      return {
        content: "Provide a target via to_canvas or to_code.",
      };

    return {
      content:
        "Link prepared. The user will see it and choose whether to apply it. Do not assume it is saved.",
      proposal: {
        kind: "link",
        target: "reference",
        canvas_id: input.from_canvas,
        reference: {
          fromCanvas: input.from_canvas,
          fromNode: input?.from_node ?? null,
          toCanvas: toCanvas ?? null,
          toCode: toCode ?? null,
          toNode: input?.to_node ?? null,
          type: String(input?.type ?? "depends-on"),
        },
      },
    };
  },
};
