"use client";

import type { Editor, Range } from "@tiptap/core";
import {
  Code2,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  type LucideIcon,
  LayoutGrid,
  ListOrdered,
  List,
  ListChecks,
  Minus,
  Quote,
  ScrollText,
  SeparatorHorizontal,
  Table2,
  Type,
  AtSign,
} from "lucide-react";

export interface SlashItem {
  title: string;
  description: string;
  icon: LucideIcon;
  keywords: string[];
  group: string;
  command: (args: { editor: Editor; range: Range }) => void;
}

/**
 * Builds the slash-menu item list. `onInsert` is the editor's existing
 * `insertContent(type)` handler — reused so embed/dialog items behave
 * identically to the toolbar's Insert menu. Block-type conversions run
 * editor commands directly.
 */
export function getSlashItems(onInsert: (type: string) => void): SlashItem[] {
  // Helper: clear the typed "/query" range, then run an insert-by-type that
  // opens a dialog or inserts a node via the shared handler.
  const viaInsert =
    (type: string) =>
    ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).run();
      onInsert(type);
    };

  return [
    // — Basic —
    {
      title: "Text",
      description: "Plain paragraph",
      icon: Type,
      keywords: ["paragraph", "text", "body", "p"],
      group: "Basic",
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setParagraph().run(),
    },
    {
      title: "Heading 1",
      description: "Large section heading",
      icon: Heading1,
      keywords: ["h1", "title", "heading"],
      group: "Basic",
      command: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleHeading({ level: 1 })
          .run(),
    },
    {
      title: "Heading 2",
      description: "Medium section heading",
      icon: Heading2,
      keywords: ["h2", "subtitle", "heading"],
      group: "Basic",
      command: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleHeading({ level: 2 })
          .run(),
    },
    {
      title: "Heading 3",
      description: "Small section heading",
      icon: Heading3,
      keywords: ["h3", "heading"],
      group: "Basic",
      command: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleHeading({ level: 3 })
          .run(),
    },
    {
      title: "Quote",
      description: "Block quotation",
      icon: Quote,
      keywords: ["blockquote", "quote", "citation"],
      group: "Basic",
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
      title: "Divider",
      description: "Horizontal rule",
      icon: Minus,
      keywords: ["divider", "hr", "rule", "line", "separator"],
      group: "Basic",
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
    {
      title: "Page break",
      description: "Force a new page in PDF/print",
      icon: SeparatorHorizontal,
      keywords: ["page", "break", "pagebreak", "print"],
      group: "Basic",
      command: viaInsert("page-break"),
    },

    // — Lists —
    {
      title: "Bullet list",
      description: "Unordered list",
      icon: List,
      keywords: ["bullet", "unordered", "list", "ul"],
      group: "Lists",
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
      title: "Numbered list",
      description: "Ordered list",
      icon: ListOrdered,
      keywords: ["numbered", "ordered", "list", "ol"],
      group: "Lists",
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
      title: "To-do list",
      description: "Checklist with checkboxes",
      icon: ListChecks,
      keywords: ["todo", "task", "checklist", "check"],
      group: "Lists",
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleTaskList().run(),
    },

    // — Blocks —
    {
      title: "Code block",
      description: "Monospaced code with syntax",
      icon: Code2,
      keywords: ["code", "snippet", "pre", "monospace"],
      group: "Blocks",
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
      title: "Image",
      description: "Upload or embed an image",
      icon: ImageIcon,
      keywords: ["image", "picture", "photo", "img"],
      group: "Blocks",
      command: viaInsert("image"),
    },
    {
      title: "Floating box",
      description: "Box that text wraps around",
      icon: ScrollText,
      keywords: ["float", "callout", "sidebar", "box", "wrap"],
      group: "Blocks",
      command: viaInsert("float-block"),
    },

    // — Embeds —
    {
      title: "Table",
      description: "Insert a table from your tables",
      icon: Table2,
      keywords: ["table", "grid", "spreadsheet"],
      group: "Embeds",
      command: viaInsert("canvas-table"),
    },
    {
      title: "Playbook",
      description: "Embed a playbook flow / diagram",
      icon: LayoutGrid,
      keywords: ["playbook", "canvas", "diagram", "flow", "board"],
      group: "Embeds",
      command: viaInsert("canvas"),
    },
    {
      title: "Mention file",
      description: "Link another file inline",
      icon: AtSign,
      keywords: ["mention", "file", "link", "reference", "at"],
      group: "Embeds",
      // Re-trigger the @-mention popup by typing the char.
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).insertContent("@").run(),
    },
  ];
}

/** Filter items by a fuzzy query against title + keywords. */
export function filterSlashItems(
  items: SlashItem[],
  query: string
): SlashItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    if (item.title.toLowerCase().includes(q)) return true;
    return item.keywords.some((k) => k.toLowerCase().includes(q));
  });
}
