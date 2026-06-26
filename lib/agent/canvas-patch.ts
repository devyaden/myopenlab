// Phase D: fine-grained canvas editing. Pure, isomorphic — runs in the edit_canvas
// tool, the apply route (re-resolved against the LATEST diagram), and tests.
// Canvas nodes already have stable ids, so ops reference them directly; the apply
// route still runs the result through reconcileNodeIds as belt-and-suspenders.

export interface CanvasState {
  nodes: any[];
  edges: any[];
  nodeStyles: Record<string, any>;
}

export type CanvasOp =
  | { op: "add_node"; id?: string; label: string; shape?: string; position?: { x: number; y: number } }
  | { op: "update_node"; id: string; label?: string; shape?: string; position?: { x: number; y: number } }
  | { op: "delete_node"; id: string }
  | { op: "move_node"; id: string; position: { x: number; y: number } }
  | { op: "add_edge"; id?: string; source: string; target: string; label?: string }
  | { op: "delete_edge"; id?: string; source?: string; target?: string };

let mintCounter = 0;
function mintId(prefix: string): string {
  const c: any = (globalThis as any).crypto;
  if (c?.randomUUID) {
    try {
      return c.randomUUID();
    } catch {
      /* fall through */
    }
  }
  mintCounter += 1;
  return `${prefix}-${mintCounter}`;
}

function asState(input: Partial<CanvasState> | null | undefined): CanvasState {
  return {
    nodes: Array.isArray(input?.nodes) ? [...input!.nodes] : [],
    edges: Array.isArray(input?.edges) ? [...input!.edges] : [],
    nodeStyles: { ...(input?.nodeStyles ?? {}) },
  };
}

/**
 * Apply node/edge ops to a diagram, returning the new state + errors. Deleting a
 * node cascades to its incident edges and its style entry so the renderer never
 * sees a dangling edge or an orphaned style.
 */
export function applyCanvasOps(
  input: Partial<CanvasState> | null | undefined,
  ops: CanvasOp[] | null | undefined
): { state: CanvasState; errors: string[] } {
  const state = asState(input);
  const errors: string[] = [];
  const findNode = (id: string) => state.nodes.find((n) => n?.id === id);

  for (const op of Array.isArray(ops) ? ops : []) {
    switch (op?.op) {
      case "add_node": {
        const id = op.id || mintId("node");
        if (findNode(id)) {
          errors.push(`add_node: id already exists (${id})`);
          break;
        }
        state.nodes.push({
          id,
          type: "genericNode",
          position: op.position ?? { x: 80, y: 80 },
          data: { label: op.label ?? "", shape: op.shape ?? "rectangle" },
        });
        break;
      }
      case "update_node": {
        const n = findNode(op.id);
        if (!n) {
          errors.push(`update_node: node not found (${op.id})`);
          break;
        }
        if (op.label != null) n.data = { ...n.data, label: op.label };
        if (op.shape != null) n.data = { ...n.data, shape: op.shape };
        if (op.position) n.position = op.position;
        break;
      }
      case "move_node": {
        const n = findNode(op.id);
        if (!n) {
          errors.push(`move_node: node not found (${op.id})`);
          break;
        }
        n.position = op.position;
        break;
      }
      case "delete_node": {
        const before = state.nodes.length;
        state.nodes = state.nodes.filter((n) => n?.id !== op.id);
        if (state.nodes.length === before) {
          errors.push(`delete_node: node not found (${op.id})`);
          break;
        }
        // Cascade: drop incident edges + the node's style entry.
        state.edges = state.edges.filter(
          (e) => e?.source !== op.id && e?.target !== op.id
        );
        delete state.nodeStyles[op.id];
        break;
      }
      case "add_edge": {
        if (!findNode(op.source) || !findNode(op.target)) {
          errors.push(
            `add_edge: source/target not found (${op.source} → ${op.target})`
          );
          break;
        }
        state.edges.push({
          id: op.id || mintId("edge"),
          source: op.source,
          target: op.target,
          ...(op.label ? { label: op.label } : {}),
        });
        break;
      }
      case "delete_edge": {
        const before = state.edges.length;
        state.edges = state.edges.filter((e) => {
          if (op.id) return e?.id !== op.id;
          if (op.source && op.target)
            return !(e?.source === op.source && e?.target === op.target);
          return true;
        });
        if (state.edges.length === before)
          errors.push("delete_edge: no matching edge");
        break;
      }
      default:
        errors.push(`unknown op: ${(op as any)?.op}`);
    }
  }

  return { state, errors };
}
