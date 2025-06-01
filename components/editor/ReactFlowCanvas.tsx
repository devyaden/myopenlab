"use client";

import { useCallback, useEffect, useRef } from "react";
import ReactFlow, {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  useEdgesState,
  useNodesState,
  type Viewport,
} from "reactflow";
import "reactflow/dist/style.css";
import CustomEdge from "../canvas-new/custom-edge";
import { GenericNode } from "../canvas-new/nodes/generic-node";
import { ImageNode } from "../canvas-new/nodes/image-node";
import { SwimlaneNode } from "../canvas-new/nodes/swimlane-node";
import { TextNode } from "../canvas-new/nodes/text-node";

interface ReactFlowCanvasProps {
  canvasData: any;
  readOnly?: boolean;
  printFriendly?: boolean;
  onInternalChange?: (nodes: any[], edges: any[]) => void;
  initialViewport?: Viewport;
  onViewportChange?: (viewport: Viewport) => void;
  height?: number;
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
  printFriendly = false,
  onInternalChange,
  initialViewport,
  onViewportChange,
  height,
}: ReactFlowCanvasProps) {
  const [nodes, setNodes, onNodesChangeInternalOriginal] = useNodesState(
    canvasData.nodes || []
  );

  const [edges, setEdges, onEdgesChangeInternalOriginal] = useEdgesState(
    canvasData.edges || []
  );

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Explicit handlers for node and edge changes
  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  // Handler for viewport changes
  const handleViewportChange = useCallback(
    (event: MouseEvent | TouchEvent | undefined, viewport: Viewport) => {
      if (onViewportChange) {
        onViewportChange(viewport);
      }
    },
    [onViewportChange]
  );

  // Initialize with canvasData
  useEffect(() => {
    if (canvasData) {
      setNodes([...(canvasData.nodes || [])]);
      setEdges([...(canvasData.edges || [])]);
    }
  }, [canvasData, setNodes, setEdges]);

  // Call onInternalChange when nodes or edges change
  useEffect(() => {
    if (onInternalChange) {
      onInternalChange(nodes, edges);
    }
  }, [nodes, edges, onInternalChange]);

  return (
    <div
      ref={reactFlowWrapper}
      className={`canvas-container `}
      style={{
        height: (height ?? 310) - 6,
        width: "100%",
        overflow: "hidden",
        borderRadius: "4px",
      }}
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
        onMove={handleViewportChange}
        defaultViewport={initialViewport}
        attributionPosition="bottom-right"
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        zoomOnScroll={false}
        panOnScroll={false}
        fitView={!initialViewport}
        proOptions={{ hideAttribution: true }}
      >
        <Background size={1} color="#fff" />
      </ReactFlow>
    </div>
  );
}
