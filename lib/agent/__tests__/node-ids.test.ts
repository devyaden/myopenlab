import { describe, it, expect } from "vitest";
import { reconcileNodeIds } from "@/lib/agent/node-ids";

const node = (id: string, label: string, extra: any = {}) => ({
  id,
  type: "genericNode",
  position: { x: 0, y: 0 },
  data: { label },
  ...extra,
});

describe("reconcileNodeIds", () => {
  it("preserves a node whose id already exists", () => {
    const existing = [node("a", "Start")];
    const r = reconcileNodeIds({
      existingNodes: existing,
      nodes: [node("a", "Start (edited)")],
      edges: [],
      nodeStyles: {},
    });
    expect(r.preserved).toBe(1);
    expect(r.remapped).toBe(0);
    expect(r.minted).toBe(0);
    expect(r.nodes[0].id).toBe("a");
    expect(r.nodes[0].data.label).toBe("Start (edited)");
  });

  it("recovers a regenerated id by label match and rewrites edges + styles", () => {
    const existing = [node("real-1", "Review"), node("real-2", "Approve")];
    const r = reconcileNodeIds({
      existingNodes: existing,
      nodes: [node("tmp-1", "Review"), node("tmp-2", "Approve")],
      edges: [{ id: "e1", source: "tmp-1", target: "tmp-2" }],
      nodeStyles: { "tmp-1": { isBold: true } },
    });
    expect(r.remapped).toBe(2);
    expect(r.nodes.map((n) => n.id).sort()).toEqual(["real-1", "real-2"]);
    expect(r.edges[0].source).toBe("real-1");
    expect(r.edges[0].target).toBe("real-2");
    expect(r.nodeStyles["real-1"]).toEqual({ isBold: true });
    expect(r.nodeStyles["tmp-1"]).toBeUndefined();
  });

  it("mints a genuinely new node and claims each existing id at most once", () => {
    const existing = [node("real-1", "Step")];
    const r = reconcileNodeIds({
      existingNodes: existing,
      // two proposed nodes share the label "Step" but only one existing id exists
      nodes: [node("p1", "Step"), node("p2", "Step"), node("p3", "Brand New")],
      edges: [],
      nodeStyles: {},
    });
    expect(r.remapped).toBe(1); // first "Step" claims real-1
    expect(r.minted).toBe(2); // second "Step" + "Brand New" are new
    const ids = r.nodes.map((n) => n.id);
    expect(ids).toContain("real-1");
    expect(ids).toContain("p2");
    expect(ids).toContain("p3");
  });

  it("treats empty inputs as an empty diagram", () => {
    const r = reconcileNodeIds({
      existingNodes: [],
      nodes: [],
      edges: [],
      nodeStyles: {},
    });
    expect(r.nodes).toEqual([]);
    expect(r.preserved + r.remapped + r.minted).toBe(0);
  });
});
