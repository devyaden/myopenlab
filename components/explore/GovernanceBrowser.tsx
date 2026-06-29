"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Background,
  BaseEdge,
  Controls,
  Handle,
  MarkerType,
  Position,
  getSmoothStepPath,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { autoLayoutNodes } from "@/lib/agent/layout";
import { playbookHref } from "@/lib/playbook-href";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useExplorationStore, type ExploreContext } from "@/lib/store/useExploration";
import { Loader2, Network, Users, X } from "lucide-react";

// ── Wire types (from /api/explore/graph + /api/explore/directory) ────────────
interface GraphNode {
  id: string;
  label: string;
  code: string | null;
  group: string;
  canvasType: string | null;
}
interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}
interface DirectoryRow {
  id: string;
  label: string;
  data: Record<string, any>;
}
interface Directory {
  id: string;
  name: string;
  code: string | null;
  kind: string;
  rows: DirectoryRow[];
}

interface GovernanceBrowserProps {
  /** Graph node id to focus (set when the user clicks a source chip in the chat). */
  focusId: string | null;
  onPick: (ctx: ExploreContext) => void;
  /** Reports the loaded graph to the shell (for the find pane + status counts),
   *  so the Map fetches the graph once instead of twice. */
  onData?: (nodes: GraphNode[], edgeCount: number) => void;
}

// ── Shared chart model ───────────────────────────────────────────────────────
interface BaseNode {
  id: string;
  label: string;
  code: string | null;
  group: string;
  canvasType: string | null;
  width: number;
  position: { x: number; y: number };
  data?: Record<string, any>;
  directoryName?: string;
}
interface BaseEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}
interface ChartData {
  nodes: BaseNode[];
  edges: BaseEdge[];
  index: Map<string, BaseNode>;
  hasHierarchy?: boolean;
}

// Colors keyed by node group, driven by Atlas categorical node tokens so the Map
// reads correctly in both light and dark themes (border = the hue, bg = 16% tint).
const GROUP_STYLE: Record<string, { bg: string; border: string }> = {
  person: { bg: "hsl(var(--node-person) / 0.16)", border: "hsl(var(--node-person))" },
  role: { bg: "hsl(var(--node-role) / 0.16)", border: "hsl(var(--node-role))" },
  document: { bg: "hsl(var(--node-document) / 0.16)", border: "hsl(var(--node-document))" },
  table: { bg: "hsl(var(--node-table) / 0.16)", border: "hsl(var(--node-table))" },
  hybrid: { bg: "hsl(var(--node-hybrid) / 0.16)", border: "hsl(var(--node-hybrid))" },
  canvas: { bg: "hsl(var(--node-canvas) / 0.16)", border: "hsl(var(--node-canvas))" },
  code: { bg: "hsl(var(--node-code) / 0.14)", border: "hsl(var(--node-code))" },
};

function groupToKind(group: string): ExploreContext["kind"] {
  if (group === "person") return "person";
  if (group === "role") return "role";
  if (group === "code") return "code";
  return "canvas";
}

// Friendly, pluralized names for the filter chips and collapsed-group clusters.
const GROUP_LABEL: Record<string, string> = {
  person: "People",
  role: "Roles",
  document: "Documents",
  table: "Tables",
  hybrid: "Playbooks",
  canvas: "Canvases",
  code: "Reference codes",
};
const groupLabel = (g: string) => GROUP_LABEL[g] ?? humanizeType(g);

// Collapse a source's same-type children into one cluster chip once they reach
// this count, so a hub doesn't explode into a wall of look-alike nodes.
const CLUSTER_THRESHOLD = 4;
const CLUSTER_PREFIX = "cluster:";

/**
 * Derive the process graph actually rendered: hide filtered-out groups, then
 * collapse each source's large same-type child buckets into a single cluster
 * node (expandable on click). Returns plain graph nodes/edges for the layout.
 */
