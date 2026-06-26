import dagre from "@dagrejs/dagre";

// Phase D: deterministic graph auto-layout for the optimize_canvas tool. Runs a
// dagre layered layout over the diagram and returns nodes with fresh positions.
// ReactFlow positions are top-left; dagre reports node centers, so we offset by
// half the node size. Node ids/data/edges are untouched.

const DEFAULT_W = 172;
const DEFAULT_H = 64;

export function autoLayoutNodes(
  nodes: any[],
  edges: any[],
  opts: { rankdir?: "TB" | "LR"; nodesep?: number; ranksep?: number } = {}
): any[] {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeEdges = Array.isArray(edges) ? edges : [];
  if (safeNodes.length === 0) return safeNodes;

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: opts.rankdir ?? "TB",
    nodesep: opts.nodesep ?? 60,
    ranksep: opts.ranksep ?? 80,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const n of safeNodes) {
    if (!n || typeof n.id !== "string") continue;
    const w = typeof n.width === "number" ? n.width : DEFAULT_W;
    const h = typeof n.height === "number" ? n.height : DEFAULT_H;
    g.setNode(n.id, { width: w, height: h });
  }
  for (const e of safeEdges) {
    if (e?.source && e?.target && g.hasNode(e.source) && g.hasNode(e.target))
      g.setEdge(e.source, e.target);
  }

  dagre.layout(g);

  return safeNodes.map((n) => {
    if (!n || typeof n.id !== "string" || !g.hasNode(n.id)) return n;
    const pos = g.node(n.id);
    const w = typeof n.width === "number" ? n.width : DEFAULT_W;
    const h = typeof n.height === "number" ? n.height : DEFAULT_H;
    return {
      ...n,
      position: {
        x: Math.round(pos.x - w / 2),
        y: Math.round(pos.y - h / 2),
      },
    };
  });
}
