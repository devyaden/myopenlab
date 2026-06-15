// Phase 4: the agent authors/edits documents via a compact, structured BLOCK
// LIST rather than hand-writing Tiptap ProseMirror JSON. This module is the
// single, pure (isomorphic — no server-only imports) translator between that
// DSL and the editor's real content model, used by BOTH the server apply route
// and the client instant-apply path so they can never diverge.
//
//   DocBlock[]  --blocksToTiptapDoc-->  { type:"doc", content:[...] }   (what the editor renders)
//   tiptap doc  --tiptapToBlocks-->     DocBlock[]                       (what get_document returns)
//   DocBlock[]  --extractReferences-->  ReferenceSpec[]                  (the cross-reference rows)
//
// The Tiptap node shapes below mirror the editor's extensions exactly:
// reactFlow (ReactFlowNode.tsx), canvasTable (CanvasTableNode.ts),
// docReference (DocReference.ts), fileMention (FileMention.ts), plus StarterKit
// + Table + TaskList. A FLOW embed is emitted with empty nodes/edges + its
// canvasId and self-hydrates on mount, so the agent never needs the flow's
// nodes. A TABLE embed is different: it does NOT self-hydrate a column
// selection, so the agent MUST supply `columns` (the projection) — without it
// the embed renders a permanent empty state, so we degrade to a note instead.

export type DocBlockType =
  | "heading"
  | "paragraph"
  | "bullet_list"
  | "numbered_list"
  | "task_list"
  | "divider"
  | "table"
  | "embed_flow"
  | "embed_table"
  | "doc_reference"
  | "mention";

export interface DocBlock {
  type: DocBlockType | string;
  // text blocks
  text?: string;
  level?: number;
  items?: Array<string | { text?: string; checked?: boolean }>;
  // table
  headers?: string[];
  rows?: string[][];
  // embed_flow / embed_table
  canvasId?: string;
  tableId?: string;
  name?: string;
  columns?: string[];
  displayRows?: number;
  width?: number;
  height?: number;
  // doc_reference / mention
  docId?: string;
  id?: string;
  code?: string;
  label?: string;
  refType?: string;
  canvasType?: string;
}

type TiptapNode = { type: string; attrs?: any; content?: TiptapNode[]; text?: string; marks?: any[] };

/** A cross-reference the apply layer should record for a document's content. */
export interface ReferenceSpec {
  toCanvas?: string | null;
  toCode?: string | null;
  type: string;
}

const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** A canvas id is a UUID; anything else (e.g. a human code the model conflated)
 *  must NOT be written into the to_canvas uuid/FK column. */
const asUuid = (v?: string | null): string | null =>
  v && UUID_RE.test(v) ? v : null;

/** A ProseMirror text node, or [] for empty (ProseMirror rejects empty text nodes). */
function textContent(text?: string): TiptapNode[] {
  const t = str(text);
  return t.length > 0 ? [{ type: "text", text: t }] : [];
}

function paragraph(text?: string): TiptapNode {
  return { type: "paragraph", content: textContent(text) };
}

function listItems(items: DocBlock["items"]): TiptapNode[] {
  return (items ?? []).map((it) => {
    const text = typeof it === "string" ? it : str(it?.text);
    return { type: "listItem", content: [paragraph(text)] };
  });
}

function taskItems(items: DocBlock["items"]): TiptapNode[] {
  return (items ?? []).map((it) => {
    const text = typeof it === "string" ? it : str(it?.text);
    const checked = typeof it === "object" && it ? !!it.checked : false;
    return {
      type: "taskItem",
      attrs: { checked },
      content: [paragraph(text)],
    };
  });
}

