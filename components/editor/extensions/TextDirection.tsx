import { Extension } from "@tiptap/core";

type TextDirectionOptions = {
  types: string[];
  defaultDirection: "ltr" | "rtl";
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textDirection: {
      /**
       * Set the text direction
       */
      setTextDirection: (direction: "ltr" | "rtl") => ReturnType;
      /**
       * Toggle the text direction
       */
      toggleTextDirection: () => ReturnType;
    };
  }
}

export const TextDirection = Extension.create<TextDirectionOptions>({
  name: "textDirection",

  addOptions() {
    return {
      types: ["heading", "paragraph"],
      defaultDirection: "ltr",
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          dir: {
            default: this.options.defaultDirection,
            parseHTML: (element: HTMLElement) =>
              element.getAttribute("dir") || this.options.defaultDirection,
            renderHTML: (attributes: { dir?: "ltr" | "rtl" }) => {
              if (
                !attributes.dir ||
                attributes.dir === this.options.defaultDirection
              ) {
                return {};
              }

              return { dir: attributes.dir };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextDirection:
        (direction: "ltr" | "rtl") =>
        ({ commands }) => {
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { dir: direction })
          );
        },
      toggleTextDirection:
        () =>
        ({ state, commands }) => {
          const { selection } = state;
          const currentDirection =
            (selection.$anchor.parent.attrs.dir as "ltr" | "rtl" | undefined) ||
            this.options.defaultDirection;
          const newDirection = currentDirection === "ltr" ? "rtl" : "ltr";

          return this.options.types.every((type) =>
            commands.updateAttributes(type, { dir: newDirection })
          );
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-L": () => this.editor.commands.setTextDirection("ltr"),
      "Mod-Shift-R": () => this.editor.commands.setTextDirection("rtl"),
    };
  },
});

export default TextDirection;
