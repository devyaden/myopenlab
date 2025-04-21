import { mergeAttributes, Node } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ResizableImageNodeView from "./ResizableImageNodeView";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    resizableImage: {
      /**
       * Add a resizable image
       */
      setResizableImage: (options: {
        src: string;
        alt?: string;
        title?: string;
        width?: number;
        height?: number;
      }) => ReturnType;
    };
  }
}

// Extend the Image extension to add width and height attributes
export const ResizableImageNode = Image.extend({
  name: "resizableImage",

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute("width") || null,
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute("height") || null,
        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {};
          }
          return { height: attributes.height };
        },
      },
    };
  },

  addCommands() {
    return {
      setResizableImage:
        (options) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: options,
            })
            .run();
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNodeView);
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
    ];
  },
});

export default ResizableImageNode;
