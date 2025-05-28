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
          const nodes = element.getAttribute("data-nodes") || "[]";
          return nodes;
        },
      },
      edges: {
        default: "[]",
        parseHTML: (element) => {
          const edges = element.getAttribute("data-edges") || "[]";
          return edges;
        },
      },
      styles: {
        default: "{}",
        parseHTML: (element) => {
          const styles = element.getAttribute("data-styles") || "{}";
          return styles;
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
      viewport: {
        default: null,
        parseHTML: (element) => {
          const viewportAttr = element.getAttribute("data-viewport");
          try {
            return viewportAttr ? JSON.parse(viewportAttr) : null;
          } catch (e) {
            console.error("Error parsing viewport attribute from HTML", e);
            return null;
          }
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
      "data-styles":
        typeof HTMLAttributes.styles === "string"
          ? HTMLAttributes.styles
          : "{}",
      "data-width": HTMLAttributes.width || 500,
      "data-height": HTMLAttributes.height || 300,
      "data-use-real-time-data": HTMLAttributes.useRealTimeData || false,
      "data-last-updated": HTMLAttributes.lastUpdated || "",
      "data-viewport": HTMLAttributes.viewport
        ? JSON.stringify(HTMLAttributes.viewport)
        : null,
      class: "react-flow-node",
    };

    // Filter out null or undefined attributes to avoid rendering them
    const finalAttrs: { [key: string]: any } = {};
    for (const key in sanitizedAttrs) {
      // @ts-ignore
      if (sanitizedAttrs[key] !== null && sanitizedAttrs[key] !== undefined) {
        // @ts-ignore
        finalAttrs[key] = sanitizedAttrs[key];
      }
    }

    return ["div", finalAttrs];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReactFlowNodeView);
  },
});
