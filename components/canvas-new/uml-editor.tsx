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
import { useCanvasStore } from "@/lib/store/useCanvas";
import { CANVAS_TYPE, CanvasSettings } from "@/types/store";
import CustomEdge from "./custom-edge";
import HelperLinesRenderer from "./HelperLines";
import MeasureRuler from "./measure-ruler";
import { NodePropertiesSidebar } from "./node-properties-sidebar";
import { GenericNode } from "./nodes/generic-node";
import { ImageNode } from "./nodes/image-node";
import { SwimlaneNode } from "./nodes/swimlane-node";
import { TextNode } from "./nodes/text-node";
import TableView from "./table-view";
import { VIEW_MODE, ViewMode } from "./table-view/table.types";
import { UMLToolbar } from "./uml-toolbar";

const nodeTypes = {
  genericNode: GenericNode,
  swimlaneNode: SwimlaneNode,
  textNode: TextNode,
  imageNode: ImageNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

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

  const handleConnect = useCallback(
    (params: Connection) => {
      // Assign default handles if they're not already defined
      if (!params.sourceHandle) params.sourceHandle = "g"; // right
      if (!params.targetHandle) params.targetHandle = "d"; // left

      const newEdge = {
        ...params,
        type: "floating",
        data: { type: "default", label: "", onLabelChange: onChangeEdgeLabel },
        markerEnd: { type: MarkerType.Arrow },
        // Ensure handles are explicitly set
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
      };
      const updatedEdges = addEdge(newEdge, edges);
      onEdgesChange?.(updatedEdges);

      // Update the nodes to reflect the new connection
      const updatedNodes = nodes.map((node) => {
        if (node.id === params.source) {
          return {
            ...node,
            data: {
              ...node.data,
              to: params.target,
            },
          };
        }
        if (node.id === params.target) {
          return {
            ...node,
            data: {
              ...node.data,
              from: params.source,
            },
          };
        }
        return node;
      });
      onNodesChange?.(updatedNodes);
    },
    [edges, onEdgesChange, nodes, onNodesChange, onChangeEdgeLabel]
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
  const enhanceNodesWithConnectionData = useCallback(
    (nodes: Node[], edges: Edge[]): Node[] => {
      // Create a map of node IDs to their labels for quick lookup
      const nodeLabelsMap = new Map(
        nodes.map((node) => [node.id, node.data.label || node.id])
      );

      return nodes.map((node) => {
        // Find incoming and outgoing edges
        const incomingEdges = edges.filter((edge) => edge.target === node.id);
        const outgoingEdges = edges.filter((edge) => edge.source === node.id);

        // Find parent and child nodes
        const parentNodeId = node.parentNode;
        const childNodeIds = nodes
          .filter((n) => n.parentNode === node.id)
          .map((n) => n.id);

        // Get parent node label if it exists
        const parentLabel = parentNodeId
          ? nodeLabelsMap.get(parentNodeId) || parentNodeId
          : "";

        // Get child node labels if they exist
        const childrenLabels = childNodeIds
          .map((id) => nodeLabelsMap.get(id) || id)
          .join(", ");

        // Format edge information with labels
        const fromInfo = incomingEdges
          .map((edge) => {
            const sourceLabel = nodeLabelsMap.get(edge.source) || edge.source;
            const edgeLabel = edge.data?.label ? ` (${edge.data.label})` : "";
            return `${sourceLabel}${edgeLabel}`;
          })
          .join(", ");

        const toInfo = outgoingEdges
          .map((edge) => {
            const targetLabel = nodeLabelsMap.get(edge.target) || edge.target;
            const edgeLabel = edge.data?.label ? ` (${edge.data.label})` : "";
            return `${targetLabel}${edgeLabel}`;
          })
          .join(", ");

        // Prepare enhanced data with only properties that have values
        const enhancedData = {
          ...node.data,
          incoming: incomingEdges.map((edge) => edge.source),
          outgoing: outgoingEdges.map((edge) => edge.target),
        };

        // Only add these properties if they have actual values
        if (fromInfo) enhancedData.from = fromInfo;
        if (toInfo) enhancedData.to = toInfo;
        if (parentNodeId) enhancedData.parent = parentLabel;
        if (childNodeIds.length > 0) enhancedData.children = childrenLabels;

        return {
          ...node,
          data: enhancedData,
        };
      });
    },
    []
  );

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
        // Update existing nodes or add new nodes
        const enhancedNodes = enhanceNodesWithConnectionData(nodes, edges);
        const nodeLookup = new Map(
          enhancedNodes.map((node) => [node.id, node])
        );

        const newNodes = updatedNodes.map((updatedNode) => {
          const existingNode =
            nodeLookup.get(updatedNode.id) ||
            nodes.find((node) => node.id === updatedNode.id);
          if (existingNode) {
            // Update existing node but preserve the enhanced data properties
            const newNode = {
              ...existingNode,
              data: {
                ...existingNode.data,
                ...updatedNode.data,
                shape: updatedNode.data.shape || existingNode.data.shape,
              },
              type: updatedNode?.type || existingNode?.type,
            };

            // Preserve relationship properties only if they exist in the source node
            if (existingNode.data.from)
              newNode.data.from = existingNode.data.from;
            if (existingNode.data.to) newNode.data.to = existingNode.data.to;
            if (existingNode.data.parent)
              newNode.data.parent = existingNode.data.parent;
            if (existingNode.data.children)
              newNode.data.children = existingNode.data.children;
            if (existingNode.data.incoming)
              newNode.data.incoming = existingNode.data.incoming;
            if (existingNode.data.outgoing)
              newNode.data.outgoing = existingNode.data.outgoing;

            return newNode;
          } else {
            // Add new node
            return {
              ...updatedNode,
              position: { x: Math.random() * 500, y: Math.random() * 500 },
            };
          }
        });
        onNodesChange?.(newNodes);
      }
    },
    [nodes, edges, onNodesChange, enhanceNodesWithConnectionData]
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
            fitView
            className="bg-white"
            multiSelectionKeyCode={["Meta", "Shift"]}
            selectNodesOnDrag={false}
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
