import { describe, it, expect } from "vitest";
import {
  blocksToTiptapDoc,
  tiptapToBlocks,
  extractReferences,
  blocksToPlainText,
  type DocBlock,
} from "@/lib/agent/document-blocks";

const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";

describe("blocksToTiptapDoc / tiptapToBlocks round-trip", () => {
  it("round-trips headings, paragraphs, lists, tasks, divider, table", () => {
    const blocks: DocBlock[] = [
      { type: "heading", level: 1, text: "Title" },
      { type: "paragraph", text: "Hello world" },
      { type: "bullet_list", items: ["one", "two"] },
      { type: "numbered_list", items: ["first", "second"] },
      { type: "task_list", items: [{ text: "todo", checked: false }, { text: "done", checked: true }] },
      { type: "divider" },
      { type: "table", headers: ["A", "B"], rows: [["1", "2"], ["3", "4"]] },
    ];
    const back = tiptapToBlocks(blocksToTiptapDoc(blocks));

    expect(back[0]).toMatchObject({ type: "heading", level: 1, text: "Title" });
    expect(back[1]).toMatchObject({ type: "paragraph", text: "Hello world" });
    expect(back[2]).toMatchObject({ type: "bullet_list", items: ["one", "two"] });
    expect(back[3]).toMatchObject({ type: "numbered_list", items: ["first", "second"] });
    expect(back[4].type).toBe("task_list");
    expect(back[4].items).toEqual([
      { text: "todo", checked: false },
      { text: "done", checked: true },
    ]);
    expect(back[5]).toMatchObject({ type: "divider" });
    expect(back[6]).toMatchObject({ type: "table", headers: ["A", "B"], rows: [["1", "2"], ["3", "4"]] });
  });

  it("always yields a non-empty doc", () => {
    const doc = blocksToTiptapDoc([]);
    expect(doc.type).toBe("doc");
    expect(doc.content.length).toBeGreaterThan(0);
  });

  it("tolerates a malformed table (flat headers/rows) without throwing", () => {
    const doc = blocksToTiptapDoc([
      // @ts-expect-error intentionally malformed shape from the model
      { type: "table", headers: "A,B", rows: "1,2" },
    ]);
    const table = doc.content.find((n) => n.type === "table");
    expect(table).toBeTruthy();
  });

  it("drops an empty list rather than emitting a schema-invalid node", () => {
    const doc = blocksToTiptapDoc([{ type: "bullet_list", items: [] }]);
    // no bulletList survives; falls back to the empty-paragraph guarantee
    expect(doc.content.some((n) => n.type === "bulletList")).toBe(false);
  });
});

describe("extractReferences", () => {
  it("keeps a doc_reference with a real uuid", () => {
    const refs = extractReferences([
      { type: "doc_reference", docId: UUID_A, refType: "policy" },
    ]);
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({ toCanvas: UUID_A, type: "policy" });
  });

  it("routes a code-like (non-uuid) id to toCode, not the uuid FK", () => {
    const refs = extractReferences([
      { type: "doc_reference", docId: "HR-01", code: "HR-01", refType: "template" },
    ]);
    expect(refs).toHaveLength(1);
    expect(refs[0].toCanvas).toBeNull();
    expect(refs[0].toCode).toBe("HR-01");
  });

  it("emits a depends-on for a flow embed and drops targetless specs", () => {
    const refs = extractReferences([
      { type: "embed_flow", canvasId: UUID_B },
      { type: "doc_reference", docId: "not-a-uuid" }, // no code → dropped
    ]);
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({ toCanvas: UUID_B, type: "depends-on" });
  });
});

describe("blocksToPlainText", () => {
  it("summarizes a heading + paragraph", () => {
    const text = blocksToPlainText([
      { type: "heading", level: 1, text: "Overview" },
      { type: "paragraph", text: "Body text" },
    ]);
    expect(text).toContain("Overview");
    expect(text).toContain("Body text");
  });
});
