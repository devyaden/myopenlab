"use client";

import "./react-flow-fixes.css";

import { Input } from "@/components/ui/input";
import { useCanvasStore } from "@/lib/store/useCanvas";
import { CANVAS_TYPE } from "@/types/store";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import type { Edge, Node, ReactFlowInstance } from "reactflow";
import { MarkerType, ReactFlowProvider } from "reactflow";
import { LoadingSpinner } from "../loading-spinner";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Toolbar } from "./toolbar";
import { UMLEditor } from "./uml-editor";
import { VerticalNav } from "./vertical-nav";
import DocumentEditor from "@/components/editor";
import { add } from "date-fns";
import { VIEW_MODE } from "./table-view/table.types";

interface NodeStyle {
  fontFamily: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  textAlign: "left" | "center" | "right" | "justify";
  verticalAlign: "top" | "middle" | "bottom";
  shape:
    | "rectangle"
    | "rounded"
    | "circle"
    | "diamond"
    | "hexagon"
    | "triangle"
    | "actor"
    | "interface"
    | "standing-woman"
    | "sitting"
    | "arms-stretched"
    | "walking-man"
    | "square"
    | "cylinder"
    | "document"
    | "left-arrow"
    | "right-arrow"
    | "top-arrow"
    | "bottom-arrow"
    | "message-bubble"
    | "capsule"
    | "swimlane";
  locked: boolean;
  isVertical?: boolean;
  borderStyle: string;
  borderWidth: number;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  lineHeight: number;
}

interface AppState {
  nodes: Node[];
  edges: Edge[];
  nodeStyles: Record<string, NodeStyle>;
}

interface ColumnData {
  title: string;
  type: string;
  options?: string[];
}

interface FigmaInterfaceProps {
  canvasId: string;
}

