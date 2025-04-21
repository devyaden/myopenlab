"use client";

import type React from "react";

import { NodeViewWrapper } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";

export default function ReactFlowNodeView({
  node,
  updateAttributes,
  selected,
}: {
  node: any;
  updateAttributes: (attrs: any) => void;
  selected: boolean;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loaded, setLoaded] = useState(false);
  const [isSelected, setIsSelected] = useState(selected);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Get image data and dimensions from node attributes
  const imageData = node.attrs.imageData;
  const width = node.attrs.width || 500;
  const height = node.attrs.height || 300;

  // Update isSelected when the selected prop changes
  useEffect(() => {
    setIsSelected(selected);
  }, [selected]);

  useEffect(() => {
    try {
      // Get the nodes and edges from the node attributes
      let nodeNodes = node.attrs.nodes || "[]";
      let nodeEdges = node.attrs.edges || "[]";

      // Parse if they're strings
      if (typeof nodeNodes === "string") {
        nodeNodes = JSON.parse(nodeNodes);
      }

      if (typeof nodeEdges === "string") {
        nodeEdges = JSON.parse(nodeEdges);
      }

      // Update node attributes to ensure data is properly stored
      // This ensures the node data is preserved in the editor's JSON structure
      if (typeof node.attrs.nodes === "string" && Array.isArray(nodeNodes)) {
        updateAttributes({
          nodes: JSON.stringify(nodeNodes),
        });
      }

      if (typeof node.attrs.edges === "string" && Array.isArray(nodeEdges)) {
        updateAttributes({
          edges: JSON.stringify(nodeEdges),
        });
      }

      setNodes(Array.isArray(nodeNodes) ? nodeNodes : []);
      setEdges(Array.isArray(nodeEdges) ? nodeEdges : []);
      setLoaded(true);
    } catch (error) {
      console.error("Error parsing canvas data:", error);
      setNodes([]);
      setEdges([]);
      setLoaded(true);
    }
  }, [node.attrs.nodes, node.attrs.edges]);

  // Handle click to select
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSelected(true);
  };

  // Handle click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsSelected(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Resize handlers
  const startResize = (
    e: React.MouseEvent,
    directionX: number,
    directionY: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Get initial values
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = wrapperRef.current?.offsetWidth || width;
    const startHeight = wrapperRef.current?.offsetHeight || height;

    // Create resize function
    const resize = (moveEvent: MouseEvent) => {
      // Calculate deltas
      const deltaX = (moveEvent.clientX - startX) * directionX;
      const deltaY = (moveEvent.clientY - startY) * directionY;

      // Calculate new dimensions
      let newWidth = startWidth;
      let newHeight = startHeight;

      // Apply width changes if we're resizing horizontally
      if (directionX !== 0) {
        newWidth = Math.max(200, startWidth + deltaX);
      }

      // Apply height changes if we're resizing vertically
      if (directionY !== 0) {
        newHeight = Math.max(150, startHeight + deltaY);
      }

      // Update the node attributes
      updateAttributes({
        width: newWidth,
        height: newHeight,
      });

      // Update the wrapper dimensions
      if (wrapperRef.current) {
        wrapperRef.current.style.width = `${newWidth}px`;
        wrapperRef.current.style.height = `${newHeight}px`;
      }
    };

    // Create stop function
    const stopResize = () => {
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResize);
    };

    // Add event listeners
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
  };

  // Simple resize functions for each corner/edge
  const startResizeBottomRight = (e: React.MouseEvent) => startResize(e, 1, 1);
  const startResizeBottomLeft = (e: React.MouseEvent) => startResize(e, -1, 1);
  const startResizeTopRight = (e: React.MouseEvent) => startResize(e, 1, -1);
  const startResizeTopLeft = (e: React.MouseEvent) => startResize(e, -1, -1);
  const startResizeRight = (e: React.MouseEvent) => startResize(e, 1, 0);
  const startResizeLeft = (e: React.MouseEvent) => startResize(e, -1, 0);
  const startResizeBottom = (e: React.MouseEvent) => startResize(e, 0, 1);
  const startResizeTop = (e: React.MouseEvent) => startResize(e, 0, -1);

  if (!loaded) {
    return (
      <NodeViewWrapper className="react-flow-node-wrapper">
        <div className="react-flow-loading">Loading canvas...</div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      className={`react-flow-node-wrapper ${isSelected ? "is-selected" : ""}`}
      ref={wrapperRef}
      onClick={handleClick}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: "relative",
        margin: "20px 10px",
        border: isSelected ? "2px solid #3b82f6" : "1px solid #ddd",
      }}
    >
      {/* Display cropped image if available, otherwise show the ReactFlow canvas */}
      {false ? (
        <div
          style={{
            width: "100%",
            height: "100%",

            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <img
            src={imageData || "/placeholder.svg"}
            alt={node.attrs.name || "Canvas"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      ) : (
        <div style={{ height: "100%", width: "100%" }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            attributionPosition="bottom-right"
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
          >
            <Background />
          </ReactFlow>
        </div>
      )}

      {/* Resize handles - only visible when selected */}
      {isSelected && (
        <>
          {/* Corner resize handles */}
          <div
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-nwse-resize"
            onMouseDown={startResizeBottomRight}
          />
          <div
            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-nesw-resize"
            onMouseDown={startResizeBottomLeft}
          />
          <div
            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-nesw-resize"
            onMouseDown={startResizeTopRight}
          />
          <div
            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-nwse-resize"
            onMouseDown={startResizeTopLeft}
          />

          {/* Edge resize handles */}
          <div
            className="absolute top-1/2 -right-1.5 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-ew-resize transform -translate-y-1/2"
            onMouseDown={startResizeRight}
          />
          <div
            className="absolute top-1/2 -left-1.5 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-ew-resize transform -translate-y-1/2"
            onMouseDown={startResizeLeft}
          />
          <div
            className="absolute -bottom-1.5 left-1/2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-ns-resize transform -translate-x-1/2"
            onMouseDown={startResizeBottom}
          />
          <div
            className="absolute -top-1.5 left-1/2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-ns-resize transform -translate-x-1/2"
            onMouseDown={startResizeTop}
          />
        </>
      )}
    </NodeViewWrapper>
  );
}
