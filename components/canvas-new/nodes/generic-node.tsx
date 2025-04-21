"use client";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  Handle,
  NodeResizer,
  Position,
  useReactFlow,
  useStore,
} from "reactflow";
import { SHAPE_DEFINITIONS, isHumanFigure } from "../shape-utils";
import TextareaAutosize from "react-textarea-autosize";

interface GenericNodeProps {
  data: {
    label: string;
    from: string;
    to: string;
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
    width?: number;
    height?: number;
    style?: React.CSSProperties & {
      fontFamily?: string;
      fontSize?: number;
      isBold?: boolean;
      isItalic?: boolean;
      isUnderline?: boolean;
      textAlign?: "left" | "center" | "right" | "justify";
      verticalAlign?: "top" | "middle" | "bottom";
      locked?: boolean;
      borderStyle?: string;
      borderWidth?: number;
      backgroundColor?: string;
      borderColor?: string;
      textColor?: string;
      lineHeight?: number;
    };
    onLabelChange?: (nodeId: string, newLabel: string) => void;
    onResize?: (nodeId: string, width: number, height: number) => void;
  };
  id: string;
  selected: boolean;
  isConnectable: boolean;
  xPos?: number;
  yPos?: number;
}

const SHOULD_MAINTAIN_ASPECT_RATIO: Record<string, boolean> = {
  circle: true,
  square: true,
};

