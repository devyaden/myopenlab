import { memo, useState, useCallback, useEffect } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "reactflow";
import type React from "react";

interface SwimlaneNodeData {
  label: string;
  style?: React.CSSProperties & {
    fontFamily?: string;
    fontSize?: number;
    isBold?: boolean;
    isItalic?: boolean;
    isUnderline?: boolean;
    textAlign?: "left" | "center" | "right" | "justify";
    locked?: boolean;
    isVertical?: boolean;
  };
  onLabelChange?: (nodeId: string, newLabel: string) => void;
}

export const SwimlaneNode = memo(
  ({ id, data, selected }: NodeProps<SwimlaneNodeData>) => {
    const [isEditing, setIsEditing] = useState(false);
    const [labelValue, setLabelValue] = useState(data.label);

    useEffect(() => {
      setLabelValue(data.label);
    }, [data.label]);

    const handleDoubleClick = useCallback(() => {
      if (!data.style?.locked) {
        setIsEditing(true);
      }
    }, [data.style?.locked]);

    const handleBlur = useCallback(() => {
      setIsEditing(false);
      if (data.onLabelChange) {
        data.onLabelChange(id, labelValue);
      }
    }, [data, id, labelValue]);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
          setIsEditing(false);
          if (data.onLabelChange) {
            data.onLabelChange(id, labelValue);
          }
        }
      },
      [data, id, labelValue]
    );

    const nodeStyle: React.CSSProperties = {
      width: "100%",
      height: "100%",
      border: `2px solid ${selected ? "#3182ce" : "#e2e8f0"}`,
      borderRadius: "4px",
      display: "flex",
      flexDirection: data.style?.isVertical ? "column" : "row",
      minWidth: "400px",
      minHeight: "100px",
      ...data.style,
      fontFamily: data.style?.fontFamily || "Arial",
      fontSize: data.style?.fontSize || 12,
      fontWeight: data.style?.isBold ? "bold" : "normal",
      fontStyle: data.style?.isItalic ? "italic" : "normal",
      textDecoration: data.style?.isUnderline ? "underline" : "none",
      textAlign: data.style?.textAlign || "left",
      borderStyle: "solid", // Always solid for swimlanes
    };

    const labelStyle: React.CSSProperties = {
      width: data.style?.isVertical ? "100%" : "40px",
      height: data.style?.isVertical ? "40px" : "100%",
      position: "absolute",
      top: 0,
      left: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f7fafc",
      padding: "8px",
      borderRight: data.style?.isVertical ? "none" : "1px solid #e2e8f0",
      borderBottom: data.style?.isVertical ? "1px solid #e2e8f0" : "none",
      writingMode: data.style?.isVertical ? "horizontal-tb" : "vertical-rl",
      transform: data.style?.isVertical ? "none" : "rotate(180deg)",
      zIndex: 10,
    };

    const contentStyle: React.CSSProperties = {
      flex: 1,
      padding: "8px",
      paddingTop: "48px", // Add this line to ensure space for the header
      minHeight: "100px",
      position: "relative",
    };

    return (
      <>
        <NodeResizer isVisible={selected} minWidth={400} minHeight={100} />
        <div
          style={nodeStyle}
          className={`${selected ? "ring-2 ring-blue-500" : ""}`}
        >
          <Handle type="target" position={Position.Left} className="w-3 h-3" />
          <div style={labelStyle}>
            {isEditing ? (
              <input
                type="text"
                value={labelValue}
                onChange={(e) => setLabelValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full text-center bg-transparent border-none outline-none"
                autoFocus
                style={{
                  ...nodeStyle,
                  writingMode: data.style?.isVertical
                    ? "horizontal-tb"
                    : "vertical-rl",
                  transform: data.style?.isVertical ? "none" : "rotate(180deg)",
                }}
              />
            ) : (
              <div onDoubleClick={handleDoubleClick}>{labelValue}</div>
            )}
          </div>
          <div style={contentStyle} className="pointer-events-none">
            {/* This is where child nodes will be rendered */}
          </div>
          <Handle type="source" position={Position.Right} className="w-3 h-3" />
        </div>
      </>
    );
  }
);

SwimlaneNode.displayName = "SwimlaneNode";
