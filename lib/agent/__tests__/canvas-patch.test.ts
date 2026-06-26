import { describe, it, expect } from "vitest";
import { applyCanvasOps, type CanvasState } from "@/lib/agent/canvas-patch";

const start = (): CanvasState => ({
  nodes: [
    { id: "a", type: "genericNode", position: { x: 0, y: 0 }, data: { label: "A" } },
    { id: "b", type: "genericNode", position: { x: 100, y: 0 }, data: { label: "B" } },
  ],
  edges: [{ id: "e1", source: "a", target: "b" }],
  nodeStyles: { a: { isBold: true } },
});

describe("applyCanvasOps", () => {
  it("adds a node and an edge to it", () => {
    const { state, errors } = applyCanvasOps(start(), [
      { op: "add_node", id: "c", label: "C" },
      { op: "add_edge", source: "b", target: "c" },
    ]);
    expect(errors).toHaveLength(0);
    expect(state.nodes.map((n) => n.id)).toContain("c");
    expect(state.edges.some((e) => e.source === "b" && e.target === "c")).toBe(true);
  });

  it("updates a node's label and shape", () => {
    const { state } = applyCanvasOps(start(), [
      { op: "update_node", id: "a", label: "A2", shape: "diamond" },
    ]);
    const a = state.nodes.find((n) => n.id === "a");
    expect(a.data.label).toBe("A2");
    expect(a.data.shape).toBe("diamond");
  });

  it("deleting a node cascades to its edges and style", () => {
    const { state } = applyCanvasOps(start(), [{ op: "delete_node", id: "a" }]);
    expect(state.nodes.some((n) => n.id === "a")).toBe(false);
    expect(state.edges).toHaveLength(0); // e1 referenced "a"
    expect(state.nodeStyles.a).toBeUndefined();
  });

  it("rejects an edge to a missing node", () => {
    const { errors } = applyCanvasOps(start(), [
      { op: "add_edge", source: "a", target: "ghost" },
    ]);
    expect(errors.length).toBe(1);
  });

  it("moves a node", () => {
    const { state } = applyCanvasOps(start(), [
      { op: "move_node", id: "b", position: { x: 250, y: 80 } },
    ]);
    expect(state.nodes.find((n) => n.id === "b").position).toEqual({ x: 250, y: 80 });
  });
});