// Properties that should never be displayed
const EXCLUDED_PROPERTIES = [
  "label",
  "shape",
  "style",
  "hidden",
  "onLabelChange",
  "onResize",
  "id",
  "width",
  "height",
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

// Base font size for scaling calculations
const BASE_FONT_SIZE = 12;
const BASE_NODE_SIZE = 100;

export const GenericNode = memo(
  ({ data, id, selected, isConnectable }: GenericNodeProps) => {
    const reactFlowInstance = useReactFlow();
    const [isEditing, setIsEditing] = useState(false);
    const [labelValue, setLabelValue] = useState(data.label);

    // Initialize nodeSize from data if available, otherwise use default
    const [nodeSize, setNodeSize] = useState({
      width: data.width || 100,
      height: data.height || 100,
    });

    // Get the node dimensions from the store
    const nodeWithPosition = useStore(
      useCallback((store) => store.nodeInternals.get(id), [id])
    );

    // Sync node dimensions from the actual node in the flow
    useEffect(() => {
      if (nodeWithPosition) {
        const { width, height } = nodeWithPosition;
        if (width && height) {
          setNodeSize({ width, height });
        }
      }
    }, [nodeWithPosition]);

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

    // Update node size on resize with smoother handling and persist to node data
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

        // Update local state
        setNodeSize({ width: newWidth, height: newHeight });

        // Persist dimensions to node data
        if (data.onResize) {
          data.onResize(id, newWidth, newHeight);
        } else {
          // If no onResize handler is provided, update the node directly
          reactFlowInstance.setNodes((nodes) =>
            nodes.map((node) => {
              if (node.id === id) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    width: newWidth,
                    height: newHeight,
                  },
                };
              }
              return node;
            })
          );
        }
      },
      [id, data, reactFlowInstance]
    );

    // Calculate font size based on node dimensions
    const calculateFontSize = useCallback(
      (baseFontSize: number) => {
        // Get the average dimension to use for scaling
        const avgDimension = (nodeSize.width + nodeSize.height) / 2;

        // Calculate scale factor based on the ratio of current size to base size
        const scaleFactor = Math.sqrt(avgDimension / BASE_NODE_SIZE);

        // Apply the scale factor to the base font size with limits
        const userFontSize = data.style?.fontSize || BASE_FONT_SIZE;
        const scaledFontSize = userFontSize * scaleFactor;

        // Set minimum and maximum font sizes
        const minFontSize = 8;
        const maxFontSize = 36;

        return Math.min(Math.max(scaledFontSize, minFontSize), maxFontSize);
      },
      [nodeSize, data.style?.fontSize]
    );

    // Define consistent text styles with dynamic font sizing
    const getTextStyle = useCallback(
      (isProperty = false) => {
        // Calculate the main font size
        const mainFontSize = calculateFontSize(
          data.style?.fontSize || BASE_FONT_SIZE
        );

        // Property text is slightly smaller
        const propertyFontSize = isProperty ? mainFontSize * 0.8 : mainFontSize;

        return {
          fontFamily: data.style?.fontFamily || "Arial",
          fontSize: `${propertyFontSize}px`,
          fontWeight: isProperty
            ? "normal"
            : data.style?.isBold
              ? "bold"
              : "normal",
          fontStyle: data.style?.isItalic ? "italic" : "normal",
          textDecoration: data.style?.isUnderline ? "underline" : "none",
          color: data.style?.textColor || "#000000",
          lineHeight: `${data.style?.lineHeight || 1.2}`,
          textAlign: data.style?.textAlign || "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          width: "100%",
        };
      },
      [data.style, calculateFontSize]
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
      const isTypeHidden = data.hidden?.type === true;

      // Add type property (using shape) if not hidden
      if (!isTypeHidden) {
        properties.push({
          key: "type",
          value: data.shape || "",
        });
      }
      let fromLabels: any = [],
        toLabels: any = [];

      // add from and to labels inside properties

      const edges = reactFlowInstance.getEdges();
      const nodes = reactFlowInstance.getNodes();

      const from = edges
        ?.filter((edge) => edge.target === id)
        .map((edge) => edge.source);

      const to = edges
        ?.filter((edge) => edge.source === id)
        .map((edge) => edge.target);

      fromLabels = from.map((id) => {
        const node = nodes.find((node) => node.id === id);
        return node ? node.data.label : "";
      });

      toLabels = to.map((id) => {
        const node = nodes.find((node) => node.id === id);
        return node ? node.data.label : "";
      });

      // Loop through all data properties
      Object.entries(data).forEach(([key, value]) => {
        // Skip excluded properties and already added special properties
        if (
          !shouldExcludeProperty(key, value) &&
          !["task", "type"].includes(key)
        ) {
          if (key === "from") {
            properties.push({ key, value: fromLabels.join(", ") });
          } else if (key === "to") {
            properties.push({ key, value: toLabels.join(", ") });
          } else {
            properties.push({ key, value: String(value) });
          }
        }
      });

      return properties;
    }, [data]);

    // Get alignment style for flex containers
    const getAlignmentStyle = useCallback(() => {
      return {
        alignItems:
          data.style?.textAlign === "left"
            ? "flex-start"
            : data.style?.textAlign === "right"
              ? "flex-end"
              : "center",
        justifyContent:
          data.style?.verticalAlign === "top"
            ? "flex-start"
            : data.style?.verticalAlign === "bottom"
              ? "flex-end"
              : "center",
      };
    }, [data.style?.textAlign, data.style?.verticalAlign]);

    // Update the renderShape function to handle special shapes better
    const renderShape = () => {
      // Base SVG style with improved scaling
      const svgStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        display: "block", // Ensures proper sizing
      };

      // For human figures, increase the spacing between figure and text
      if (currentShapeIsHumanFigure) {
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              ...getAlignmentStyle(),
            }}
          >
            {/* Human figure shape - reduce height to create more space for text */}
            <div
              style={{
                height: "55%", // Reduced from 60% to create more space for text
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "10px", // Increased spacing between figure and text
              }}
            >
              {SHAPE_DEFINITIONS[data.shape] && (
                <svg
                  style={svgStyle}
                  viewBox={SHAPE_DEFINITIONS[data.shape].viewBox}
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {SHAPE_DEFINITIONS[data.shape].render(shapeProps)}
                </svg>
              )}
            </div>

            {/* Text below the shape - add margin-top for spacing */}
            <div
              style={{
                width: "100%",
                minHeight: "45%", // Increased from 40% to accommodate text
                display: "flex",
                flexDirection: "column",
                ...getAlignmentStyle(),
                justifyContent:
                  data.style?.verticalAlign === "top"
                    ? "flex-start"
                    : data.style?.verticalAlign === "bottom"
                      ? "flex-end"
                      : "center", // Apply vertical alignment
                padding: "4px",
                overflow: "hidden",
              }}
            >
              <div style={getTextStyle()}>{labelValue}</div>

              {visibleProperties.length > 0 && (
                <div
                  style={{
                    width: "100%",
                    marginTop: "2px",
                    overflow: "hidden",
                  }}
                >
                  {visibleProperties.map((prop) => (
                    <div key={prop.key} style={getTextStyle(true)}>
                      {prop.value}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      // For special shapes like hexagon, diamond, triangle, etc. - ensure text stays within bounds
      if (["hexagon", "diamond", "triangle", "circle"].includes(data.shape)) {
        // Calculate appropriate padding based on shape
        const shapePadding =
          data.shape === "diamond"
            ? "20%"
            : data.shape === "triangle"
              ? "20%"
              : data.shape === "hexagon"
                ? "15%"
                : data.shape === "circle"
                  ? "12%"
                  : "8px";

        const PRESERVED_ASPECT_RATIO_SHAPES = ["circle", "square"];

        return (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {/* Render the shape as SVG */}
            <svg
              style={svgStyle}
              viewBox={SHAPE_DEFINITIONS[data.shape].viewBox}
              preserveAspectRatio={
                PRESERVED_ASPECT_RATIO_SHAPES.includes(data.shape)
                  ? "xMidYMid meet"
                  : "none"
              }
              xmlns="http://www.w3.org/2000/svg"
            >
              {SHAPE_DEFINITIONS[data.shape].render(shapeProps)}
            </svg>

            {/* Overlay text on top of the shape */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                ...getAlignmentStyle(),
                justifyContent:
                  data.style?.verticalAlign === "top"
                    ? "flex-start"
                    : data.style?.verticalAlign === "bottom"
                      ? "flex-end"
                      : "center", // Apply vertical alignment
                padding: shapePadding,
                pointerEvents: "none",
                overflow: "hidden",
              }}
            >
              <div style={getTextStyle()}>{labelValue}</div>

              {visibleProperties.length > 0 && (
                <div
                  style={{
                    width: "100%",
                    marginTop: "2px",
                    overflow: "hidden",
                  }}
                >
                  {visibleProperties.map((prop) => (
                    <div key={prop.key} style={getTextStyle(true)}>
                      {prop.value}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      // For arrow shapes - move text below the shape
      if (
        ["left-arrow", "right-arrow", "top-arrow", "bottom-arrow"].includes(
          data.shape
        )
      ) {
        return (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Arrow shape container - take up 65% of height */}
            <div style={{ height: "65%", width: "100%", position: "relative" }}>
              <svg
                style={svgStyle}
                viewBox={SHAPE_DEFINITIONS[data.shape].viewBox}
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
              >
                {SHAPE_DEFINITIONS[data.shape].render(shapeProps)}
              </svg>
            </div>

            {/* Text container below the arrow - take up 35% of height */}
            <div
              style={{
                height: "35%",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                ...getAlignmentStyle(),
                justifyContent:
                  data.style?.verticalAlign === "top"
                    ? "flex-start"
                    : data.style?.verticalAlign === "bottom"
                      ? "flex-end"
                      : "center", // Apply vertical alignment
                padding: "4px",
                overflow: "hidden",
                marginTop: "2px",
              }}
            >
              <div style={getTextStyle()}>{labelValue}</div>

              {visibleProperties.length > 0 && (
                <div
                  style={{
                    width: "100%",
                    marginTop: "2px",
                    overflow: "hidden",
                  }}
                >
                  {visibleProperties.map((prop) => (
                    <div key={prop.key} style={getTextStyle(true)}>
                      {prop.value}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }
      // For capsule shape - fix the rendering to be oval/pill-shaped
      if (data.shape === "capsule") {
        return (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {/* Create a div with border-radius instead of using SVG for capsule */}
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: `${Math.min(nodeSize.height, nodeSize.width) / 2}px`, // Make border radius half of the smaller dimension
                border: `${data.style?.borderWidth || 1}px ${data.style?.borderStyle || "solid"} ${
                  data.style?.borderColor || "#000000"
                }`,
                backgroundColor: data.style?.backgroundColor || "white",
              }}
            ></div>

            {/* Overlay text on top of the shape */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                ...getAlignmentStyle(),
                justifyContent:
                  data.style?.verticalAlign === "top"
                    ? "flex-start"
                    : data.style?.verticalAlign === "bottom"
                      ? "flex-end"
                      : "center", // Apply vertical alignment
                padding: "10%",
                pointerEvents: "none",
                overflow: "hidden",
              }}
            >
              <div style={getTextStyle()}>{labelValue}</div>

              {visibleProperties.length > 0 && (
                <div
                  style={{
                    width: "100%",
                    marginTop: "2px",
                    overflow: "hidden",
                  }}
                >
                  {visibleProperties.map((prop) => (
                    <div key={prop.key} style={getTextStyle(true)}>
                      {prop.value}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      // For cylindar and document shapes - ensure text stays within bounds
      if (
        ["cylindar", "document", "message-bubble", "capsule"].includes(
          data.shape
        )
      ) {
        return (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {/* Render the shape */}
            <svg
              style={svgStyle}
              viewBox={SHAPE_DEFINITIONS[data.shape].viewBox}
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="100%"
            >
              {SHAPE_DEFINITIONS[data.shape].render(shapeProps)}
            </svg>

            {/* Overlay text on top of the shape */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                ...getAlignmentStyle(),
                justifyContent:
                  data.style?.verticalAlign === "top"
                    ? "flex-start"
                    : data.style?.verticalAlign === "bottom"
                      ? "flex-end"
                      : "center", // Apply vertical alignment
                padding: "20px",
                pointerEvents: "none",
                // overflow: "hidden",
                // background: "red",
              }}
            >
              <div style={getTextStyle()}>{labelValue}</div>

              {visibleProperties.length > 0 && (
                <div
                  style={{
                    width: "100%",
                    marginTop: "2px",
                    overflow: "hidden",
                  }}
                >
                  {visibleProperties.map((prop) => (
                    <div key={prop.key} style={getTextStyle(true)}>
                      {prop.value}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
                  // textAlign: data.style?.textAlign || "center",
                  ...getTextStyle(true),
                }}
              >
                Attributes
              </div>
              <div
                className="p-2"
                style={{
                  backgroundColor: data.style?.backgroundColor || "white",
                  // textAlign: data.style?.textAlign || "center",
                  ...getTextStyle(true),
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
                  // textAlign: data.style?.textAlign || "center",
                  ...getTextStyle(true),
                }}
              >
                «interface»
              </div>
              <div className="p-2">
                <div
                  style={{
                    // width: "100%",
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
          // For default case (rectangle, rounded, etc.) - update to use vertical alignment
          return (
            <div
              style={{
                ...shapeStyle,
                borderColor: data.style?.borderColor || "#000000",
                borderStyle: data.style?.borderStyle || "solid",
                borderWidth: `${data.style?.borderWidth || 1}px`,
                backgroundColor: data.style?.backgroundColor || "white",
                padding: "8px",
                overflow: "hidden", // Ensure text doesn't overflow
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  ...getAlignmentStyle(),
                  justifyContent:
                    data.style?.verticalAlign === "top"
                      ? "flex-start"
                      : data.style?.verticalAlign === "bottom"
                        ? "flex-end"
                        : "center", // Apply vertical alignment
                  overflow: "hidden", // Ensure text doesn't overflow
                }}
              >
                <div style={getTextStyle()}>{labelValue}</div>

                {visibleProperties.length > 0 && (
                  <div
                    style={{
                      width: "100%",
                      marginTop: "4px",
                      overflow: "hidden",
                    }}
                  >
                    {visibleProperties.map((prop) => (
                      <div key={prop.key} style={getTextStyle(true)}>
                        {prop.value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
      }
    };

    return (
      <>
        <NodeResizer
          isVisible={selected}
          minWidth={30}
          minHeight={30}
          keepAspectRatio={SHOULD_MAINTAIN_ASPECT_RATIO[data.shape] || false}
          onResize={handleResize}
          handleStyle={{
            width: 12,
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
