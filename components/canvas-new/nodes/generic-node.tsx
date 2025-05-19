"use client";
import { useCanvasStore } from "@/lib/store/useCanvas";
import { SHAPES } from "@/lib/types/flow-table.types";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Handle, NodeResizer, Position, useReactFlow } from "reactflow";
import { SHAPE_DEFINITIONS, isHumanFigure } from "../shape-utils";

interface GenericNodeProps {
  data: {
    label: string;
    from: string;
    to: string;
    shape: SHAPES;
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
  // Explicitly exclude capsule from aspect ratio maintenance
};

// Add a mapping for shapes that need rounded corners
const BORDER_RADIUS_MAP: Record<string, string> = {
  rounded: "8px",
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

// Helper function for the position absolute overlay for shapes with text inside
const getOverlayAlignmentStyle = (
  verticalAlign?: string,
  textAlign?: string
) => {
  return {
    // Vertical alignment (top/middle/bottom)
    alignItems:
      verticalAlign === "top"
        ? "flex-start"
        : verticalAlign === "bottom"
          ? "flex-end"
          : "center",
    // Horizontal alignment (left/center/right)
    justifyContent:
      textAlign === "left"
        ? "flex-start"
        : textAlign === "right"
          ? "flex-end"
          : "center",
  };
};

export const GenericNode = memo(
  ({ data, id, selected, isConnectable }: GenericNodeProps) => {
    const reactFlowInstance = useReactFlow();
    const [isEditing, setIsEditing] = useState(false);
    const [labelValue, setLabelValue] = useState(data.label);

    const { canvasSettings } = useCanvasStore();

    // Initialize nodeSize from node dimensions first, data.width/height second, or defaults last
    // We need to handle dimensions at both the node level and data level
    const [nodeSize, setNodeSize] = useState(() => {
      // Get the node from ReactFlow to access its width/height properties
      const node = reactFlowInstance.getNode(id);

      return {
        width: node?.width || data.width || 100,
        height: node?.height || data.height || 100,
      };
    });

    // Update nodeSize if node dimensions change
    // useEffect(() => {
    //   const node = reactFlowInstance.getNode(id);
    //   if (node?.width && node?.height) {
    //     setNodeSize({
    //       width: node.width,
    //       height: node.height,
    //     });
    //   } else if (data.width && data.height) {
    //     setNodeSize({
    //       width: data.width,
    //       height: data.height,
    //     });
    //   }
    // }, [reactFlowInstance, id, data.width, data.height]);

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
                  width: newWidth,
                  height: newHeight,
                  data: {
                    ...node.data,
                    width: newWidth,
                    height: newHeight,
                  },
                  style: {
                    ...node.style,
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
          overflow: "visible",
          textOverflow: "ellipsis",
          whiteSpace: "normal",
          wordBreak: "break-all" as any,
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
        backgroundColor: "#09BC8A",
        border: "1px solid white",
        zIndex: 20,
        // transition: "opacity 0.2s ease",
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

      // We're no longer using node-level hiding
      // Node visibility is controlled by the hiddenColumns array in canvas settings

      return false;
    };

    // Get visible properties (not hidden and not excluded)
    const visibleProperties = useMemo(() => {
      let properties: { key: string; value: any }[] = [];

      // Add type property (using shape) if not hidden

      properties.push({
        key: "type",
        value: data.shape || "",
      });

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
          // Filter out null and undefined values, but keep boolean values
          if (value === null || value === undefined) {
            console.log(
              "🚀 ~ properties=properties.filter ~ properties:",
              properties
            );
            return; // Skip this property
          }

          // if the value is of type array then display comma seperated values
          if (Array.isArray(value)) {
            properties.push({
              key,
              value: value
                ?.map((item: any) => item?.value ?? item?.label ?? item)
                .join(", "),
            });
          } else if (key === "from") {
            if (fromLabels.length > 0) {
              properties.push({ key, value: fromLabels.join(", ") });
            }
          } else if (key === "to") {
            if (toLabels.length > 0) {
              properties.push({ key, value: toLabels.join(", ") });
            }
          } else {
            properties.push({
              key,
              value: typeof value === "boolean" ? String(value) : String(value),
            });
          }
        }
      });

      // filter out the propertis that are not hidden based on the hiddenColumns array in canvas settings

      const hiddenColumns = canvasSettings?.table_settings?.hiddenColumns || [];

      properties = properties.filter((property) => {
        return !hiddenColumns.includes(property.key);
      });

      return properties;
    }, [data]);

    // Update the renderShape function to handle special shapes better
    const renderShape = () => {
      // Base SVG style with improved scaling
      const svgStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        display: "block", // Ensures proper sizing
      };

