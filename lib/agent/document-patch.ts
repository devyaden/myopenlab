// Phase D: fine-grained document editing. Pure, isomorphic (no server imports) so
// the same code runs in the edit_document_blocks tool (to preview), the apply route
// (to commit — re-resolved against the LATEST body), and the test suite.
//
// Blocks have no persisted id, so `get_document` annotates each with an `index`
// (its ordinal) and a content-derived `anchor`. edit_document_blocks ops target a
// block by either. Ops apply sequentially against a working copy — anchors stay
// valid while a block's content is unchanged; prefer `index` when two blocks share
// identical text (their anchors collide and the first match wins).

import type { DocBlock } from "./document-blocks";

export interface IndexedBlock extends DocBlock {
  index: number;
  anchor: string;
}

export type DocOp =
  | { op: "insert"; at?: number | string; position?: "before" | "after"; block: DocBlock }
  | { op: "update"; target: number | string; block: DocBlock }
  | { op: "delete"; target: number | string }
  | { op: "move"; target: number | string; to: number };

/** The visible text of a block, for anchoring + previews. */
function blockText(b: DocBlock | null | undefined): string {
  if (!b) return "";
  if (typeof b.text === "string") return b.text;
  if (Array.isArray(b.items))
    return b.items
      .map((it) => (typeof it === "string" ? it : it?.text ?? ""))
      .join(" ");
  if (Array.isArray(b.headers)) return b.headers.join(" ");
  return "";
}

/** FNV-1a → base36; deterministic and dependency-free. */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** A stable, content-derived handle for a block (type + normalized text). */
export function anchorFor(b: DocBlock | null | undefined): string {
  const type = String(b?.type ?? "blk");
  return `${type.slice(0, 4)}-${hash(`${type}|${blockText(b).trim().toLowerCase()}`)}`;
}

/** Strip the read-time annotations so a block round-trips cleanly into the doc. */
function stripMeta(b: any): DocBlock {
  if (!b || typeof b !== "object") return b;
  const { index: _i, anchor: _a, ...rest } = b;
  return rest as DocBlock;
}

/** Annotate blocks with index + anchor (used by get_document). */
export function indexBlocks(blocks: DocBlock[] | null | undefined): IndexedBlock[] {
  return (Array.isArray(blocks) ? blocks : []).map((b, i) => ({
    ...b,
    index: i,
    anchor: anchorFor(b),
  }));
}

/** Resolve a target (ordinal index or anchor string) to a current array index, or -1. */
export function resolveTarget(
  blocks: DocBlock[],
  target: number | string | undefined
): number {
  if (typeof target === "number")
    return target >= 0 && target < blocks.length ? target : -1;
  if (typeof target === "string")
    return blocks.findIndex((b) => anchorFor(b) === target);
  return -1;
}

/**
 * Apply a sequence of block ops, returning the new block list and any errors
 * (unresolved targets etc.). Errors don't throw — they're surfaced to the model so
 * it can retry with an `index`, and unaffected ops still apply.
 */
export function applyDocOps(
  input: DocBlock[] | null | undefined,
  ops: DocOp[] | null | undefined
): { blocks: DocBlock[]; errors: string[] } {
  const blocks: DocBlock[] = (Array.isArray(input) ? input : []).map(stripMeta);
  const errors: string[] = [];

  for (const op of Array.isArray(ops) ? ops : []) {
    switch (op?.op) {
      case "insert": {
        if (!op.block) {
          errors.push("insert: missing block");
          break;
        }
        const block = stripMeta(op.block);
        if (op.at == null) {
          blocks.push(block);
          break;
        }
        const idx = resolveTarget(blocks, op.at);
        if (idx < 0) {
          errors.push(`insert: target not found (${op.at}); appended at end`);
          blocks.push(block);
          break;
        }
        const pos = op.position === "before" ? idx : idx + 1;
        blocks.splice(pos, 0, block);
        break;
      }
      case "update": {
        const idx = resolveTarget(blocks, op.target);
        if (idx < 0) {
          errors.push(`update: target not found (${op.target})`);
          break;
        }
        if (!op.block) {
          errors.push("update: missing block");
          break;
        }
        blocks[idx] = stripMeta(op.block);
        break;
      }
      case "delete": {
        const idx = resolveTarget(blocks, op.target);
        if (idx < 0) {
          errors.push(`delete: target not found (${op.target})`);
          break;
        }
        blocks.splice(idx, 1);
        break;
      }
      case "move": {
        const idx = resolveTarget(blocks, op.target);
        if (idx < 0) {
          errors.push(`move: target not found (${op.target})`);
          break;
        }
        const [b] = blocks.splice(idx, 1);
        let to = typeof op.to === "number" ? op.to : blocks.length;
        to = Math.max(0, Math.min(to, blocks.length));
        blocks.splice(to, 0, b);
        break;
      }
      default:
        errors.push(`unknown op: ${(op as any)?.op}`);
    }
  }

  return { blocks, errors };
}
