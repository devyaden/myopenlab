"use client";

import { GripVertical } from "lucide-react";

/**
 * Drag affordance for embed node views (canvas / table / doc-reference).
 *
 * Tiptap initiates a whole-node drag when the node spec is `draggable: true`
 * AND the node view contains an element marked `data-drag-handle`. The embedded
 * ReactFlow canvas swallows pointer events, so without an explicit handle there
 * is no grab point — this grip sits in the left gutter and provides one.
 *
 * Rendered inside a `position: relative` + `group` NodeViewWrapper. It reveals
 * on hover (group-hover) or when the node is selected.
 */
export function EmbedDragHandle({ visible }: { visible?: boolean }) {
  return (
    <div
      data-drag-handle
      draggable
      contentEditable={false}
      title="Drag to move"
      aria-label="Drag to move"
      className={[
        "embed-drag-handle absolute top-1/2 -left-7 z-20 -translate-y-1/2",
        "flex h-7 w-6 items-center justify-center rounded",
        "border border-gray-200 bg-white/90 text-gray-400 shadow-sm",
        "cursor-grab transition-opacity hover:text-gray-700 active:cursor-grabbing",
        "opacity-0 group-hover:opacity-100",
        visible ? "opacity-100" : "",
      ].join(" ")}
      // NOTE: do not stopPropagation/preventDefault on mousedown here — Tiptap's
      // node-view stopEvent must see the mousedown on the drag handle to arm the
      // drag (it sets `isDragging`, which lets the following dragstart set
      // ProseMirror's `view.dragging` so the drop actually moves the block).
      style={{ touchAction: "none" }}
    >
      <GripVertical size={16} />
    </div>
  );
}

export default EmbedDragHandle;
