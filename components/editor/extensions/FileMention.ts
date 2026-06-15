import Mention from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import MentionList, {
  type MentionListHandle,
} from "../MentionList";
import { searchFiles, preloadFiles } from "../hooks/useFileSearch";

export interface FileMentionAttrs {
  id: string;
  label: string;
  canvasType: string | null;
  /** Phase 3: human-readable code (e.g. "HR-01") when the target is coded. */
  code: string | null;
}

/**
 * Tiptap node for `@file` mentions of other canvases the user owns.
 *
 * - Trigger: `@`. Suggestion fetches the user's canvases via searchFiles()
 *   (module-level cache, see hooks/useFileSearch.ts).
 * - Renders inline as a styled chip with a file-type icon and the file
 *   name. The chip carries `data-file-id` and `data-canvas-type` so a
 *   click handler in the editor wrapper can navigate to the file.
 * - Attributes are persisted in the document JSON, so reload preserves
 *   the mention.
 */
const FileMention = Mention.extend({
  name: "fileMention",
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-file-id"),
        renderHTML: (attrs) =>
          attrs.id ? { "data-file-id": attrs.id } : {},
      },
      label: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-label"),
        renderHTML: (attrs) =>
          attrs.label ? { "data-label": attrs.label } : {},
      },
      canvasType: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-canvas-type"),
        renderHTML: (attrs) =>
          attrs.canvasType ? { "data-canvas-type": attrs.canvasType } : {},
      },
      code: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-code"),
        renderHTML: (attrs) =>
          attrs.code ? { "data-code": attrs.code } : {},
      },
    };
  },
});

export function createFileMentionConfig(opts: {
  onPreload?: () => void;
  /**
   * Phase 3: fired after a mention is inserted, with its attributes — used to
   * record a typed cross-reference from the current document to the target.
   */
  onMention?: (attrs: FileMentionAttrs) => void;
}) {
  return FileMention.configure({
    HTMLAttributes: {
      class: "file-mention",
    },
    // Custom renderer: each chip displays the file name prefixed with `@`.
    // The Mention extension's renderText hook controls plain-text
    // serialization (used in copy/paste, plain-text export).
    renderText({ node }) {
      return `@${node.attrs.label ?? "file"}`;
    },
    // Tiptap's Mention extension's HTML output via renderLabel was deprecated;
    // we control HTML via renderHTML on the node spec instead. The default
    // renderHTML wraps the chip in a span with our HTMLAttributes class.

    suggestion: {
      char: "@",
      // Insert the mention node, then notify so a typed reference is recorded.
      // Mirrors @tiptap/extension-mention's default command (insert node + a
      // trailing space), with our onMention side-effect appended.
      command: ({ editor, range, props }) => {
        const attrs = props as unknown as FileMentionAttrs;
        const nodeAfter = editor.view.state.selection.$to.nodeAfter;
        const overrideSpace = nodeAfter?.text?.startsWith(" ");
        const r = overrideSpace ? { from: range.from, to: range.to + 1 } : range;

        editor
          .chain()
          .focus()
          .insertContentAt(r, [
            { type: "fileMention", attrs },
            { type: "text", text: " " },
          ])
          .run();

        opts.onMention?.(attrs);
      },
      // Fired when the popup opens. Cheap; just kicks off the cache fetch.
      items: async ({ query }) => {
        opts.onPreload?.();
        try {
          return await searchFiles(query);
        } catch (err) {
          console.error("[FileMention] search failed", err);
          return [];
        }
      },
      render: () => {
        let component: ReactRenderer<MentionListHandle> | null = null;
        let popup: TippyInstance | null = null;

        return {
          onStart: (props) => {
            preloadFiles();
            component = new ReactRenderer(MentionList, {
              props,
              editor: props.editor,
            });

            if (!props.clientRect) return;
            const rect = props.clientRect();
            if (!rect) return;

            popup = tippy(document.body, {
              getReferenceClientRect: () => rect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: "manual",
              placement: "bottom-start",
              theme: "file-mention",
            });
          },
          onUpdate: (props) => {
            component?.updateProps(props);
            if (popup && props.clientRect) {
              const rect = props.clientRect();
              if (rect) {
                popup.setProps({ getReferenceClientRect: () => rect });
              }
            }
          },
          onKeyDown: (props) => {
            if (props.event.key === "Escape") {
              popup?.hide();
              return true;
            }
            return component?.ref?.onKeyDown(props.event as any) ?? false;
          },
          onExit: () => {
            popup?.destroy();
            component?.destroy();
            popup = null;
            component = null;
          },
        };
      },
    },
  });
}

export default FileMention;
