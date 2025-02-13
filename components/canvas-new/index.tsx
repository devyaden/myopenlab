"use client";

import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import type { Edge, Node } from "reactflow";
import { MarkerType, ReactFlowProvider } from "reactflow";
import { Header } from "./header";
import { RollupCalculator } from "./rollup-calculator"; // Import RollupCalculator
import { Sidebar } from "./sidebar";

import { Toolbar } from "./toolbar";
import { UMLEditor } from "./uml-editor";
import { VerticalNav } from "./vertical-nav";

interface NodeStyle {
  fontFamily: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  textAlign: "left" | "center" | "right" | "justify";
  shape:
    | "rectangle"
    | "rounded"
    | "circle"
    | "diamond"
    | "hexagon"
    | "triangle"
    | "useCase"
    | "actor"
    | "class"
    | "interface"
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
}

const MAX_HISTORY_SIZE = 50;

interface FigmaInterfaceProps {
  canvasId: string;
}

export default function FigmaInterface({ canvasId }: FigmaInterfaceProps) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [currentState, setCurrentState] = useState<AppState>({
    nodes: [],
    edges: [],
    nodeStyles: {},
  });
  const [history, setHistory] = useState<AppState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"canvas" | "table">("canvas");
  const clipboardRef = useRef<Node[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [columns, setColumns] = useState<ColumnData[]>([
    { title: "id", type: "Text" },
    { title: "task", type: "Text" },
    { title: "type", type: "Select" },
  ]);
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(false);
  const [projectName, setProjectName] = useState<string>("Untitled Project");
  const [folders, setFolders] = useState<
    {
      id: string;
      name: string;
      canvases: { id: string; name: string }[];
    }[]
  >([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  useEffect(() => {
    const savedFolders = localStorage.getItem("savedFolders");
    if (savedFolders) {
      setFolders(JSON.parse(savedFolders));
    }
  }, []);

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
          type: "Canvas",
        },
        ...recentDocuments.filter((doc: any) => doc.id !== canvasId),
      ].slice(0, 10); // Keep only the 10 most recent documents
      localStorage.setItem("recentDocuments", JSON.stringify(updatedDocuments));
    },
    []
  );

  useEffect(() => {
    const savedCanvas = localStorage.getItem(`canvas_${canvasId}`);
    if (savedCanvas) {
      const parsedCanvas = JSON.parse(savedCanvas);
      setCurrentState(parsedCanvas.currentState);
      setColumns(parsedCanvas.columns);
      setProjectName(parsedCanvas.projectName);
      setCurrentFolder(parsedCanvas.folderId); // Set currentFolder
      addToRecentDocuments(canvasId, parsedCanvas.projectName);
    }
  }, [canvasId, addToRecentDocuments]);

  const updateHistory = useCallback(
    (newState: AppState) => {
      setHistory((prevHistory) => {
        const newHistory = [
          ...prevHistory.slice(0, historyIndex + 1),
          newState,
        ].slice(-MAX_HISTORY_SIZE);
        setHistoryIndex(newHistory.length - 1);
        return newHistory;
      });
    },
    [historyIndex]
  );

  const updateState = useCallback(
    (newState: Partial<AppState>) => {
      setCurrentState((prevState) => {
        const updatedState = { ...prevState, ...newState };
        setHistory((prevHistory) => {
          const newHistory = [
            ...prevHistory.slice(0, historyIndex + 1),
            updatedState,
          ];
          setHistoryIndex(newHistory.length - 1);
          return newHistory.slice(-MAX_HISTORY_SIZE);
        });
        return updatedState;
      });
    },
    [historyIndex]
  );

  useEffect(() => {
    if (history.length === 0) {
      updateHistory(currentState);
    }
  }, [currentState, history.length, updateHistory]);

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

  const updateNodeStyle = useCallback(
    (nodeId: string, styleUpdate: Partial<NodeStyle>) => {
      updateState({
        nodeStyles: {
          ...currentState.nodeStyles,
          [nodeId]: {
            ...getNodeStyle(nodeId),
            ...styleUpdate,
          },
        },
        nodes: currentState.nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  style:
                    node.type === "textNode"
                      ? { ...getNodeStyle(nodeId), ...styleUpdate }
                      : {
                          ...getNodeStyle(nodeId),
                          ...styleUpdate,
                          shape: node.data.shape,
                        },
                },
              }
            : node
        ),
      });
    },
    [currentState.nodeStyles, currentState.nodes, getNodeStyle, updateState]
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

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentState(history[newIndex]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentState(history[newIndex]);
    }
  }, [history, historyIndex]);

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
          // Add default values for all columns
          ...columns.reduce(
            (acc, column) => ({
              ...acc,
              [column.title]:
                column.type === "Relation" || column.type === "Rollup"
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

  const rotateSwimlane = useCallback(() => {
    if (selectedNode) {
      const currentStyle = getNodeStyle(selectedNode);
      updateNodeStyle(selectedNode, { isVertical: !currentStyle.isVertical });
    }
  }, [selectedNode, updateNodeStyle, getNodeStyle]);

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
          if (node.id === swimlaneId && node.type === "swimlaneNode") {
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

    const updatedNodes = currentState.nodes.filter(
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

  const deleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      updateState({
        nodes: currentState.nodes.filter((node) => node.id !== selectedNode),
        nodeStyles: Object.fromEntries(
          Object.entries(currentState.nodeStyles).filter(
            ([id]) => id !== selectedNode
          )
        ),
      });
      setSelectedNode(null);
    }
  }, [selectedNode, currentState.nodes, currentState.nodeStyles, updateState]);

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
                    style === "step" ||
                    style === "smoothstep"
                      ? style
                      : edge.type,
                  style: {
                    ...edge.style,
                    strokeDasharray:
                      style === "dashed"
                        ? "5,5"
                        : style === "dotted"
                          ? "1,5"
                          : undefined,
                  },
                  markerEnd: { type: MarkerType.Arrow },
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

  const handleAddColumn = useCallback((columnData: ColumnData) => {
    setColumns((prevColumns) => [...prevColumns, columnData]);
    setCurrentState((prevState) => ({
      ...prevState,
      nodes: prevState.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          [columnData.title]: "",
        },
      })),
    }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

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

  const saveToLocalStorage = useCallback(() => {
    const dataToSave = {
      projectName,
      currentState,
      columns,
      folderId: currentFolder, // Added folderId
    };
    localStorage.setItem(`canvas_${canvasId}`, JSON.stringify(dataToSave));

    // Update the savedCanvases list
    const savedCanvases = JSON.parse(
      localStorage.getItem("savedCanvases") || "[]"
    );
    const existingCanvasIndex = savedCanvases.findIndex(
      (canvas: { id: string }) => canvas.id === canvasId
    );
    if (existingCanvasIndex !== -1) {
      savedCanvases[existingCanvasIndex] = {
        id: canvasId,
        name: projectName,
        lastModified: new Date().toISOString(),
        folderId: currentFolder, // Added folderId
      };
    } else {
      savedCanvases.push({
        id: canvasId,
        name: projectName,
        lastModified: new Date().toISOString(),
        folderId: currentFolder, // Added folderId
      });
    }
    localStorage.setItem("savedCanvases", JSON.stringify(savedCanvases));

    toast.success("Project saved successfully!", {
      icon: "💾",
      style: {
        borderRadius: "10px",
        background: "#333",
        color: "#fff",
      },
    });
  }, [projectName, currentState, columns, canvasId, currentFolder]);

  const restoreFromLocalStorage = useCallback(() => {
    const savedCanvas = localStorage.getItem(`canvas_${canvasId}`);
    if (savedCanvas) {
      const parsedCanvas = JSON.parse(savedCanvas);
      setCurrentState(parsedCanvas.currentState);
      setColumns(parsedCanvas.columns);
      setProjectName(parsedCanvas.projectName);
      setCurrentFolder(parsedCanvas.folderId); // Set currentFolder

      // Update the lastModified date in the savedCanvases list
      const savedCanvases = JSON.parse(
        localStorage.getItem("savedCanvases") || "[]"
      );
      const updatedCanvases = savedCanvases.map(
        (canvas: { id: string; lastModified: string }) =>
          canvas.id === canvasId
            ? { ...canvas, lastModified: new Date().toISOString() }
            : canvas
      );
      localStorage.setItem("savedCanvases", JSON.stringify(updatedCanvases));

      toast.success("Project restored successfully!");
    } else {
      toast.error("No saved project found!");
    }
  }, [canvasId]);

  const handleCanvasNameChange = useCallback(
    (canvasId: string, newName: string) => {
      setProjectName(newName);

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

  const handleFolderNameChange = useCallback(
    (folderId: string, newName: string) => {
      const updatedFolders = folders.map((folder) =>
        folder.id === folderId ? { ...folder, name: newName } : folder
      );

      setFolders(updatedFolders);
      localStorage.setItem("savedFolders", JSON.stringify(updatedFolders));
    },
    [folders]
  );

  const selectedStyle = selectedNode ? getNodeStyle(selectedNode) : null;
  const selectedEdgeData = selectedEdge
    ? currentState.edges.find((edge) => edge.id === selectedEdge)?.data
    : null;

  return (
    <ReactFlowProvider>
      <div className="min-h-screen bg-white flex flex-col w-screen">
        <Header
          onUndo={undo}
          onRedo={redo}
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
            handleCanvasNameChange(canvasId, newName); // Pass canvasId here
          }}
          onSave={saveToLocalStorage}
          onRestore={restoreFromLocalStorage}
          onBackToDashboard={() => router.push("/")}
        />
        <Toolbar
          key={selectedNode || selectedEdge || "no-selection"}
          fontFamily={selectedStyle?.fontFamily || "Arial"}
          setFontFamily={(font) =>
            selectedNode && updateNodeStyle(selectedNode, { fontFamily: font })
          }
          fontSize={selectedStyle?.fontSize || 12}
          setFontSize={(size) =>
            selectedNode && updateNodeStyle(selectedNode, { fontSize: size })
          }
          isBold={selectedStyle?.isBold || false}
          setIsBold={(bold) =>
            selectedNode && updateNodeStyle(selectedNode, { isBold: bold })
          }
          isItalic={selectedStyle?.isItalic || false}
          setIsItalic={(italic) =>
            selectedNode && updateNodeStyle(selectedNode, { isItalic: italic })
          }
          isUnderline={selectedStyle?.isUnderline || false}
          setIsUnderline={(underline) =>
            selectedNode &&
            updateNodeStyle(selectedNode, { isUnderline: underline })
          }
          textAlign={selectedStyle?.textAlign || "left"}
          setTextAlign={(align) =>
            selectedNode && updateNodeStyle(selectedNode, { textAlign: align })
          }
          selectedNode={selectedNode}
          onUndo={undo}
          onRedo={redo}
          onCopy={copySelectedNodes}
          onPaste={pasteNodes}
          onLock={lockNode}
          onChangeShape={changeShape}
          onRotateSwimlane={rotateSwimlane}
          shape={selectedStyle?.shape || "rectangle"}
          isLocked={selectedStyle?.locked || false}
          isSwimlaneVertical={selectedStyle?.isVertical ?? true}
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
          onChangeEdgeLabel={(label) =>
            selectedEdge && onChangeEdgeLabel(selectedEdge, label)
          }
          currentEdgeLabel={selectedEdgeData?.label || ""}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <div className="flex flex-1 overflow-hidden">
          <VerticalNav
            className="hidden md:flex"
            onToggleSidebar={toggleSidebar}
          />
          <div className="flex-1 flex flex-col md:flex-row relative">
            <Sidebar onDragStart={onDragStart} isVisible={isSidebarOpen} />
            <div className="flex-1 relative">
              <UMLEditor
                viewMode={viewMode}
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
                onDelete={deleteSelectedNodes}
                selectedEdge={selectedEdge}
                onEdgeSelect={onEdgeSelect}
                onChangeEdgeStyle={onChangeEdgeStyle}
                onChangeEdgeLabel={onChangeEdgeLabel}
                onAddImage={addImage}
                onAddColumn={handleAddColumn}
                columns={columns}
                setColumns={setColumns}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onFitToScreen={handleFitToScreen}
                showGrid={showGrid}
                showRulers={showRulers}
              />
              <RollupCalculator // Added RollupCalculator component
                nodes={currentState.nodes}
                columns={columns}
                onRollupChange={(nodeId, columnTitle, value) => {
                  setCurrentState((prevState) => ({
                    ...prevState,
                    nodes: prevState.nodes.map((node) =>
                      node.id === nodeId
                        ? {
                            ...node,
                            data: { ...node.data, [columnTitle]: value },
                          }
                        : node
                    ),
                  }));
                }}
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
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#333",
              color: "#fff",
            },
          }}
        />
      </div>
    </ReactFlowProvider>
  );
}
