import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ReactFlowNodeView from "./ReactFlowNodeView";

export const ReactFlowNode = Node.create({
  name: "reactFlow",

  group: "block",

  content: "",

  draggable: true,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      canvasId: {
        default: null,
      },
      name: {
        default: "Untitled Canvas",
      },
      nodes: {
        default: "[]",
        parseHTML: (element) => {
          // Get the data from data-nodes attribute
          const nodes = element.getAttribute("data-nodes") || "[]";
          return nodes;
        },
      },
      edges: {
        default: "[]",
        parseHTML: (element) => {
          // Get the data from data-edges attribute
          const edges = element.getAttribute("data-edges") || "[]";
          return edges;
        },
      },
      width: {
        default: 500,
        parseHTML: (element) => {
          return parseInt(element.getAttribute("data-width") || "500", 10);
        },
      },
      height: {
        default: 300,
        parseHTML: (element) => {
          return parseInt(element.getAttribute("data-height") || "300", 10);
        },
      },
      useRealTimeData: {
        default: false,
        parseHTML: (element) => {
          return element.getAttribute("data-use-real-time-data") === "true";
        },
      },
      lastUpdated: {
        default: null,
        parseHTML: (element) => {
          return element.getAttribute("data-last-updated") || null;
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="react-flow"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Create a sanitized version of the attributes
    const sanitizedAttrs = {
      "data-type": "react-flow",
      "data-id": HTMLAttributes.id || "",
      "data-canvas-id": HTMLAttributes.canvasId || "",
      "data-name": HTMLAttributes.name || "Untitled Canvas",
      "data-nodes":
        typeof HTMLAttributes.nodes === "string" ? HTMLAttributes.nodes : "[]",
      "data-edges":
        typeof HTMLAttributes.edges === "string" ? HTMLAttributes.edges : "[]",
      "data-width": HTMLAttributes.width || 500,
      "data-height": HTMLAttributes.height || 300,
      "data-use-real-time-data": HTMLAttributes.useRealTimeData || false,
      "data-last-updated": HTMLAttributes.lastUpdated || "",
      class: "react-flow-node",
    };

    return ["div", sanitizedAttrs];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReactFlowNodeView);
  },
});