export default function CanvasNew({ canvasId }: FigmaInterfaceProps) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  const {
    loadCanvas,
    name: projectName,
    setName: setProjectName,
    nodes,
    setNodes,
    edges,
    setEdges,
    nodeStyles,
    updateNodeStyle,
    undo,
    redo,
    canUndo,
    canRedo,
    saveLoading,
    saveCanvas,
    columns,
    setColumns,
    folderCanvases,
    isLoading,
    canvas_type,
    updateCanvasSettings,
    canvasSettings,
  } = useCanvasStore();

  const currentState: {
    nodes: Node[];
    edges: Edge[];
    nodeStyles: Record<string, NodeStyle>;
  } = {
    nodes,
    edges,
    nodeStyles,
  };

  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"canvas" | "table" | "document">(
    "canvas"
  );
  const clipboardRef = useRef<Node[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(false);
  // const [projectName, setProjectName] = useState<string>("Untitled Project");
  const [folders, setFolders] = useState<
    {
      id: string;
      name: string;
      canvases: { id: string; name: string }[];
    }[]
  >([]);

  const [edgeWidth, setEdgeWidth] = useState(2);
  const [edgeColor, setEdgeColor] = useState("#000000");

  const addToRecentDocuments = useCallback(
    (canvasId: string, canvasName: string) => {
      const recentDocuments = JSON.parse(
        localStorage.getItem("recentDocuments") || "[]"
      );
      const updatedDocuments = [
        {
          id: canvasId,
          title: canvasName,
          date: new Date().toLocaleDateString(),
          type: canvas_type,
        },
        ...recentDocuments.filter((doc: any) => doc.id !== canvasId),
      ].slice(0, 10); // Keep only the 10 most recent documents
      localStorage.setItem("recentDocuments", JSON.stringify(updatedDocuments));
    },
    []
  );

  useEffect(() => {
    if (canvasId) {
      addToRecentDocuments(canvasId, projectName);
    }
  }, [nodes]);

  // Function to detect and fix circular parent-child relationships
  const fixCircularParentChildRelationships = useCallback(
    (nodesToFix: Node[]): Node[] => {
      if (
        !nodesToFix ||
        !Array.isArray(nodesToFix) ||
        nodesToFix.length === 0
      ) {
        return nodesToFix;
      }

      // Create a map for quick lookup of nodes by id
      const nodeMap = new Map<string, Node>();
      nodesToFix.forEach((node) => nodeMap.set(node.id, node));

      // First pass - remove any self-referential parentNode values (node is its own parent)
      const firstPassNodes = nodesToFix.map((node) => {
        if (node.parentNode === node.id) {
          console.warn(
            `Node ${node.id} is its own parent - removing self reference`
          );
          return {
            ...node,
            parentNode: undefined,
            positionAbsolute: node.positionAbsolute || node.position,
          };
        }
        return node;
      });

      // Second pass - build parent-child hierarchy graph
      // and detect any circular references
      const parentMap = new Map<string, string>();
      const visited = new Set<string>();
      const processing = new Set<string>();
      const circularNodes = new Set<string>();

      // Depth-first search to detect cycles
      const detectCycle = (nodeId: string): boolean => {
        if (!nodeId) return false;
        if (circularNodes.has(nodeId)) return true;
        if (visited.has(nodeId)) return false;
        if (processing.has(nodeId)) {
          circularNodes.add(nodeId);
          return true;
        }

        processing.add(nodeId);

        const node = nodeMap.get(nodeId);
        if (node && node.parentNode) {
          const parentId = node.parentNode;
          parentMap.set(nodeId, parentId);
          if (detectCycle(parentId)) {
            circularNodes.add(nodeId);
            return true;
          }
        }

        processing.delete(nodeId);
        visited.add(nodeId);
        return false;
      };

      // Check all nodes for cycles
      firstPassNodes.forEach((node) => {
        if (!visited.has(node.id)) {
          detectCycle(node.id);
        }
      });

      // Third pass - break any cycles we found
      const fixedNodes = firstPassNodes.map((node) => {
        if (circularNodes.has(node.id)) {
          console.warn(`Breaking circular reference for node ${node.id}`);
          return {
            ...node,
            parentNode: undefined,
            positionAbsolute: node.positionAbsolute || node.position,
          };
        }
        return node;
      });

      if (circularNodes.size > 0) {
        console.warn(
          `Fixed ${circularNodes.size} circular parent-child relationships`
        );
      }

      return fixedNodes;
    },
    []
  );

  // Add a clean version of updateState that properly handles node updates
  const updateState = useCallback(
    (newState: Partial<AppState>) => {
      // Always fix circular references on every update to be safe
      try {
        if (newState.nodes) {
          // Always check for circular references on every node update
          const fixedNodes = fixCircularParentChildRelationships(
            newState.nodes
          );
          setNodes(fixedNodes);
        }

        if (newState.edges) {
          setEdges(newState.edges);
        }

        if (newState.nodeStyles) {
          Object.entries(newState.nodeStyles).forEach(([nodeId, style]) => {
            updateNodeStyle(nodeId, style);
          });
        }
      } catch (error) {
        console.error("Error in updateState:", error);
      }
    },
    [fixCircularParentChildRelationships, setNodes, setEdges, updateNodeStyle]
  );

  // Wrapper component to provide sanitized nodes to ReactFlow
  const SafeUMLEditor = useCallback(
    (props: any) => {
      // Always sanitize nodes before passing to ReactFlow
      const safeNodes = fixCircularParentChildRelationships(props.nodes);

      // Check if we had to fix anything
      if (JSON.stringify(safeNodes) !== JSON.stringify(props.nodes)) {
        console.warn("Fixed circular references in nodes before rendering");
        // Update the app state with fixed nodes to prevent future issues
        setTimeout(() => setNodes(safeNodes), 0);
      }

      return <UMLEditor {...props} nodes={safeNodes} />;
    },
    [fixCircularParentChildRelationships, setNodes]
  );

  // Effect to load the canvas
  useEffect(() => {
    if (canvasId) {
      useCanvasStore.persist.setOptions({
        name: `canvas_${canvasId}`,
      });

      useCanvasStore.persist.rehydrate();
      localStorage.removeItem("canvas-store");

      loadCanvas(canvasId);
    }
  }, [canvasId, loadCanvas]);

  // Effect to check for circular references on EVERY render
  useEffect(() => {
    if (nodes.length > 0) {
      const fixedNodes = fixCircularParentChildRelationships(nodes);

      // Check if any nodes were modified
      let anyNodeFixed = false;
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].parentNode !== fixedNodes[i].parentNode) {
          anyNodeFixed = true;
          break;
        }
      }

      if (anyNodeFixed) {
        console.log("Fixed circular relationships in nodes");
        setNodes(fixedNodes);
      }
    }
  }, [nodes, fixCircularParentChildRelationships, setNodes]);

  const getNodeStyle = useCallback(
    (nodeId: string): NodeStyle => {
      return (
        currentState.nodeStyles[nodeId] || {
          fontFamily: "Arial",
          fontSize: 12,
          isBold: false,
          isItalic: false,
          isUnderline: false,
          textAlign: "left" as const,
          verticalAlign: "top" as const,
          shape: "rectangle" as const,
          locked: false,
          isVertical: true,
          borderStyle: "solid",
          borderWidth: 2,
          backgroundColor: "#ffffff",
          borderColor: "#000000",
          textColor: "#000000",
          lineHeight: 1.2,
        }
      );
    },
    [currentState.nodeStyles]
  );

  const onNodeSelect = useCallback((nodeIds: string[]) => {
    setSelectedNodes(nodeIds);
    setSelectedNode(nodeIds.length === 1 ? nodeIds[0] : null);
  }, []);

  const onNodesChange = useCallback(
    (newNodes: Node[]) => {
      console.log("🚀 ~ 3333333:", newNodes);

      updateState({ nodes: newNodes });
    },
    [updateState]
  );

  const onEdgesChange = useCallback(
    (newEdges: Edge[]) => {
      updateState({ edges: newEdges });
    },
    [updateState]
  );

  const copySelectedNodes = useCallback(() => {
    const nodesToCopy = currentState.nodes
      .filter((node) => selectedNodes.includes(node.id))
      .map((node) => ({
        ...node,
        style: currentState.nodeStyles[node.id] || {},
      }));
    clipboardRef.current = nodesToCopy;
  }, [currentState.nodes, currentState.nodeStyles, selectedNodes]);

  const pasteNodes = useCallback(() => {
    if (clipboardRef.current.length > 0) {
      const newNodes = clipboardRef.current.map((node) => ({
        ...node,
        id: `${node.id}-copy-${Date.now()}`,
        position: {
          x: node.position.x + 20,
          y: node.position.y + 20,
        },
        data: {
          ...node.data,
          label: node.data.label,
        },
      }));
      updateState({
        nodes: [...currentState.nodes, ...newNodes],
        nodeStyles: {
          ...currentState.nodeStyles,
          ...newNodes.reduce(
            (styles, node) => ({
              ...styles,
              [node.id]: node.style,
            }),
            {}
          ),
        },
      });
    }
  }, [currentState.nodes, currentState.nodeStyles, updateState]);

  const lockNode = useCallback(() => {
    if (selectedNode) {
      const currentStyle = getNodeStyle(selectedNode);
      updateNodeStyle(selectedNode, { locked: !currentStyle.locked });
    }
  }, [selectedNode, updateNodeStyle, getNodeStyle]);

  const changeShape = useCallback(
    (shape: NodeStyle["shape"]) => {
      if (selectedNode) {
        updateNodeStyle(selectedNode, { shape });
      }
    },
    [selectedNode, updateNodeStyle]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const addNode = useCallback(
    (type: string, position: { x: number; y: number }) => {
      const newNode = {
        id: `node-${Date.now()}`,
        type: type === "text" ? "textNode" : "genericNode",
        position,
        data: {
          label: `New ${type}`,
          shape: type,
          from: "",
          to: "",

          ...columns.reduce(
            (acc, column) => ({
              ...acc,
              [column.title]:
                column?.type === "Relation" || column?.type === "Rollup"
                  ? null
                  : "",
            }),
            {}
          ),
        },
        connectable: type !== "text",
      };
      updateState({
        nodes: [...currentState.nodes, newNode],
        nodeStyles: {
          ...currentState.nodeStyles,
          [newNode.id]: getNodeStyle(newNode.id),
        },
      });
    },
    [
      currentState.nodes,
      currentState.nodeStyles,
      updateState,
      getNodeStyle,
      columns,
    ]
  );

  const addSwimlane = useCallback(
    (position: { x: number; y: number }) => {
      const newSwimlane = {
        id: `swimlane-${Date.now()}`,
        type: "swimlaneNode",
        position,
        style: { width: 600, height: 150 },
        data: {
          label: "New Swimlane",
          lanes: [
            {
              id: `lane-${Date.now()}`,
              label: "Lane 1",
              height: 150,
            },
          ],
        },
      };
      updateState({ nodes: [...currentState.nodes, newSwimlane] });
    },
    [currentState.nodes, updateState]
  );

  const onLabelChange = useCallback(
    (nodeId: string, newLabel: string) => {
      updateState({
        nodes: currentState.nodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, label: newLabel } }
            : node
        ),
      });
    },
    [currentState.nodes, updateState]
  );

  const setBorderStyle = useCallback(
    (style: string) => {
      if (selectedNode) {
        updateNodeStyle(selectedNode, { borderStyle: style });
      }
    },
    [selectedNode, updateNodeStyle]
  );

  const setBorderWidth = useCallback(
    (width: number) => {
      if (selectedNode) {
        updateNodeStyle(selectedNode, { borderWidth: width });
      }
    },
    [selectedNode, updateNodeStyle]
  );

  const addLaneToSwimlane = useCallback(
    (swimlaneId: string) => {
      updateState({
        nodes: currentState.nodes.map((node) => {
          if (node.id === swimlaneId && node?.type === "swimlaneNode") {
            const newLane = {
              id: `lane-${Date.now()}`,
              label: `Lane ${node.data.lanes.length + 1}`,
              height: 100,
            };
            return {
              ...node,
              data: {
                ...node.data,
                lanes: [...node.data.lanes, newLane],
              },
              style: {
                ...node.style,
                height: ((node.style?.height as number) || 0) + 100,
              },
            };
          }
          return node;
        }),
      });
    },
    [currentState.nodes, updateState]
  );

  const deleteSelectedNodes = useCallback(() => {
    const nodesToDeleteSet = new Set(selectedNodes);
    const deleteNodeAndChildren = (nodeId: string) => {
      const node = currentState.nodes.find((n) => n.id === nodeId);
      if (node) {
        nodesToDeleteSet.add(nodeId);
        currentState.nodes.forEach((n) => {
          if (n.parentNode === nodeId) {
            deleteNodeAndChildren(n.id);
          }
        });
      }
    };

    selectedNodes.forEach((nodeId) => deleteNodeAndChildren(nodeId));

    // First, identify all nodes that need their parentNode reference removed
    const updatedNodesWithFixedParents = currentState.nodes.map((node) => {
      if (
        !nodesToDeleteSet.has(node.id) &&
        node.parentNode &&
        nodesToDeleteSet.has(node.parentNode)
      ) {
        // This node's parent will be deleted, so remove the parentNode reference
        return {
          ...node,
          parentNode: undefined,
          // Make position absolute since it was relative to parent before
          position: {
            ...node.position,
          },
        };
      }
      return node;
    });

    // Then filter out the deleted nodes
    const updatedNodes = updatedNodesWithFixedParents.filter(
      (node) => !nodesToDeleteSet.has(node.id)
    );
    const updatedEdges = currentState.edges.filter(
      (edge) =>
        !nodesToDeleteSet.has(edge.source) && !nodesToDeleteSet.has(edge.target)
    );

    updateState({
      nodes: updatedNodes,
      edges: updatedEdges,
      nodeStyles: Object.fromEntries(
        Object.entries(currentState.nodeStyles).filter(
          ([id]) => !nodesToDeleteSet.has(id)
        )
      ),
    });
    setSelectedNodes([]);
    setSelectedNode(null);
  }, [
    currentState.nodes,
    currentState.edges,
    currentState.nodeStyles,
    selectedNodes,
    updateState,
  ]);

  const deleteSelectedEdges = useCallback(() => {
    if (selectedEdge) {
      updateState({
        edges: currentState.edges.filter((edge) => edge.id !== selectedEdge),
      });
      setSelectedEdge(null);
    }
  }, [selectedEdge, currentState.edges, updateState]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "z") {
        event.preventDefault();
        undo();
      } else if (event.ctrlKey && event.key === "y") {
        event.preventDefault();
        redo();
      } else if (event.ctrlKey && event.shiftKey && event.key === "Z") {
        event.preventDefault();
        redo();
      } else if (event.ctrlKey && event.key === "c") {
        event.preventDefault();
        copySelectedNodes();
      } else if (event.ctrlKey && event.key === "v") {
        event.preventDefault();
        pasteNodes();
      } else if (event.key === "Delete") {
        event.preventDefault();
        if (selectedNodes.length > 0) {
          deleteSelectedNodes();
        } else if (selectedEdge) {
          deleteSelectedEdges();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    undo,
    redo,
    copySelectedNodes,
    pasteNodes,
    deleteSelectedNodes,
    deleteSelectedEdges,
    selectedNodes,
    selectedEdge,
  ]);

  const setBackgroundColor = useCallback(
    (color: string) => {
      if (selectedNode) {
        updateNodeStyle(selectedNode, { backgroundColor: color });
      }
    },
    [selectedNode, updateNodeStyle]
  );

  const setBorderColor = useCallback(
    (color: string) => {
      if (selectedNode) {
        updateNodeStyle(selectedNode, { borderColor: color });
      }
    },
    [selectedNode, updateNodeStyle]
  );

  const setTextColor = useCallback(
    (color: string) => {
      if (selectedNode) {
        updateNodeStyle(selectedNode, { textColor: color });
      }
    },
    [selectedNode, updateNodeStyle]
  );

  const setLineHeight = useCallback(
    (height: number) => {
      if (selectedNode) {
        updateNodeStyle(selectedNode, { lineHeight: height });
      }
    },
    [selectedNode, updateNodeStyle]
  );

  const onEdgeSelect = useCallback((edgeIds: string[]) => {
    setSelectedEdge(edgeIds.length === 1 ? edgeIds[0] : null);
  }, []);

  const onChangeEdgeStyle = useCallback(
    (style: string) => {
      if (selectedEdge) {
        updateState({
          edges: currentState.edges.map((edge) =>
            edge.id === selectedEdge
              ? {
                  ...edge,
                  type:
                    style === "default" ||
                    style === "straight" ||
                    style === "step" ||
                    style === "smoothstep" ||
                    style === "simplebezier"
                      ? style
                      : "smoothstep",
                  style: {
                    ...edge.style,
                    edgeType: style,
                    strokeWidth: style === "double" ? 3 : 2,
                    strokeDasharray:
                      style === "dashed"
                        ? "5,5"
                        : style === "dotted"
                          ? "1,5"
                          : undefined,
                    className: style === "double" ? "double-line" : undefined,
                  },
                  markerEnd: { type: MarkerType.ArrowClosed },
                }
              : edge
          ),
        });
      }
    },
    [selectedEdge, currentState.edges, updateState]
  );

  const onChangeEdgeLabel = useCallback(
    (edgeId: string, newLabel: string) => {
      updateState({
        edges: currentState.edges.map((edge) =>
          edge.id === edgeId
            ? {
                ...edge,
                data: { ...edge.data, label: newLabel },
              }
            : edge
        ),
      });
    },
    [currentState.edges, updateState]
  );

  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const aspectRatio = img.width / img.height;
            const maxSize = 200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              width = Math.min(maxSize, width);
              height = width / aspectRatio;
            } else {
              height = Math.min(maxSize, height);
              width = height * aspectRatio;
            }

            const newNode = {
              id: `image-${Date.now()}`,
              type: "imageNode",
              position: { x: Math.random() * 500, y: Math.random() * 500 },
              data: {
                src: e.target?.result as string,
                alt: file.name,
                width: img.width,
                height: img.height,
              },
              style: { width, height },
            };
            updateState({
              nodes: [...currentState.nodes, newNode],
            });
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    },
    [currentState.nodes, updateState]
  );

  const addImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAddColumn = useCallback(
    (columnData: ColumnData) => {
      const newColumns = [...columns, columnData];
      setColumns(newColumns);
    },
    [columns, setColumns]
  );

  const toggleSidebar = useCallback(() => {
    // Don't open sidebar in table view
    if (viewMode === "table") {
      setIsSidebarOpen(false);
      return;
    }
    setIsSidebarOpen((prev) => !prev);
  }, [viewMode]);

  const handleZoomIn = useCallback(() => {
    // This will be handled by the UMLEditor component
  }, []);

  const handleZoomOut = useCallback(() => {
    // This will be handled by the UMLEditor component
  }, []);

  const handleFitToScreen = useCallback(() => {
    // This will be handled by the UMLEditor component
  }, []);

  const handleToggleGrid = useCallback(() => {
    setShowGrid((prev) => !prev);
  }, []);

  const handleToggleRulers = useCallback(() => {
    setShowRulers((prev) => !prev);
  }, []);

  const handleEdgeWidthChange = useCallback(
    (width: number) => {
      setEdgeWidth(width);
      // Update the selected edge's width
      if (selectedEdge) {
        const updatedEdges = currentState.edges.map((edge) =>
          edge.id === selectedEdge
            ? { ...edge, style: { ...edge.style, strokeWidth: width } }
            : edge
        );
        updateState({ ...currentState, edges: updatedEdges });
      }
    },
    [selectedEdge, currentState, updateState]
  );

  const handleEdgeColorChange = useCallback(
    (color: string) => {
      setEdgeColor(color);
      // Update the selected edge's color
      if (selectedEdge) {
        const updatedEdges = currentState.edges.map((edge) =>
          edge.id === selectedEdge
            ? { ...edge, style: { ...edge.style, stroke: color } }
            : edge
        );
        updateState({ ...currentState, edges: updatedEdges });
      }
    },
    [selectedEdge, currentState, updateState]
  );

  const handleCanvasNameChange = useCallback(
    (canvasId: string, newName: string) => {
      setProjectName(newName);

      // change name in cvanvas obect in localstorage
      const currentCanvas = localStorage.getItem(`canvas_${canvasId}`);

      if (currentCanvas) {
        const parsedCanvas = JSON.parse(currentCanvas);

        const updatedCanvas = {
          ...parsedCanvas,
          projectName: newName,
        };

        localStorage.setItem(
          `canvas_${canvasId}`,
          JSON.stringify(updatedCanvas)
        );
      }

      const updatedFolders = folders.map((folder) => ({
        ...folder,
        canvases: folder.canvases.map((canvas) =>
          canvas.id === canvasId ? { ...canvas, name: newName } : canvas
        ),
      }));

      setFolders(updatedFolders);
      localStorage.setItem("savedFolders", JSON.stringify(updatedFolders));

      // Update savedCanvases
      const savedCanvases = JSON.parse(
        localStorage.getItem("savedCanvases") || "[]"
      );
      const updatedCanvases = savedCanvases.map(
        (canvas: { id: string; name: string }) =>
          canvas.id === canvasId ? { ...canvas, name: newName } : canvas
      );
      localStorage.setItem("savedCanvases", JSON.stringify(updatedCanvases));
    },
    [folders]
  );

  const selectedStyle = selectedNode ? getNodeStyle(selectedNode) : null;
  const selectedEdgeData = selectedEdge
    ? currentState.edges.find((edge) => edge.id === selectedEdge)?.data
    : null;

  const bringForward = useCallback(() => {
    if (selectedNodes.length > 0) {
      const updatedNodes = [...currentState.nodes];
      selectedNodes.forEach((nodeId) => {
        const index = updatedNodes.findIndex((node) => node.id === nodeId);
        if (index < updatedNodes.length - 1) {
          const temp = updatedNodes[index];
          updatedNodes[index] = updatedNodes[index + 1];
          updatedNodes[index + 1] = temp;
        }
      });
      updateState({ nodes: updatedNodes });
    }
  }, [selectedNodes, currentState.nodes, updateState]);

  const sendBackward = useCallback(() => {
    if (selectedNodes.length > 0) {
      const updatedNodes = [...currentState.nodes];
      selectedNodes.forEach((nodeId) => {
        const index = updatedNodes.findIndex((node) => node.id === nodeId);
        if (index > 0) {
          const temp = updatedNodes[index];
          updatedNodes[index] = updatedNodes[index - 1];
          updatedNodes[index - 1] = temp;
        }
      });
      updateState({ nodes: updatedNodes });
    }
  }, [selectedNodes, currentState.nodes, updateState]);

  // Add this function inside the FigmaInterface component
  const handleImportCanvas = useCallback((importedData: any) => {
    // setCurrentState(importedData);
    setColumns(importedData.columns || []);
    toast.success("Canvas imported successfully!");
  }, []);

  const getViewportCenter = useCallback(() => {
    if (!reactFlowInstance) return { x: 100, y: 100 }; // Default position

    const viewport = reactFlowInstance.getViewport();
    const { x, y, zoom } = viewport;

    // Get the wrapper element's dimensions
    const wrapper = document.querySelector(".react-flow-wrapper");
    if (!wrapper) return { x: x + 500, y: y + 300 };

    const rect = wrapper.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Convert screen coordinates to flow coordinates
    return reactFlowInstance.project({
      x: centerX,
      y: centerY,
    });
  }, [reactFlowInstance]);

  // Handle shape click from sidebar
  const handleShapeClick = useCallback(
    (shapeType: string) => {
      const position = getViewportCenter();
      addNode(shapeType, position);
    },
    [getViewportCenter, addNode]
  );

  // Modify this part to handle sidebar closing when navigating to table
  const handleViewModeChange = (mode: "canvas" | "table" | "document") => {
    console.log("🚀 ~ handleViewModeChange ~ mode:", mode);
    // Close sidebar when switching to table view
    if (mode === "table") {
      setIsSidebarOpen(false);
    }
    setViewMode(mode);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size={36} />
          <p className="text-primary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      {viewMode === "canvas" || viewMode === "table" ? (
        <>
          <div className="h-screen bg-white flex flex-col w-screen">
            <Header
              onUndo={undo}
              onRedo={redo}
              currentState={currentState}
              onCut={() => {
                copySelectedNodes();
                deleteSelectedNodes();
              }}
              onCopy={copySelectedNodes}
              onPaste={pasteNodes}
              onDelete={deleteSelectedNodes}
              onInsertImage={addImage}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onFitToScreen={handleFitToScreen}
              onToggleGrid={handleToggleGrid}
              onToggleRulers={handleToggleRulers}
              projectName={projectName}
              setProjectName={(newName) => {
                setProjectName(newName);
                handleCanvasNameChange(canvasId, newName);
              }}
              onBackToDashboard={() => router.push("/")}
              onImportCanvas={handleImportCanvas}
              onBringForward={bringForward}
              onSendBackward={sendBackward}
              saveLoading={saveLoading}
              onSave={saveCanvas}
            />

            {/* conditional rendering based on canvas type */}

            {canvas_type === CANVAS_TYPE.HYBRID &&
              viewMode === VIEW_MODE.canvas && (
                <Toolbar
                  key={selectedNode || selectedEdge || "no-selection"}
                  fontFamily={selectedStyle?.fontFamily || "Arial"}
                  setFontFamily={(font) =>
                    selectedNode &&
                    updateNodeStyle(selectedNode, { fontFamily: font })
                  }
                  fontSize={selectedStyle?.fontSize || 12}
                  setFontSize={(size) =>
                    selectedNode &&
                    updateNodeStyle(selectedNode, { fontSize: size })
                  }
                  isBold={selectedStyle?.isBold || false}
                  setIsBold={(bold) =>
                    selectedNode &&
                    updateNodeStyle(selectedNode, { isBold: bold })
                  }
                  isItalic={selectedStyle?.isItalic || false}
                  setIsItalic={(italic) =>
                    selectedNode &&
                    updateNodeStyle(selectedNode, { isItalic: italic })
                  }
                  isUnderline={selectedStyle?.isUnderline || false}
                  setIsUnderline={(underline) =>
                    selectedNode &&
                    updateNodeStyle(selectedNode, { isUnderline: underline })
                  }
                  textAlign={selectedStyle?.textAlign || "left"}
                  setTextAlign={(align) =>
                    selectedNode &&
                    updateNodeStyle(selectedNode, { textAlign: align })
                  }
                  verticalAlign={selectedStyle?.verticalAlign || "top"}
                  setVerticalAlign={(align) =>
                    selectedNode &&
                    updateNodeStyle(selectedNode, { verticalAlign: align })
                  }
                  selectedNode={selectedNode}
                  onUndo={undo}
                  onRedo={redo}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  onCopy={copySelectedNodes}
                  onPaste={pasteNodes}
                  onLock={lockNode}
                  onChangeShape={changeShape}
                  shape={selectedStyle?.shape || "rectangle"}
                  isLocked={selectedStyle?.locked || false}
                  borderStyle={selectedStyle?.borderStyle || "solid"}
                  setBorderStyle={setBorderStyle}
                  borderWidth={selectedStyle?.borderWidth || 2}
                  setBorderWidth={setBorderWidth}
                  isSwimlane={selectedStyle?.shape === "swimlane"}
                  onDelete={
                    selectedNodes.length > 0
                      ? deleteSelectedNodes
                      : selectedEdge
                        ? deleteSelectedEdges
                        : () => {}
                  }
                  backgroundColor={selectedStyle?.backgroundColor || "#ffffff"}
                  setBackgroundColor={setBackgroundColor}
                  borderColor={selectedStyle?.borderColor || "#000000"}
                  setBorderColor={setBorderColor}
                  textColor={selectedStyle?.textColor || "#000000"}
                  setTextColor={setTextColor}
                  lineHeight={selectedStyle?.lineHeight || 1.2}
                  setLineHeight={setLineHeight}
                  selectedEdge={selectedEdge}
                  onChangeEdgeStyle={onChangeEdgeStyle}
                  currentEdgeStyle={selectedEdgeData?.type || "default"}
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  // edge styles
                  edgeWidth={edgeWidth}
                  setEdgeWidth={handleEdgeWidthChange}
                  edgeColor={edgeColor}
                  setEdgeColor={handleEdgeColorChange}
                />
              )}

            <div className="flex flex-1 overflow-hidden">
              <VerticalNav
                className="hidden md:flex"
                onToggleSidebar={toggleSidebar}
                canvasType={canvas_type}
              />
              <div className="flex-1 flex flex-col md:flex-row relative ">
                <Sidebar
                  onDragStart={onDragStart}
                  isVisible={isSidebarOpen}
                  onShapeClick={handleShapeClick}
                />
                <div className="flex-1 relative">
                  <SafeUMLEditor
                    nodes={currentState.nodes}
                    edges={currentState.edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeStyles={currentState.nodeStyles}
                    onNodeSelect={onNodeSelect}
                    selectedNodes={selectedNodes}
                    onAddNode={addNode}
                    onAddSwimlane={addSwimlane}
                    onLabelChange={onLabelChange}
                    onAddLane={addLaneToSwimlane}
                    onEdgeSelect={onEdgeSelect}
                    onChangeEdgeLabel={onChangeEdgeLabel}
                    onAddImage={addImage}
                    onAddColumn={handleAddColumn}
                    columns={columns}
                    setColumns={setColumns}
                    currentFolderCanvases={folderCanvases.map((canvas) => ({
                      ...canvas,
                      canvas_type:
                        canvas.canvas_type || canvas_type || CANVAS_TYPE.HYBRID,
                    }))}
                    canvasId={canvasId}
                    canvasType={canvas_type}
                    onReactFlowInit={setReactFlowInstance}
                    canvasSettings={canvasSettings}
                    updateCanvasSettings={updateCanvasSettings}
                    viewMode={viewMode}
                    onViewModeChange={handleViewModeChange}
                  />
                </div>
              </div>
            </div>
            <Input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
        </>
      ) : (
        <>
          <DocumentEditor
            canvasId={canvasId}
            isPartOfCanvas={true}
            onBackToBoard={() => setViewMode("canvas")}
          />
        </>
      )}
    </ReactFlowProvider>
  );
}
