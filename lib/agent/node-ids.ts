// Phase 2 (Operating Model Engine) — stable node identity.
//
// When the agent edits an existing playbook it returns a *full* revised diagram,
// and the apply layer overwrites `canvas_data.nodes` wholesale. If the model
// minted fresh ids for nodes it actually kept, every relation/rollup link and
// step-level cross-reference that keys on those ids would break.
//
// `reconcileNodeIds` enforces id preservation server-side: proposed nodes are
// re-anchored onto the existing canvas's node ids (exact id match first, then a
// label match to recover ids the model regenerated). Edges and nodeStyles that
// referenced a remapped id are rewritten to match. This is belt-and-suspenders
// with the prompt instruction telling the model to copy ids verbatim.

export interface ReconcileInput {
  /** Nodes currently persisted for the canvas (from canvas_data.nodes). */
  existingNodes: any[];
  /** The agent's proposed nodes/edges/styles (post-normalization). */
  nodes: any[];
  edges: any[];
  nodeStyles: Record<string, any>;
}

export interface ReconcileResult {
  nodes: any[];
  edges: any[];
  nodeStyles: Record<string, any>;
  /** Proposed nodes whose id already matched an existing node. */
  preserved: number;
  /** Proposed nodes re-anchored onto an existing id via label match. */
  remapped: number;
  /** Genuinely new nodes (kept their proposed id). */
  minted: number;
}

function normLabel(node: any): string {
  return String(node?.data?.label ?? "")
    .trim()
    .toLowerCase();
}

/**
 * Re-anchor a proposed diagram onto an existing canvas's node ids.
 *
 * Matching strategy, per proposed node:
 *  1. its id already exists (and isn't already claimed) → preserve it;
 *  2. otherwise, claim an as-yet-unclaimed existing node with the same label
 *     (the model regenerated the id but kept the step) → adopt that id;
 *  3. otherwise it's a new node → keep its proposed id.
 *
 * Each existing id can be claimed at most once, so duplicates degrade to new
 * nodes rather than colliding.
 */
export function reconcileNodeIds(input: ReconcileInput): ReconcileResult {
  const existingNodes = Array.isArray(input.existingNodes)
    ? input.existingNodes
    : [];
  const proposedNodes = Array.isArray(input.nodes) ? input.nodes : [];
  const proposedEdges = Array.isArray(input.edges) ? input.edges : [];
  const proposedStyles = input.nodeStyles ?? {};

  const existingIds = new Set<string>();
  const existingIdsByLabel = new Map<string, string[]>();
  for (const n of existingNodes) {
    if (!n || typeof n.id !== "string") continue;
    existingIds.add(n.id);
    const key = normLabel(n);
    if (!key) continue;
    if (!existingIdsByLabel.has(key)) existingIdsByLabel.set(key, []);
    existingIdsByLabel.get(key)!.push(n.id);
  }

  const claimed = new Set<string>();
  const remap: Record<string, string> = {}; // proposed id -> adopted existing id
  let preserved = 0;
  let remapped = 0;
  let minted = 0;

  const nodes = proposedNodes.map((node) => {
    const pid = typeof node?.id === "string" ? node.id : undefined;

    // 1) Exact id match — preserve.
    if (pid && existingIds.has(pid) && !claimed.has(pid)) {
      claimed.add(pid);
      preserved++;
      return node;
    }

    // 2) Recover a regenerated id by label match.
    const candidates = existingIdsByLabel.get(normLabel(node));
    const free = candidates?.find((id) => !claimed.has(id));
    if (free) {
      claimed.add(free);
      if (pid && pid !== free) remap[pid] = free;
      remapped++;
      return { ...node, id: free };
    }

    // 3) New node.
    minted++;
    return node;
  });

  const edges = proposedEdges.map((edge) => {
    if (!edge || typeof edge !== "object") return edge;
    const next = { ...edge };
    if (typeof next.source === "string" && remap[next.source])
      next.source = remap[next.source];
    if (typeof next.target === "string" && remap[next.target])
      next.target = remap[next.target];
    return next;
  });

  const nodeStyles: Record<string, any> = {};
  for (const [key, value] of Object.entries(proposedStyles)) {
    nodeStyles[remap[key] ?? key] = value;
  }

  return { nodes, edges, nodeStyles, preserved, remapped, minted };
}
