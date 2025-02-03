"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ReactFlowProvider } from "reactflow";
import { Header } from "./header";
import { Toolbar } from "./toolbar";
import { Sidebar } from "./sidebar";
import { VerticalNav } from "./vertical-nav";
import { UMLEditor } from "./uml-editor";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Node, Edge } from "reactflow";

interface NodeStyle {
  fontFamily: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  textAlign: "left" | "center" | "right" | "justify";
  shape: "rectangle" | "rounded" | "circle" | "swimlane";
  locked: boolean;
  isVertical?: boolean;
  borderStyle: string;
  borderWidth: number;
}

interface AppState {
  nodes: Node[];
  edges: Edge[];
  nodeStyles: Record<string, NodeStyle>;
}

const MAX_HISTORY_SIZE = 50;

export default function CanvasNew() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<AppState>({
    nodes: [],
    edges: [],
    nodeStyles: {},
  });
  const [history, setHistory] = useState<AppState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const clipboardRef = useRef<Node | null>(null);

  useEffect(() => {
    setHistory([currentState]);
    setHistoryIndex(0);
  }, [currentState]); // Added currentState to dependencies

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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
        }
      );
    },
    [currentState.nodeStyles]
  );

  const updateState = useCallback(
    (newState: Partial<AppState>) => {
      setCurrentState((prevState) => {
        const updatedState = { ...prevState, ...newState };
        setHistory((prevHistory) => {
          const newHistory = [
            ...prevHistory.slice(0, historyIndex + 1),
            updatedState,
          ].slice(-MAX_HISTORY_SIZE);
          setHistoryIndex(Math.min(historyIndex + 1, MAX_HISTORY_SIZE - 1));
          return newHistory;
        });
        return updatedState;
      });
    },
    [historyIndex]
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
                  style: { ...getNodeStyle(nodeId), ...styleUpdate },
                },
              }
            : node
        ),
      });
    },
    [currentState.nodeStyles, currentState.nodes, getNodeStyle, updateState]
  );

  const onNodeSelect = useCallback((nodeId: string | null) => {
    setSelectedNode(nodeId);
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

  const copyNode = useCallback(() => {
    if (selectedNode) {
      const nodeToCopy = currentState.nodes.find(
        (node) => node.id === selectedNode
      );
      if (nodeToCopy) {
        clipboardRef.current = { ...nodeToCopy, id: `${Date.now()}` };
      }
    }
  }, [currentState.nodes, selectedNode]);

  const pasteNode = useCallback(() => {
    if (clipboardRef.current) {
      const newNode = {
        ...clipboardRef.current,
        position: {
          x: clipboardRef.current.position.x + 50,
          y: clipboardRef.current.position.y + 50,
        },
      };
      updateState({ nodes: [...currentState.nodes, newNode] });
    }
  }, [currentState.nodes, updateState]);

  const lockNode = useCallback(() => {
    if (selectedNode) {
      const currentStyle = getNodeStyle(selectedNode);
      updateNodeStyle(selectedNode, { locked: !currentStyle.locked });
    }
  }, [selectedNode, updateNodeStyle, getNodeStyle]);

  const changeShape = useCallback(
    (shape: "rectangle" | "rounded" | "circle" | "swimlane") => {
      if (selectedNode) {
        updateNodeStyle(selectedNode, { shape });
      }
    },
    [selectedNode, updateNodeStyle]
  );

  const addSwimlane = useCallback(() => {
    const newSwimlane = {
      id: `swimlane-${Date.now()}`,
      type: "swimlaneNode",
      position: { x: 100, y: 100 },
      style: { width: 600, height: 200 },
      data: { label: "New Swimlane" },
    };
    updateState({ nodes: [...currentState.nodes, newSwimlane] });
  }, [currentState.nodes, updateState]);

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

  const selectedStyle = selectedNode ? getNodeStyle(selectedNode) : null;

  return (
    <ReactFlowProvider>
      <div className="min-h-screen bg-white flex flex-col w-screen">
        <Header />
        <Toolbar
          key={selectedNode || "no-selection"}
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
          onCopy={copyNode}
          onPaste={pasteNode}
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
        />
        <div className="flex flex-1 overflow-hidden">
          <VerticalNav className="hidden md:flex" />
          <div className="flex-1 flex flex-col md:flex-row relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 left-2 md:hidden z-20"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <Sidebar
              className={`${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              } transition-transform md:translate-x-0 absolute md:relative z-10 md:z-0`}
            />
            <div className="flex-1 relative">
              <UMLEditor
                nodes={currentState.nodes}
                edges={currentState.edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeStyles={currentState.nodeStyles}
                onNodeSelect={onNodeSelect}
                onAddSwimlane={addSwimlane}
                onLabelChange={onLabelChange}
              />
            </div>
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
