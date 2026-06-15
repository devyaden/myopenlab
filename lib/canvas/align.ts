import type { Node } from "reactflow";

export type AlignAxis =
  | "left"
  | "hcenter"
  | "right"
  | "top"
  | "vcenter"
  | "bottom";

export type DistributeAxis = "h" | "v";

const getDims = (n: Node) => ({
  w: n.width || (n.style?.width as number) || 100,
  h: n.height || (n.style?.height as number) || 100,
});

// Compute new positions that align all given nodes to the chosen axis.
// Returns a map from id -> new {x, y}. Only nodes whose position changes are
// included so callers can skip identity updates.
export function alignNodes(
  nodes: Node[],
  axis: AlignAxis
): Map<string, { x: number; y: number }> {
  const out = new Map<string, { x: number; y: number }>();
  if (nodes.length < 2) return out;

  const bounds = nodes.map((n) => {
    const { w, h } = getDims(n);
    return {
      id: n.id,
      x: n.position.x,
      y: n.position.y,
      w,
      h,
    };
  });

  const minLeft = Math.min(...bounds.map((b) => b.x));
  const maxRight = Math.max(...bounds.map((b) => b.x + b.w));
  const minTop = Math.min(...bounds.map((b) => b.y));
  const maxBottom = Math.max(...bounds.map((b) => b.y + b.h));
  const hCenter = (minLeft + maxRight) / 2;
  const vCenter = (minTop + maxBottom) / 2;

  for (const b of bounds) {
    let x = b.x;
    let y = b.y;
    switch (axis) {
      case "left":
        x = minLeft;
        break;
      case "right":
        x = maxRight - b.w;
        break;
      case "hcenter":
        x = hCenter - b.w / 2;
        break;
      case "top":
        y = minTop;
        break;
      case "bottom":
        y = maxBottom - b.h;
        break;
      case "vcenter":
        y = vCenter - b.h / 2;
        break;
    }
    if (x !== b.x || y !== b.y) {
      out.set(b.id, { x, y });
    }
  }
  return out;
}

// Distribute selected nodes evenly along an axis. Sort by leading edge along
// the axis, fix the first and last node, and evenly space the rest by
// dividing the slack between them.
export function distributeNodes(
  nodes: Node[],
  axis: DistributeAxis
): Map<string, { x: number; y: number }> {
  const out = new Map<string, { x: number; y: number }>();
  if (nodes.length < 3) return out;

  const items = nodes.map((n) => {
    const { w, h } = getDims(n);
    return { id: n.id, x: n.position.x, y: n.position.y, w, h };
  });

  if (axis === "h") {
    items.sort((a, b) => a.x - b.x);
    const totalWidth = items.reduce((acc, it) => acc + it.w, 0);
    const span = items[items.length - 1].x + items[items.length - 1].w - items[0].x;
    const slack = span - totalWidth;
    const gap = slack / (items.length - 1);
    let cursor = items[0].x;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const x = i === 0 ? it.x : cursor;
      if (x !== it.x) out.set(it.id, { x, y: it.y });
      cursor = x + it.w + gap;
    }
  } else {
    items.sort((a, b) => a.y - b.y);
    const totalHeight = items.reduce((acc, it) => acc + it.h, 0);
    const span = items[items.length - 1].y + items[items.length - 1].h - items[0].y;
    const slack = span - totalHeight;
    const gap = slack / (items.length - 1);
    let cursor = items[0].y;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const y = i === 0 ? it.y : cursor;
      if (y !== it.y) out.set(it.id, { x: it.x, y });
      cursor = y + it.h + gap;
    }
  }
  return out;
}
