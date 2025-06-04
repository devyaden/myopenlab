"use client";

import DocumentEditor from "@/components/editor";
import { Input } from "@/components/ui/input";
import { findAbsolutePosition } from "@/lib/canvas.utils";
import { useUser } from "@/lib/contexts/userContext";
import { deleteImage, listImages, uploadImage } from "@/lib/storage-utils";
import { useCanvasStore } from "@/lib/store/useCanvas";
import { CANVAS_TYPE } from "@/types/store";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import type { Edge, Node, ReactFlowInstance } from "reactflow";
import { MarkerType, ReactFlowProvider } from "reactflow";
import { LoadingSpinner } from "../loading-spinner";
import { Unauthorized } from "../unauthorized";
import { Header } from "./header";
import { ImageManagerDialog } from "./image-manager-dialog";
import "./react-flow-fixes.css";
import { Sidebar } from "./sidebar";
import { VIEW_MODE } from "./table-view/table.types";
import { Toolbar } from "./toolbar";
import { UMLEditor } from "./uml-editor";
import { VerticalNav } from "./vertical-nav";
import { ViewModeSwitcher } from "./view-mode-switcher";
import { useMemo } from "react";

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
  const { user } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [visibility, setVisibility] = useState<string>("private");
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [unauthorized, setUnauthorized] = useState<boolean>(false);
  const [isDocumentReady, setIsDocumentReady] = useState(false);

  const documentRef = useRef<any>(null);
  const tableViewRef = useRef<any>(null);

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
    user_id,
    currentFolder,
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
  const [folders, setFolders] = useState<
    {
      id: string;
      name: string;
      canvases: { id: string; name: string }[];
    }[]
  >([]);

  const [edgeWidth, setEdgeWidth] = useState(2);
  const [edgeColor, setEdgeColor] = useState("#000000");
  const [refReady, setRefReady] = useState(false);

  // Add a tableViewRef to access the TableView component's methods

  const [imageManagerOpen, setImageManagerOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<
    Array<{
      id: string;
      src: string;
      alt: string;
      createdAt?: string;
      path?: string;
    }>
  >([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Add this state handler for toggleMiniMap used during export
  const [miniMapRef, setMiniMapRef] = useState<
    ((show: boolean) => void) | undefined
  >(undefined);

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
      useCanvasStore.persist.setOptions({
        name: `canvas_${canvasId}`,
      });

      useCanvasStore.persist.rehydrate();
      localStorage.removeItem("canvas-store");

      // First load the canvas from the server
      loadCanvas(canvasId).then(() => {
        // After loading, check if there's AI data pending to be applied
        const pendingTimestamp = sessionStorage?.getItem(
          "pending-ai-data-timestamp"
        );

        if (pendingTimestamp) {
          const aiDataKey = `ai-data-${pendingTimestamp}`;
          const aiDataJson = localStorage.getItem(aiDataKey);

          if (aiDataJson) {
            try {
              const aiData = JSON.parse(aiDataJson);
              if (aiData.pending && aiData.data) {
                // Initialize the canvas with AI data
                if (aiData.data.nodes) setNodes(aiData.data.nodes);
                if (aiData.data.edges) setEdges(aiData.data.edges);
                if (aiData.data.nodeStyles) {
                  // Update each node style individually
                  Object.entries(aiData.data.nodeStyles).forEach(
                    ([nodeId, style]) => {
                      updateNodeStyle(nodeId, style as NodeStyle);
                    }
                  );
                }

                // Clear the pending data
                localStorage.removeItem(aiDataKey);
                sessionStorage.removeItem("pending-ai-data-timestamp");
                // Save the canvas with AI data
                saveCanvas();
              }
            } catch (error) {
              console.error("Error parsing AI data:", error);
            }
          }
        }
      });
    }
  }, [canvasId, loadCanvas, saveCanvas]);

  useEffect(() => {
    if (canvasId) {
      addToRecentDocuments(canvasId, projectName);
    }
  }, [canvasId, projectName, addToRecentDocuments]);

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
        // Update the app state with fixed nodes to prevent future issues
        setTimeout(() => setNodes(safeNodes), 0);
      }

      return (
        <UMLEditor {...props} nodes={safeNodes} tableViewRef={tableViewRef} />
      );
    },
    [fixCircularParentChildRelationships, setNodes]
  );

  const exportToCSVFn = useMemo(() => {
    if (viewMode !== VIEW_MODE.table || !tableViewRef.current) return undefined;
    return tableViewRef.current.exportToCSV;
  }, [viewMode, refReady, tableViewRef.current]);

  const exportToExcelFn = useMemo(() => {
    return viewMode === VIEW_MODE.table && tableViewRef.current
      ? tableViewRef.current.exportToExcel
      : undefined;
  }, [viewMode, refReady, tableViewRef.current]);

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
        setNodes(fixedNodes);
      }
    }
  }, [nodes, fixCircularParentChildRelationships, setNodes]);

  useEffect(() => {
    if (viewMode === VIEW_MODE.table && tableViewRef.current) {
      setRefReady(true);
    } else {
      setRefReady(false);
    }
  }, [viewMode, tableViewRef.current]);

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
          verticalAlign: "middle" as const,
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
    // Special handling for image type - open image manager instead of dragging
    if (nodeType === "image") {
      event.preventDefault();
      event.stopPropagation();
      // Open the image manager dialog
      setImageManagerOpen(true);
      return;
    }

    // Default behavior for other shape types
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
              ? style === "animated"
                ? {
                    ...edge,
                    animated: true,
                  }
                : {
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
                    animated: false,
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

  // Load images from Supabase storage instead of localStorage
  useEffect(() => {
    const loadImages = async () => {
      if (user?.id) {
        try {
          const images = await listImages(user.id);
          setUploadedImages(images);
        } catch (error) {
          toast.error("Failed to load your images");
        }
      }
    };

    if (user?.id) {
      loadImages();
    }

    // Re-fetch images when component mounts or when user changes
    return () => {
      // Cleanup if needed
    };
  }, [user?.id]);

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !user?.id) return;

      setIsUploadingImage(true);

      try {
        // Upload to Supabase
        const uploadedImage = await uploadImage(file, user.id);

        if (!uploadedImage) {
          toast.error("Failed to upload image");
          return;
        }

        // Add to uploaded images list
        setUploadedImages((prev) => [uploadedImage, ...prev]);

        // Only create a node if not opened from image manager
        if (!imageManagerOpen) {
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

            // Get a position near the center of the viewport
            const position = reactFlowInstance
              ? reactFlowInstance.project({
                  x: window.innerWidth / 2,
                  y: window.innerHeight / 2,
                })
              : { x: 100, y: 100 };

            const newNode = {
              id: `node-${Date.now()}`,
              type: "imageNode",
              position: position,
              data: {
                src: uploadedImage.src,
                alt: uploadedImage.alt,
                width: img.width,
                height: img.height,
              },
              style: { width, height },
            };

            updateState({
              nodes: [...currentState.nodes, newNode],
            });
          };
          img.src = uploadedImage.src;
        }

        toast.success("Image uploaded successfully");
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("maximum limit of 10 images")
        ) {
          toast.error(error.message);
        } else {
          toast.error("Failed to upload image");
        }
      } finally {
        setIsUploadingImage(false);

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [
      currentState.nodes,
      updateState,
      imageManagerOpen,
      user?.id,
      reactFlowInstance,
    ]
  );

  const addImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDeleteImage = useCallback(
    async (imageId: string) => {
      // Find the image with the given ID
      const imageToDelete = uploadedImages.find((img) => img.id === imageId);

      if (!imageToDelete || !imageToDelete.path) {
        toast.error("Image not found");
        return;
      }

      try {
        // Delete from Supabase
        const success = await deleteImage(imageToDelete.path);

        if (!success) {
          toast.error("Failed to delete image");
          return;
        }

        // Remove from local state
        setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));

        // Also remove any nodes using this image from the canvas
        const nodesToRemove = currentState.nodes.filter(
          (node) =>
            node.type === "imageNode" && node.data?.src === imageToDelete.src
        );

        if (nodesToRemove.length > 0) {
          updateState({
            nodes: currentState.nodes.filter(
              (node) =>
                !(
                  node.type === "imageNode" &&
                  node.data?.src === imageToDelete.src
                )
            ),
          });
        }

        toast.success("Image deleted");
      } catch (error) {
        toast.error("Failed to delete image");
      }
    },
    [uploadedImages, currentState.nodes, updateState]
  );

  const handleSelectImage = useCallback(
    (image: { id: string; src: string; alt: string }) => {
      // Create a new image node from the selected image
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

        // Get a position near the center of the viewport
        const position = reactFlowInstance
          ? reactFlowInstance.project({
              x: window.innerWidth / 2,
              y: window.innerHeight / 2,
            })
          : { x: 100, y: 100 };

        const newNode = {
          id: `node-${Date.now()}`,
          type: "imageNode",
          position: position,
          data: {
            src: image.src,
            alt: image.alt,
            width: img.width,
            height: img.height,
          },
          style: { width, height },
        };

        updateState({
          nodes: [...currentState.nodes, newNode],
        });

        toast.success("Image added to canvas");
      };
      img.src = image.src;
    },
    [currentState.nodes, updateState, reactFlowInstance]
  );

  const handleAddColumn = useCallback(
    (columnData: ColumnData) => {
      const newColumns = [...columns, columnData];
      setColumns(newColumns);
    },
    [columns, setColumns]
  );

  const toggleSidebar = useCallback(() => {
    if (viewMode === "table") {
      setIsSidebarOpen(false);
      return;
    }
    setIsSidebarOpen((prev) => !prev);
  }, [viewMode]);

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

  // Add this function inside the FigmaInterface component
  const handleImportCanvas = useCallback((importedData: any) => {
    // setCurrentState(importedData);
    setColumns(importedData.columns || []);
    toast.success("Canvas imported successfully!");
  }, []);

  // Handle shape click from sidebar
  const handleShapeClick = useCallback(
    (shapeType: string) => {
      // Get a position near the center of the viewport
      const position = reactFlowInstance
        ? reactFlowInstance.project({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
          })
        : { x: 100, y: 100 };

      addNode(shapeType, position);
    },
    [reactFlowInstance, addNode]
  );

  // Modify this part to handle sidebar closing when navigating to table
  const handleViewModeChange = (mode: "canvas" | "table" | "document") => {
    // Close sidebar when switching to table view
    // if (mode === "table" || mode === "document") {
    setIsSidebarOpen(false);
    // }

    // If the canvas is hybrid, allow switching between all views
    // If it's a specific type (table or document), restrict to that view
    if (canvas_type === CANVAS_TYPE.HYBRID || mode === canvas_type) {
      setViewMode(mode);
    } else {
      toast.error(
        `This is a ${canvas_type} canvas and cannot be viewed as ${mode}`
      );
    }
  };

  // Check if current user is the owner of the canvas
  useEffect(() => {
    if (user && user_id) {
      setIsOwner(user.id === user_id);
      setIsLoaded(true);
    }
  }, [user, user_id]);

  // Check authorization when canvas is loaded
  useEffect(() => {
    const checkAuthorization = async () => {
      if (!user || !isLoaded) return;

      try {
        // Get canvas details to check visibility
        const response = await fetch(`/api/canvas/${canvasId}`);

        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Canvas not found");
            router.push("/protected");
            return;
          }
          throw new Error("Failed to fetch canvas");
        }

        const data = await response.json();

        setVisibility(data.visibility || "private");

        // If user is not owner and canvas is not public, show unauthorized component
        if (user.id !== data.user_id && data.visibility !== "public") {
          setUnauthorized(true);
        }
      } catch (error) {
        toast.error("Failed to check authorization");
      }
    };

    checkAuthorization();
  }, [canvasId, user, isLoaded, router]);

  const detachNodeFromParent = useCallback(() => {
    if (!selectedNode) return;

    const nodeToDetach = nodes.find((n) => n.id === selectedNode);
    if (!nodeToDetach || !nodeToDetach.parentNode) return;

    const updatedNodes = nodes.map((node) => {
      if (node.id === selectedNode) {
        // Calculate absolute position before detaching
        const absolutePosition = findAbsolutePosition(node, nodes);
        return {
          ...node,
          parentNode: undefined,
          position: absolutePosition,
        };
      }
      return node;
    });

    setNodes(updatedNodes);
  }, [selectedNode, nodes, setNodes]);

  // useEffect(() => {}, [viewMode, documentRef.current]);

  // Function to change canvas visibility
  const handleVisibilityChange = async (newVisibility: string) => {
    try {
      const response = await fetch("/api/canvas/visibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          canvasId,
          visibility: newVisibility,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update visibility");
      }

      setVisibility(newVisibility);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  // Toggle image manager dialog
  const toggleImageManager = useCallback(() => {
    setImageManagerOpen((prev) => !prev);
  }, []);

  // Handler for UMLEditor's toggleMiniMap reference
  const handleMiniMapToggleRef = useCallback(
    (toggleFn: (show: boolean) => void) => {
      setMiniMapRef(toggleFn);
    },
    []
  );

  // If unauthorized, show the Unauthorized component
  if (unauthorized) {
    return <Unauthorized />;
  }

  // Create read-only props for non-owners viewing public canvases
  const isReadOnly = !isOwner;

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
    <>
      {viewMode === "canvas" || viewMode === "table" ? (
        <ReactFlowProvider>
          <>
            <div className="h-screen bg-white flex flex-col w-screen">
              <Header
                currentState={currentState}
                projectName={projectName}
                setProjectName={(newName) => {
                  setProjectName(newName);
                  handleCanvasNameChange(canvasId, newName);
                }}
                onBackToDashboard={() => router.push("/protected")}
                onImportCanvas={handleImportCanvas}
                saveLoading={saveLoading}
                onSave={saveCanvas}
                canvasId={canvasId}
                visibility={visibility}
                onVisibilityChange={handleVisibilityChange}
                isOwner={isOwner}
                viewMode={viewMode}
                exportToCSV={exportToCSVFn}
                exportToExcel={exportToExcelFn}
                propExportAsPDF={documentRef.current?.exportAsPDF}
                exportAsJSON={documentRef.current?.exportAsJSON}
                canvasType={canvas_type!}
                toggleMiniMap={miniMapRef}
                currentFolder={currentFolder}
              />

              {/* Add view mode switcher for read-only mode */}
              {isReadOnly && viewMode === VIEW_MODE.canvas && (
                <div className="flex justify-end p-2 border-b">
                  <ViewModeSwitcher
                    viewMode={viewMode}
                    onViewModeChange={handleViewModeChange}
                    canvasType={canvas_type}
                  />
                </div>
              )}

              {/* conditional rendering based on canvas type */}

              {isLoaded &&
                canvas_type === CANVAS_TYPE.HYBRID &&
                viewMode === VIEW_MODE.canvas &&
                !isReadOnly && (
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
                    backgroundColor={
                      selectedStyle?.backgroundColor || "#ffffff"
                    }
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
                    onDetachNode={detachNodeFromParent}
                    selectedNodeHasParent={
                      !!(
                        selectedNode &&
                        nodes.find((n) => n.id === selectedNode)?.parentNode
                      )
                    }
                  />
                )}

              <div className="flex flex-1 overflow-hidden">
                {!isReadOnly &&
                  viewMode === VIEW_MODE.canvas &&
                  canvas_type !== VIEW_MODE.table && (
                    <VerticalNav
                      className="hidden md:flex"
                      onToggleSidebar={toggleSidebar}
                      canvasType={canvas_type}
                      onDragStart={onDragStart}
                      onOpenImageManager={toggleImageManager}
                    />
                  )}
                <div className="flex-1 flex flex-col md:flex-row relative ">
                  {!isReadOnly && (
                    <Sidebar
                      onDragStart={onDragStart}
                      isVisible={isSidebarOpen}
                      onShapeClick={handleShapeClick}
                      onOpenImageManager={toggleImageManager}
                    />
                  )}

                  <div className="flex-1 relative">
                    <SafeUMLEditor
                      nodes={currentState.nodes}
                      edges={currentState.edges}
                      onNodesChange={isReadOnly ? undefined : onNodesChange}
                      onEdgesChange={isReadOnly ? undefined : onEdgesChange}
                      nodeStyles={currentState.nodeStyles}
                      onNodeSelect={isReadOnly ? undefined : onNodeSelect}
                      selectedNodes={selectedNodes}
                      onAddNode={isReadOnly ? undefined : addNode}
                      onAddSwimlane={isReadOnly ? undefined : addSwimlane}
                      onLabelChange={isReadOnly ? undefined : onLabelChange}
                      onAddLane={isReadOnly ? undefined : addLaneToSwimlane}
                      onEdgeSelect={isReadOnly ? undefined : onEdgeSelect}
                      onChangeEdgeLabel={
                        isReadOnly ? undefined : onChangeEdgeLabel
                      }
                      onAddImage={isReadOnly ? undefined : addImage}
                      onAddColumn={isReadOnly ? undefined : handleAddColumn}
                      columns={columns}
                      setColumns={isReadOnly ? undefined : setColumns}
                      currentFolderCanvases={folderCanvases.map((canvas) => ({
                        ...canvas,
                        canvas_type:
                          canvas.canvas_type ||
                          canvas_type ||
                          CANVAS_TYPE.HYBRID,
                      }))}
                      canvasId={canvasId}
                      canvasType={canvas_type}
                      onReactFlowInit={setReactFlowInstance}
                      canvasSettings={canvasSettings}
                      updateCanvasSettings={
                        isReadOnly ? undefined : updateCanvasSettings
                      }
                      viewMode={viewMode}
                      onViewModeChange={handleViewModeChange}
                      readOnly={isReadOnly}
                      onMiniMapToggleRef={handleMiniMapToggleRef}
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
                disabled={isUploadingImage}
              />

              {/* Image Manager Dialog */}
              <ImageManagerDialog
                isOpen={imageManagerOpen}
                onClose={() => setImageManagerOpen(false)}
                images={uploadedImages}
                onImageDelete={handleDeleteImage}
                onImageUpload={addImage}
                onImageSelect={handleSelectImage}
              />
            </div>
          </>
        </ReactFlowProvider>
      ) : (
        <DocumentEditor
          canvasId={canvasId}
          isPartOfCanvas={true}
          onBackToBoard={() => setViewMode("canvas")}
          readOnly={isReadOnly}
          onViewModeChange={handleViewModeChange}
          viewMode={viewMode}
          canvasType={canvas_type!}
          ref={documentRef}
          onReady={() => setIsDocumentReady(true)}
        />
      )}
    </>
  );
}
