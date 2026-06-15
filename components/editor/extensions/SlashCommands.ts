import { Extension, type Editor, type Range } from "@tiptap/core";
import Suggestion, {
  type SuggestionOptions,
} from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import SlashCommandList, {
  type SlashCommandListHandle,
} from "../SlashCommandList";
import {
  filterSlashItems,
  getSlashItems,
  type SlashItem,
} from "../slash-items";

/**
 * Notion-style `/` block menu. Reuses the same `@tiptap/suggestion` +
 * tippy.js + ReactRenderer pattern as the @-mention extension
 * (FileMention.ts). Unlike the mention extension, it doesn't insert a
 * node — each item runs an editor command that converts/inserts a block.
 */
const SlashCommands = Extension.create<{
  suggestion: Partial<SuggestionOptions>;
}>({
  name: "slashCommands",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        // Only fire at the start of an empty / whitespace-led text block so
        // typing "and/or" mid-sentence doesn't pop the menu.
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          const isRootDepth = $from.depth === 1;
          const parentIsTextblock = $from.parent.isTextblock;
          const textBefore = $from.parent.textBetween(
            0,
            $from.parentOffset,
            undefined,
            "￼"
          );
          // Allow when the only thing before the cursor on this block is the
          // slash trigger itself (textBefore is empty or whitespace).
          return parentIsTextblock && isRootDepth && /^\s*$/.test(textBefore);
        },
        command: ({ editor, range, props }) => {
          (props as SlashItem).command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export function createSlashCommandsConfig(opts: {
  onInsert: (type: string) => void;
}) {
  const items = getSlashItems(opts.onInsert);

  return SlashCommands.configure({
    suggestion: {
      items: ({ query }: { query: string }) => filterSlashItems(items, query),
      render: () => {
        let component: ReactRenderer<SlashCommandListHandle> | null = null;
        let popup: TippyInstance | null = null;

        return {
          onStart: (props: any) => {
            component = new ReactRenderer(SlashCommandList, {
              props: {
                items: props.items,
                command: (item: SlashItem) => props.command(item),
              },
              editor: props.editor as Editor,
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
              theme: "slash-menu",
            });
          },
          onUpdate: (props: any) => {
            component?.updateProps({
              items: props.items,
              command: (item: SlashItem) => props.command(item),
            });
            if (popup && props.clientRect) {
              const rect = props.clientRect();
              if (rect) {
                popup.setProps({ getReferenceClientRect: () => rect });
              }
            }
          },
          onKeyDown: (props: any) => {
            if (props.event.key === "Escape") {
              popup?.hide();
              return true;
            }
            return component?.ref?.onKeyDown(props.event) ?? false;
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

export default SlashCommands;
