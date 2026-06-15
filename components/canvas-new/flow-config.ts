import type { EdgeTypes, NodeTypes } from "reactflow";
import CustomEdge from "./custom-edge";
import { GenericNode } from "./nodes/generic-node";
import { ImageNode } from "./nodes/image-node";
import { SwimlaneNode } from "./nodes/swimlane-node";
import { TextNode } from "./nodes/text-node";

export const nodeTypes: NodeTypes = {
  genericNode: GenericNode,
  swimlaneNode: SwimlaneNode,
  textNode: TextNode,
  imageNode: ImageNode,
};

export const edgeTypes: EdgeTypes = { custom: CustomEdge };

/**
 * Passed to every <ReactFlow onError>. Swallows code '002' (a benign
 * Fast Refresh / HMR artifact: editing a module gives `nodeTypes` a new
 * reference with identical keys while the canvas stays mounted) and
 * forwards every other code to React Flow's default dev logging.
 */
export function onReactFlowError(code: string, message: string) {
  if (code === "002") return;
  if (process.env.NODE_ENV === "development") console.warn(message);
}
