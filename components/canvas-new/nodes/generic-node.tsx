"use client";

import { memo, useState, useCallback, useEffect } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import type React from "react";

interface GenericNodeProps {
  data: {
    label: string;
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
      | "interface";
    style?: React.CSSProperties & {
      fontFamily?: string;
      fontSize?: number;
      isBold?: boolean;
      isItalic?: boolean;
      isUnderline?: boolean;
      textAlign?: "left" | "center" | "right" | "justify";
      locked?: boolean;
      borderStyle?: string;
      borderWidth?: number;
      backgroundColor?: string;
      borderColor?: string;
      textColor?: string;
      lineHeight?: number;
    };
    onLabelChange?: (nodeId: string, newLabel: string) => void;
  };
  id: string;
  selected: boolean;
  isConnectable: boolean;
}

export const GenericNode = memo(
  ({ data, id, selected, isConnectable }: GenericNodeProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [labelValue, setLabelValue] = useState(data.label);
    const [nodeSize, setNodeSize] = useState({ width: 100, height: 100 });

    // Sync label with data changes
    useEffect(() => {
      setLabelValue(data.label);
    }, [data.label]);

    // Handle double-click to enable editing
    const handleDoubleClick = useCallback(() => {
      if (!data.style?.locked) {
        setIsEditing(true);
      }
    }, [data.style?.locked]);

    // Handle blur to exit editing mode
    const handleBlur = useCallback(() => {
      setIsEditing(false);
      if (data.onLabelChange) {
        data.onLabelChange(id, labelValue);
      }
    }, [data, id, labelValue]);

    // Handle Enter key to exit editing mode
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

    // Update node size on resize
    const handleResize = useCallback(
      (evt: any, { width, height }: { width: number; height: number }) => {
        setNodeSize({ width, height });
      },
      []
    );

    // Define consistent text styles
    const getTextStyle = () => ({
      fontFamily: data.style?.fontFamily || "Arial",
      fontSize: `${data.style?.fontSize || 12}px`,
      fontWeight: data.style?.isBold ? "bold" : "normal",
      fontStyle: data.style?.isItalic ? "italic" : "normal",
      textDecoration: data.style?.isUnderline ? "underline" : "none",
      textAlign: data.style?.textAlign || "center",
      color: data.style?.textColor || "#000000",
      lineHeight: `${data.style?.lineHeight || 1.2}`,
    });

    // Calculate maximum lines for truncation
    const calculateMaxLines = () => {
      const fontSize = data.style?.fontSize || 12;
      const lineHeight = data.style?.lineHeight || 1.2;
      const textHeight = fontSize * lineHeight;
      return Math.floor(nodeSize.height / textHeight);
    };

    // Base node style with centering
    const nodeStyle: React.CSSProperties = {
      width: nodeSize.width,
      height: nodeSize.height,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    };

    // Shape style with centering
    const shapeStyle: React.CSSProperties = {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };

    // Common shape properties
    const shapeProps = {
      fill: data.style?.backgroundColor || "white",
      stroke: data.style?.borderColor || "#000000",
      strokeWidth: data.style?.borderWidth || 1,
      strokeDasharray:
        data.style?.borderStyle === "dashed"
          ? "5,5"
          : data.style?.borderStyle === "dotted"
            ? "1,5"
            : undefined,
    };

    // Render text within SVG using foreignObject
    const renderTextWithForeignObject = (
      x: number,
      y: number,
      width: number,
      height: number
    ) => (
      <foreignObject x={x} y={y} width={width} height={height}>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...getTextStyle(),
            whiteSpace: "normal",
            wordWrap: "break-word",
            overflow: "hidden",
          }}
        >
          {labelValue}
        </div>
      </foreignObject>
    );

    // Render different shapes with text alignment and truncation
    const renderShape = () => {
      const svgStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        maxWidth: "100%",
        maxHeight: "100%",
      };

      const maxLines = calculateMaxLines();

      switch (data.shape) {
        case "circle":
        case "useCase":
          return (
            <svg
              style={svgStyle}
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
            >
              <ellipse cx="50" cy="50" rx="45" ry="45" {...shapeProps} />
              {renderTextWithForeignObject(10, 10, 80, 80)}
            </svg>
          );
        case "diamond":
          return (
            <svg
              style={svgStyle}
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
            >
              <polygon points="50,5 95,50 50,95 5,50" {...shapeProps} />
              {renderTextWithForeignObject(10, 10, 80, 80)}
            </svg>
          );
        case "hexagon":
          return (
            <svg
              style={svgStyle}
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
            >
              <polygon
                points="25,5 75,5 95,50 75,95 25,95 5,50"
                {...shapeProps}
              />
              {renderTextWithForeignObject(10, 10, 80, 80)}
            </svg>
          );
        case "triangle":
          return (
            <svg
              style={svgStyle}
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
            >
              <polygon points="50,5 95,95 5,95" {...shapeProps} />
              {renderTextWithForeignObject(20, 40, 60, 50)}
            </svg>
          );
        case "actor":
          return (
            <svg
              style={svgStyle}
              viewBox="0 0 100 120"
              preserveAspectRatio="xMidYMid meet"
            >
              <circle cx="50" cy="20" r="15" {...shapeProps} />
              <line
                x1="50"
                y1="35"
                x2="50"
                y2="70"
                stroke={data.style?.borderColor || "#000000"}
                strokeWidth={data.style?.borderWidth || 1}
              />
              <line
                x1="30"
                y1="50"
                x2="70"
                y2="50"
                stroke={data.style?.borderColor || "#000000"}
                strokeWidth={data.style?.borderWidth || 1}
              />
              <line
                x1="50"
                y1="70"
                x2="30"
                y2="90"
                stroke={data.style?.borderColor || "#000000"}
                strokeWidth={data.style?.borderWidth || 1}
              />
              <line
                x1="50"
                y1="70"
                x2="70"
                y2="90"
                stroke={data.style?.borderColor || "#000000"}
                strokeWidth={data.style?.borderWidth || 1}
              />
              {renderTextWithForeignObject(10, 90, 80, 30)}
            </svg>
          );
        case "class":
          return (
            <div
              style={{
                ...shapeStyle,
                borderColor: data.style?.borderColor || "#000000",
                borderStyle: data.style?.borderStyle || "solid",
                borderWidth: `${data.style?.borderWidth || 1}px`,
              }}
              className="flex flex-col"
            >
              <div
                className="border-b-2 p-2 font-bold"
                style={{
                  borderColor: data.style?.borderColor || "#000000",
                  backgroundColor: data.style?.backgroundColor || "white",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    display: "-webkit-box",
                    WebkitLineClamp: maxLines,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    ...getTextStyle(),
                    whiteSpace: "normal",
                    wordWrap: "break-word",
                  }}
                >
                  {labelValue}
                </div>
              </div>
              <div
                className="border-b-2 p-2"
                style={{
                  borderColor: data.style?.borderColor || "#000000",
                  backgroundColor: data.style?.backgroundColor || "white",
                }}
              >
                Attributes
              </div>
              <div
                className="p-2"
                style={{
                  backgroundColor: data.style?.backgroundColor || "white",
                }}
              >
                Methods
              </div>
            </div>
          );
        case "interface":
          return (
            <div
              style={{
                ...shapeStyle,
                borderColor: data.style?.borderColor || "#000000",
                borderStyle: data.style?.borderStyle || "solid",
                borderWidth: `${data.style?.borderWidth || 1}px`,
                backgroundColor: data.style?.backgroundColor || "white",
              }}
              className="flex flex-col"
            >
              <div
                className="border-b-2 p-2 font-bold"
                style={{ borderColor: data.style?.borderColor || "#000000" }}
              >
                «interface»
              </div>
              <div className="p-2">
                <div
                  style={{
                    width: "100%",
                    display: "-webkit-box",
                    WebkitLineClamp: maxLines,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    ...getTextStyle(),
                    whiteSpace: "normal",
                    wordWrap: "break-word",
                  }}
                >
                  {labelValue}
                </div>
              </div>
            </div>
          );
        case "rounded":
          return (
            <div
              style={{
                ...shapeStyle,
                borderRadius: "8px",
                borderColor: data.style?.borderColor || "#000000",
                borderStyle: data.style?.borderStyle || "solid",
                borderWidth: `${data.style?.borderWidth || 1}px`,
                backgroundColor: data.style?.backgroundColor || "white",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  // display: "-webkit-box",
                  WebkitLineClamp: maxLines,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  ...getTextStyle(),
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {labelValue}
              </div>
            </div>
          );
        default:
          return (
            <div
              style={{
                ...shapeStyle,
                borderColor: data.style?.borderColor || "#000000",
                borderStyle: data.style?.borderStyle || "solid",
                borderWidth: `${data.style?.borderWidth || 1}px`,
                backgroundColor: data.style?.backgroundColor || "white",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  WebkitLineClamp: maxLines,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  ...getTextStyle(),
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {labelValue}
              </div>
            </div>
          );
      }
    };

    return (
      <>
        <NodeResizer
          isVisible={selected}
          minWidth={100}
          minHeight={100}
          onResize={handleResize}
        />
        <div
          style={{ ...nodeStyle, ...shapeStyle }}
          className={`${data.style?.locked ? "cursor-not-allowed" : "cursor-pointer"}`}
        >
          {/* Target Handles */}
          <Handle
            type="target"
            position={Position.Top}
            className="w-3 h-3"
            isConnectable={isConnectable}
            id="a"
          />
          <Handle
            type="target"
            position={Position.Bottom}
            className="w-3 h-3"
            isConnectable={isConnectable}
            id="b"
          />
          <Handle
            type="target"
            position={Position.Right}
            className="w-3 h-3"
            isConnectable={isConnectable}
            id="c"
          />
          <Handle
            type="target"
            position={Position.Left}
            className="w-3 h-3"
            isConnectable={isConnectable}
            id="d"
          />

          {/* Source Handles */}
          <Handle
            type="source"
            position={Position.Top}
            className="w-3 h-3"
            isConnectable={isConnectable}
            id="e"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3"
            isConnectable={isConnectable}
            id="f"
          />
          <Handle
            type="source"
            position={Position.Right}
            className="w-3 h-3"
            isConnectable={isConnectable}
            id="g"
          />
          <Handle
            type="source"
            position={Position.Left}
            className="w-3 h-3"
            isConnectable={isConnectable}
            id="h"
          />

          {/* Render editable input or shape */}
          {isEditing ? (
            <input
              type="text"
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full text-center bg-transparent border-none outline-none"
              style={getTextStyle()}
              autoFocus
            />
          ) : (
            <div className="w-full h-full" onDoubleClick={handleDoubleClick}>
              {renderShape()}
            </div>
          )}
        </div>
      </>
    );
  }
);

GenericNode.displayName = "GenericNode";