function deriveProcessGraph(
  graph: { nodes: GraphNode[]; edges: GraphEdge[] } | null,
  hiddenGroups: Set<string>,
  expandedClusters: Set<string>,
  keepIds: (string | null)[] = []
): { nodes: GraphNode[]; edges: GraphEdge[] } | null {
  if (!graph) return null;
  const keep = new Set(keepIds.filter(Boolean) as string[]);
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));

  // 1. Group filter.
  const visible = (id: string) => {
    const n = byId.get(id);
    return !!n && !hiddenGroups.has(n.group);
  };
  let nodes = graph.nodes.filter((n) => !hiddenGroups.has(n.group));
  const edges = graph.edges.filter((e) => visible(e.source) && visible(e.target));

  // 2. Cluster each source's same-type child buckets that hit the threshold.
  const clusterNodes: GraphNode[] = [];
  const clusterEdges: GraphEdge[] = [];
  const replaced = new Set<string>(); // original source→child edge ids removed
  const collapsedMembers = new Set<string>();
  const expandedMembers = new Set<string>();

  const outBySource = new Map<string, GraphEdge[]>();
  for (const e of edges) {
    const list = outBySource.get(e.source) ?? [];
    list.push(e);
    outBySource.set(e.source, list);
  }

  for (const [src, outEdges] of Array.from(outBySource)) {
    const byGroup = new Map<string, GraphEdge[]>();
    for (const e of outEdges) {
      const g = byId.get(e.target)?.group ?? "canvas";
      const list = byGroup.get(g) ?? [];
      list.push(e);
      byGroup.set(g, list);
    }
    for (const [g, bucket] of Array.from(byGroup)) {
      if (bucket.length < CLUSTER_THRESHOLD) continue;
      const clusterId = `${CLUSTER_PREFIX}${src}:${g}`;
      const expanded = expandedClusters.has(clusterId);
      clusterNodes.push({
        id: clusterId,
        label: `${groupLabel(g)} (${bucket.length})`,
        code: null,
        group: g,
        canvasType: null,
      });
      clusterEdges.push({ id: `ce:${clusterId}`, source: src, target: clusterId, type: bucket[0].type });
      for (const e of bucket) {
        replaced.add(e.id);
        if (expanded) {
          clusterEdges.push({ id: `cm:${clusterId}:${e.target}`, source: clusterId, target: e.target, type: e.type });
          expandedMembers.add(e.target);
        } else {
          collapsedMembers.add(e.target);
        }
      }
    }
  }

  // Hide a collapsed member unless it's also revealed by an expanded cluster or
  // explicitly kept (the focused/selected node).
  const hidden = new Set(
    Array.from(collapsedMembers).filter((id) => !expandedMembers.has(id) && !keep.has(id))
  );
  nodes = nodes.filter((n) => !hidden.has(n.id));
  const shown = new Set(nodes.map((n) => n.id));

  const finalEdges = edges
    .filter((e) => !replaced.has(e.id) && shown.has(e.source) && shown.has(e.target))
    .concat(clusterEdges);

  return { nodes: [...nodes, ...clusterNodes], edges: finalEdges };
}

/** Drop directories whose person/role group is filtered out. */
function filterDirectories(
  directories: Directory[] | null,
  hiddenGroups: Set<string>
): Directory[] | null {
  if (!directories) return null;
  return directories.filter((d) => !hiddenGroups.has(d.kind === "role" ? "role" : "person"));
}

const isClusterId = (id: string) => id.startsWith(CLUSTER_PREFIX);

