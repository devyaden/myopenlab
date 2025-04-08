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
    hidden?: Record<string, boolean>;
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

// Properties that should never be displayed
const EXCLUDED_PROPERTIES = [
  "label",
  "shape",
  "style",
  "hidden",
  "onLabelChange",
  "id",
  // "from",
  // "to",
  "parent",
  "children",
];

// Additional patterns to exclude (for function names and IDs)
const EXCLUDED_PATTERNS = [
  /^on[A-Z]/, // Matches event handlers like "onChange", "onAdd", etc.
  /Id$/, // Matches properties ending with "Id"
  /^id/, // Matches properties starting with "id"
];

// Shapes that need special padding for content
const SPECIAL_PADDING_SHAPES = ["hexagon", "diamond", "triangle", "circle"];

export const GenericNode = memo(
  ({ data, id, selected, isConnectable }: GenericNodeProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [labelValue, setLabelValue] = useState(data.label);
    const [nodeSize, setNodeSize] = useState({ width: 100, height: 100 });

    // Check if current shape is a human figure
    const currentShapeIsHumanFigure = isHumanFigure(data.shape);

    // Check if current shape needs special padding
    const needsSpecialPadding = SPECIAL_PADDING_SHAPES.includes(data.shape);

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

    // Helper function to check if a property should be excluded
    const shouldExcludeProperty = (key: string, value: any) => {
      // Check against explicit exclusion list
      if (EXCLUDED_PROPERTIES.includes(key)) return true;

      // Check if it's a function
      if (typeof value === "function") return true;

      // Check against regex patterns
      for (const pattern of EXCLUDED_PATTERNS) {
        if (pattern.test(key)) return true;
      }

      // Check if it's hidden
      if (data.hidden && data.hidden[key]) return true;

      return false;
    };

    // Get visible properties (not hidden and not excluded)
    const visibleProperties = useMemo(() => {
      const properties: { key: string; value: any }[] = [];

      // First add special properties (task and type) if they're not hidden
      const isTaskHidden = data.hidden?.task === true;
      const isTypeHidden = data.hidden?.type === true;

      // Add task property (using label) if not hidden
      if (!isTaskHidden) {
        properties.push({
          key: "task",
          value: data.label || "",
        });
      }

      // Add type property (using shape) if not hidden
      if (!isTypeHidden) {
        properties.push({
          key: "type",
          value: data.shape || "",
        });
      }

      // Loop through all data properties
      Object.entries(data).forEach(([key, value]) => {
        // Skip excluded properties and already added special properties
        if (
          !shouldExcludeProperty(key, value) &&
          !["task", "type"].includes(key)
        ) {
          properties.push({ key, value: String(value) });
        }
      });

      return properties;
    }, [data]);

    // Render properties table
    const renderPropertiesTable = () => {
      if (visibleProperties.length === 0) return null;

      // Calculate font size based on node size
      const baseFontSize = data.style?.fontSize || 12;
      const scaleFactor = Math.min(1, Math.max(0.6, nodeSize.width / 150)); // Scale between 60% and 100% based on width
      const fontSize = baseFontSize * 0.7 * scaleFactor; // Make font smaller and scale with node size

      return (
        <div
          style={{
            width: "100%",
            marginTop: "4px",
            fontSize: `${fontSize}px`,
            color: data.style?.textColor || "#000000",
            fontFamily: data.style?.fontFamily || "Arial",
            // overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            // gap: "2px",
          }}
        >
          {visibleProperties.map((prop) => (
            <div
              key={prop.key}
              style={{
                // padding: "2px 4px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textAlign: data.style?.textAlign || "center",
              }}
            >
              {prop.value}
            </div>
          ))}
        </div>
      );
    };

    // Calculate content padding based on shape
    const getContentPadding = () => {
      if (!needsSpecialPadding) return "8px";

      // For shapes like hexagon, diamond, etc., we need more padding
      const basePadding = Math.max(10, nodeSize.width * 0.15); // 15% of width or at least 10px
      return `${basePadding}px`;
    };

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
              flexDirection: "column",
              alignItems: "center",
              justifyContent:
                visibleProperties.length > 0 ? "flex-start" : "center",
              padding: "4px",
              overflow: "hidden",
            }}
          >
            {/* Title with 2-line clamp */}
            <div
              style={{
                width: "100%",
                ...getTextStyle(),
                fontWeight: "bold",
                textAlign:
                  data.style?.textAlign === "left"
                    ? "left"
                    : data.style?.textAlign === "right"
                      ? "right"
                      : "center",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                // overflow: "hidden",
                textOverflow: "ellipsis",
                zIndex: 50,
                // maxHeight: `calc(${data.style?.fontSize || 12}px * ${data.style?.lineHeight || 1.2} * 2)`,
                // marginBottom: "4px", // Add space between title and properties
              }}
            >
              {labelValue}
            </div>

            {/* Properties Table */}
            {renderPropertiesTable()}
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
            <div
              style={{
                width: "100%",
                minHeight: "20%",
                display: "flex",
                flexDirection: "column",
                alignItems:
                  data.style?.textAlign === "left"
                    ? "flex-start"
                    : data.style?.textAlign === "right"
                      ? "flex-end"
                      : "center",
                padding: "8px",
                overflow: "hidden",
                marginTop: "5px",
              }}
            >
              {/* Title with 2-line clamp */}
              <div
                style={{
                  width: "100%",
                  ...getTextStyle(),
                  fontWeight: "bold",
                  textAlign:
                    data.style?.textAlign === "left"
                      ? "left"
                      : data.style?.textAlign === "right"
                        ? "right"
                        : "center",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxHeight: `calc(${data.style?.fontSize || 12}px * ${data.style?.lineHeight || 1.2} * 2)`,
                  marginBottom: "4px", // Add space between title and properties
                }}
              >
                {labelValue}
              </div>

              {/* Properties Table */}
              {renderPropertiesTable()}
            </div>
          </div>
        );
      }

      // For other shapes, render with text inside
      if (SHAPE_DEFINITIONS[data.shape]) {
        // For SVG shapes, we need to adjust the foreignObject position and size
        // to account for the shape's geometry
        let foreignX = 10;
        let foreignY = 10;
        let foreignWidth = 80;
        let foreignHeight = 80;

        // Adjust for special shapes
        if (data.shape === "hexagon") {
          foreignX = 20;
          foreignY = 15;
          foreignWidth = 60;
          foreignHeight = 70;
        } else if (data.shape === "diamond") {
          foreignX = 25;
          foreignY = 25;
          foreignWidth = 50;
          foreignHeight = 50;
        } else if (data.shape === "triangle") {
          foreignX = 20;
          foreignY = 30;
          foreignWidth = 60;
          foreignHeight = 50;
        }

        return (
          <svg
            style={svgStyle}
            viewBox={SHAPE_DEFINITIONS[data.shape].viewBox}
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
          >
            {SHAPE_DEFINITIONS[data.shape].render(shapeProps)}
            {renderTextWithForeignObject(
              foreignX,
              foreignY,
              foreignWidth,
              foreignHeight
            )}
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
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    ...getTextStyle(),
                    whiteSpace: "normal",
                    wordWrap: "break-word",
                    maxHeight: `calc(${data.style?.fontSize || 12}px * ${data.style?.lineHeight || 1.2} * 2)`,
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
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    ...getTextStyle(),
                    whiteSpace: "normal",
                    wordWrap: "break-word",
                    maxHeight: `calc(${data.style?.fontSize || 12}px * ${data.style?.lineHeight || 1.2} * 2)`,
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
                padding: getContentPadding(), // Use dynamic padding based on shape
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems:
                    data.style?.textAlign === "left"
                      ? "flex-start"
                      : data.style?.textAlign === "right"
                        ? "flex-end"
                        : "center",
                  justifyContent:
                    visibleProperties.length > 0 ? "flex-start" : "center",
                  overflow: "hidden",
                }}
              >
                {/* Title with 2-line clamp */}
                <div
                  style={{
                    width: "100%",
                    ...getTextStyle(),
                    fontWeight: "bold",
                    textAlign:
                      data.style?.textAlign === "left"
                        ? "left"
                        : data.style?.textAlign === "right"
                          ? "right"
                          : "center",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    // overflow: "hidden",
                    // textOverflow: "ellipsis",
                    // maxHeight: `calc(${data.style?.fontSize || 12}px * ${data.style?.lineHeight || 1.2} * 2)`,
                    // marginBottom: "4px", // Add space between title and properties
                  }}
                >
                  {labelValue}
                </div>

                {/* Properties Table */}
                {renderPropertiesTable()}
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
              maxRows={2} // Limit to 2 rows when editing
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