function tableNode(headers?: string[], rows?: string[][]): TiptapNode {
  const cell = (text: string, header: boolean): TiptapNode => ({
    type: header ? "tableHeader" : "tableCell",
    content: [paragraph(text)],
  });
  const trs: TiptapNode[] = [];
  // Defensive: the agent can emit a string or a flat array where a 2D array is
  // expected; never let a bad shape throw and 500 the whole document apply.
  const safeHeaders = Array.isArray(headers) ? headers : [];
  if (safeHeaders.length) {
    trs.push({ type: "tableRow", content: safeHeaders.map((h) => cell(str(h), true)) });
  }
  for (const row of Array.isArray(rows) ? rows : []) {
    const cells = Array.isArray(row) ? row : [row]; // tolerate a scalar row as one cell
    trs.push({ type: "tableRow", content: cells.map((c) => cell(str(c), false)) });
  }
  // A table with no rows at all is invalid; fall back to a single empty cell.
  if (trs.length === 0) trs.push({ type: "tableRow", content: [cell("", false)] });
  return { type: "table", content: trs };
}

function flowEmbed(b: DocBlock): TiptapNode {
  return {
    type: "reactFlow",
    attrs: {
      canvasId: str(b.canvasId),
      name: b.name ? str(b.name) : "Embedded playbook",
      useRealTimeData: true, // hydrate live from the source on mount
      nodes: "[]",
      edges: "[]",
      styles: "{}",
      width: typeof b.width === "number" ? b.width : 640,
      height: typeof b.height === "number" ? b.height : 380,
    },
  };
}

function tableEmbed(b: DocBlock): TiptapNode {
  const cols = Array.isArray(b.columns) ? b.columns.map(str) : [];
  return {
    type: "canvasTable",
    attrs: {
      tableId: str(b.tableId),
      rows: 0,
      columns: 0,
      data: "[]",
      filterConfig: "[]",
      sortConfig: null,
      selectedColumns: JSON.stringify(cols),
      displayRows: typeof b.displayRows === "number" ? b.displayRows : 8,
      isDynamic: true, // hydrate live from the source table
      lastUpdated: null,
      isRTL: false,
    },
  };
}

function docReferenceNode(b: DocBlock): TiptapNode {
  return {
    type: "docReference",
    attrs: {
      docId: str(b.docId || b.id),
      refType: b.refType ? str(b.refType) : "document",
      label: b.label ? str(b.label) : null,
      code: b.code ? str(b.code) : null,
    },
  };
}

function mentionParagraph(b: DocBlock): TiptapNode {
  // An inline mention chip wrapped in its own paragraph. label falls back to the
  // code or a generic so the chip always shows something.
  const label = str(b.label || b.code || b.name || "link");
  const content: TiptapNode[] = [];
  if (b.text) content.push({ type: "text", text: str(b.text) + " " });
  content.push({
    type: "fileMention",
    attrs: {
      id: str(b.id || b.docId || b.canvasId),
      label,
      canvasType: b.canvasType ? str(b.canvasType) : null,
      code: b.code ? str(b.code) : null,
    },
  });
  return { type: "paragraph", content };
}

/** Convert one block; returns null for an unrenderable/unknown block. */
function blockToNode(b: DocBlock): TiptapNode | null {
  if (!b || typeof b !== "object") return null;
  switch (b.type) {
    case "heading": {
      const level = Math.min(3, Math.max(1, Number(b.level) || 2));
      return { type: "heading", attrs: { level }, content: textContent(b.text) };
    }
    case "paragraph":
      return paragraph(b.text);
    case "bullet_list": {
      // An empty list (items omitted/[]) is schema-INVALID (bulletList content
      // is "listItem+"); drop it rather than persist an unrenderable node.
      const items = listItems(b.items);
      return items.length ? { type: "bulletList", content: items } : null;
    }
    case "numbered_list": {
      const items = listItems(b.items);
      return items.length ? { type: "orderedList", content: items } : null;
    }
    case "task_list": {
      const items = taskItems(b.items);
      return items.length ? { type: "taskList", content: items } : null;
    }
    case "divider":
      return { type: "horizontalRule" };
    case "table":
      return tableNode(b.headers, b.rows);
    case "embed_flow":
      return b.canvasId ? flowEmbed(b) : null;
    case "embed_table":
      // A live table embed needs an explicit column projection — unlike the
      // flow embed it does NOT self-hydrate, so without columns it renders a
      // permanent empty state. Degrade to a visible note instead of a dead embed.
      return b.tableId && Array.isArray(b.columns) && b.columns.length > 0
        ? tableEmbed(b)
        : b.tableId
          ? paragraph(`[table embed ${str(b.tableId)} — specify columns to display]`)
          : null;
    case "doc_reference":
      return b.docId || b.id ? docReferenceNode(b) : null;
    case "mention":
      return b.id || b.docId || b.canvasId || b.code ? mentionParagraph(b) : null;
    default:
      // Unknown block: degrade to a paragraph of its text rather than dropping
      // silently, if it carries any.
      return b.text ? paragraph(b.text) : null;
  }
}