function humanizeType(type: string): string {
  return type
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Read a field from a directory row with tolerant key matching. */
function pickField(data: Record<string, any>, keys: string[]): string | null {
  for (const k of keys) {
    for (const cand of [k, k.toLowerCase()]) {
      const v = data?.[cand];
      if (v != null && String(v).trim() !== "") return String(v);
    }
  }
  return null;
}

/** Match a manager/reports-to value to a row id within one directory. */
function matchRowId(labelToId: Map<string, string>, value: string): string | null {
  const v = value.trim().toLowerCase();
  if (!v) return null;
  const exact = labelToId.get(v);
  if (exact) return exact;
  for (const [label, id] of Array.from(labelToId.entries())) {
    if (label.startsWith(v) || v.startsWith(label) || label.includes(v)) return id;
  }
  return null;
}

// ── Chart builders ───────────────────────────────────────────────────────────
function buildProcessChart(graph: { nodes: GraphNode[]; edges: GraphEdge[] } | null): ChartData {
  const index = new Map<string, BaseNode>();
  if (!graph) return { nodes: [], edges: [], index };
  const meta = new Map(graph.nodes.map((n) => [n.id, n]));
  const positioned = autoLayoutNodes(
    graph.nodes.map((n) => ({ id: n.id, width: 168, height: 46 })),
    graph.edges.map((e) => ({ source: e.source, target: e.target })),
    { rankdir: "TB", nodesep: 90, ranksep: 170 }
  );
  const nodes: BaseNode[] = positioned.map((p: any) => {
    const m = meta.get(p.id)!;
    const node: BaseNode = {
      id: p.id,
      label: m.label,
      code: m.code,
      group: m.group,
      canvasType: m.canvasType,
      width: 168,
      position: p.position ?? { x: 0, y: 0 },
    };
    index.set(node.id, node);
    return node;
  });
  const edges: BaseEdge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: e.type,
  }));
  return { nodes, edges, index };
}

function buildPeopleChart(directories: Directory[] | null): ChartData {
  const index = new Map<string, BaseNode>();
  if (!directories) return { nodes: [], edges: [], index, hasHierarchy: false };
  const rawNodes: { id: string; width: number; height: number }[] = [];
  const edges: BaseEdge[] = [];

  for (const dir of directories) {
    const kind = dir.kind === "role" ? "role" : "person";
    const labelToId = new Map<string, string>();
    for (const row of dir.rows) {
      const id = `${dir.id}:${row.id}`;
      labelToId.set(row.label.trim().toLowerCase(), id);
      index.set(id, {
        id,
        label: row.label,
        code: null,
        group: kind,
        canvasType: null,
        width: 184,
        position: { x: 0, y: 0 },
        data: row.data,
        directoryName: dir.name,
      });
      rawNodes.push({ id, width: 184, height: 52 });
    }
    for (const row of dir.rows) {
      const managerVal =
        kind === "role"
          ? pickField(row.data, ["Reports To", "ReportsTo", "Manager"])
          : pickField(row.data, ["Manager", "Reports To", "Manager Name", "ManagerName"]);
      if (!managerVal) continue;
      const id = `${dir.id}:${row.id}`;
      const managerId = matchRowId(labelToId, managerVal);
      if (managerId && managerId !== id) {
        edges.push({
          id: `mgr-${dir.id}-${row.id}`,
          source: managerId,
          target: id,
          type: kind === "role" ? "reports-to" : "manages",
        });
      }
    }
  }

  const positioned = autoLayoutNodes(
    rawNodes,
    edges.map((e) => ({ source: e.source, target: e.target })),
    { rankdir: "TB", nodesep: 80, ranksep: 150 }
  );
  const posById = new Map(positioned.map((p: any) => [p.id, p.position]));
  Array.from(index.values()).forEach((node) => {
    node.position = posById.get(node.id) ?? { x: 0, y: 0 };
  });
  return {
    nodes: Array.from(index.values()),
    edges,
    index,
    hasHierarchy: edges.length > 0,
  };
}

// ── Detail model ─────────────────────────────────────────────────────────────
interface RefItem {
  label: string;
  code: string | null;
  type: string;
}
interface DetailModel {
  kind: "process" | "person";
  title: string;
  code: string | null;
  subtitle: string | null;
  fields: { label: string; value: string }[];
  outgoing: RefItem[];
  incoming: RefItem[];
  reportsTo: string | null;
  reports: string[];
  assignedIn: RefItem[];
  openHref: string | null;
  ask: ExploreContext;
}

