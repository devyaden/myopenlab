import {
  Bold as BoldIcon,
  Highlighter,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
} from "lucide-react";
import React, { memo, useCallback, useMemo } from "react";
import { NodeToolbar, useReactFlow } from "reactflow";
import { BaseEditor, createEditor, Descendant, Editor } from "slate";
import { withHistory } from "slate-history";
import {
  Editable,
  ReactEditor,
  RenderElementProps,
  RenderLeafProps,
  Slate,
  withReact,
} from "slate-react";

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

type CustomElement =
  | { type: "paragraph"; children: Descendant[] }
  | { type: "heading-one"; children: Descendant[] }
  | { type: "bulleted-list"; children: Descendant[] }
  | { type: "list-item"; children: Descendant[] };

type CustomText = {
  text: string;
  bold?: true;
  italic?: true;
  underline?: true;
  highlight?: true;
  fontSize?: string;
};

interface TextNodeData {
  content?: Descendant[];
  onContentChange?: (content: Descendant[]) => void;
}

interface TextNodeProps {
  data: TextNodeData;
  selected?: boolean;
}

const CustomElement = ({
  attributes,
  children,
  element,
}: RenderElementProps) => {
  switch (element.type) {
    case "heading-one":
      return <h1 {...attributes}>{children}</h1>;
    case "bulleted-list":
      return <ul {...attributes}>{children}</ul>;
    case "list-item":
      return <li {...attributes}>{children}</li>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const CustomLeaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  let style: React.CSSProperties = {};

  if (leaf.bold) style.fontWeight = "bold";
  if (leaf.italic) style.fontStyle = "italic";
  if (leaf.underline) style.textDecoration = "underline";
  if (leaf.highlight) style.backgroundColor = "yellow";
  if (leaf.fontSize) style.fontSize = leaf.fontSize;

  return (
    <span {...attributes} style={style}>
      {children}
    </span>
  );
};

const ToolbarButton = ({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    className={`p-2 rounded transition-colors ${
      active ? "bg-blue-200 text-blue-800" : "hover:bg-gray-100"
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);

const TextNode = memo(({ data, selected }: TextNodeProps) => {
  const reactFlow = useReactFlow();

  const editor = useMemo(
    () => withHistory(withReact(createEditor() as ReactEditor)),
    []
  );

  const initialValue: Descendant[] = useMemo(
    () =>
      data.content && data.content.length > 0
        ? data.content
        : [{ type: "paragraph", children: [{ text: "" }] }],
    [data.content]
  );

  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      // update the content value in the current node
      const updatedNodes = reactFlow.getNodes().map((node) => {
        if (node.selected) {
          return {
            ...node,
            data: {
              ...node.data,
              content: newValue,
            },
          };
        }
        return node;
      });

      reactFlow.setNodes(updatedNodes);
    },

    //

    [reactFlow]
  );

  const toggleMark = useCallback(
    (mark: keyof CustomText) => {
      const isActive = isMarkActive(editor, mark);
      if (isActive) {
        Editor.removeMark(editor, mark);
      } else {
        Editor.addMark(editor, mark, true);
      }
    },
    [editor]
  );

  const setFontSize = useCallback(
    (size: string) => {
      Editor.addMark(editor, "fontSize", size);
    },
    [editor]
  );

  const isMarkActive = (editor: Editor, mark: keyof CustomText) => {
    const marks = Editor.marks(editor);
    // @ts-ignore
    return marks ? marks[mark] === true : false;
  };

  return (
    <>
      {selected && (
        <NodeToolbar isVisible={selected}>
          <ToolbarButton
            onClick={() => toggleMark("bold")}
            active={isMarkActive(editor, "bold")}
          >
            <BoldIcon size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => toggleMark("italic")}
            active={isMarkActive(editor, "italic")}
          >
            <ItalicIcon size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => toggleMark("underline")}
            active={isMarkActive(editor, "underline")}
          >
            <UnderlineIcon size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => toggleMark("highlight")}
            active={isMarkActive(editor, "highlight")}
          >
            <Highlighter size={16} />
          </ToolbarButton>
          <select
            className="ml-2 border p-1 rounded"
            onChange={(e) => setFontSize(e.target.value)}
          >
            <option value="12px">12px</option>
            <option value="16px" selected>
              16px
            </option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
          </select>
        </NodeToolbar>
      )}
      <div
        className="p-1  border rounded relative cursor-text min-w-[150px]"
        style={{
          border: selected ? "2px solid #0041d0" : "2px solid transparent",
        }}
      >
        <Slate
          editor={editor}
          initialValue={initialValue}
          onChange={handleChange}
        >
          <Editable
            renderElement={(props) => <CustomElement {...props} />}
            renderLeaf={(props) => <CustomLeaf {...props} />}
            placeholder="Enter your text..."
            className="outline-none"
          />
        </Slate>
      </div>
    </>
  );
});

TextNode.displayName = "TextNode";

export default TextNode;
