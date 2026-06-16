// Phase 5: the March-style "process page" scaffold, expressed once as a pure
// factory over the existing block DSL (lib/agent/document-blocks.ts). One source
// of truth used by BOTH:
//   • the agent's propose_process_page tool (server-side), and
//   • the "Process page" tile in Create New (client-side),
// so a process page authored either way has byte-identical structure and flows
// through the same blocksToTiptapDoc / extractReferences converters.
//
// A process page composes one unit of the operating model: a title + code, the
// live process flow, the Activities / RACI / Deliverables tables, and reference
// cards to the supporting Templates / Policies / Standards — every piece coded
// and cross-linked. When a live flow or reference target isn't known yet (e.g.
// the blank "Create New" path has no flow), the section degrades to a guiding
// placeholder paragraph rather than an empty/dead embed.

import type { DocBlock } from "./document-blocks";

export interface ProcessPageReferenceCard {
  /** A document id to link as a reference card (preferred). */
  docId?: string | null;
  /** Or its operating-model code (e.g. "PLCY01-HR-01"); resolved on apply. */
  code?: string | null;
  /** template | policy | standard | checklist | authority | document */
  refType?: string;
  label?: string;
}

export interface ProcessPageOptions {
  title: string;
  // The page's own operating-model code is assigned at apply time (the canvas
  // row) and shown in the breadcrumb chip — intentionally NOT rendered into the
  // body here, so it isn't carried as a builder option.
  intro?: string;
  /** When present, embed the live flow; otherwise a placeholder is emitted. */
  flowCanvasId?: string | null;
  flowName?: string;
  /** Body rows for each table (the headers are fixed). */
  activities?: string[][];
  raci?: string[][];
  deliverables?: string[][];
  referenceCards?: ProcessPageReferenceCard[];
}

export const ACTIVITIES_HEADERS = ["Ref", "Activity", "Owner", "Notes"];
export const RACI_HEADERS = [
  "Activity",
  "Responsible",
  "Accountable",
  "Consulted",
  "Informed",
];
export const DELIVERABLES_HEADERS = ["Deliverable", "Format", "Owner"];

const DEFAULT_INTRO =
  "This page documents the process as part of the operating model. It brings " +
  "together the live process flow, the activities and RACI, the deliverables, " +
  "and the supporting templates, policies, and standards.";

/** A table with `count` empty rows matching the header width — a fillable stub. */
function blankRows(width: number, count: number): string[][] {
  return Array.from({ length: count }, () => Array(width).fill(""));
}

/** Keep only well-formed rows (arrays); never let a bad shape reach the table. */
function safeRows(rows: string[][] | undefined, width: number, fallbackCount: number): string[][] {
  const valid = (Array.isArray(rows) ? rows : []).filter((r) => Array.isArray(r));
  return valid.length > 0 ? valid : blankRows(width, fallbackCount);
}

/**
 * Build the canonical process-page block list. Sections with no live target
 * (flow / reference cards) degrade to a guiding placeholder paragraph so the
 * scaffold always renders cleanly on a blank create.
 */
export function buildProcessPageBlocks(opts: ProcessPageOptions): DocBlock[] {
  const blocks: DocBlock[] = [];

  blocks.push({ type: "heading", level: 1, text: opts.title || "Process Page" });
  blocks.push({ type: "paragraph", text: opts.intro || DEFAULT_INTRO });

  // ── Process flow ──────────────────────────────────────────────────────────
  blocks.push({ type: "heading", level: 2, text: "Process Flow" });
  if (opts.flowCanvasId) {
    blocks.push({
      type: "embed_flow",
      canvasId: opts.flowCanvasId,
      name: opts.flowName || `${opts.title} flow`,
    });
  } else {
    blocks.push({
      type: "paragraph",
      text:
        "Embed the live process flow here — use the “/Embed Flow” block, or ask " +
        "the AI agent to create and embed the flow for this process.",
    });
  }

  // ── Activities ──────────────────────────────────────────────────────────────
  blocks.push({ type: "heading", level: 2, text: "Activities" });
  blocks.push({
    type: "table",
    headers: ACTIVITIES_HEADERS,
    rows: safeRows(opts.activities, ACTIVITIES_HEADERS.length, 3),
  });

  // ── RACI ────────────────────────────────────────────────────────────────────
  blocks.push({ type: "heading", level: 2, text: "RACI" });
  blocks.push({
    type: "table",
    headers: RACI_HEADERS,
    rows: safeRows(opts.raci, RACI_HEADERS.length, 3),
  });

  // ── Deliverables ────────────────────────────────────────────────────────────
  blocks.push({ type: "heading", level: 2, text: "Deliverables" });
  blocks.push({
    type: "table",
    headers: DELIVERABLES_HEADERS,
    rows: safeRows(opts.deliverables, DELIVERABLES_HEADERS.length, 2),
  });

  // ── Templates, Policies & Standards (reference cards) ───────────────────────
  blocks.push({
    type: "heading",
    level: 2,
    text: "Templates, Policies & Standards",
  });
  const cards = (Array.isArray(opts.referenceCards) ? opts.referenceCards : []).filter(
    (c) => c && (c.docId || c.code)
  );
  if (cards.length > 0) {
    for (const c of cards) {
      if (c.docId) {
        // A real document id → a live reference card.
        blocks.push({
          type: "doc_reference",
          docId: c.docId,
          code: c.code ?? undefined,
          refType: c.refType || "document",
          label: c.label ?? undefined,
        });
      } else if (c.code) {
        // Code only (the id wasn't resolvable): a reference CARD can't render
        // live without a docId, so degrade to a typed inline mention chip that
        // still carries the code — nothing is dropped and the ref is recorded.
        blocks.push({
          type: "mention",
          code: c.code,
          refType: c.refType || "document",
          label: c.label ?? c.code,
        });
      }
    }
  } else {
    blocks.push({
      type: "paragraph",
      text:
        "Link the supporting Templates, Policies, and Standards here — use the " +
        "“/Embed Document (reference card)” block, or @-mention them by code.",
    });
  }

  return blocks;
}