const PERSON_SKIP = new Set([
  "label",
  "shape",
  "Manager",
  "manager",
  "Reports To",
  "reports to",
  "ReportsTo",
]);

function computeDetail(
  id: string,
  tab: "processes" | "people",
  processData: ChartData,
  peopleData: ChartData
): DetailModel | null {
  if (tab === "processes") {
    const meta = processData.index.get(id);
    if (!meta) return null;
    const outgoing: RefItem[] = processData.edges
      .filter((e) => e.source === id)
      .map((e) => {
        const m = processData.index.get(e.target);
        return m ? { label: m.label, code: m.code, type: e.type } : null;
      })
      .filter(Boolean) as RefItem[];
    const incoming: RefItem[] = processData.edges
      .filter((e) => e.target === id)
      .map((e) => {
        const m = processData.index.get(e.source);
        return m ? { label: m.label, code: m.code, type: e.type } : null;
      })
      .filter(Boolean) as RefItem[];
    return {
      kind: "process",
      title: meta.label,
      code: meta.code,
      subtitle: humanizeType(meta.group),
      fields: [],
      outgoing,
      incoming,
      reportsTo: null,
      reports: [],
      assignedIn: [],
      openHref: meta.canvasType ? playbookHref(id, meta.canvasType) : null,
      ask: { kind: groupToKind(meta.group), id, label: meta.label, code: meta.code },
    };
  }

  const meta = peopleData.index.get(id);
  if (!meta) return null;
  const data = meta.data ?? {};
  const fields = Object.entries(data)
    .filter(([k, v]) => !PERSON_SKIP.has(k) && v != null && String(v).trim() !== "")
    .map(([k, v]) => ({ label: k, value: String(v) }));
  const reportsToEdge = peopleData.edges.find((e) => e.target === id);
  const reportsTo = reportsToEdge
    ? peopleData.index.get(reportsToEdge.source)?.label ?? null
    : null;
  const reports = peopleData.edges
    .filter((e) => e.source === id)
    .map((e) => peopleData.index.get(e.target)?.label)
    .filter(Boolean) as string[];
  // The people node id equals the reference graph's person-node id, so artifacts
  // that assign this person/role show up as incoming edges in the process graph.
  const assignedIn: RefItem[] = processData.edges
    .filter((e) => e.target === id)
    .map((e) => {
      const m = processData.index.get(e.source);
      return m ? { label: m.label, code: m.code, type: e.type } : null;
    })
    .filter(Boolean) as RefItem[];
  return {
    kind: "person",
    title: meta.label,
    code: null,
    subtitle: meta.directoryName ?? meta.group,
    fields,
    outgoing: [],
    incoming: [],
    reportsTo,
    reports,
    assignedIn,
    openHref: null,
    ask: { kind: meta.group === "role" ? "role" : "person", id, label: meta.label, code: null },
  };
}

// ── Colored chip node ────────────────────────────────────────────────────────
// A global `.react-flow__node { ... !important }` reset in globals.css strips the
// wrapper's border/background so the editor's custom nodes can style their own
// inner element. The Map relies on per-type color, so it must do the same: paint
// an inner div (immune to that reset) instead of styling the node wrapper.
const HIDDEN_HANDLE = {
  opacity: 0,
  width: 1,
  height: 1,
  minWidth: 0,
  minHeight: 0,
  border: 0,
} as const;

