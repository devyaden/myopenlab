"use client";

import type React from "react";

import { NodeViewWrapper } from "@tiptap/react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useEdgesState, useNodesState } from "reactflow";
import "reactflow/dist/style.css";
import ReactFlowCanvas from "../ReactFlowCanvas";

function ReactFlowNodeView({
  node,
  updateAttributes,
  selected,
}: {
  node: any;
  updateAttributes: (attrs: any) => void;
  selected: boolean;
}) {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [styles, setStyles] = useState<Record<string, any>>({});
  const [loaded, setLoaded] = useState(false);
  const [isSelected, setIsSelected] = useState(selected);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Get attributes from node
  const canvasId = node.attrs.canvasId;
  const useRealTimeData = node.attrs.useRealTimeData;
  const width = node.attrs.width || 500;
  const height = node.attrs.height || 300;
  const lastUpdated = node.attrs.lastUpdated;
  const canvasName = node.attrs.name || "Untitled Canvas";

  // Update isSelected when the selected prop changes
  useEffect(() => {
    setIsSelected(selected);
  }, [selected]);

  // Function to fetch canvas data from the API
  const fetchCanvasData = async () => {
    if (!canvasId || !useRealTimeData) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/canvas/data/${canvasId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch canvas data");
      }

      const data = await response.json();

      // Update the node attributes with the latest data
      updateAttributes({
        nodes: JSON.stringify(data.nodes),
        edges: JSON.stringify(data.edges),
        styles: JSON.stringify(data.styles),
        lastUpdated: data.updated_at,
      });

      // Update the local state
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
      setStyles(data.styles || {});
    } catch (error) {
      console.error("Error fetching canvas data:", error);
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up polling for real-time updates
  useEffect(() => {
    if (useRealTimeData && canvasId) {
      fetchCanvasData();
    }
  }, [useRealTimeData, canvasId]);

  // Load initial data from node attributes
  useEffect(
    () => {
      try {
        // If we're using real-time data, we'll fetch from the API
        // Otherwise, use the data stored in the node attributes
        if (!useRealTimeData) {
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
          if (
            typeof node.attrs.nodes === "string" &&
            Array.isArray(nodeNodes)
          ) {
            updateAttributes({
              nodes: JSON.stringify(nodeNodes),
            });
          }

          if (
            typeof node.attrs.edges === "string" &&
            Array.isArray(nodeEdges)
          ) {
            updateAttributes({
              edges: JSON.stringify(nodeEdges),
            });
          }

          // Force a proper reset of nodes and edges
          setNodes([]);
          setEdges([]);

          // Use setTimeout to ensure the reset is processed before setting new values
          setTimeout(() => {
            setNodes(Array.isArray(nodeNodes) ? nodeNodes : []);
            setEdges(Array.isArray(nodeEdges) ? nodeEdges : []);
            setLoaded(true);
          }, 10);
        } else {
          // For real-time data, we'll set loaded to true after the API fetch completes
          setLoaded(true);
        }
      } catch (error) {
        console.error("Error parsing canvas data:", error);
        setNodes([]);
        setEdges([]);
        setLoaded(true);
      }
    },
    [
      // node.attrs.nodes,
      // node.attrs.edges,
      // node.attrs.width,
      // node.attrs.height,
      // useRealTimeData,
    ]
  );

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

  const optimizedNodes = useMemo(
    () =>
      nodes?.map((node: any) => {
        const nodeWidth =
          node.width ||
          node.data.width ||
          (node.type === "textNode" ? 150 : 100);
        const nodeHeight =
          node.height ||
          node.data.height ||
          (node.type === "textNode" ? 50 : 100);

        return {
          ...node,
          width: nodeWidth,
          height: nodeHeight,
          data: {
            ...node.data,
            width: nodeWidth,
            height: nodeHeight,
            style: {
              ...styles[node.id],
              width: nodeWidth,
              height: nodeHeight,
            },
          },
          style: {
            ...node.style,
            width: nodeWidth,
            height: nodeHeight,
          },
        };
      }),
    [nodes, styles]
  );

  const optimizedEdges = useMemo(
    () =>
      edges.map((edge: any) => ({
        ...edge,
        type: "custom",
        sourceHandle: edge.sourceHandle || "g",
        targetHandle: edge.targetHandle || "d",
        style: {
          ...(edge.style || {}),
          opacity: edge.style?.opacity ?? 1.0,
          strokeWidth: edge.style?.strokeWidth ?? 2,
        },
        data: edge.data,
      })),
    [edges]
  );

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

  // Handle manual refresh of real-time data
  const handleRefresh = () => {
    if (useRealTimeData && canvasId) {
      fetchCanvasData();
    }
  };

  // Format relative time for better display
  const getRelativeTimeString = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

      // Format relative time
      if (diff < 60) return "just now";
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

      // Format date for older updates
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "unknown";
    }
  };

  if (!loaded || isLoading) {
    return (
      <NodeViewWrapper
        className="react-flow-node-wrapper"
        data-name={canvasName}
        data-canvas-id={canvasId}
      >
        <div className="react-flow-loading flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-500">
              {isLoading ? "Updating canvas..." : "Loading canvas..."}
            </span>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // Create a simplified canvas data object for ReactFlowCanvas
  const canvasData = {
    nodes: optimizedNodes,
    edges: optimizedEdges,
    flowData: { styles: styles || {} },
  };

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
        overflow: "hidden",
        borderRadius: "6px",
      }}
      data-name={canvasName}
      data-canvas-id={canvasId}
      data-nodes={JSON.stringify(nodes)}
      data-edges={JSON.stringify(edges)}
    >
      <div
        style={{
          height: "100%",
          width: "100%",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <ReactFlowCanvas
          canvasData={canvasData}
          readOnly={true}
          printFriendly={true}
        />
      </div>

      {/* Refresh button for real-time data */}
      {useRealTimeData && (
        <button
          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 z-10"
          onClick={handleRefresh}
          title="Refresh canvas data"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
        </button>
      )}

      {/* Last updated info for real-time data */}
      {useRealTimeData && lastUpdated && (
        <div className="absolute bottom-1 right-2 text-xs text-gray-400">
          Updated: {getRelativeTimeString(lastUpdated)}
        </div>
      )}

      {/* Error message if any */}
      {error && (
        <div className="absolute bottom-2 left-2 bg-red-100 text-xs text-red-600 px-2 py-1 rounded z-10">
          Error: {error}
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

export default memo(ReactFlowNodeView);
