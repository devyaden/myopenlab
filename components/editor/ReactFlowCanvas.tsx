"use client";

import { useEffect, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { GenericNode } from "../canvas-new/nodes/generic-node";
import { SwimlaneNode } from "../canvas-new/nodes/swimlane-node";
import { TextNode } from "../canvas-new/nodes/text-node";
import { ImageNode } from "../canvas-new/nodes/image-node";
import CustomEdge from "../canvas-new/custom-edge";

interface ReactFlowCanvasProps {
  canvasData: any;
  readOnly?: boolean;
}

const nodeTypes = {
  genericNode: GenericNode,
  swimlaneNode: SwimlaneNode,
  textNode: TextNode,
  imageNode: ImageNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

export default function ReactFlowCanvas({
  canvasData,
  readOnly = true,
}: ReactFlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    canvasData.nodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    canvasData.edges || []
  );
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Initialize with canvasData
  useEffect(() => {
    if (canvasData) {
      setNodes(canvasData.nodes || []);
      setEdges(canvasData.edges || []);
    }
  }, [canvasData, setNodes, setEdges]);

  return (
    <div
      ref={reactFlowWrapper}
      className="canvas-container"
      style={{ height: 300, width: "100%" }}
    >
      <ReactFlow
        nodes={nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            style: {
              ...canvasData.flowData?.styles[node.id],
              width:
                node?.type === "imageNode"
                  ? node.style?.width
                  : node.style?.width ||
                    (node?.type === "textNode" ? 150 : 100),
              height:
                node?.type === "imageNode"
                  ? node.style?.height
                  : node.style?.height ||
                    (node?.type === "textNode" ? 50 : 100),
            },
          },
          style: {
            width:
              node?.type === "imageNode"
                ? node.style?.width
                : node.style?.width || (node?.type === "textNode" ? 150 : 100),
            height:
              node?.type === "imageNode"
                ? node.style?.height
                : node.style?.height || (node?.type === "textNode" ? 50 : 100),
          },
          connectable: node?.type !== "textNode",
          // selected: selectedNodes.includes(node.id),
        }))}
        edges={edges.map((edge) => ({
          ...edge,
          type: "custom",
          data: { ...edge.data },
        }))}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-right"
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