function ChipNode({ data }: any) {
  const emphasized = data.selected || data.primary;
  const border = data.cluster
    ? `1.5px dashed ${data.border}`
    : `${emphasized ? 2 : 1.5}px solid ${data.selected ? "hsl(var(--foreground))" : data.border}`;
  const boxShadow = data.selected
    ? `0 0 0 3px ${data.border}`
    : data.primary
      ? `0 0 0 2px ${data.border}`
      : "none";
  return (
    <>
      <Handle type="target" position={Position.Top} isConnectable={false} style={HIDDEN_HANDLE} />
      <div
        style={{
          width: data.width,
          background: data.bg,
          color: "hsl(var(--foreground))",
          border,
          boxShadow,
          borderRadius: 10,
          padding: "8px 10px",
          fontSize: 11,
          fontWeight: emphasized || data.cluster ? 600 : 400,
          textAlign: "center",
          cursor: data.cluster ? "pointer" : "default",
          opacity: data.dim ? 0.2 : 1,
          transition: "opacity 200ms ease",
        }}
      >
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={false} style={HIDDEN_HANDLE} />
    </>
  );
}
const EXPLORE_NODE_TYPES = { chip: ChipNode };

// ── Bus-routed smooth-step edge ──────────────────────────────────────────────
// Edges from the same source share one horizontal "bus" just below that source,
// then drop vertically into each child — the clean tree/org-chart connector,
// instead of a comb of stacked lines. Different sources at the same rank are
// staggered slightly (busLane) so their buses don't overlap.
const BUS_GAP = 26;
function LaneEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  label,
  labelStyle,
  labelBgStyle,
  data,
}: any) {
  const dy = targetY - sourceY;
  const desired = BUS_GAP + ((data?.busLane ?? 0) % 5) * 6;
  // Keep the bend a fixed gap below the source but always between the two ranks;
  // for very short spans just use the midpoint.
  const centerY = dy > 24 ? sourceY + Math.min(desired, dy - 12) : (sourceY + targetY) / 2;
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
    centerY,
  });
  return (
    <BaseEdge
      id={id}
      path={path}
      style={style}
      markerEnd={markerEnd}
      labelX={labelX}
      labelY={labelY}
      label={label}
      labelStyle={labelStyle}
      labelShowBg
      labelBgStyle={labelBgStyle}
    />
  );
}
const EXPLORE_EDGE_TYPES = { lane: LaneEdge };

