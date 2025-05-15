"use client";

import { useEffect, useRef } from "react";
import ReactFlow, {
  Background,
  MiniMap,
  useEdgesState,
  useNodesState,
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

  // Enhance nodes for printing when in print-friendly mode
  useEffect(() => {
    if (printFriendly && reactFlowWrapper.current) {
      // Add styles for better print visibility
      const container = reactFlowWrapper.current;
      container.classList.add("print-friendly-flow");

      // Apply custom styles for better printing
      const styleElement = document.createElement("style");
      styleElement.textContent = `
        @media print {
          .print-friendly-flow {
            height: 350px !important;
            width: 100% !important;
            overflow: visible !important;
            page-break-inside: avoid !important;
          }
          .print-friendly-flow .react-flow__node {
            background-color: white !important;
            border: 1px solid #333 !important;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.16) !important;
          }
          .print-friendly-flow .react-flow__edge-path {
            stroke: #333 !important;
            stroke-width: 2px !important;
          }
          .print-friendly-flow .react-flow__controls,
          .print-friendly-flow .react-flow__minimap,
          .print-friendly-flow .react-flow__attribution {
            display: none !important;
          }
        }
      `;
      document.head.appendChild(styleElement);

      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, [printFriendly]);

  return (
    <div
      ref={reactFlowWrapper}
      className={`canvas-container ${printFriendly ? "print-friendly-flow" : ""}`}
      style={{
        height: 300,
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
            ...(printFriendly
              ? {
                  backgroundColor: "white",
                  border: "1px solid #333",
                  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.16)",
                }
              : {}),
          },
          connectable: node?.type !== "textNode",
          // selected: selectedNodes.includes(node.id),
        }))}
        edges={edges.map((edge) => ({
          ...edge,
          type: "custom",
          data: { ...edge.data },
          style: printFriendly
            ? {
                stroke: "#333",
                strokeWidth: 2,
              }
            : undefined,
        }))}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        // onNodesChange={onNodesChange}
        // onEdgesChange={onEdgesChange}

        // onChange={(changes) => {
        //   console.log("🚀 ~ onChange ~ changes:", changes);
        // }}
        // onNodesChange={(changes) => {
        //   console.log("🚀 ~ onNodesChange ~ changes:", changes);
        // }}
        // onEdgesChange={(changes) => {
        //   console.log("🚀 ~ onEdgesChange ~ changes:", changes);
        // }}
        // fitView
        // fitViewOptions={{
        //   padding: 0.2,
        //   minZoom: 0.5,
        //   maxZoom: 1.5,
        // }}
        attributionPosition="bottom-right"
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        zoomOnScroll={false}
        panOnScroll={false}
        // minZoom={0.5}
        // maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background size={1} color="#f8f8f8" />
        {/* <Controls showInteractive={!printFriendly} /> */}
        {!printFriendly && <MiniMap />}
      </ReactFlow>
    </div>
  );
}
