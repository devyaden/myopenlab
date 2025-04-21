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
      imageData: {
        default: null,
        parseHTML: (element) => {
          return element.getAttribute("data-image") || null;
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
      "data-name": HTMLAttributes.name || "Untitled Canvas",
      "data-nodes":
        typeof HTMLAttributes.nodes === "string" ? HTMLAttributes.nodes : "[]",
      "data-edges":
        typeof HTMLAttributes.edges === "string" ? HTMLAttributes.edges : "[]",
      "data-image": HTMLAttributes.imageData || "",
      "data-width": HTMLAttributes.width || 500,
      "data-height": HTMLAttributes.height || 300,
      class: "react-flow-node",
    };

    return ["div", sanitizedAttrs];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReactFlowNodeView);
  },
});
