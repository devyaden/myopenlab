"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEdgesState, useNodesState } from "reactflow";
import "reactflow/dist/style.css";
import ReactFlowCanvas from "../ReactFlowCanvas";
import { Button } from "@/components/ui";
import { log } from "@/lib/log";
import { subscribeEmbedRefresh } from "@/lib/realtime/embed-refresh";
import { EmbedDragHandle } from "./embed/EmbedDragHandle";
import { useInViewUpgrade } from "./embed/useInViewUpgrade";
import { FlowSnapshotPreview } from "./embed/FlowSnapshotPreview";

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
  const [initialized, setInitialized] = useState(false);
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

  // Parse the inline snapshot straight from attrs (no effect, no flash) so an
  // off-screen embed paints its diagram instantly as a cheap SVG, without
  // mounting a full ReactFlow instance.
  const snapshot = useMemo(() => {
    const parse = (s: any, fb: any) => {
      try {
        return s ? JSON.parse(s) : fb;
      } catch {
        return fb;
      }
    };
    return {
      nodes: parse(node.attrs.nodes, []),
      edges: parse(node.attrs.edges, []),
      styles: parse(node.attrs.styles, {}),
    };
  }, [node.attrs.nodes, node.attrs.edges, node.attrs.styles]);

  // Only mount the heavy interactive ReactFlow once the embed nears the viewport.
  const hasBeenInView = useInViewUpgrade(wrapperRef);

  useEffect(() => {
    setIsSelected(selected);
  }, [selected]);

  const handleViewportUpdate = useCallback(
    (newViewport: any) => {
      const currentViewportString = JSON.stringify(node.attrs.viewport || {});
      const newViewportString = JSON.stringify(newViewport);

      if (currentViewportString !== newViewportString) {
        debouncedUpdateAttributes({ viewport: newViewport });
      }
    },
    [node.attrs.viewport, debouncedUpdateAttributes]
  );

  const fetchCanvasData = async () => {
    if (!canvasId || !useRealTimeData || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`/api/canvas/data/${canvasId}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch canvas data");
      }

      const data = await response.json();

      log.debug("Fetched canvas data:", {
        nodes: data.nodes?.length || 0,
        edges: data.edges?.length || 0,
        styles: Object.keys(data.styles || {}).length,
      });

      // Update node attributes with fetched data
      updateAttributes({
        nodes: JSON.stringify(data.nodes || []),
        edges: JSON.stringify(data.edges || []),
        styles: JSON.stringify(data.styles || {}),
        lastUpdated: data.updated_at,
      });

      // Update local state
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
      setStyles(data.styles || {});
    } catch (error: any) {
      if (error.name === "AbortError") {
        log.debug("Canvas data fetch was aborted (timeout)");
      } else {
        console.error("Error fetching canvas data:", error);
        setError((error as Error).message);
      }
    } finally {
      setIsLoading(false);
      setLoaded(true);
    }
  };

  // Initialize data from node attributes - this runs once
  useEffect(() => {
    if (initialized) return;

    try {
      const nodeData = node.attrs.nodes ? JSON.parse(node.attrs.nodes) : [];
      const edgeData = node.attrs.edges ? JSON.parse(node.attrs.edges) : [];

      // Better parsing of styles with fallback
      let styleData = {};
      if (node.attrs.styles) {
        try {
          styleData = JSON.parse(node.attrs.styles);
        } catch (e) {
          log.warn("Error parsing styles, using empty object:", e);
          styleData = {};
        }
      }

      log.debug("Initializing ReactFlow node with:", {
        nodes: nodeData.length,
        edges: edgeData.length,
        styles: Object.keys(styleData).length,
      });

      setNodes(nodeData);
      setEdges(edgeData);
      setStyles(styleData);
      setLoaded(true);
      setInitialized(true);
      // NOTE: the on-mount fetch was removed — fresh data is fetched lazily the
      // first time the embed scrolls into view (see the in-view effect below),
      // so opening a doc with many embeds no longer fires a burst of requests.
    } catch (error) {
      console.error("Error parsing node data:", error);
      setNodes([]);
      setEdges([]);
      setStyles({});
      setLoaded(true);
      setInitialized(true);
    }
  }, []); // Empty dependency array - runs only once

  // Update data when node attributes change (but don't trigger loading)
  useEffect(() => {
    if (!initialized) return;

    try {
      const nodeData = node.attrs.nodes ? JSON.parse(node.attrs.nodes) : [];
      const edgeData = node.attrs.edges ? JSON.parse(node.attrs.edges) : [];

      // Better parsing of styles with fallback
      let styleData = {};
      if (node.attrs.styles) {
        try {
          styleData = JSON.parse(node.attrs.styles);
        } catch (e) {
          log.warn("Error parsing updated styles:", e);
          styleData = {};
        }
      }

      // Only update if data actually changed
      if (JSON.stringify(nodeData) !== JSON.stringify(nodes)) {
        log.debug("Updating nodes data");
        setNodes(nodeData);
      }
      if (JSON.stringify(edgeData) !== JSON.stringify(edges)) {
        log.debug("Updating edges data");
        setEdges(edgeData);
      }
      if (JSON.stringify(styleData) !== JSON.stringify(styles)) {
        log.debug(
          "Updating styles data:",
          Object.keys(styleData).length,
          "styles"
        );
        setStyles(styleData);
      }
    } catch (error) {
      console.error("Error updating node data:", error);
    }
  }, [node.attrs.nodes, node.attrs.edges, node.attrs.styles, initialized]);

  // Keep a ref to the latest fetcher so the subscription/focus handlers
  // (registered once per canvasId) always call the current closure.
  const fetchRef = useRef(fetchCanvasData);
  fetchRef.current = fetchCanvasData;

  // Phase 3: keep a live embed in sync with its source canvas without polling.
  // Refetch when (a) the source is saved in this tab or by an agent apply (the
  // in-app bus), (b) the source row changes via realtime, or (c) the tab
  // regains focus (covers edits made elsewhere while this doc stayed open).
  // All three are debounced into a single refetch. Static embeds are untouched.
  useEffect(() => {
    if (!useRealTimeData || !canvasId) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fetchRef.current(), 400);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") schedule();
    };
    const unsub = subscribeEmbedRefresh(canvasId, schedule);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      if (timer) clearTimeout(timer);
      unsub();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [useRealTimeData, canvasId]);

  // Fetch fresh data the first time the embed scrolls into view (deferred off
  // the initial page load), and only when the inline snapshot is missing
  // content — embeds that already carry a full snapshot stay zero-network until
  // the realtime/in-app bus signals a change.
  useEffect(() => {
    if (!hasBeenInView || !useRealTimeData || !canvasId) return;
    if (
      snapshot.nodes.length === 0 ||
      Object.keys(snapshot.styles).length === 0
    ) {
      fetchRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasBeenInView, useRealTimeData, canvasId]);

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

        // Get the style for this specific node
        const nodeStyle = styles[node.id] || {};

        // Merge existing node style with stored styles
        const mergedStyle = {
          ...node.style,
          ...nodeStyle,
          width: nodeWidth,
          height: nodeHeight,
        };

        // Merge existing node data style with stored styles
        const mergedDataStyle = {
          ...node.data?.style,
          ...nodeStyle,
          width: nodeWidth,
          height: nodeHeight,
        };

        return {
          ...node,
          width: nodeWidth,
          height: nodeHeight,
          data: {
            ...node.data,
            width: nodeWidth,
            height: nodeHeight,
            style: mergedDataStyle,
          },
          style: mergedStyle,
        };
      }),
    [nodes, styles]
  );

  const optimizedEdges = useMemo(
    () =>
      edges.map((edge: any) => {
        // Get any stored styles for this edge
        const edgeStyle = styles[edge.id] || {};

        // Merge existing edge style with stored styles
        const mergedStyle = {
          ...(edge.style || {}),
          ...edgeStyle,
          opacity: edge.style?.opacity ?? edgeStyle.opacity ?? 1.0,
          strokeWidth: edge.style?.strokeWidth ?? edgeStyle.strokeWidth ?? 2,
        };

        return {
          ...edge,
          type: edge.type || "custom",
          sourceHandle: edge.sourceHandle || "g",
          targetHandle: edge.targetHandle || "d",
          style: mergedStyle,
          data: edge.data,
        };
      }),
    [edges, styles]
  );

  const startResize = (
    e: React.MouseEvent,
    directionX: number,
    directionY: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = wrapperRef.current?.offsetWidth || 600;
    const startHeight = wrapperRef.current?.offsetHeight || 300;

    // Upper bound = the editor page surface's inner width (so an embed can
    // grow to full page width) with a sane fallback. Previously hard-capped
    // at 570px, which is why embeds couldn't be made bigger.
    const surface = wrapperRef.current?.closest(
      ".editor-page-surface"
    ) as HTMLElement | null;
    const maxWidth = surface
      ? Math.max(300, surface.clientWidth)
      : 2000;

    const resize = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) * directionX;
      const deltaY = (moveEvent.clientY - startY) * directionY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (directionX !== 0) {
        newWidth = Math.min(maxWidth, Math.max(200, startWidth + deltaX));
      }

      if (directionY !== 0) {
        newHeight = Math.max(150, startHeight + deltaY);
      }

      updateAttributes({
        width: newWidth,
        height: newHeight,
      });

      if (wrapperRef.current) {
        wrapperRef.current.style.width = `${newWidth}px`;
        wrapperRef.current.style.height = `${newHeight}px`;
      }
    };

    const stopResize = () => {
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResize);
    };

    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
  };

  const startResizeBottomRight = (e: React.MouseEvent) => startResize(e, 1, 1);
  const startResizeBottomLeft = (e: React.MouseEvent) => startResize(e, -1, 1);
  const startResizeTopRight = (e: React.MouseEvent) => startResize(e, 1, -1);
  const startResizeTopLeft = (e: React.MouseEvent) => startResize(e, -1, -1);
  const startResizeRight = (e: React.MouseEvent) => startResize(e, 1, 0);
  const startResizeLeft = (e: React.MouseEvent) => startResize(e, -1, 0);
  const startResizeBottom = (e: React.MouseEvent) => startResize(e, 0, 1);
  const startResizeTop = (e: React.MouseEvent) => startResize(e, 0, -1);

  const handleRefresh = () => {
    if (useRealTimeData && canvasId && !isLoading) {
      fetchCanvasData();
    }
  };

  const getRelativeTimeString = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diff < 60) return "just now";
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "unknown";
    }
  };

  // No blank/spinner loading branch: the snapshot SVG (below) is painted
  // synchronously from attrs, so there's never an empty frame to cover.
  const canvasData = useMemo(
    () => ({
      nodes: optimizedNodes,
      edges: optimizedEdges,
      flowData: {
        styles: styles || {},
        // Pass additional flow data if available
        ...node.attrs.flowData,
      },
    }),
    [optimizedNodes, optimizedEdges, styles, node.attrs.flowData]
  );

  return (
    <NodeViewWrapper
      className={`react-flow-node-wrapper loaded-state group ${isSelected ? "is-selected" : ""}`}
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
      data-loading="false"
      data-loaded="true"
      data-nodes={JSON.stringify(optimizedNodes)}
      data-edges={JSON.stringify(optimizedEdges)}
    >
      <EmbedDragHandle visible={isSelected} />
      <div
        style={{
          flex: "1 1 auto",
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          display: "flex",
        }}
      >
        {hasBeenInView ? (
          <ReactFlowCanvas
            canvasData={canvasData}
            readOnly={useRealTimeData}
            printFriendly={true}
            initialViewport={initialViewport}
            onViewportChange={handleViewportUpdate}
            height={height}
          />
        ) : (
          <FlowSnapshotPreview
            nodes={snapshot.nodes}
            edges={snapshot.edges}
            styles={snapshot.styles}
          />
        )}
      </div>

      {isSelected && (
        <Button
          variant="ghost"
          className="absolute top-2 right-2 "
          onClick={handleRefresh}
          title="Refresh canvas data"
          disabled={isLoading}
        >
          {isLoading ? (
            <p className="text-black">Refreshing...</p>
          ) : (
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
          )}
        </Button>
      )}

      {useRealTimeData && lastUpdated && (
        <div className="absolute bottom-1 right-2 text-xs text-gray-400">
          Updated: {getRelativeTimeString(lastUpdated)}
        </div>
      )}

      {error && (
        <div className="absolute bottom-2 left-2 bg-red-100 text-xs text-red-600 px-2 py-1 rounded z-10">
          Error: {error}
        </div>
      )}

      {isSelected && (
        <>
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
