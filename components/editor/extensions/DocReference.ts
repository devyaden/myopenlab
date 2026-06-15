import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import DocReferenceNodeView from "./DocReferenceNodeView";

/**
 * Phase 3: a sub-document "reference card" — the chosen representation for the
 * March-style Template / Policy / Standard / Checklist / Authority metadata
 * slides. Unlike the flow (`reactFlow`) and table (`canvasTable`) embeds, this
 * does not transclude content; it renders a live *card* (title, human code,
 * owner, last-edited, type badge, click-through) for another document.
 *
 * `docId` points at the referenced canvas (a `document` canvas_type); `refType`
 * carries the cross-reference kind. `label`/`code` are cached on the node so the
 * card shows something instantly before the live fetch resolves (and in static
 * exports / print where no fetch runs).
 */
export const DocReference = Node.create({
  name: "docReference",

  group: "block",

  content: "",

  draggable: true,

  atom: true,

  addAttributes() {
    return {
      docId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-doc-id"),
        renderHTML: (attrs) =>
          attrs.docId ? { "data-doc-id": attrs.docId } : {},
      },
      refType: {
        default: "document",
        parseHTML: (el) => el.getAttribute("data-ref-type") || "document",
        renderHTML: (attrs) =>
          attrs.refType ? { "data-ref-type": attrs.refType } : {},
      },
      label: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-label"),
        renderHTML: (attrs) =>
          attrs.label ? { "data-label": attrs.label } : {},
      },
      code: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-code"),
        renderHTML: (attrs) => (attrs.code ? { "data-code": attrs.code } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="doc-reference"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { "data-type": "doc-reference", class: "doc-reference", ...HTMLAttributes },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocReferenceNodeView);
  },
});

export default DocReference;
