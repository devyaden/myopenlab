import { describe, it, expect } from "vitest";
import {
  applyDocOps,
  indexBlocks,
  anchorFor,
  resolveTarget,
} from "@/lib/agent/document-patch";
import type { DocBlock } from "@/lib/agent/document-blocks";

const base = (): DocBlock[] => [
  { type: "heading", level: 1, text: "Title" },
  { type: "paragraph", text: "Intro" },
  { type: "paragraph", text: "Body" },
];

describe("indexBlocks / anchors", () => {
  it("annotates each block with a numeric index and a stable anchor", () => {
    const indexed = indexBlocks(base());
    expect(indexed.map((b) => b.index)).toEqual([0, 1, 2]);
    expect(indexed[0].anchor).toBe(anchorFor({ type: "heading", text: "Title" }));
    // anchor is stable across calls for identical content
    expect(anchorFor({ type: "paragraph", text: "Body" })).toBe(
      anchorFor({ type: "paragraph", text: "Body" })
    );
  });

  it("resolves by index and by anchor", () => {
    const blocks = base();
    expect(resolveTarget(blocks, 1)).toBe(1);
    expect(resolveTarget(blocks, anchorFor(blocks[2]))).toBe(2);
    expect(resolveTarget(blocks, "missing-anchor")).toBe(-1);
    expect(resolveTarget(blocks, 99)).toBe(-1);
  });
});

describe("applyDocOps", () => {
  it("inserts after a targeted block", () => {
    const { blocks, errors } = applyDocOps(base(), [
      { op: "insert", at: 0, position: "after", block: { type: "paragraph", text: "New" } },
    ]);
    expect(errors).toHaveLength(0);
    expect(blocks.map((b) => b.text)).toEqual(["Title", "New", "Intro", "Body"]);
  });

  it("updates and deletes by anchor", () => {
    const start = base();
    const { blocks } = applyDocOps(start, [
      { op: "update", target: anchorFor(start[1]), block: { type: "paragraph", text: "Intro v2" } },
      { op: "delete", target: anchorFor(start[2]) },
    ]);
    expect(blocks.map((b) => b.text)).toEqual(["Title", "Intro v2"]);
  });

  it("moves a block to a new position", () => {
    const { blocks } = applyDocOps(base(), [{ op: "move", target: 2, to: 0 }]);
    expect(blocks.map((b) => b.text)).toEqual(["Body", "Title", "Intro"]);
  });

  it("records an error for an unresolved target and still applies valid ops", () => {
    const { blocks, errors } = applyDocOps(base(), [
      { op: "delete", target: "nope" },
      { op: "insert", block: { type: "paragraph", text: "End" } },
    ]);
    expect(errors.length).toBe(1);
    expect(blocks[blocks.length - 1].text).toBe("End");
  });

  it("strips read-time index/anchor metadata from inserted/updated blocks", () => {
    const { blocks } = applyDocOps(base(), [
      // @ts-expect-error simulating a block the model echoed back with annotations
      { op: "insert", block: { type: "paragraph", text: "X", index: 9, anchor: "z" } },
    ]);
    const last: any = blocks[blocks.length - 1];
    expect(last.index).toBeUndefined();
    expect(last.anchor).toBeUndefined();
  });
});
