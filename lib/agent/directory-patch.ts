// Phase D: fine-grained directory (people/role table) editing. Pure + isomorphic,
// used by the edit_directory tool (preview) and the apply route (commit). A
// directory row is a genericNode in canvas_data.nodes: its name is the node
// `label` (first column) and the other columns map onto `data[title]`. Field keys
// are matched leniently (column title, lowercase, or camelCase) like the create path.

export type DirectoryOp =
  | { op: "add_row"; id?: string; fields: Record<string, any> }
  | { op: "update_row"; id: string; fields: Record<string, any> }
  | { op: "delete_row"; id: string };

let mintCounter = 0;
function mintId(): string {
  const c: any = (globalThis as any).crypto;
  if (c?.randomUUID) {
    try {
      return c.randomUUID();
    } catch {
      /* fall through */
    }
  }
  mintCounter += 1;
  return `row-${mintCounter}`;
}

function camelOf(title: string): string {
  return title
    .split(/\s+/)
    .map((w, idx) =>
      idx === 0
        ? w.charAt(0).toLowerCase() + w.slice(1)
        : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join("");
}

function fieldValue(fields: Record<string, any>, title: string): string {
  const v =
    fields?.[title] ?? fields?.[title.toLowerCase()] ?? fields?.[camelOf(title)];
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

/** Build a row node's `data` from a fields record + the directory's column titles. */
function rowData(
  fields: Record<string, any>,
  colTitles: string[],
  existing?: Record<string, any>
): Record<string, any> {
  const nameKey = colTitles[0] ?? "Name";
  const data: Record<string, any> = {
    ...(existing ?? {}),
    shape: existing?.shape ?? "rectangle",
  };
  const name =
    fields?.name ?? fields?.Name ?? fields?.label ?? fields?.[nameKey];
  if (name != null) data.label = String(name);
  else if (data.label == null) data.label = "";
  for (let c = 1; c < colTitles.length; c++) {
    const title = colTitles[c];
    if (
      title in fields ||
      title.toLowerCase() in fields ||
      camelOf(title) in fields
    ) {
      data[title] = fieldValue(fields, title);
    }
  }
  return data;
}

export function applyDirectoryOps(
  nodes: any[] | null | undefined,
  colTitles: string[],
  ops: DirectoryOp[] | null | undefined
): { nodes: any[]; errors: string[] } {
  const out = (Array.isArray(nodes) ? nodes : []).map((n) => ({ ...n }));
  const errors: string[] = [];
  const titles = Array.isArray(colTitles) && colTitles.length ? colTitles : ["Name"];

  for (const op of Array.isArray(ops) ? ops : []) {
    switch (op?.op) {
      case "add_row": {
        const id = op.id || mintId();
        out.push({
          id,
          type: "genericNode",
          parentNode: null,
          position: { x: 80, y: 80 + (out.length % 50) * 110 },
          data: rowData(op.fields ?? {}, titles),
        });
        break;
      }
      case "update_row": {
        const row = out.find((n) => n?.id === op.id);
        if (!row) {
          errors.push(`update_row: row not found (${op.id})`);
          break;
        }
        row.data = rowData(op.fields ?? {}, titles, row.data);
        break;
      }
      case "delete_row": {
        const before = out.length;
        const idx = out.findIndex((n) => n?.id === op.id);
        if (idx < 0) {
          errors.push(`delete_row: row not found (${op.id})`);
          break;
        }
        out.splice(idx, 1);
        if (out.length === before) errors.push(`delete_row: no-op (${op.id})`);
        break;
      }
      default:
        errors.push(`unknown op: ${(op as any)?.op}`);
    }
  }

  return { nodes: out, errors };
}
