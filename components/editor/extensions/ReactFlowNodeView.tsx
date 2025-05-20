"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  // Debounce updateAttributes to avoid excessive updates
  const debouncedUpdateAttributes = useRef(
    debounce((newAttrs: any) => {
      if (Object.keys(newAttrs).length > 0) {
        updateAttributes(newAttrs);
      }
    }, 1000)
  ).current;

  const canvasId = node.attrs.canvasId;
  const useRealTimeData = node.attrs.useRealTimeData;
  const width = node.attrs.width || 500;

  const height = node.attrs.height || 300;
  const lastUpdated = node.attrs.lastUpdated;
  const canvasName = node.attrs.name || "Untitled Canvas";
  const initialViewport = node.attrs.viewport || undefined;

  useEffect(() => {
    setIsSelected(selected);
  }, [selected]);

  const handleViewportUpdate = useCallback(
    (newViewport: any) => {
      const currentViewportString = JSON.stringify(node.attrs.viewport || {});
      const newViewportString = JSON.stringify(newViewport);

      if (currentViewportString !== newViewportString) {
        debouncedUpdateAttributes({ viewport: newViewport });
      } else {
        console.log("[ReactFlowNodeView] Viewport same, not updating.");
      }
    },
    [node.attrs.viewport, debouncedUpdateAttributes]
  );

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
      setLoaded(true);
    }
  };

  // Set up polling for real-time updates
  useEffect(() => {
    if (useRealTimeData && canvasId) {
      fetchCanvasData();
    }
  }, [useRealTimeData, canvasId]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSelected(true);
  };

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
        type: edge.type || "custom",
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
    const startWidth = wrapperRef.current?.offsetWidth || 570;
    const startHeight = wrapperRef.current?.offsetHeight || 300;

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
        newWidth = Math.min(570, Math.max(200, startWidth + deltaX));
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
        className={`react-flow-node-wrapper ${isSelected ? "is-selected" : ""}`}
        data-name={canvasName}
        data-canvas-id={canvasId}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          position: "relative",
          border: isSelected ? "2px solid #3b82f6" : "1px solid #ddd",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="text-sm text-gray-500">
            {isLoading ? "Updating canvas..." : "Loading canvas..."}
          </span>
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
      // className={`${isSelected ? "is-selected" : ""}`}
      ref={wrapperRef}
      onClick={handleClick}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: "relative",
        margin: "20px 20px",
        border: isSelected ? "2px solid #3b82f6" : "1px solid #ddd",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      data-name={canvasName}
      data-canvas-id={canvasId}
      data-nodes={JSON.stringify(nodes)}
      data-edges={JSON.stringify(edges)}
    >
      <div
        style={{
          flex: "1 1 auto" /* Make this div fill available space */,
          width: "100%",
          position: "relative",
          overflow: "hidden",
          display: "flex" /* Add flex display */,
        }}
      >
        <ReactFlowCanvas
          canvasData={canvasData}
          readOnly={useRealTimeData}
          printFriendly={true}
          initialViewport={initialViewport}
          onViewportChange={handleViewportUpdate}
          height={height}
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
            className="absolute -bottom-2 -right-2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-nwse-resize"
            onMouseDown={startResizeBottomRight}
          />
          <div
            className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-nesw-resize"
            onMouseDown={startResizeBottomLeft}
          />
          <div
            className="absolute -top-2 -right-2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-nesw-resize"
            onMouseDown={startResizeTopRight}
          />
          <div
            className="absolute -top-2 -left-2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-nwse-resize"
            onMouseDown={startResizeTopLeft}
          />

          {/* Edge resize handles */}
          <div
            className="absolute top-1/2 -right-2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-ew-resize transform -translate-y-1/2"
            onMouseDown={startResizeRight}
          />
          <div
            className="absolute top-1/2 -left-2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-ew-resize transform -translate-y-1/2"
            onMouseDown={startResizeLeft}
          />
          <div
            className="absolute -bottom-2 left-1/2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-ns-resize transform -translate-x-1/2"
            onMouseDown={startResizeBottom}
          />
          <div
            className="absolute -top-2 left-1/2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-ns-resize transform -translate-x-1/2"
            onMouseDown={startResizeTop}
          />
        </>
      )}
    </NodeViewWrapper>
  );
}

export default memo(ReactFlowNodeView);

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
}
