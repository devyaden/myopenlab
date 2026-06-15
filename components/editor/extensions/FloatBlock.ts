import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import FloatBlockNodeView from "./FloatBlockNodeView";

export type FloatSide = "left" | "right";
export type FloatSize = "small" | "medium" | "large";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    floatBlock: {
      /** Insert a floating block with the given side and size, prefilled
       * with an empty paragraph. */
      insertFloatBlock: (opts?: {
        side?: FloatSide;
        size?: FloatSize;
      }) => ReturnType;
      /** Update attributes on the currently-selected floatBlock. */
      setFloatBlockSide: (side: FloatSide) => ReturnType;
      setFloatBlockSize: (size: FloatSize) => ReturnType;
    };
  }
}

const SIDES: FloatSide[] = ["left", "right"];
const SIZES: FloatSize[] = ["small", "medium", "large"];

/**
 * A block-level wrapper that floats inside the document flow. Body text
 * (paragraphs that come AFTER it in document order) wraps around it via
 * CSS `float`. Content inside is regular block content — typically a
 * paragraph, an image, or both.
 *
 * Anchoring: the float sits where it lives in the document. Edits above
 * push it down, edits below leave it alone. Not absolute-positioned.
 *
 * Two knobs: `side` (left | right) and `size` (small | medium | large,
 * mapped to 25%/40%/60% of the body width by CSS).
 */
const FloatBlock = Node.create({
  name: "floatBlock",
  group: "block",
  // Content rule: at least one block child. ProseMirror enforces this on
  // delete so an empty float collapses to a single paragraph rather than
  // rejecting the deletion.
  content: "block+",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      side: {
        default: "right" as FloatSide,
        parseHTML: (el) => el.getAttribute("data-side") ?? "right",
        renderHTML: (attrs) => ({ "data-side": attrs.side }),
      },
      size: {
        default: "medium" as FloatSize,
        parseHTML: (el) => el.getAttribute("data-size") ?? "medium",
        renderHTML: (attrs) => ({ "data-size": attrs.size }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-float-block]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-float-block": "true",
        class: `float-block float-block--${HTMLAttributes["data-side"] ?? "right"} float-block--${HTMLAttributes["data-size"] ?? "medium"}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      insertFloatBlock:
        (opts) =>
        ({ chain }) => {
          const side: FloatSide = SIDES.includes(opts?.side as FloatSide)
            ? (opts!.side as FloatSide)
            : "right";
          const size: FloatSize = SIZES.includes(opts?.size as FloatSize)
            ? (opts!.size as FloatSize)
            : "medium";
          return chain()
            .focus()
            .insertContent({
              type: this.name,
              attrs: { side, size },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Floating box" }],
                },
              ],
            })
            .run();
        },
      setFloatBlockSide:
        (side) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { side }),
      setFloatBlockSize:
        (size) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { size }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(FloatBlockNodeView);
  },
});

export default FloatBlock;
