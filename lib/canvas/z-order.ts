import type { Node } from "reactflow";

export type ZDirection = "front" | "forward" | "backward" | "back";

// Reorder `nodes` so that the given selection moves in the requested direction.
// ReactFlow renders nodes in array order (later index = on top), so we
// physically rearrange the array. Parent nodes (swimlanes) must precede their
// descendants — the topological pass at the end enforces that invariant.
export function reorderForZ(
  nodes: Node[],
  selectedIds: string[],
  direction: ZDirection
): Node[] {
  if (selectedIds.length === 0) return nodes;
  const isSelected = (n: Node) => selectedIds.includes(n.id);
  const selected = nodes.filter(isSelected);
  const others = nodes.filter((n) => !isSelected(n));

  let next: Node[];
  switch (direction) {
    case "front":
      next = [...others, ...selected];
      break;
    case "back":
      next = [...selected, ...others];
      break;
    case "forward": {
      next = [...nodes];
      // Walk from the end so swapping doesn't double-skip.
      for (let i = next.length - 1; i >= 0; i--) {
        if (!isSelected(next[i])) continue;
        if (i === next.length - 1) continue;
        // Swap with the next non-selected neighbor in front.
        let j = i + 1;
        while (j < next.length && isSelected(next[j])) j++;
        if (j < next.length) {
          [next[i], next[j]] = [next[j], next[i]];
        }
      }
      break;
    }
    case "backward": {
      next = [...nodes];
      for (let i = 0; i < next.length; i++) {
        if (!isSelected(next[i])) continue;
        if (i === 0) continue;
        let j = i - 1;
        while (j >= 0 && isSelected(next[j])) j--;
        if (j >= 0) {
          [next[i], next[j]] = [next[j], next[i]];
        }
      }
      break;
    }
  }

  return ensureParentsBeforeChildren(next);
}

// Stable topological pass: every node's parentNode must appear earlier in the
// array than the node itself, otherwise ReactFlow drops the child. Preserves
// existing relative order between unrelated nodes as much as possible.
function ensureParentsBeforeChildren(nodes: Node[]): Node[] {
  const indexById = new Map<string, number>();
  nodes.forEach((n, i) => indexById.set(n.id, i));

  const placed: Node[] = [];
  const placedIds = new Set<string>();

  const place = (n: Node) => {
    if (placedIds.has(n.id)) return;
    if (n.parentNode) {
      const parent = nodes.find((x) => x.id === n.parentNode);
      if (parent && !placedIds.has(parent.id)) {
        place(parent);
      }
    }
    placed.push(n);
    placedIds.add(n.id);
  };

  for (const n of nodes) place(n);
  return placed;
}