      // For arrow shapes - move text below the shape with better positioning
      if (
        ["left-arrow", "right-arrow", "top-arrow", "bottom-arrow"].includes(
          data.shape as string
        )
      ) {
        return (
          <div
            style={{
              width: "100%",
              height: "auto", // Auto height to fit content
              minHeight: "100%", // Ensure it takes at least full node height
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Arrow shape with minimal fixed height */}
            <div
              style={{
                height: "40px",
                width: "100%",
                marginBottom: "4px",
                flexShrink: 0,
              }}
            >
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

            {/* Text container that expands naturally */}
            <div
              style={{
                width: "100%",
                padding: "0 8px",
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
              }}
            >
              {/* Node label */}
              <div
                style={{
                  ...getTextStyle(),
                  width: "100%",
                  whiteSpace: "normal",
                  wordBreak: "break-all",
                  marginBottom: "4px",
                }}
              >
                {labelValue}
              </div>

              {/* Property list */}
              {visibleProperties.length > 0 && (
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {visibleProperties.map((prop) => (
                    <div
                      key={prop.key}
                      style={{
                        ...getTextStyle(true),

                        width: "100%",
                        whiteSpace: "normal",
                        wordBreak: "break-all",
                        marginBottom: "2px",
                        lineHeight: "1.1",
                      }}
                    >
                      {prop.value}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      // For human figures, change to match arrow layout
      if (currentShapeIsHumanFigure) {
        return (
          <div
            style={{
              width: "100%",
              height: "auto",
              minHeight: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Human figure shape container */}
            <div
              style={{
                height: "60px",
                width: "100%",
                marginBottom: "4px",
                flexShrink: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
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

            {/* Text container below the figure */}
            <div
              style={{
                width: "100%",
                padding: "0 8px",
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
              }}
            >
              <div
                style={{
                  ...getTextStyle(),

                  width: "100%",
                  whiteSpace: "normal",
                  wordBreak: "break-all",
                  marginBottom: "4px",
                }}
              >
                {labelValue}
              </div>

              {visibleProperties.length > 0 && (
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {visibleProperties.map((prop) => (
                    <div
                      key={prop.key}
                      style={{
                        ...getTextStyle(true),

                        width: "100%",
                        whiteSpace: "normal",
                        wordBreak: "break-all",
                        marginBottom: "2px",
                        lineHeight: "1.1",
                      }}
                    >
                      {prop.value}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      // For cylinder shape - text below the shape
      if ((data.shape as string) === "cylinder") {
        return (
          <div
            style={{
              width: "100%",
              height: "auto",
              minHeight: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Cylinder shape container - top portion */}
            <div
              style={{
                height: "60px",
                width: "100%",
                marginBottom: "4px",
                flexShrink: 0,
              }}
            >
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

            {/* Text container below the shape */}
            <div
              style={{
                width: "100%",
                padding: "0 8px",
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
              }}
            >
              {/* Node label */}
              <div
                style={{
                  ...getTextStyle(),

                  width: "100%",
                  whiteSpace: "normal",
                  wordBreak: "break-all",
                  marginBottom: "4px",
                }}
              >
                {labelValue}
              </div>

              {/* Property list */}
              {visibleProperties.length > 0 && (
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {visibleProperties.map((prop) => (
                    <div
                      key={prop.key}
                      style={{
                        ...getTextStyle(true),

                        width: "100%",
                        whiteSpace: "normal",
                        wordBreak: "break-all",
                        marginBottom: "2px",
                        lineHeight: "1.1",
                      }}
                    >
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
      if (
        ["hexagon", "diamond", "triangle", "circle"].includes(
          data.shape as string
        )
      ) {
        // Calculate appropriate width percentage based on shape
        const widthPercentage =
          data.shape === "diamond"
            ? "50%"
            : data.shape === "triangle"
              ? "60%"
              : data.shape === "circle"
                ? "70%"
                : "65%";

        const PRESERVED_ASPECT_RATIO_SHAPES = ["circle", "square"];

        return (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {/* Render the shape as SVG */}
            <svg
              style={svgStyle}
              viewBox={SHAPE_DEFINITIONS[data.shape].viewBox}
              preserveAspectRatio={
                PRESERVED_ASPECT_RATIO_SHAPES.includes(data.shape as string)
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
                ...getOverlayAlignmentStyle(
                  data.style?.verticalAlign,
                  data.style?.textAlign
                ),
                padding: "15px",
              }}
            >
              <div
                style={{
                  width: widthPercentage,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "visible",
                  textAlign: data.style?.textAlign || "center",
                }}
              >
                <div
                  style={{
                    ...getTextStyle(),
                    overflow: "visible",
                    textOverflow: "ellipsis",
                  }}
                >
                  {labelValue}
                </div>

                {visibleProperties.length > 0 && (
                  <div
                    style={{
                      width: "100%",
                      marginTop: "2px",
                      overflow: "visible",
                    }}
                  >
                    {visibleProperties.map((prop) => (
                      <div
                        key={prop.key}
                        style={{
                          ...getTextStyle(true),
                          overflow: "visible",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {prop.value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      // For capsule shape - render using SVG to maintain pill shape
      if (data.shape === "capsule") {
        return (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
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

            {/* Text overlaid on capsule */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                ...getOverlayAlignmentStyle(
                  data.style?.verticalAlign,
                  data.style?.textAlign
                ),
                padding: "15px",
              }}
            >
              <div
                style={{
                  width: "70%", // Use percentage of container width to maintain spacing
                  display: "flex",
                  flexDirection: "column",
                  overflow: "visible",
                  textAlign: data.style?.textAlign || "center",
                }}
              >
                <div
                  style={{
                    ...getTextStyle(),
                    overflow: "visible",
                    textOverflow: "ellipsis",
                  }}
                >
                  {labelValue}
                </div>

                {visibleProperties.length > 0 && (
                  <div
                    style={{
                      width: "100%",
                      marginTop: "2px",
                      overflow: "visible",
                    }}
                  >
                    {visibleProperties.map((prop) => (
                      <div
                        key={prop.key}
                        style={{
                          ...getTextStyle(true),
                          overflow: "visible",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {prop.value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      // For cylinder, document, and message-bubble shapes - ensure text stays within bounds
      if (
        ["cylinder", "document", "message-bubble"].includes(
          data.shape as string
        )
      ) {
        // Special case for cylinder - move text below the shape
        if ((data.shape as string) === "cylinder") {
          return (
            <div
              style={{
                width: "100%",
                height: "auto",
                minHeight: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Cylinder shape container - top portion */}
              <div
                style={{
                  height: "70px",
                  width: "100%",
                  marginBottom: "8px",
                  flexShrink: 0,
                }}
              >
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

              {/* Text container below the shape */}
              <div
                style={{
                  width: "100%",
                  padding: "0 8px",
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                }}
              >
                {/* Node label */}
                <div
                  style={{
                    ...getTextStyle(),
                    textAlign: data.style?.textAlign || "center",
                    width: "100%",
                    whiteSpace: "normal",
                    wordBreak: "break-all",
                    marginBottom: "8px",
                  }}
                >
                  {labelValue}
                </div>

                {/* Property list */}
                {visibleProperties.length > 0 && (
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {visibleProperties.map((prop) => (
                      <div
                        key={prop.key}
                        style={{
                          ...getTextStyle(true),
                          textAlign: data.style?.textAlign || "center",
                          width: "100%",
                          whiteSpace: "normal",
                          wordBreak: "break-all",
                          marginBottom: "4px",
                          lineHeight: "1.2",
                        }}
                      >
                        {prop.value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Other shapes (document, message-bubble) - use original approach
        // Calculate width percentage based on shape
        const widthPercentage = data.shape === "message-bubble" ? "70%" : "75%";

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
                ...getOverlayAlignmentStyle(
                  data.style?.verticalAlign,
                  data.style?.textAlign
                ),
                padding: "15px",
              }}
            >
              <div
                style={{
                  width: widthPercentage,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "visible",
                  textAlign: data.style?.textAlign || "center",
                }}
              >
                <div
                  style={{
                    ...getTextStyle(),
                    overflow: "visible",
                    textOverflow: "ellipsis",
                  }}
                >
                  {labelValue}
                </div>

                {visibleProperties.length > 0 && (
                  <div
                    style={{
                      width: "100%",
                      marginTop: "2px",
                      overflow: "visible",
                    }}
                  >
                    {visibleProperties.map((prop) => (
                      <div
                        key={prop.key}
                        style={{
                          ...getTextStyle(true),
                          overflow: "visible",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {prop.value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      // Special cases for class and interface
      switch (data.shape) {
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
          return (
            <div
              style={{
                ...shapeStyle,
                borderColor: data.style?.borderColor || "#000000",
                borderStyle: data.style?.borderStyle || "solid",
                borderWidth: `${data.style?.borderWidth || 1}px`,
                backgroundColor: data.style?.backgroundColor || "white",
                padding: "8px",
                // overflow: "hidden",
                borderRadius: BORDER_RADIUS_MAP[data.shape] || "0px", // Apply border radius based on shape type
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  // Vertical alignment (top/middle/bottom)
                  justifyContent:
                    data.style?.verticalAlign === "top"
                      ? "flex-start"
                      : data.style?.verticalAlign === "bottom"
                        ? "flex-end"
                        : data.style?.verticalAlign === "middle"
                          ? "center"
                          : "flex-start", // Default to top
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    ...getTextStyle(),
                    textAlign: data.style?.textAlign || "left", // Horizontal alignment
                    width: "100%",
                  }}
                >
                  {labelValue}
                </div>

                {visibleProperties.length > 0 && (
                  <div
                    style={{
                      width: "100%",
                      marginTop: "4px",
                      overflow: "hidden",
                    }}
                  >
                    {visibleProperties.map((prop) => (
                      <div
                        key={prop.key}
                        style={{
                          ...getTextStyle(true),
                          textAlign: data.style?.textAlign || "left", // Horizontal alignment
                          width: "100%",
                        }}
                      >
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
          keepAspectRatio={
            data.shape === "capsule"
              ? false
              : SHOULD_MAINTAIN_ASPECT_RATIO[data.shape] || false
          }
          onResize={handleResize}
          handleStyle={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: "#09BC8A",
            border: "2px solid white",
            zIndex: 10,
          }}
          lineStyle={{
            borderWidth: 1,
            borderColor: "#003F91",
          }}
        />
        <div
          style={{
            ...nodeStyle,
            ...shapeStyle,
            width: nodeSize.width,
            height: nodeSize.height,
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
