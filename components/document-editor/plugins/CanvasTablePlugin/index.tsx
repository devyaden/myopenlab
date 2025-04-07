"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $wrapNodeInElement, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
} from "lexical";
import { useEffect } from "react";
import {
  $createTableNode,
  CanvasTableNode,
  type TableData,
} from "../../nodes/CanvasTableNode";

export const INSERT_CANVAS_TABLE_COMMAND: LexicalCommand<TableData> =
  createCommand("INSERT_CANVAS_TABLE_COMMAND");

export default function TableNodePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([CanvasTableNode])) {
      throw new Error("TableNodePlugin: TableNode not registered on editor");
    }

    return mergeRegister(
      editor.registerCommand<TableData>(
        INSERT_CANVAS_TABLE_COMMAND,
        (payload) => {
          // Create the Table node with all necessary properties
          const tableNode = $createTableNode(
            payload.id,
            payload.rows,
            payload.columns,
            payload.data
          );
          $insertNodes([tableNode]);
          if ($isRootOrShadowRoot(tableNode.getParentOrThrow())) {
            $wrapNodeInElement(tableNode, $createParagraphNode).selectEnd();
          }
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor]);

  return null;
}
