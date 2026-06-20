import type { Editor } from "@tiptap/react";

/** Atom embeds that can't hold a caret and therefore strand the gap cursor. */
const ATOM_EMBED_TYPES = ["reactFlow", "canvasTable", "docReference"];

/**
 * After inserting an atom embed (reactFlow / canvasTable / docReference), make
 * sure there's an editable paragraph right after it and drop the caret into it.
 *
 * The embeds are ProseMirror atoms (no editable content). When one is the last
 * block, ProseMirror falls back to a "gap cursor" — the stray horizontal dash
 * that appears below the diagram. Giving the block a trailing paragraph and
 * moving the caret there lets the user keep typing normally.
 *
 * A paragraph is only created when the block isn't already followed by a
 * textblock, so inserting mid-document doesn't litter empty paragraphs.
 *
 * Uses Tiptap's high-level command chain only (no `@tiptap/pm` import, which is
 * not a hoisted dependency in this project).
 */
export function placeCaretAfterEmbed(editor: Editor) {
  if (!editor || editor.isDestroyed) return;
  const { state } = editor;
  // `selection.to` sits just after the freshly inserted atom block.
  const pos = Math.min(state.selection.to, state.doc.content.size);
  const nodeAfter = state.doc.resolve(pos).nodeAfter;

  if (!nodeAfter || !nodeAfter.isTextblock) {
    editor
      .chain()
      .insertContentAt(pos, { type: "paragraph" })
      .focus(pos + 1)
      .run();
  } else {
    editor.chain().focus(pos + 1).run();
  }
}

/**
 * Guarantee the document ends in an editable paragraph when its last block is an
 * atom embed — covers stored / agent-authored docs that would otherwise show the
 * gap cursor below a trailing diagram. Call once right after content is loaded
 * (inside the load guard so it doesn't trip autosave).
 */
export function ensureTrailingParagraph(editor: Editor) {
  if (!editor || editor.isDestroyed) return;
  const last = editor.state.doc.lastChild;
  if (last && ATOM_EMBED_TYPES.includes(last.type.name)) {
    editor.commands.insertContentAt(editor.state.doc.content.size, {
      type: "paragraph",
    });
  }
}
