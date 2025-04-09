"use client";

import type { default as JSX, default as React } from "react";

import {
  $getNodeByKey,
  DecoratorNode,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import { memo, useCallback, useEffect, useRef, useState } from "react";

// Add this after the imports
declare global {
  interface Window {
    lexicalEditor?: LexicalEditor;
  }
}

export type ReactFlowData = {
  id: string;
  title: string;
  description?: string;
  flowData: {
    imageData?: string;
    dimensions?: {
      width: number;
      height: number;
    };
    originalNodes?: any[];
    originalEdges?: any[];
  };
};

export type SerializedReactFlowNode = Spread<
  {
    flowId: string;
    title: string;
    flowData: {
      imageData?: string;
      dimensions?: {
        width: number;
        height: number;
      };
      originalNodes?: any[];
      originalEdges?: any[];
    };
  },
  SerializedLexicalNode
>;

export class ReactFlowNode extends DecoratorNode<any> {
  __flowId: string;
  __title: string;
  __flowData: {
    imageData?: string;
    dimensions?: {
      width: number;
      height: number;
    };
    originalNodes?: any[];
    originalEdges?: any[];
  };

  static getType(): string {
    return "react-flow";
  }

  static clone(node: ReactFlowNode): ReactFlowNode {
    return new ReactFlowNode(
      node.__flowId,
      node.__title,
      node.__flowData,
      node.__key
    );
  }

  constructor(
    flowId: string,
    title: string,
    flowData: {
      imageData?: string;
      dimensions?: {
        width: number;
        height: number;
      };
      originalNodes?: any[];
      originalEdges?: any[];
    },
    key?: NodeKey
  ) {
    super(key);
    this.__flowId = flowId;
    this.__title = title;
    this.__flowData = flowData;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement("div");
    div.className = "react-flow-container";
    return div;
  }

  updateDOM(): false {
    return false;
  }

  getFlowId(): string {
    return this.__flowId;
  }

  getTitle(): string {
    return this.__title;
  }

  getFlowData(): {
    imageData?: string;
    dimensions?: {
      width: number;
      height: number;
    };
    originalNodes?: any[];
    originalEdges?: any[];
  } {
    return this.__flowData;
  }

  setDimensions(width: number, height: number): void {
    if (!this.__flowData.dimensions) {
      this.__flowData.dimensions = { width, height };
    } else {
      this.__flowData.dimensions.width = width;
      this.__flowData.dimensions.height = height;
    }
  }

  static importJSON(serializedNode: SerializedReactFlowNode): ReactFlowNode {
    const { flowId, title, flowData } = serializedNode;
    const node = new ReactFlowNode(flowId, title, flowData);
    return node;
  }

  exportJSON(): SerializedReactFlowNode {
    return {
      flowId: this.__flowId,
      title: this.__title,
      flowData: this.__flowData,
      type: "react-flow",
      version: 1,
    };
  }

  decorate(editor: LexicalEditor): JSX.CElement<any, any> {
    return (
      <ReactFlowComponent
        flowId={this.__flowId}
        title={this.__title}
        flowData={this.__flowData}
        nodeKey={this.__key}
        editor={editor}
      />
    );
  }
}

const ReactFlowComponent = memo(function ReactFlowComponent({
  flowId,
  title,
  flowData,
  nodeKey,
  editor,
}: {
  flowId: string;
  title: string;
  flowData: {
    imageData?: string;
    dimensions?: {
      width: number;
      height: number;
    };
    originalNodes?: any[];
    originalEdges?: any[];
  };
  nodeKey: NodeKey;
  editor: LexicalEditor;
}): any {
  const [isSelected, setIsSelected] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Use the dimensions from flowData directly
  const width = flowData.dimensions?.width;
  const height = flowData.dimensions?.height;

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

  // Update node dimensions in Lexical
  const updateNodeDimensions = useCallback(
    (newWidth: number, newHeight: number) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node instanceof ReactFlowNode) {
          node.setDimensions(newWidth, newHeight);
        }
      });
    },
    [editor, nodeKey]
  );

  // Simple resize functions for each corner/edge
  const startResizeTopLeft = (e: React.MouseEvent) => startResize(e, -1, -1);
  const startResizeTop = (e: React.MouseEvent) => startResize(e, 0, -1);
  const startResizeTopRight = (e: React.MouseEvent) => startResize(e, 1, -1);
  const startResizeRight = (e: React.MouseEvent) => startResize(e, 1, 0);
  const startResizeBottomRight = (e: React.MouseEvent) => startResize(e, 1, 1);
  const startResizeBottom = (e: React.MouseEvent) => startResize(e, 0, 1);
  const startResizeBottomLeft = (e: React.MouseEvent) => startResize(e, -1, 1);
  const startResizeLeft = (e: React.MouseEvent) => startResize(e, -1, 0);

  // Main resize function
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
    const startWidth = wrapperRef.current?.offsetWidth || 0;
    const startHeight = wrapperRef.current?.offsetHeight || 0;

    // Create resize function
    const resize = (moveEvent: MouseEvent) => {
      // Calculate deltas
      const deltaX = (moveEvent.clientX - startX) * directionX;
      const deltaY = (moveEvent.clientY - startY) * directionY;

      // Set new dimensions
      if (wrapperRef.current) {
        // Apply width changes if we're resizing horizontally
        if (directionX !== 0) {
          const newWidth = Math.max(200, startWidth + deltaX);
          wrapperRef.current.style.width = `${newWidth}px`;
        }

        // Apply height changes if we're resizing vertically
        if (directionY !== 0) {
          const newHeight = Math.max(150, startHeight + deltaY);
          wrapperRef.current.style.height = `${newHeight}px`;
        }
      }
    };

    // Create stop function
    const stopResize = () => {
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResize);

      // Update the node's internal data structure with the new dimensions
      if (wrapperRef.current) {
        const newWidth = wrapperRef.current.offsetWidth;
        const newHeight = wrapperRef.current.offsetHeight;

        // Update the node dimensions in Lexical
        updateNodeDimensions(newWidth, newHeight);
      }
    };

    // Add event listeners
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
  };

  // Set default dimensions if not provided
  const defaultWidth = width || 500;
  const defaultHeight = height || 300;

  return (
    <div
      className={`my-4 relative ${isSelected ? "is-selected" : ""}`}
      style={{
        width: `${defaultWidth}px`,
        height: `${defaultHeight}px`,
        maxWidth: "100%",
      }}
      ref={wrapperRef}
      onClick={() => setIsSelected(true)}
    >
      <div
        className={`w-full h-full overflow-hidden rounded-md ${
          isSelected ? "border-2 border-blue-500" : "border border-gray-200"
        } shadow-sm`}
      >
        <div
          ref={imageRef}
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            overflow: "hidden",
            backgroundColor: "#f9f9f9",
          }}
        >
          {flowData.imageData ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <img
                src={flowData.imageData || "/placeholder.svg"}
                alt={title}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500">
              No canvas data available
            </div>
          )}
        </div>
      </div>

      {/* Resize handles - only visible when selected */}
      {isSelected && (
        <>
          {/* Top-left */}
          <div
            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-nwse-resize"
            onMouseDown={startResizeTopLeft}
          />

          {/* Top */}
          <div
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-ns-resize"
            onMouseDown={startResizeTop}
          />

          {/* Top-right */}
          <div
            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-nesw-resize"
            onMouseDown={startResizeTopRight}
          />

          {/* Right */}
          <div
            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-ew-resize"
            onMouseDown={startResizeRight}
          />

          {/* Bottom-right */}
          <div
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-nwse-resize"
            onMouseDown={startResizeBottomRight}
          />

          {/* Bottom */}
          <div
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-ns-resize"
            onMouseDown={startResizeBottom}
          />

          {/* Bottom-left */}
          <div
            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-nesw-resize"
            onMouseDown={startResizeBottomLeft}
          />

          {/* Left */}
          <div
            className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-ew-resize"
            onMouseDown={startResizeLeft}
          />
        </>
      )}
    </div>
  );
});

export function $createReactFlowNode(
  flowId: string,
  title: string,
  flowData: {
    imageData?: string;
    dimensions?: {
      width: number;
      height: number;
    };
    originalNodes?: any[];
    originalEdges?: any[];
  }
): ReactFlowNode {
  return new ReactFlowNode(flowId, title, flowData);
}

export function $isReactFlowNode(
  node: LexicalNode | null | undefined
): node is ReactFlowNode {
  return node instanceof ReactFlowNode;
}
