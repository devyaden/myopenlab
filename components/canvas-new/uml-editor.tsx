"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  MarkerType,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useOnSelectionChange,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type ReactFlowInstance,
  type Node as ReactFlowNode,
} from "reactflow";
import "reactflow/dist/style.css";

import { findBestParentNode, getHelperLines } from "@/lib/canvas.utils";
import { enhanceNodesWithConnectionData } from "@/lib/canvas/connections";
import { stripConnectionKeys } from "@/lib/canvas/column-data";
import { useCanvasStore } from "@/lib/store/useCanvas";
import { CANVAS_TYPE, CanvasSettings } from "@/types/store";
import {
  edgeTypes,
  nodeTypes,
  onReactFlowError,
} from "./flow-config";
import HelperLinesRenderer from "./HelperLines";
import MeasureRuler from "./measure-ruler";
import { NodePropertiesSidebar } from "./node-properties-sidebar";
import TableView from "./table-view";
import { VIEW_MODE, ViewMode } from "./table-view/table.types";
import { UMLToolbar } from "./uml-toolbar";

interface UMLEditorProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: ((nodes: Node[]) => void) | undefined;
  onEdgesChange: ((edges: Edge[]) => void) | undefined;
  nodeStyles: Record<string, any>;
  selectedNodes: string[];
  onNodeSelect: ((nodeIds: string[]) => void) | undefined;
  onAddNode:
    | ((type: string, position: { x: number; y: number }) => void)
    | undefined;
  onAddSwimlane: ((position: { x: number; y: number }) => void) | undefined;
  onLabelChange: ((nodeId: string, newLabel: string) => void) | undefined;
  onAddLane: ((swimlaneId: string) => void) | undefined;
  onEdgeSelect: ((edgeIds: string[]) => void) | undefined;
  onChangeEdgeLabel: ((edgeId: string, label: string) => void) | undefined;
  onAddImage: ((position?: any) => void) | undefined;
  onAddColumn: ((columnData: any) => void) | undefined;
  columns: any[];
  setColumns: ((columns: any[]) => void) | undefined;
  currentFolderCanvases: { id: string; name: string; canvas_type: string }[];
  canvasId: string;
  canvasType: CANVAS_TYPE | null;
  onReactFlowInit?: (instance: ReactFlowInstance) => void;
  canvasSettings: CanvasSettings;
  updateCanvasSettings: ((settings: CanvasSettings) => void) | undefined;
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
  readOnly?: boolean;
  tableViewRef?: React.MutableRefObject<any>;
  onMiniMapToggleRef?: (toggleFn: (show: boolean) => void) => void;
}

const sortNodes = (node: ReactFlowNode, nodes: ReactFlowNode[]) => {
  nodes = [...nodes].sort((a, b) => {
    if (a.id === node.id) return 1;
    if (b.id === node.id) return -1;
    return 0;
  });
  const children = nodes?.filter((n) => n.parentNode === node.id);
  children.forEach((child) => {
    nodes = sortNodes(child, nodes);
  });

  return nodes;
};

const findAbsolutePosition = (
  currentNode: ReactFlowNode,
  allNodes: ReactFlowNode[]
): { x: number; y: number } => {
  if (!currentNode?.parentNode) {
    return { x: currentNode.position.x, y: currentNode.position.y };
  }

  const parentNode = allNodes.find((n) => n.id === currentNode.parentNode);
  if (!parentNode) {
    return { x: currentNode.position.x, y: currentNode.position.y };
  }

  const parentPosition = findAbsolutePosition(parentNode, allNodes);
  return {
    x: parentPosition.x + currentNode.position.x,
    y: parentPosition.y + currentNode.position.y,
  };
};

