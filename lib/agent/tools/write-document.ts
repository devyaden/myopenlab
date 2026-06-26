import { resolveCode } from "@/lib/refs/resolver";
import { tiptapToBlocks, type DocBlock } from "../document-blocks";
import { applyDocOps, indexBlocks } from "../document-patch";
import { buildProcessPageBlocks } from "../process-page-template";
import type { AgentToolContext, AgentToolDef } from "../registry";
import { documentBodySchema, assertOwnership } from "./shared";

/** Read a document's current body as a block list (shared by get_document + edits). */
async function readDocumentBlocks(
  ctx: AgentToolContext,
  canvasId: string
): Promise<DocBlock[]> {
  const { data } = await ctx.supabase
    .from("document_data")
    .select("lexical_state")
    .eq("canvas_id", canvasId)
    .maybeSingle();
  if (data?.lexical_state == null) return [];
  try {
    const wrapper =
      typeof data.lexical_state === "string"
        ? JSON.parse(data.lexical_state)
        : data.lexical_state;
    return tiptapToBlocks(wrapper?.json ?? wrapper);
  } catch {
    return [];
  }
}

export const proposeCreateDocumentTool: AgentToolDef = {
  name: "propose_create_document",
  category: "write",
  intent: "create",
  definition: {
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
  handler: async (input) => {
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
  },
};

export const proposeUpdateDocumentTool: AgentToolDef = {
  name: "propose_update_document",
  category: "write",
  intent: "edit",
  definition: {
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
  handler: async (input, ctx) => {
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
  },
};

export const editDocumentBlocksTool: AgentToolDef = {
  name: "edit_document_blocks",
  category: "edit",
  intent: "edit",
  definition: {
    name: "edit_document_blocks",
    description:
      "Make FINE-GRAINED edits to an existing document by block ops, instead of rewriting the whole body. PREFER this over propose_update_document for small changes. Call get_document first to get each block's `index` and `anchor`. The user sees a diff to approve; the edit is re-resolved against the latest document at apply time. For a wholesale rewrite, use propose_update_document.",
    input_schema: {
      type: "object",
      properties: {
        canvas_id: { type: "string", description: "The document id to edit" },
        ops: {
          type: "array",
          description:
            "Ordered block edit ops. Target a block by its `index` (number) or `anchor` (string) from get_document. Each op is one of:\n" +
            '- { "op":"insert", "at":<index|anchor>, "position":"before"|"after", "block":{<DocBlock>} } (omit "at" to append at end)\n' +
            '- { "op":"update", "target":<index|anchor>, "block":{<DocBlock>} } (replaces that block)\n' +
            '- { "op":"delete", "target":<index|anchor> }\n' +
            '- { "op":"move", "target":<index|anchor>, "to":<index> }\n' +
            "A <DocBlock> uses the same shape as propose_*_document body blocks (heading/paragraph/bullet_list/table/embed_flow/doc_reference/…). Prefer `anchor`; use `index` when blocks share identical text. Ops apply in order.",
          items: { type: "object" },
        },
      },
      required: ["canvas_id", "ops"],
    },
  },
  handler: async (input, ctx) => {
    const owned = await assertOwnership(ctx, input?.canvas_id);
    if (!owned)
      return { content: "Document not found or you don't have access." };
    const ops = Array.isArray(input?.ops) ? input.ops : [];
    if (ops.length === 0) return { content: "No ops provided." };

    const before = await readDocumentBlocks(ctx, input.canvas_id);
    const { blocks: after, errors } = applyDocOps(before, ops);

    const errNote = errors.length
      ? ` Note: ${errors.length} op(s) had problems — ${errors.join("; ")}. Re-check the target index/anchor from get_document.`
      : "";
    return {
      content:
        `Patch prepared (${ops.length} op(s)). The user will see a diff and choose whether to apply it; it is re-resolved against the latest document on apply. Do not assume it is saved.` +
        errNote,
      proposal: {
        kind: "patch",
        target: "document",
        canvas_id: input.canvas_id,
        ops,
        diff: { before: indexBlocks(before), after: indexBlocks(after) },
      },
    };
  },
};

export const proposeProcessPageTool: AgentToolDef = {
  name: "propose_process_page",
  category: "write",
  intent: "create",
  definition: {
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
  handler: async (input, ctx) => {
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
  },
};