/**
 * Convert a block list to a Tiptap ProseMirror `doc`. Always returns at least an
 * empty paragraph so ProseMirror never rejects an empty doc.
 */
export function blocksToTiptapDoc(blocks: DocBlock[] | null | undefined): {
  type: "doc";
  content: TiptapNode[];
} {
  const content = (Array.isArray(blocks) ? blocks : [])
    .map(blockToNode)
    .filter((n): n is TiptapNode => n != null);
  if (content.length === 0) content.push(paragraph(""));
  return { type: "doc", content };
}

/** Flatten a node's text content (for previews + reverse conversion). */
function collectText(node: TiptapNode | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  if (!node.content) return "";
  return node.content.map(collectText).join("");
}

/**
 * Best-effort reverse conversion: a Tiptap doc's content → block list, so
 * get_document can hand the agent an editable view it can modify and re-submit.
 */
export function tiptapToBlocks(doc: any): DocBlock[] {
  const content: TiptapNode[] = Array.isArray(doc?.content) ? doc.content : [];
  const blocks: DocBlock[] = [];
  for (const node of content) {
    switch (node?.type) {
      case "heading":
        blocks.push({ type: "heading", level: node.attrs?.level ?? 2, text: collectText(node) });
        break;
      case "paragraph": {
        // A paragraph that is just a mention chip → a mention block.
        const mention = (node.content ?? []).find((c) => c.type === "fileMention");
        if (mention && collectText(node).trim() === "") {
          blocks.push({
            type: "mention",
            id: mention.attrs?.id,
            label: mention.attrs?.label,
            code: mention.attrs?.code ?? undefined,
            canvasType: mention.attrs?.canvasType ?? undefined,
          });
        } else {
          blocks.push({ type: "paragraph", text: collectText(node) });
        }
        break;
      }
      case "bulletList":
        blocks.push({ type: "bullet_list", items: (node.content ?? []).map(collectText) });
        break;
      case "orderedList":
        blocks.push({ type: "numbered_list", items: (node.content ?? []).map(collectText) });
        break;
      case "taskList":
        blocks.push({
          type: "task_list",
          items: (node.content ?? []).map((li) => ({
            text: collectText(li),
            checked: !!li.attrs?.checked,
          })),
        });
        break;
      case "horizontalRule":
        blocks.push({ type: "divider" });
        break;
      case "table": {
        const rows = (node.content ?? []).map((tr) =>
          (tr.content ?? []).map((td) => collectText(td))
        );
        const [headers, ...body] = rows;
        blocks.push({ type: "table", headers: headers ?? [], rows: body });
        break;
      }
      case "reactFlow":
        blocks.push({ type: "embed_flow", canvasId: node.attrs?.canvasId, name: node.attrs?.name });
        break;
      case "canvasTable": {
        // Recover the column projection from the node attr so a get_document →
        // edit → propose_update_document round-trip keeps the table rendering.
        let columns: string[] = [];
        try {
          const parsed = JSON.parse(node.attrs?.selectedColumns || "[]");
          if (Array.isArray(parsed)) columns = parsed.map(String);
        } catch {
          columns = [];
        }
        blocks.push({
          type: "embed_table",
          tableId: node.attrs?.tableId,
          columns,
          displayRows:
            typeof node.attrs?.displayRows === "number"
              ? node.attrs.displayRows
              : undefined,
        });
        break;
      }
      case "docReference":
        blocks.push({
          type: "doc_reference",
          docId: node.attrs?.docId,
          refType: node.attrs?.refType,
          label: node.attrs?.label ?? undefined,
          code: node.attrs?.code ?? undefined,
        });
        break;
      default:
        break;
    }
  }
  return blocks;
}