// ── ReactFlow chart with zoom-to-focus + dimming ─────────────────────────────
function ChartPane({
  base,
  selectedId,
  onSelect,
  onToggleCluster,
}: {
  base: ChartData;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onToggleCluster: (id: string) => void;
}) {
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // Only treat a selection as "active" for dimming/edges when the node is
  // actually in this view — otherwise launching the Map focused on an artifact
  // that has no cross-references would fade the entire graph.
  const selectionActive = useMemo(
    () => selectedId != null && base.nodes.some((n) => n.id === selectedId),
    [selectedId, base.nodes]
  );

  // Per-source bus lane: all edges from one node share a horizontal bus; give
  // each source a small stagger index (ordered left→right) so sibling buses at
  // the same rank don't sit exactly on top of each other.
  const sourceLane = useMemo(() => {
    const sources = Array.from(new Set(base.edges.map((e) => e.source)));
    sources.sort(
      (a, b) => (base.index.get(a)?.position.x ?? 0) - (base.index.get(b)?.position.x ?? 0)
    );
    const map = new Map<string, number>();
    sources.forEach((s, i) => map.set(s, i));
    return map;
  }, [base.edges, base.index]);

  // The anchor: highest-degree node, emphasized only in the unselected overview
  // so the reader has an obvious "start here".
  const primaryId = useMemo(() => {
    const deg = new Map<string, number>();
    for (const e of base.edges) {
      deg.set(e.source, (deg.get(e.source) ?? 0) + 1);
      deg.set(e.target, (deg.get(e.target) ?? 0) + 1);
    }
    let best: string | null = null;
    let bestD = -1;
    for (const n of base.nodes) {
      const d = deg.get(n.id) ?? 0;
      if (d > bestD) {
        bestD = d;
        best = n.id;
      }
    }
    return bestD > 0 ? best : null;
  }, [base.nodes, base.edges]);

  const rfNodes: Node[] = useMemo(
    () =>
      base.nodes.map((n) => {
        const style = GROUP_STYLE[n.group] ?? GROUP_STYLE.canvas;
        const sel = selectedId === n.id;
        const dim = selectionActive && !sel;
        return {
          id: n.id,
          type: "chip",
          position: n.position,
          data: {
            label: n.code ? `${n.label}  {${n.code}}` : n.label,
            width: n.width,
            bg: style.bg,
            border: style.border,
            selected: sel,
            primary: !selectionActive && n.id === primaryId,
            cluster: isClusterId(n.id),
            dim,
          },
        };
      }),
    [base.nodes, selectedId, selectionActive, primaryId]
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      base.edges.map((e) => {
        const connected =
          !selectionActive || e.source === selectedId || e.target === selectedId;
        const hovered = hoveredEdgeId === e.id;
        // De-emphasized by default; emphasized on hover or when it touches the
        // selected node.
        const emph = hovered || (selectionActive && connected);
        const stroke = connected
          ? emph
            ? "hsl(var(--foreground))"
            : "hsl(var(--muted-foreground))"
          : "hsl(var(--border))";
        // Tags show in the overview and for the selected node's edges; hidden on
        // the dimmed edges when a selection narrows focus.
        const showLabel = !selectionActive || connected;
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: "lane",
          data: { busLane: sourceLane.get(e.source) ?? 0 },
          label: showLabel ? humanizeType(e.type) : undefined,
          labelStyle: {
            fill: emph ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
            fontSize: emph ? 10 : 9,
            fontWeight: emph ? 600 : 400,
          },
          labelBgStyle: { fill: "hsl(var(--card))" },
          style: {
            stroke,
            strokeWidth: emph ? 2.4 : connected ? 1.6 : 1,
            opacity: connected ? 1 : 0.18,
            transition: "opacity 200ms ease",
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
        };
      }),
    [base.edges, selectedId, selectionActive, sourceLane, hoveredEdgeId]
  );

  useEffect(() => {
    if (!rf) return;
    const n = selectionActive
      ? base.nodes.find((x) => x.id === selectedId)
      : null;
    if (n) {
      rf.setCenter(n.position.x + n.width / 2, n.position.y + 26, {
        zoom: 1.5,
        duration: 500,
      });
    } else {
      rf.fitView({ duration: 500, padding: 0.2 });
    }
  }, [rf, selectedId, selectionActive, base.nodes]);

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={EXPLORE_NODE_TYPES}
      edgeTypes={EXPLORE_EDGE_TYPES}
      onInit={setRf}
      onNodeClick={(_, node) =>
        isClusterId(node.id) ? onToggleCluster(node.id) : onSelect(node.id)
      }
      onPaneClick={() => onSelect(null)}
      onEdgeMouseEnter={(_, edge) => setHoveredEdgeId(edge.id)}
      onEdgeMouseLeave={() => setHoveredEdgeId(null)}
      fitView
      minZoom={0.2}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
    >
      <Background color="hsl(var(--border))" gap={20} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

// ── Detail card overlay ──────────────────────────────────────────────────────
function RefChip({ item }: { item: RefItem }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-foreground">
      <span className="truncate">{item.label}</span>
      {item.code && <span className="font-mono text-primary">{`{${item.code}}`}</span>}
      {item.type && <span className="text-muted-foreground">· {humanizeType(item.type)}</span>}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-2">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function DetailCard({
  detail,
  onClose,
  onAsk,
  onOpen,
}: {
  detail: DetailModel;
  onClose: () => void;
  onAsk: () => void;
  onOpen?: () => void;
}) {
  const t = useT();
  return (
    <div className="absolute left-3 top-3 z-10 w-72 animate-in fade-in zoom-in-95 duration-300 rounded-xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur rtl:left-auto rtl:right-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{detail.title}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {detail.subtitle && <span className="truncate">{detail.subtitle}</span>}
            {detail.code && <span className="font-mono text-primary">{`{${detail.code}}`}</span>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>

      {detail.fields.length > 0 && (
        <dl className="mt-2 space-y-0.5">
          {detail.fields.map((f) => (
            <div key={f.label} className="flex gap-1 text-[11px]">
              <dt className="text-muted-foreground">{f.label}:</dt>
              <dd className="truncate text-foreground">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {detail.kind === "person" && (
        <>
          {detail.reportsTo && (
            <Section title={t("explore.browser.detail.reportsTo")}>
              <span className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-foreground">
                {detail.reportsTo}
              </span>
            </Section>
          )}
          {detail.reports.length > 0 && (
            <Section title={t("explore.browser.detail.reports")}>
              {detail.reports.map((r, i) => (
                <span
                  key={i}
                  className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-foreground"
                >
                  {r}
                </span>
              ))}
            </Section>
          )}
          {detail.assignedIn.length > 0 && (
            <Section title={t("explore.browser.detail.assignedIn")}>
              {detail.assignedIn.map((r, i) => (
                <RefChip key={i} item={r} />
              ))}
            </Section>
          )}
        </>
      )}

      {detail.kind === "process" && (
        <>
          {detail.outgoing.length > 0 && (
            <Section title={t("explore.browser.detail.references")}>
              {detail.outgoing.map((r, i) => (
                <RefChip key={i} item={r} />
              ))}
            </Section>
          )}
          {detail.incoming.length > 0 && (
            <Section title={t("explore.browser.detail.referencedBy")}>
              {detail.incoming.map((r, i) => (
                <RefChip key={i} item={r} />
              ))}
            </Section>
          )}
        </>
      )}

      <div className="mt-3 flex gap-1.5">
        <button
          onClick={onAsk}
          className="flex-1 rounded-md bg-primary px-2 py-1.5 text-[11px] font-medium text-primary-foreground hover:opacity-90"
        >
          {t("explore.browser.detail.ask")}
        </button>
        {onOpen && (
          <button
            onClick={onOpen}
            className="rounded-md border border-border px-2 py-1.5 text-[11px] text-foreground hover:bg-muted"
          >
            {t("explore.browser.detail.open")}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main browser ─────────────────────────────────────────────────────────────
export function GovernanceBrowser({
  focusId,
  onPick,
  onData,
}: GovernanceBrowserProps) {
  const t = useT();
  const router = useRouter();
  const exitExplore = useExplorationStore((s) => s.exit);
  const [tab, setTab] = useState<"processes" | "people">("processes");
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
  const [directories, setDirectories] = useState<Directory[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Types toggled off via the filter chips, and large groups expanded via their
  // cluster chips. Shared across tabs (group names are namespaced by type).
  const [hiddenGroups, setHiddenGroups] = useState<Set<string>>(() => new Set());
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(() => new Set());

  const toggleGroup = useCallback((g: string) => {
    setHiddenGroups((prev) => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });
  }, []);
  const toggleCluster = useCallback((id: string) => {
    setExpandedClusters((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Include the launch artifact so the Map can focus it even if it has no refs.
    const graphUrl = focusId
      ? `/api/explore/graph?focus=${encodeURIComponent(focusId)}`
      : "/api/explore/graph";
    Promise.all([
      fetch(graphUrl).then((r) => (r.ok ? r.json() : { nodes: [], edges: [] })),
      fetch("/api/explore/directory").then((r) => (r.ok ? r.json() : { directories: [] })),
    ])
      .then(([g, d]) => {
        if (cancelled) return;
        const gNodes: GraphNode[] = g.nodes ?? [];
        const gEdges: GraphEdge[] = g.edges ?? [];
        setGraph({ nodes: gNodes, edges: gEdges });
        setDirectories(d.directories ?? []);
        if (gEdges.length === 0) setTab("people");
        onData?.(gNodes, gEdges.length);
      })
      .catch(() => {
        if (cancelled) return;
        setGraph({ nodes: [], edges: [] });
        setDirectories([]);
      });
    return () => {
      cancelled = true;
    };
    // Fetch once on mount with the launch focus; later selections reuse the graph.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processData = useMemo(
    () =>
      buildProcessChart(
        deriveProcessGraph(graph, hiddenGroups, expandedClusters, [focusId, selectedId])
      ),
    [graph, hiddenGroups, expandedClusters, focusId, selectedId]
  );
  const peopleData = useMemo(
    () => buildPeopleChart(filterDirectories(directories, hiddenGroups)),
    [directories, hiddenGroups]
  );

  // Group → count for the filter chips, from the unfiltered data of the active tab.
  const groupCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const bump = (g: string) => counts.set(g, (counts.get(g) ?? 0) + 1);
    if (tab === "processes") graph?.nodes.forEach((n) => bump(n.group));
    else
      directories?.forEach((d) =>
        d.rows.forEach(() => bump(d.kind === "role" ? "role" : "person"))
      );
    return counts;
  }, [tab, graph, directories]);

  // A chat source-chip click focuses the matching process node.
  useEffect(() => {
    if (focusId) {
      setTab("processes");
      setSelectedId(focusId);
    }
  }, [focusId]);

  const switchTab = useCallback((tb: "processes" | "people") => {
    setTab(tb);
    setSelectedId(null);
  }, []);

  const detail = useMemo(
    () => (selectedId ? computeDetail(selectedId, tab, processData, peopleData) : null),
    [selectedId, tab, processData, peopleData]
  );

  const activeBase = tab === "processes" ? processData : peopleData;
  const loading = graph === null || directories === null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-border px-3 py-2">
        <TabButton active={tab === "processes"} onClick={() => switchTab("processes")} icon={<Network size={14} />}>
          {t("explore.browser.processes")}
        </TabButton>
        <TabButton active={tab === "people"} onClick={() => switchTab("people")} icon={<Users size={14} />}>
          {t("explore.browser.directory")}
        </TabButton>
      </div>

      {groupCounts.size > 1 && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-3 py-1.5">
          {Array.from(groupCounts.entries())
            .sort((a, b) => groupLabel(a[0]).localeCompare(groupLabel(b[0])))
            .map(([g, count]) => (
              <FilterChip
                key={g}
                group={g}
                count={count}
                active={!hiddenGroups.has(g)}
                onToggle={() => toggleGroup(g)}
              />
            ))}
        </div>
      )}

      <div className="relative flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
          </div>
        ) : activeBase.nodes.length === 0 ? (
          <EmptyState
            text={tab === "processes" ? t("explore.browser.graphEmpty") : t("explore.browser.directoryEmpty")}
          />
        ) : (
          <>
            <ChartPane
              key={tab}
              base={activeBase}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onToggleCluster={toggleCluster}
            />
            {tab === "people" && !peopleData.hasHierarchy && (
              <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-md border border-border bg-card/90 px-3 py-2 text-center text-[11px] text-muted-foreground backdrop-blur">
                {t("explore.browser.hierarchyHint")}
              </div>
            )}
            {detail && (
              <DetailCard
                detail={detail}
                onClose={() => setSelectedId(null)}
                onAsk={() => onPick(detail.ask)}
                onOpen={
                  detail.openHref
                    ? () => {
                        exitExplore();
                        router.push(detail.openHref!);
                      }
                    : undefined
                }
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  group,
  count,
  active,
  onToggle,
}: {
  group: string;
  count: number;
  active: boolean;
  onToggle: () => void;
}) {
  const style = GROUP_STYLE[group] ?? GROUP_STYLE.canvas;
  return (
    <button
      onClick={onToggle}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
        active
          ? "border-border bg-card text-foreground"
          : "border-transparent bg-muted/40 text-muted-foreground line-through"
      }`}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full border"
        style={{
          background: active ? style.bg : "transparent",
          borderColor: style.border,
          opacity: active ? 1 : 0.5,
        }}
        aria-hidden
      />
      <span>{groupLabel(group)}</span>
      <span className="tabular-nums text-muted-foreground">{count}</span>
    </button>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center px-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
