import { NextResponse } from "next/server";
import { requireExploreAccess } from "@/lib/explore/access";

// The owner's cross-reference spine, shaped as a node/edge graph for the
// governance browser. Nodes are artifacts (playbooks/policies/documents/tables),
// directory people/roles (when a reference targets a specific row), and unresolved
// codes; edges are the typed references between them. Read-only and owner-scoped.

export interface GraphNode {
  id: string;
  label: string;
  code: string | null;
  /** 'person' | 'role' | a canvas_type ('hybrid'|'table'|'document') | 'code'. */
  group: string;
  canvasType: string | null;
  /** For a directory row node, the directory canvas it belongs to. */
  parent?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

export async function GET(req: Request) {
  const access = await requireExploreAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const { supabase, user, scope } = access;
  // The artifact the Map was launched from — included as a node even if it has no
  // references yet, so "you are here" always has something to focus in the graph.
  const focusId = new URL(req.url).searchParams.get("focus");

  const [{ data: refRows }, { data: canvasRows }] = await Promise.all([
    supabase.from("reference").select("*").eq("user_id", user.id),
    supabase
      .from("canvas")
      .select("id, name, code, canvas_type, directory_kind")
      .eq("user_id", user.id),
  ]);

  const refs = (refRows ?? []) as any[];
  const byId = new Map((canvasRows ?? []).map((c: any) => [c.id, c]));
  const allowed = scope.allowedCanvasIds ? new Set(scope.allowedCanvasIds) : null;
  const inScope = (cid: string | null | undefined) =>
    !cid || !allowed ? true : allowed.has(cid);

  // Resolve labels for any person/role rows targeted by node-level references.
  const dirCanvasIds = Array.from(
    new Set(
      refs
        .filter((r) => r.to_node && r.to_canvas && byId.get(r.to_canvas)?.directory_kind)
        .map((r) => r.to_canvas as string)
    )
  );
  const rowLabels = new Map<string, string>(); // `${canvasId}:${nodeId}` -> label
  await Promise.all(
    dirCanvasIds.map(async (cid) => {
      const { data } = await supabase
        .from("canvas_data")
        .select("nodes")
        .eq("canvas_id", cid)
        .maybeSingle();
      const nodes = Array.isArray(data?.nodes) ? (data!.nodes as any[]) : [];
      for (const n of nodes) {
        if (n?.id != null) {
          rowLabels.set(`${cid}:${n.id}`, String(n.data?.label ?? "Untitled"));
        }
      }
    })
  );

  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  const ensureCanvas = (cid: string): string => {
    if (!nodes.has(cid)) {
      const c = byId.get(cid);
      nodes.set(cid, {
        id: cid,
        label: c?.name ?? "Untitled",
        code: c?.code ?? null,
        group: c?.directory_kind ?? c?.canvas_type ?? "canvas",
        canvasType: c?.canvas_type ?? null,
      });
    }
    return cid;
  };
  const ensureRow = (cid: string, nodeId: string): string => {
    const key = `${cid}:${nodeId}`;
    if (!nodes.has(key)) {
      const c = byId.get(cid);
      nodes.set(key, {
        id: key,
        label: rowLabels.get(key) ?? "Unknown",
        code: null,
        group: c?.directory_kind ?? "person",
        canvasType: null,
        parent: cid,
      });
    }
    return key;
  };
  const ensureCode = (code: string): string => {
    const key = `code:${code}`;
    if (!nodes.has(key)) {
      nodes.set(key, { id: key, label: code, code, group: "code", canvasType: null });
    }
    return key;
  };

  for (const r of refs) {
    if (!r.from_canvas || !inScope(r.from_canvas)) continue;
    let target: string | null = null;
    if (r.to_canvas && inScope(r.to_canvas)) {
      target = r.to_node ? ensureRow(r.to_canvas, r.to_node) : ensureCanvas(r.to_canvas);
    } else if (r.to_code && !r.to_canvas) {
      target = ensureCode(r.to_code);
    }
    if (!target) continue;
    const source = ensureCanvas(r.from_canvas);
    edges.push({ id: r.id, source, target, type: r.type });
  }

  // Ensure the launched artifact is present (so the Map can focus it even when it
  // has no cross-references yet) — but only if it's a real, in-scope canvas.
  if (focusId && byId.has(focusId) && inScope(focusId)) ensureCanvas(focusId);

  return NextResponse.json({ nodes: Array.from(nodes.values()), edges });
}
