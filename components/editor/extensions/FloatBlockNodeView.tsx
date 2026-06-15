"use client";

import {
  NodeViewContent,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import { AlignLeft, AlignRight, Trash2 } from "lucide-react";
import type { FloatSide, FloatSize } from "./FloatBlock";

const SIZE_LABELS: Record<FloatSize, string> = {
  small: "S",
  medium: "M",
  large: "L",
};

/**
 * NodeView for FloatBlock. Renders the float wrapper plus a small inline
 * toolbar that becomes visible only when the node is selected, exposing
 * side / size / delete controls.
 *
 * The actual float layout is CSS — see `.float-block` rules in
 * editor.css. This component is purely chrome + ProseMirror content host.
 */
export default function FloatBlockNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const side = (node.attrs.side as FloatSide) ?? "right";
  const size = (node.attrs.size as FloatSize) ?? "medium";

  return (
    <NodeViewWrapper
      as="div"
      data-float-block="true"
      data-side={side}
      data-size={size}
      className={`float-block float-block--${side} float-block--${size}${
        selected ? " is-selected" : ""
      }`}
    >
      <div
        className="float-block__toolbar"
        // Don't let toolbar buttons trigger ProseMirror selection changes
        // when clicked.
        contentEditable={false}
      >
        <button
          type="button"
          className={`float-block__btn${
            side === "left" ? " is-active" : ""
          }`}
          onClick={() => updateAttributes({ side: "left" })}
          aria-label="Float left"
          title="Float left"
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className={`float-block__btn${
            side === "right" ? " is-active" : ""
          }`}
          onClick={() => updateAttributes({ side: "right" })}
          aria-label="Float right"
          title="Float right"
        >
          <AlignRight className="h-3.5 w-3.5" />
        </button>
        <span className="float-block__divider" aria-hidden />
        {(["small", "medium", "large"] as FloatSize[]).map((s) => (
          <button
            key={s}
            type="button"
            className={`float-block__btn float-block__btn--text${
              size === s ? " is-active" : ""
            }`}
            onClick={() => updateAttributes({ size: s })}
            aria-label={`Size ${s}`}
            title={`Size ${s}`}
          >
            {SIZE_LABELS[s]}
          </button>
        ))}
        <span className="float-block__divider" aria-hidden />
        <button
          type="button"
          className="float-block__btn float-block__btn--danger"
          onClick={() => deleteNode()}
          aria-label="Remove floating block"
          title="Remove floating block"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <NodeViewContent className="float-block__content" />
    </NodeViewWrapper>
  );
}
