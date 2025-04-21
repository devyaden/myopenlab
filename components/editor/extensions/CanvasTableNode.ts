import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import CanvasTableNodeView from "./CanvasTableNodeView";

export const CanvasTableNode = Node.create({
  name: "canvasTable",

  group: "block",

  content: "",

  draggable: true,

  atom: true,

  addAttributes() {
    return {
      tableId: {
        default: null,
      },
      rows: {
        default: 0,
      },
      columns: {
        default: 0,
      },
      data: {
        default: "[]",
      },
      width: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="canvas-table"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { "data-type": "canvas-table", ...HTMLAttributes }];
  },

  addNodeView() {
    // @ts-ignore
    return ReactNodeViewRenderer(CanvasTableNodeView);
  },
});

export default CanvasTableNode;
