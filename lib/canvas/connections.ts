import type { Edge, Node } from "reactflow";

// Single source of truth for a node's connection data (from / to / parent /
// children), shared by the on-canvas node, the side panel, and the table view.
// These are always computed from edges + parentNode and never persisted.

export interface ConnectionRef {
  id: string;
  label: string;
  // Optional edge label, used only for the comma-joined display string.
  edgeLabel?: string;
  // The backing edge id (set for from/to refs) so callers can delete the exact
  // edge a chip represents. Undefined for parent/children (not edge-backed).
  edgeId?: string;
}

export interface NodeConnections {
  from: ConnectionRef[];
  to: ConnectionRef[];
  parent: ConnectionRef | null;
  children: ConnectionRef[];
}

const buildLabelsMap = (nodes: Node[]): Map<string, string> =>
  new Map(nodes.map((node) => [node.id, node.data?.label || node.id]));

// Structured connections for a single node. `label` is the connected node's
// label (no edge-label suffix) so it can be rendered as a clickable chip.
export const getNodeConnections = (
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
  labelsMap?: Map<string, string>
): NodeConnections => {
  const labels = labelsMap || buildLabelsMap(nodes);

  const from: ConnectionRef[] = edges
    .filter((edge) => edge.target === nodeId)
    .map((edge) => ({
      id: edge.source,
      label: labels.get(edge.source) || edge.source,
      edgeLabel: edge.data?.label,
      edgeId: edge.id,
    }));

  const to: ConnectionRef[] = edges
    .filter((edge) => edge.source === nodeId)
    .map((edge) => ({
      id: edge.target,
      label: labels.get(edge.target) || edge.target,
      edgeLabel: edge.data?.label,
      edgeId: edge.id,
    }));

  const self = nodes.find((n) => n.id === nodeId);
  const parentId = self?.parentNode;
  const parent: ConnectionRef | null = parentId
    ? { id: parentId, label: labels.get(parentId) || parentId }
    : null;

  const children: ConnectionRef[] = nodes
    .filter((n) => n.parentNode === nodeId)
    .map((n) => ({ id: n.id, label: labels.get(n.id) || n.id }));

  return { from, to, parent, children };
};

const joinRefs = (refs: ConnectionRef[]): string =>
  refs
    .map((ref) => `${ref.label}${ref.edgeLabel ? ` (${ref.edgeLabel})` : ""}`)
    .join(", ");

// Comma-joined display strings for the table columns / on-canvas node text.
export const formatConnectionsForDisplay = (
  connections: NodeConnections
): { from: string; to: string; parent: string; children: string } => ({
  from: joinRefs(connections.from),
  to: joinRefs(connections.to),
  parent: connections.parent?.label || "",
  children: joinRefs(connections.children),
});

// Inject computed connection data into nodes for the table view. Preserves the
// exact output shape of the previous in-component implementation: `incoming`/
// `outgoing` are arrays of ids; `from`/`to`/`parent`/`children` are only set
// when non-empty.
export const enhanceNodesWithConnectionData = (
  nodes: Node[],
  edges: Edge[]
): Node[] => {
  const labels = buildLabelsMap(nodes);

  return nodes.map((node) => {
    const conn = getNodeConnections(node.id, nodes, edges, labels);
    const display = formatConnectionsForDisplay(conn);

    const enhancedData: Record<string, any> = {
      ...node.data,
      incoming: conn.from.map((ref) => ref.id),
      outgoing: conn.to.map((ref) => ref.id),
    };

    if (display.from) enhancedData.from = display.from;
    if (display.to) enhancedData.to = display.to;
    if (conn.parent) enhancedData.parent = display.parent;
    if (conn.children.length > 0) enhancedData.children = display.children;

    return { ...node, data: enhancedData };
  });
};