/**
 * The cross-references implied by a document's blocks — reference cards
 * (typed by refType), @-mentions (the refType or "depends-on"), and live embeds
 * (a "depends-on" link so backlinks show "this doc embeds HR-01"). Used by the
 * apply layer to reconcile the document's `reference` rows.
 */
export function extractReferences(blocks: DocBlock[] | null | undefined): ReferenceSpec[] {
  const out: ReferenceSpec[] = [];
  for (const b of Array.isArray(blocks) ? blocks : []) {
    if (!b || typeof b !== "object") continue;
    // Only a real UUID may go in the to_canvas FK column; a code-like value the
    // model put in an id field must fall through to toCode so resolveCode can
    // record the link instead of the insert silently failing on a bad uuid/FK.
    if (b.type === "doc_reference" && (b.docId || b.id)) {
      out.push({ toCanvas: asUuid(str(b.docId || b.id)), toCode: b.code ?? null, type: str(b.refType) || "document" });
    } else if (b.type === "mention" && (b.id || b.docId || b.canvasId || b.code)) {
      out.push({
        toCanvas: asUuid(str(b.id || b.docId || b.canvasId)),
        toCode: b.code ?? null,
        type: str(b.refType) || "depends-on",
      });
    } else if (b.type === "embed_flow" && asUuid(str(b.canvasId))) {
      out.push({ toCanvas: asUuid(str(b.canvasId)), toCode: null, type: "depends-on" });
    } else if (b.type === "embed_table" && asUuid(str(b.tableId))) {
      out.push({ toCanvas: asUuid(str(b.tableId)), toCode: null, type: "depends-on" });
    }
  }
  // Drop specs that resolved to no usable target (neither a uuid nor a code),
  // so reconcile never inserts a reference that points nowhere.
  return out.filter((s) => s.toCanvas || s.toCode);
}

/** A short plain-text summary of a block list, for the proposal preview card. */
export function blocksToPlainText(blocks: DocBlock[] | null | undefined, max = 400): string {
  const parts: string[] = [];
  for (const b of Array.isArray(blocks) ? blocks : []) {
    switch (b?.type) {
      case "heading":
        parts.push(`# ${str(b.text)}`);
        break;
      case "paragraph":
        if (b.text) parts.push(str(b.text));
        break;
      case "bullet_list":
      case "numbered_list":
        parts.push((b.items ?? []).map((it) => `• ${typeof it === "string" ? it : str(it?.text)}`).join("\n"));
        break;
      case "task_list":
        parts.push((b.items ?? []).map((it) => `☐ ${typeof it === "string" ? it : str(it?.text)}`).join("\n"));
        break;
      case "table":
        parts.push(`▦ table (${(b.rows?.length ?? 0) + (b.headers?.length ? 1 : 0)} rows)`);
        break;
      case "embed_flow":
        parts.push(`◳ embedded flow${b.name ? ` — ${str(b.name)}` : ""}`);
        break;
      case "embed_table":
        parts.push(`▦ embedded table`);
        break;
      case "doc_reference":
        parts.push(`🔗 ${str(b.refType) || "document"} card${b.code ? ` — ${str(b.code)}` : b.label ? ` — ${str(b.label)}` : ""}`);
        break;
      case "mention":
        parts.push(`@${str(b.label || b.code || "link")}`);
        break;
      default:
        break;
    }
  }
  const text = parts.join("\n");
  return text.length > max ? text.slice(0, max) + "…" : text;
}