export function UMLEditor({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  nodeStyles,
  selectedNodes,
  onNodeSelect,
  onAddNode,
  onAddSwimlane,
  onLabelChange,
  onAddLane,
  onEdgeSelect,
  onChangeEdgeLabel,
  onAddImage,
  viewMode,
  onViewModeChange,
  onAddColumn,
  columns,
  setColumns,
  currentFolderCanvases,
  canvasId,
  canvasType,
  onReactFlowInit,
  canvasSettings,
  updateCanvasSettings,
  readOnly,
  tableViewRef,
  onMiniMapToggleRef,
}: UMLEditorProps) {
  const { getNode } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const isTextEditing = useCanvasStore((s) => s.isTextEditing);
  const [showRulers, setShowRulers] = useState(false);
  const [background, setBackground] = useState<BackgroundVariant>(
    BackgroundVariant.Dots
  );
  const [backgroundColor, setBackgroundColor] = useState<string>(
    canvasSettings?.backgroundColor || "#ffffff"
  );

  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showNodeProperties, setShowNodeProperties] = useState(false);

  const [helperLineHorizontal, setHelperLineHorizontal] = useState<
    number | undefined
  >(undefined);
  const [helperLineVertical, setHelperLineVertical] = useState<
    number | undefined
  >(undefined);
  const [horizontalCenterAlignment, setHorizontalCenterAlignment] = useState<
    number | undefined
  >(undefined);
  const [verticalCenterAlignment, setVerticalCenterAlignment] = useState<
    number | undefined
  >(undefined);

  const handleZoomIn = useCallback(() => {
    zoomIn();
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut();
  }, [zoomOut]);

  const handleFitToScreen = useCallback(() => {
    fitView();
  }, [fitView]);

  // Select and center a node (used by the side panel's connection chips).
  const handleFocusNode = useCallback(
    (nodeId: string) => {
      if (!nodes.some((n) => n.id === nodeId)) return;
      onNodeSelect?.([nodeId]);
      fitView({ nodes: [{ id: nodeId }], duration: 300, maxZoom: 1.2 });
    },
    [nodes, onNodeSelect, fitView]
  );

  const customApplyNodeChanges = useCallback(
    (changes: NodeChange[], nodes: Node[]): Node[] => {
      // reset the helper lines (clear existing lines, if any)
      setHelperLineHorizontal(undefined);
      setHelperLineVertical(undefined);
      setHorizontalCenterAlignment(undefined);
      setVerticalCenterAlignment(undefined);

      // this will be true if it's a single node being dragged
      // inside we calculate the helper lines and snap position for the position where the node is being moved to
      if (
        changes.length === 1 &&
        changes[0].type === "position" &&
        changes[0].dragging &&
        changes[0].position
      ) {
        const helperLines = getHelperLines(changes[0], nodes as any);

        // if we have a helper line, we snap the node to the helper line position
        // this is being done by manipulating the node position inside the change object
        changes[0].position.x =
          helperLines.snapPosition.x ?? changes[0].position.x;
        changes[0].position.y =
          helperLines.snapPosition.y ?? changes[0].position.y;

        // if helper lines are returned, we set them so that they can be displayed
        setHelperLineHorizontal(helperLines.horizontal);
        setHelperLineVertical(helperLines.vertical);

        // set the center alignment lines if they exist
        setHorizontalCenterAlignment(helperLines.horizontalCenter);
        setVerticalCenterAlignment(helperLines.verticalCenter);
      }

      return applyNodeChanges(changes, nodes);
    },
    []
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const isDraggingNow = changes.some(
        (change) => change.type === "position" && change.dragging === true
      );

      const isDragEnd = changes.some(
        (change) => change.type === "position" && change.dragging === false
      );

      // Update dragging state in store
      const { setDragging } = useCanvasStore.getState();
      if (isDraggingNow) {
        setDragging(true);
      } else if (isDragEnd) {
        setDragging(false);
      }

      const updatedNodes = customApplyNodeChanges(changes, nodes).map(
        (node) => {
          if (node.parentNode) {
            const parent = getNode(node.parentNode);
            if (parent && node.position) {
              const minX = 10; // Minimum X position to avoid overlapping with the vertical swimlane header
              const maxX = (parent.width || 0) - (node.width || 0);
              const maxY = (parent.height || 0) - (node.height || 0);

              return {
                ...node,
                position: {
                  x: Math.max(minX, Math.min(node.position.x, maxX)),
                  y: Math.max(0, Math.min(node.position.y, maxY)),
                },
              };
            }
          }
          return node;
        }
      );

      onNodesChange?.(updatedNodes);

      const selectChange = changes.find((change) => change?.type === "select");

      if (selectChange) {
        const selectedNodeIds = updatedNodes
          .filter((node) => node.selected)
          .map((node) => node.id);
        onNodeSelect?.(selectedNodeIds);
      }
    },
    [getNode, onNodesChange, onNodeSelect, nodes]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(changes, edges);
      onEdgesChange?.(updatedEdges);

      const selectChange = changes.find((change) => change?.type === "select");
      if (selectChange) {
        const selectedEdgeIds = updatedEdges
          .filter((edge) => edge.selected)
          .map((edge) => edge.id);
        onEdgeSelect?.(selectedEdgeIds);
      }
    },
    [edges, onEdgesChange, onEdgeSelect]
  );

  // Canonical edge factory — used for both hand-drawn connections and ones
  // created from the node side panel, so they are identical. memoizedEdges
  // remaps type->"custom" and injects onLabelChange at render time.
  const buildConnectionEdge = useCallback(
    (source: string, target: string, sourceHandle = "g", targetHandle = "d") => ({
      source,
      target,
      sourceHandle,
      targetHandle,
      type: "floating",
      data: { type: "default", label: "" },
      markerEnd: { type: MarkerType.Arrow },
    }),
    []
  );

  const handleConnect = useCallback(
    (params: Connection) => {
      const newEdge = buildConnectionEdge(
        params.source as string,
        params.target as string,
        params.sourceHandle || "g",
        params.targetHandle || "d"
      );
      onEdgesChange?.(addEdge(newEdge, edges));
    },
    [edges, onEdgesChange, buildConnectionEdge]
  );

  // Create an edge source->target from the side panel. Guards self-connection
  // and an existing identical edge so the panel can't make duplicates.
  const handleConnectNodes = useCallback(
    (source: string, target: string) => {
      if (!source || !target || source === target) return;
      const exists = edges.some(
        (e) => e.source === source && e.target === target
      );
      if (exists) return;
      onEdgesChange?.(addEdge(buildConnectionEdge(source, target), edges));
    },
    [edges, onEdgesChange, buildConnectionEdge]
  );

  // Remove a specific edge by id (from the side panel chip's × button).
  const handleRemoveEdge = useCallback(
    (edgeId: string) => {
      onEdgesChange?.(edges.filter((e) => e.id !== edgeId));
    },
    [edges, onEdgesChange]
  );

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, draggedNode: Node, draggedNodes: Node[]) => {
      const children = nodes?.filter((n) => n.parentNode === draggedNode.id);
      let sortedNodes: Node[];

      if (children.length === 0) {
        sortedNodes = [...nodes].sort((a, b) => {
          if (a.id === draggedNode.id) return 1;
          if (b.id === draggedNode.id) return -1;
          return 0;
        });
      } else {
        sortedNodes = sortNodes(draggedNode, nodes);
      }

      const updatedNodes = sortedNodes.map((node) => {
        if (draggedNodes.some((dn) => dn.id === node.id)) {
          const absolutePosition = findAbsolutePosition(node, sortedNodes);

          // Use improved intersection detection
          const bestParentNode = findBestParentNode(
            node,
            sortedNodes,
            absolutePosition
          );

          if (!bestParentNode) {
            return {
              ...node,
              parentNode: undefined,
              position: absolutePosition,
            };
          } else {
            const targetAbsolutePosition = findAbsolutePosition(
              bestParentNode,
              sortedNodes
            );
            return {
              ...node,
              parentNode: bestParentNode.id,
              position: {
                x: absolutePosition.x - targetAbsolutePosition.x,
                y: absolutePosition.y - targetAbsolutePosition.y,
              },
            };
          }
        }
        return node;
      });

      onNodesChange?.(updatedNodes);
    },
    [nodes, onNodesChange]
  );

  // Enhance nodes with connection data
  const handleTableNodesChange = useCallback(
    (updatedNodes: Node[]) => {
      // Check if any nodes were deleted
      const deletedNodeIds = nodes
        .filter((node) => !updatedNodes.some((n) => n.id === node.id))
        .map((node) => node.id);

      if (deletedNodeIds.length > 0) {
        // Remove deleted nodes
        const newNodes = nodes.filter(
          (node) => !deletedNodeIds.includes(node.id)
        );
        onNodesChange?.(newNodes);
      } else {
        // Update existing nodes or add new nodes. Connection keys (from/to/
        // parent/children/incoming/outgoing) are derived and must never be
        // persisted, so we always strip them from the node data we save.
        const nodeLookup = new Map(nodes.map((node) => [node.id, node]));

        const newNodes = updatedNodes.map((updatedNode) => {
          const existingNode = nodeLookup.get(updatedNode.id);
          if (existingNode) {
            return {
              ...existingNode,
              data: stripConnectionKeys({
                ...existingNode.data,
                ...updatedNode.data,
                shape: updatedNode.data.shape || existingNode.data.shape,
              }),
              type: updatedNode?.type || existingNode?.type,
            };
          }
          // Add new node
          return {
            ...updatedNode,
            data: stripConnectionKeys(updatedNode.data),
            position: { x: Math.random() * 500, y: Math.random() * 500 },
          };
        });
        onNodesChange?.(newNodes);
      }
    },
    [nodes, onNodesChange]
  );

  const handleTableEdgesChange = useCallback(
    (updatedEdges: Edge[]) => {
      onEdgesChange?.(updatedEdges);
    },
    [onEdgesChange]
  );

  const handleSwimlaneUpdate = useCallback(
    (nodeId: string, newLabel: string) => {
      onLabelChange?.(nodeId, newLabel);
    },
    [onLabelChange]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      if (type === "image") {
        onAddImage?.(position);
      } else if (type === "swimlane") {
        onAddSwimlane?.(position);
      } else {
        onAddNode?.(type, position);
      }
    },
    [reactFlowInstance, onAddNode, onAddSwimlane, onAddImage]
  );

  const onEdgeUpdate = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      const updatedEdges = edges.map((e) =>
        e.id === oldEdge.id ? { ...e, ...newConnection } : e
      );
      onEdgesChange?.(updatedEdges as Edge[]);
    },
    [edges, onEdgesChange]
  );

  const handleDeleteNodes = useCallback(
    (nodesToDelete: string[]) => {
      const nodesToDeleteSet = new Set(nodesToDelete);
      const deleteNodeAndChildren = (nodeId: string) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
          nodesToDeleteSet.add(nodeId);
          nodes.forEach((n) => {
            if (n.parentNode === nodeId) {
              deleteNodeAndChildren(n.id);
            }
          });
        }
      };

      nodesToDelete.forEach((nodeId) => deleteNodeAndChildren(nodeId));

      const updatedNodes = nodes.filter(
        (node) => !nodesToDeleteSet.has(node.id)
      );
      const updatedEdges = edges.filter(
        (edge) =>
          !nodesToDeleteSet.has(edge.source) &&
          !nodesToDeleteSet.has(edge.target)
      );

      onNodesChange?.(updatedNodes);
      onEdgesChange?.(updatedEdges);
    },
    [nodes, edges, onNodesChange, onEdgesChange]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Delete" && selectedNodes.length > 0) {
        handleDeleteNodes(selectedNodes);
      }
    },
    [selectedNodes, handleDeleteNodes]
  );

  useEffect(() => {
    document.addEventListener(
      "keydown",
      handleKeyDown as unknown as EventListener
    );
    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown as unknown as EventListener
      );
    };
  }, [handleKeyDown]);

  const onPaneClick = useCallback(() => {
    setShowNodeProperties(false);
  }, []);

  const closeNodeProperties = useCallback(() => {
    setShowNodeProperties(false);
  }, []);

  useOnSelectionChange({
    onChange: (selected) => {
      const { nodes } = selected;
      if (nodes.length === 1) {
        setShowNodeProperties(true);
      } else {
        setShowNodeProperties(false);
      }
    },
  });

  const handleBackgroundColorChange = useCallback(
    (color: string) => {
      setBackgroundColor(color);
      updateCanvasSettings?.({
        ...canvasSettings,
        backgroundColor: color,
      });
    },
    [canvasSettings, updateCanvasSettings]
  );

  useEffect(() => {
    console.log("backgroundColor", backgroundColor);
  }, [backgroundColor]);

  const memoizedNodes = useMemo(
    () =>
      nodes.map((node) => {
        // Ensure dimensions are properly set for the node
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
            // Ensure width and height are passed to node data
            width: nodeWidth,
            height: nodeHeight,
            style: {
              ...nodeStyles[node.id],
              width: nodeWidth,
              height: nodeHeight,
            },
            onLabelChange:
              node?.type === "swimlaneNode"
                ? handleSwimlaneUpdate
                : onLabelChange,
            onAddLane: node?.type === "swimlaneNode" ? onAddLane : undefined,
          },
          // Also set dimensions at the node level for proper rendering
          style: {
            ...node.style,
            width: nodeWidth,
            height: nodeHeight,
          },
          connectable: node.type !== "textNode",
          selected: selectedNodes.includes(node.id),
        };
      }),
    [
      nodes,
      nodeStyles,
      selectedNodes,
      handleSwimlaneUpdate,
      onLabelChange,
      onAddLane,
    ]
  );

  const memoizedEdges = useMemo(
    () =>
      edges.map((edge) => {
        // Ensure edges have defined handles
        const sourceHandle = edge.sourceHandle || "g"; // default to right
        const targetHandle = edge.targetHandle || "d"; // default to left

        // Enhanced edge style for visibility
        const enhancedStyle = {
          ...(edge.style || {}),
          opacity: edge.style?.opacity !== undefined ? edge.style.opacity : 1.0,
          strokeWidth:
            edge.style?.strokeWidth !== undefined ? edge.style.strokeWidth : 2,
        };

        return {
          ...edge,
          type: "custom",
          sourceHandle,
          targetHandle,
          style: enhancedStyle,
          data: { ...edge.data, onLabelChange: onChangeEdgeLabel },
        };
      }),
    [edges, onChangeEdgeLabel]
  );

  // Add a new method to control minimap visibility
  const toggleMiniMap = useCallback((show: boolean) => {
    setShowMiniMap(show);
  }, []);

  // Register the toggleMiniMap function so it can be accessed by the parent component
  useEffect(() => {
    if (onMiniMapToggleRef) {
      onMiniMapToggleRef(() => toggleMiniMap);
    }
  }, [onMiniMapToggleRef, toggleMiniMap]);

  useEffect(() => {
    // Special handling for EVENT_VISITOR_EXPERIENCE diagrams to ensure connections are visible
    if (canvasType === CANVAS_TYPE.HYBRID && edges.length > 0) {
      // Check if any edges are missing handles and fix them
      const fixedEdges = edges.map((edge) => {
        if (!edge.sourceHandle || !edge.targetHandle) {
          return {
            ...edge,
            sourceHandle: edge.sourceHandle || "g", // default right
            targetHandle: edge.targetHandle || "d", // default left
          };
        }
        return edge;
      });

      // Only update if there were any changes
      if (JSON.stringify(fixedEdges) !== JSON.stringify(edges)) {
        onEdgesChange?.(fixedEdges);
      }
    }
  }, [canvasType, edges, onEdgesChange]);

  return (
    <div className="w-full h-[calc(100vh-132px)]" ref={reactFlowWrapper}>
      {viewMode === VIEW_MODE.canvas && canvasType === CANVAS_TYPE.HYBRID ? (
        <>
          {showNodeProperties && selectedNodes.length && (
            <NodePropertiesSidebar
              selectedNode={
                nodes.find((node) => node.id === selectedNodes[0]) as Node
              }
              onClose={closeNodeProperties}
              columns={columns}
              setColumns={setColumns || (() => {})}
              nodes={nodes}
              edges={edges}
              onFocusNode={handleFocusNode}
              onConnectNodes={handleConnectNodes}
              onRemoveEdge={handleRemoveEdge}
            />
          )}

          {viewMode === VIEW_MODE.canvas && (
            <UMLToolbar
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onFitToScreen={handleFitToScreen}
              onToggleRuler={() => {
                setShowRulers(!showRulers);
              }}
              onChangeBackground={(background: BackgroundVariant) =>
                setBackground(background)
              }
              onChangeBackgroundColor={handleBackgroundColorChange}
              showMiniMap={showMiniMap}
              onToggleMiniMap={toggleMiniMap}
              readOnly={readOnly}
            />
          )}

          <ReactFlow
            onInit={(instance) => {
              setReactFlowInstance(instance);
              onReactFlowInit?.(instance); // Pass instance to parent
            }}
            onPaneClick={onPaneClick}
            nodes={memoizedNodes}
            edges={memoizedEdges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onNodeDragStop={onNodeDragStop}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onError={onReactFlowError}
            fitView
            className="bg-card"
            multiSelectionKeyCode={["Meta", "Shift"]}
            selectNodesOnDrag={false}
            // Miro/Figma gesture model: drag the empty pane = marquee select;
            // hold Space (or use middle/right mouse) = pan the canvas.
            selectionOnDrag={!isTextEditing}
            panOnDrag={isTextEditing ? true : [1, 2]}
            panActivationKeyCode="Space"
            nodesDraggable={!isTextEditing}
            elementsSelectable={!readOnly}
            edgeUpdaterRadius={10}
            onEdgeUpdate={onEdgeUpdate}
            minZoom={0.1}
            maxZoom={4}
            proOptions={{
              hideAttribution: true,
            }}
            // style={{ backgroundColor: "red" }}
          >
            <Background
              id="1"
              variant={background}
              style={{ backgroundColor }}
            />
            {/* <Controls showZoom={false} /> */}
            {showRulers && <MeasureRuler />}

            {showMiniMap && <MiniMap />}
            <HelperLinesRenderer
              horizontal={helperLineHorizontal}
              vertical={helperLineVertical}
              horizontalCenter={horizontalCenterAlignment}
              verticalCenter={verticalCenterAlignment}
            />
          </ReactFlow>
        </>
      ) : (
        <TableView
          nodes={enhanceNodesWithConnectionData(nodes, edges)}
          edges={edges}
          onNodesChange={handleTableNodesChange}
          onEdgesChange={handleTableEdgesChange}
          onAddColumn={onAddColumn || (() => {})}
          columns={[
            ...columns,
            // Only add parent column if there are parent-child relationships
            ...(nodes.some((node) => node.parentNode) &&
            !columns.some((col) => col.title === "parent")
              ? [{ title: "parent", type: "Text" }]
              : []),

            // Only add children column if there are nodes with children
            ...(nodes.some((node) =>
              nodes.some((n) => n.parentNode === node.id)
            ) && !columns.some((col) => col.title === "children")
              ? [{ title: "children", type: "Text" }]
              : []),

            // Only add from column if there are incoming connections
            ...(edges.length > 0 && !columns.some((col) => col.title === "from")
              ? [{ title: "from", type: "Text" }]
              : []),

            // Only add to column if there are outgoing connections
            ...(edges.length > 0 && !columns.some((col) => col.title === "to")
              ? [{ title: "to", type: "Text" }]
              : []),
          ]}
          setColumns={setColumns || (() => {})}
          currentFolderCanvases={currentFolderCanvases}
          canvasId={canvasId}
          canvasType={canvasType}
          canvasSettings={canvasSettings}
          updateCanvasSettings={updateCanvasSettings || (() => {})}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          readOnly={readOnly}
          ref={tableViewRef}
        />
      )}
    </div>
  );
}
