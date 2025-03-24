"use client";

import type React from "react";
import { memo, useCallback, useEffect, useState } from "react";
import { Handle, NodeResizer, Position } from "reactflow";

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
      | "walking-man";

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

    // List of human figure shapes
    const humanFigureShapes = [
      "actor",
      "standing-woman",
      "sitting",
      "arms-stretched",
      "walking-man",
    ];

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

    // Handle styles - only visible when selected
    const handleStyle = {
      opacity: selected ? 1 : 0,
      width: "0.75rem",
      height: "0.75rem",
    };

    // Render text within SVG using foreignObject - fixed for human figures
    const renderTextWithForeignObject = (
      x: number,
      y: number,
      width: number,
      height: number,
      isHumanFigure = false
    ) => {
      // For human figures, render text at the bottom if there's content
      if (isHumanFigure) {
        return (
          <foreignObject
            x={0}
            y={nodeSize.height - 30}
            width={nodeSize.width}
            height={30}
          >
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
      }

      // For other shapes, use normal rendering
      return (
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

      // Set up SVG for human figures to fit content better
      const getHumanFigureSvgStyle = () => ({
        ...svgStyle,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "auto",
        padding: 0,
      });

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
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
              }}
            >
              <svg
                style={getHumanFigureSvgStyle()}
                preserveAspectRatio="xMidYMid meet"
                viewBox="-421 153 117 256"
                xmlSpace="preserve"
                fill={data.style?.borderColor || "#000000"}
              >
                <path
                  d="M-362.9,157.9c11.3,0,20.5,9.2,20.5,20.5s-9.2,20.5-20.5,20.5s-20.5-9.2-20.5-20.5S-374.2,157.9-362.9,157.9z M-337.1,204.2
                  h-51.2c-14.2,0-25.6,11.4-25.6,25.6v62.6c0,4.9,3.9,9,9,9s9-3.9,9-9v-57.5c0-1.4,1.2-2.6,2.6-2.6c1.4,0,2.6,1.2,2.6,2.6v155.2
                  c0,7.7,5.7,14,12.8,14s12.8-6.3,12.8-14v-88.5c0-1.4,1.2-2.6,2.6-2.6s2.6,1.2,2.6,2.6v88.5c0,7.7,5.7,14,12.8,14s12.8-6.3,12.8-14
                  V234.9c0-1.4,1.2-2.6,2.6-2.6c1.4,0,2.6,1.2,2.6,2.6v57.6c0,4.9,3.9,9,9,9s9-3.9,9-9v-62.7C-311.5,215.6-323.2,204.2-337.1,204.2z"
                />
              </svg>
              {labelValue && (
                <div
                  style={{
                    width: "100%",
                    ...getTextStyle(),
                    marginTop: "auto",
                    padding: "4px 0",
                  }}
                >
                  {labelValue}
                </div>
              )}
            </div>
          );

        case "sitting":
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
              }}
            >
              <svg
                style={getHumanFigureSvgStyle()}
                fill={data.style?.borderColor || "#000000"}
                version="1.1"
                viewBox="0 0 128 128"
                xmlSpace="preserve"
              >
                <path
                  d="M44.7,46.3c-2.1-13.7,17.6-17.8,20.8-3.9l5.4,26.8l20.1,0c5.8,0,8.9,4.7,8.9,9v36.4c0,8.9-12.6,8.8-12.6-0.2V86.2H61.6
                  c-6,0-9.7-4.1-10.6-8.8L44.7,46.3z"
                />
                <path d="M54.1,30.3c6.5,0,11.8-5.2,11.9-11.8C66,12,60.7,6.7,54.1,6.7c-6.5,0-11.8,5.2-11.8,11.7C42.3,25,47.5,30.3,54.1,30.3" />
                <path
                  d="M28.4,60.6c-1.4-7.6,8.6-9.4,10-1.8l4.4,23.9c1,5,4.6,9.2,9.8,10.8c1.6,0.5,3.3,0.5,4.8,0.6l14.5,0.1
                  c7.7,0,7.7,10.1-0.1,10.1l-15.2-0.1c-2.3,0-4.7-0.3-7-1c-9-2.7-15.3-10.1-16.9-18.7L28.4,60.6z"
                />
              </svg>
              {labelValue && (
                <div
                  style={{
                    width: "100%",
                    ...getTextStyle(),
                    marginTop: "auto",
                    padding: "4px 0",
                  }}
                >
                  {labelValue}
                </div>
              )}
            </div>
          );

        case "standing-woman":
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
              }}
            >
              <svg
                style={getHumanFigureSvgStyle()}
                fill={data.style?.borderColor || "#000000"}
                version="1.2"
                baseProfile="tiny"
                viewBox="-63 65 128 128"
                xmlSpace="preserve"
              >
                <path
                  d="M11.3,89.8c7.2,0,12.4,5.9,13.4,9.2l8.8,29c1.8,6.2-6.2,8.8-8.1,2.7l-8-26.6H13l13.3,47.3H13.6v36.9c0,6.3-9.5,6.3-9.5,0
                  v-37.2h-4.8v37.1c0,6.4-9.5,6.4-9.5,0v-36.8h-12.7l13.2-47.3h-4.4l-7.9,26.7c-1.9,5.8-9.9,3.4-8.1-2.8l8.8-29
                  c0.9-3.3,5.1-9.2,12.4-9.2C-8.9,89.8,11.3,89.8,11.3,89.8z"
                />
                <path d="M1.7,87.6C7.4,87.6,12,83,12,77.3C12,71.6,7.4,67,1.7,67C-4,67-8.5,71.6-8.5,77.3C-8.5,83-4,87.6,1.7,87.6" />
              </svg>
              {labelValue && (
                <div
                  style={{
                    width: "100%",
                    ...getTextStyle(),
                    marginTop: "auto",
                    padding: "4px 0",
                  }}
                >
                  {labelValue}
                </div>
              )}
            </div>
          );

        case "arms-stretched":
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
              }}
            >
              <svg
                style={getHumanFigureSvgStyle()}
                fill={data.style?.borderColor || "#000000"}
                version="1.1"
                viewBox="0 0 256 256"
                xmlSpace="preserve"
              >
                <g>
                  <circle cx="127.7" cy="23.7" r="20.9" />
                  <path
                    d="M212.4,5.5c-3.6-3.6-9.3-3.6-12.9,0L170,35l-10.2,10.2c-3.1,3-7.1,4.6-11.1,4.6h-21h0h-21.3c-6.7,0-13.3,2.5-18.4,7.6
                    l-50.4,50.4c-3.6,3.6-3.6,9.3,0,12.9c3.6,3.6,9.3,3.6,12.9,0l44.1-44.1c0.5-0.5,1.1-0.8,1.8-0.8c1.4,0,2.6,1.2,2.6,2.6v23.5v44.3
                    v93.9c0,7.2,5.8,13,13,13c7.2,0,13-5.8,13-13v-91.3c0-1.4,1.2-2.6,2.6-2.6c1.4,0,2.6,1.2,2.6,2.6v91.3c0,7.2,5.8,13,13,13
                    s13-5.8,13-13v-93.9h0V74.4l26.5-26.5l29.5-29.5C215.9,14.9,215.9,9.1,212.4,5.5z"
                  />
                </g>
              </svg>
              {labelValue && (
                <div
                  style={{
                    width: "100%",
                    ...getTextStyle(),
                    marginTop: "auto",
                    padding: "4px 0",
                  }}
                >
                  {labelValue}
                </div>
              )}
            </div>
          );

        case "walking-man":
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
              }}
            >
              <svg
                style={getHumanFigureSvgStyle()}
                fill={data.style?.borderColor || "#000000"}
                version="1.2"
                baseProfile="tiny"
                viewBox="-191 65 256 256"
                xmlSpace="preserve"
              >
                <path
                  d="M-55.5,110.5c11.1,0.8,21.1-7.4,22.1-19c0.8-11.1-7.4-21.1-19-22.1c-11.1-0.8-21.1,7.4-22.1,19
                  C-75.2,99.7-66.6,109.7-55.5,110.5 M-72.9,118.9c3.9-2.9,8.8-4.5,14.3-4.3c6.8,0.6,12.9,4.9,16.2,10l20.5,40.8l27.9,19.5
                  c2.3,2,3.9,4.9,3.7,8c-0.2,5.1-4.9,8.8-10,8.2c-1.4,0-2.9-0.6-4.3-1.4l-30.1-20.5c-0.8-0.8-1.8-1.8-2.3-2.9l-7.8-15.2l-9.2,40.6
                  l36.3,43c0.8,1.4,1.4,2.9,1.8,4.3l9.8,51.8c0,1.2,0,2,0,2.9c-0.6,7.8-7.2,13.1-14.9,12.9c-6.3-0.6-10.9-5.1-12.5-10.9l-9.2-48.3
                  l-29.5-32.8l-6.8,31.5c-0.2,1.4-2.3,4.5-2.9,5.7l-28.1,47.9c-2.9,4.3-7.4,7.2-12.9,6.6c-7.8-0.6-13.5-7.2-12.9-14.9
                  c0.2-2.3,1.2-4.3,2-6.1l26.4-44l21.9-97.1l-14.3,11.5l-7.8,34.6c-0.8,4.3-5.1,8-9.8,7.8c-5.1-0.2-8.8-4.9-8.6-10
                  c0-0.2,0-0.8,0.2-1.2l8.8-40.3c0.6-1.8,1.4-3.1,2.9-4.3L-72.9,118.9z"
                />
              </svg>
              {labelValue && (
                <div
                  style={{
                    width: "100%",
                    ...getTextStyle(),
                    marginTop: "auto",
                    padding: "4px 0",
                  }}
                >
                  {labelValue}
                </div>
              )}
            </div>
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
                  WebkitLineClamp: maxLines,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  ...getTextStyle(),
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                  display: "flex",
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
                  WebkitLineClamp: maxLines,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  ...getTextStyle(),
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: data.style?.textAlign,
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
