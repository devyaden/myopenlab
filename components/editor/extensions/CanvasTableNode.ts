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
      // New attributes for dynamic updates
      filterConfig: {
        default: "[]", // JSON string of filter groups
      },
      sortConfig: {
        default: null, // JSON string of sort configuration
      },
      selectedColumns: {
        default: "[]", // JSON string of selected column names
      },
      displayRows: {
        default: 5,
      },
      isDynamic: {
        default: true, // Flag to enable/disable dynamic updates
      },
      lastUpdated: {
        default: null, // Timestamp of last update
      },
      // NEW: RTL support
      isRTL: {
        default: false, // Flag to enable RTL layout
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

  renderHTML({ HTMLAttributes }: { HTMLAttributes: any }) {
    return ["div", { "data-type": "canvas-table", ...HTMLAttributes }];
  },

  addNodeView() {
    // @ts-ignore
    return ReactNodeViewRenderer(CanvasTableNodeView);
  },
});

export default CanvasTableNode;
