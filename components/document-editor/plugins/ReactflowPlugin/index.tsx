// ReactflowPlugin/index.tsx

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
  $createReactFlowNode,
  ReactFlowNode,
  type ReactFlowData,
} from "../../nodes/ReactflowNode";

export const INSERT_REACT_FLOW_COMMAND: LexicalCommand<ReactFlowData> =
  createCommand("INSERT_REACT_FLOW_COMMAND");

export default function ReactFlowPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ReactFlowNode])) {
      throw new Error(
        "ReactFlowPlugin: ReactFlowNode not registered on editor"
      );
    }

    return mergeRegister(
      editor.registerCommand<ReactFlowData>(
        INSERT_REACT_FLOW_COMMAND,
        (payload) => {
          // Ensure dimensions are properly set in the payload
          if (payload.flowData && payload.flowData.dimensions) {
            // Make sure dimensions are numbers
            const width = Number(payload.flowData.dimensions.width);
            const height = Number(payload.flowData.dimensions.height);

            payload.flowData.dimensions = {
              width: isNaN(width) ? 500 : width,
              height: isNaN(height) ? 300 : height,
            };
          } else if (payload.flowData) {
            // Set default dimensions if not provided
            payload.flowData.dimensions = {
              width: 500,
              height: 300,
            };
          }

          // Create the ReactFlow node with all necessary properties
          const reactFlowNode = $createReactFlowNode(
            payload.id,
            payload.title,
            payload.flowData
          );
          $insertNodes([reactFlowNode]);
          if ($isRootOrShadowRoot(reactFlowNode.getParentOrThrow())) {
            $wrapNodeInElement(reactFlowNode, $createParagraphNode).selectEnd();
          }
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor]);

  return null;
}
