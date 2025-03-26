"use client";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Handle, NodeResizer, Position } from "reactflow";
import { SHAPE_DEFINITIONS, isHumanFigure } from "../shape-utils";
import TextareaAutosize from "react-textarea-autosize";

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
      | "cylindar";

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

const SHOULD_MAINTAIN_ASPECT_RATIO: Record<string, boolean> = {
  circle: true,
  square: true,
  hexagon: true,
  diamond: true,
  triangle: true,
  cylinder: true,
};

export const GenericNode = memo(
  ({ data, id, selected, isConnectable }: GenericNodeProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [labelValue, setLabelValue] = useState(data.label);
    const [nodeSize, setNodeSize] = useState({ width: 100, height: 100 });

    // Check if current shape is a human figure
    const currentShapeIsHumanFigure = isHumanFigure(data.shape);

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

    // Update node size on resize with smoother handling
    const handleResize = useCallback(
      (
        _: any,
        {
          width,
          height,
        }: {
          width: number;
          height: number;
        }
      ) => {
        const MAX_DIMENSION = 2000;
        const newWidth = Math.min(Math.max(width, 30), MAX_DIMENSION);
        const newHeight = Math.min(Math.max(height, 30), MAX_DIMENSION);

        setNodeSize({ width: newWidth, height: newHeight });
      },
      []
    );

    // Define consistent text styles
    const getTextStyle = useCallback(
      () => ({
        fontFamily: data.style?.fontFamily || "Arial",
        fontSize: `${data.style?.fontSize || 12}px`,
        fontWeight: data.style?.isBold ? "bold" : "normal",
        fontStyle: data.style?.isItalic ? "italic" : "normal",
        textDecoration: data.style?.isUnderline ? "underline" : "none",
        color: data.style?.textColor || "#000000",
        lineHeight: `${data.style?.lineHeight || 1.2}`,
        textAlign: data.style?.textAlign || "center",
      }),
      [data.style]
    );

    // Calculate maximum lines for truncation
    const calculateMaxLines = () => {
      const fontSize = data.style?.fontSize || 12;
      const lineHeight = data.style?.lineHeight || 1.2;
      const textHeight = fontSize * lineHeight;
      return Math.floor(nodeSize.height / textHeight);
    };

    // Base node style with centering
    const nodeStyle: React.CSSProperties = {
      transition: `
    width 0.15s cubic-bezier(0.4, 0, 0.2, 1),
    height 0.15s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)
  `,
      willChange: "width, height, transform",
    };
    // Shape style with centering
    const shapeStyle: React.CSSProperties = {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };

    // Common shape properties - outline only for human figures
    const shapeProps = useMemo(
      () => ({
        fill: data.style?.backgroundColor || "white",
        stroke: data.style?.borderColor || "#000000",
        strokeWidth: data.style?.borderWidth || 1,
        strokeDasharray:
          data.style?.borderStyle === "dashed"
            ? "5,5"
            : data.style?.borderStyle === "dotted"
              ? "1,5"
              : undefined,
      }),
      [data.style]
    );

    // Handle styles - improved visibility when selected
    const handleStyle = useMemo(
      () => ({
        opacity: selected ? 1 : 0,
        width: "0.75rem",
        height: "0.75rem",
        backgroundColor: "#1a192b",
        border: "1px solid white",
        transition: "opacity 0.2s ease", // Smooth transition for handles
      }),
      [selected]
    );

    // Render text within SVG using foreignObject
    const renderTextWithForeignObject = (
      x: number,
      y: number,
      width: number,
      height: number
    ) => {
      return (
        <foreignObject x={x} y={y} width={width} height={height}>
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent:
                data.style?.textAlign === "left"
                  ? "flex-start"
                  : data.style?.textAlign === "right"
                    ? "flex-end"
                    : "center",
              ...getTextStyle(),
              whiteSpace: "normal",
              wordWrap: "break-word",
              overflow: "hidden",
              padding: "4px",
            }}
          >
            {labelValue}
          </div>
        </foreignObject>
      );
    };

    // Render different shapes with text alignment and truncation
    const renderShape = () => {
      const svgStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        maxWidth: "100%",
        maxHeight: "100%",
      };

      const maxLines = calculateMaxLines();

      // For human figures, we'll render the shape and text separately
      if (currentShapeIsHumanFigure) {
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Human figure shape */}
            <div
              style={{
                height: "75%",
                width: "100%",
                display: "flex",
                justifyContent: "center",
              }}
            >
              {SHAPE_DEFINITIONS[data.shape] && (
                <svg
                  style={{ height: "100%", maxWidth: "100%" }}
                  viewBox={SHAPE_DEFINITIONS[data.shape].viewBox}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {SHAPE_DEFINITIONS[data.shape].render(shapeProps)}
                </svg>
              )}
            </div>

            {/* Text below the shape */}
            {labelValue && (
              <div
                style={{
                  width: "100%",
                  minHeight: "20%",
                  ...getTextStyle(),
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    data.style?.textAlign === "left"
                      ? "flex-start"
                      : data.style?.textAlign === "right"
                        ? "flex-end"
                        : "center",
                  padding: "8px",
                  overflow: "visible",
                  marginTop: "5px",
                  wordBreak: "break-word",
                }}
              >
                {labelValue}
              </div>
            )}
          </div>
        );
      }

      // For other shapes, render with text inside
      if (SHAPE_DEFINITIONS[data.shape]) {
        return (
          <svg
            style={svgStyle}
            viewBox={SHAPE_DEFINITIONS[data.shape].viewBox}
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
          >
            {SHAPE_DEFINITIONS[data.shape].render(shapeProps)}
            {renderTextWithForeignObject(10, 10, 80, 80)}
          </svg>
        );
      }

      // Special cases for class and interface
      switch (data.shape) {
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
                  textAlign: data.style?.textAlign || "center",
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
                  textAlign: data.style?.textAlign || "center",
                }}
              >
                Attributes
              </div>
              <div
                className="p-2"
                style={{
                  backgroundColor: data.style?.backgroundColor || "white",
                  textAlign: data.style?.textAlign || "center",
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
                style={{
                  borderColor: data.style?.borderColor || "#000000",
                  textAlign: data.style?.textAlign || "center",
                }}
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
                  WebkitLineClamp: maxLines,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  ...getTextStyle(),
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    data.style?.textAlign === "left"
                      ? "flex-start"
                      : data.style?.textAlign === "right"
                        ? "flex-end"
                        : "center",
                  padding: "8px",
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
          minWidth={30} // Reduced minimum size
          minHeight={30}
          keepAspectRatio={SHOULD_MAINTAIN_ASPECT_RATIO[data.shape]} // Add aspect ratio config
          onResize={handleResize}
          handleStyle={{
            width: 12, // Larger handles
            height: 12,
            borderRadius: 6,
            backgroundColor: "#1a192b",
            border: "2px solid white",
          }}
          lineStyle={{
            borderWidth: 2,
            borderColor: "#1a192b",
          }}
        />
        <div
          style={{
            ...nodeStyle,
            ...shapeStyle,
            boxShadow: selected ? "0 0 0 1px rgba(26, 25, 43, 0.3)" : "none",
          }}
          className={`${data.style?.locked ? "cursor-not-allowed" : "cursor-pointer"}`}
          role="application"
          aria-label={`${data.shape} node`}
          aria-describedby={`node-${id}-desc`}
        >
          {/* Target Handles - Now only visible when selected */}
          <Handle
            type="target"
            position={Position.Top}
            style={handleStyle}
            isConnectable={isConnectable}
            id="a"
          />
          <Handle
            type="target"
            position={Position.Bottom}
            style={handleStyle}
            isConnectable={isConnectable}
            id="b"
          />
          <Handle
            type="target"
            position={Position.Right}
            style={handleStyle}
            isConnectable={isConnectable}
            id="c"
          />
          <Handle
            type="target"
            position={Position.Left}
            style={handleStyle}
            isConnectable={isConnectable}
            id="d"
          />

          {/* Source Handles - Now only visible when selected */}
          <Handle
            type="source"
            position={Position.Top}
            style={handleStyle}
            isConnectable={isConnectable}
            id="e"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            style={handleStyle}
            isConnectable={isConnectable}
            id="f"
          />
          <Handle
            type="source"
            position={Position.Right}
            style={handleStyle}
            isConnectable={isConnectable}
            id="g"
          />
          <Handle
            type="source"
            position={Position.Left}
            style={handleStyle}
            isConnectable={isConnectable}
            id="h"
          />

          {/* Render editable input or shape */}
          {isEditing ? (
            <TextareaAutosize
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onBlur={handleBlur}
              //@ts-ignore
              onKeyDown={handleKeyDown}
              className="w-full text-center bg-transparent border-none outline-none resize-none px-4"
              style={getTextStyle()}
              autoFocus
              minRows={1}
              maxRows={5}
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
