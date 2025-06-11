"use client";
import { useCanvasStore } from "@/lib/store/useCanvas";
import { SHAPES } from "@/lib/types/flow-table.types";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useState, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Handle, NodeResizer, Position, useReactFlow } from "reactflow";
import { SHAPE_DEFINITIONS, isHumanFigure } from "../shape-utils";

const HUMAN_FIGURE_SHAPES = [
  "actor",
  "standing-woman",
  "sitting",
  "arms-stretched",
  "walking-man",
];

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
};

const BORDER_RADIUS_MAP: Record<string, string> = {
  rounded: "8px",
};

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
  "parent",
  "children",
];

const EXCLUDED_PATTERNS = [/^on[A-Z]/, /Id$/, /^id/];

// Text measurement utilities
const measureText = (
  text: string,
  fontSize: number,
  fontFamily: string,
  fontWeight: string = "normal"
): { width: number; height: number } => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return { width: 0, height: 0 };

  context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const metrics = context.measureText(text);

  return {
    width: metrics.width,
    height: fontSize * 1.2, // Approximate height with line spacing
  };
};

// Auto-sizing text hook
const useAutoSizedText = (
  text: string,
  containerWidth: number,
  containerHeight: number,
  baseFontSize: number,
  fontFamily: string,
  fontWeight: string = "normal",
  maxLines: number = 10
) => {
  const [fontSize, setFontSize] = useState(baseFontSize);

  useEffect(() => {
    if (!text || containerWidth <= 0 || containerHeight <= 0) {
      setFontSize(baseFontSize);
      return;
    }

    let optimalSize = baseFontSize;
    const minSize = 8;
    const maxSize = Math.min(baseFontSize * 2, 48);

    // Binary search for optimal font size
    let low = minSize;
    let high = maxSize;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const lineHeight = mid * 1.2;

      // Split text into words and calculate how many lines it would take
      const words = text.split(" ");
      let lines = 1;
      let currentLineWidth = 0;

      for (const word of words) {
        const wordWidth = measureText(
          word + " ",
          mid,
          fontFamily,
          fontWeight
        ).width;

        if (currentLineWidth + wordWidth > containerWidth) {
          if (currentLineWidth === 0) {
            // Single word is too long, it will overflow anyway
            break;
          }
          lines++;
          currentLineWidth = wordWidth;
        } else {
          currentLineWidth += wordWidth;
        }
      }

      const totalHeight = lines * lineHeight;

      if (totalHeight <= containerHeight && lines <= maxLines) {
        optimalSize = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    setFontSize(Math.max(optimalSize, minSize));
  }, [
    text,
    containerWidth,
    containerHeight,
    baseFontSize,
    fontFamily,
    fontWeight,
    maxLines,
  ]);

  return fontSize;
};

// Text container component with auto-sizing
const AutoSizedTextContainer: React.FC<{
  text: string;
  containerWidth: number;
  containerHeight: number;
  style: any;
  isProperty?: boolean;
  className?: string;
}> = ({
  text,
  containerWidth,
  containerHeight,
  style,
  isProperty = false,
  className = "",
}) => {
  const baseFontSize = isProperty
    ? (style.fontSize || 12) * 0.8
    : style.fontSize || 12;
  const fontWeight = style.isBold ? "bold" : "normal";

  const autoFontSize = useAutoSizedText(
    text,
    containerWidth - 16, // Account for padding
    containerHeight - (isProperty ? 4 : 8), // Account for margins
    baseFontSize,
    style.fontFamily || "Arial",
    fontWeight,
    isProperty ? 3 : 10
  );

  const textStyle = {
    fontFamily: style.fontFamily || "Arial",
    fontSize: `${autoFontSize}px`,
    fontWeight: fontWeight,
    fontStyle: style.isItalic ? "italic" : "normal",
    textDecoration: style.isUnderline ? "underline" : "none",
    color: style.textColor || "#000000",
    lineHeight: `${style.lineHeight || 1.2}`,
    textAlign: style.textAlign || "center",
    wordWrap: "break-word" as any,
    overflowWrap: "break-word" as any,
    hyphens: "auto" as any,
    width: "100%",
    margin: 0,
    padding: 0,
  };

  return (
    <div
      className={className}
      style={{
        ...textStyle,
        display: "block",
        overflow: "visible",
      }}
    >
      {text}
    </div>
  );
};

const getOverlayAlignmentStyle = (
  verticalAlign?: string,
  textAlign?: string
) => {
  return {
    alignItems:
      verticalAlign === "top"
        ? "flex-start"
        : verticalAlign === "bottom"
          ? "flex-end"
          : "center",
    justifyContent:
      textAlign === "left"
        ? "flex-start"
        : textAlign === "right"
          ? "flex-end"
          : "center",
  };
};

const getPropertyDataKey = (propertyName: string): string => {
  if (propertyName === "task") return "label";
  if (propertyName === "type") return "shape";
  if (propertyName === "id") return "id";
  return propertyName;
};

export const GenericNode = memo(
  ({ data, id, selected, isConnectable }: GenericNodeProps) => {
    const reactFlowInstance = useReactFlow();
    const [isEditing, setIsEditing] = useState(false);
    const [labelValue, setLabelValue] = useState(data.label);
    const containerRef = useRef<HTMLDivElement>(null);

    const { canvasSettings } = useCanvasStore();

    // Initialize nodeSize from node dimensions
    const [nodeSize, setNodeSize] = useState(() => {
      const node = reactFlowInstance.getNode(id);
      return {
        width: node?.width || data.width || 100,
        height: node?.height || data.height || 100,
      };
    });

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

        if (data.onResize) {
          data.onResize(id, newWidth, newHeight);
        } else {
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

    const baseTextStyle = useMemo(
      () => ({
        fontFamily: data.style?.fontFamily || "Arial",
        fontSize: data.style?.fontSize || 12,
        isBold: data.style?.isBold,
        isItalic: data.style?.isItalic,
        isUnderline: data.style?.isUnderline,
        textColor: data.style?.textColor || "#000000",
        lineHeight: data.style?.lineHeight || 1.2,
        textAlign: data.style?.textAlign || "center",
      }),
      [data.style]
    );

    const nodeStyle: React.CSSProperties = {
      transition: `
        width 0.15s cubic-bezier(0.4, 0, 0.2, 1),
        height 0.15s cubic-bezier(0.4, 0, 0.2, 1),
        transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)
      `,
      willChange: "width, height, transform",
    };

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

    const handleStyle = useMemo(
      () => ({
        opacity: selected ? 1 : 0,
        width: "0.75rem",
        height: "0.75rem",
        backgroundColor: "#09BC8A",
        border: "1px solid white",
        zIndex: 20,
      }),
      [selected]
    );

    const shouldExcludeProperty = (key: string, value: any) => {
      if (EXCLUDED_PROPERTIES.includes(key)) return true;
      if (typeof value === "function") return true;
      for (const pattern of EXCLUDED_PATTERNS) {
        if (pattern.test(key)) return true;
      }
      return false;
    };

    const populateFromAndTo = useCallback(() => {
      const edges = reactFlowInstance.getEdges();
      const nodes = reactFlowInstance.getNodes();

      const from = edges
        ?.filter((edge) => edge.target === id)
        .map((edge) => edge.source);

      const to = edges
        ?.filter((edge) => edge.source === id)
        .map((edge) => edge.target);

      const fromLabels = from.map((sourceId) => {
        const node = nodes.find((node) => node.id === sourceId);
        return node ? node.data.label : "";
      });

      const toLabels = to.map((targetId) => {
        const node = nodes.find((node) => node.id === targetId);
        return node ? node.data.label : "";
      });

      return {
        fromLabels: fromLabels || [],
        toLabels: toLabels || [],
      };
    }, [reactFlowInstance, id]);

    const visibleProperties = useMemo(() => {
      let properties: { key: string; value: any }[] = [];

      const { fromLabels, toLabels } = populateFromAndTo();

      properties.push({
        key: "type",
        value: data.shape || "",
      });

      Object.entries(data).forEach(([key, value]) => {
        if (
          !shouldExcludeProperty(key, value) &&
          !["task", "type"].includes(key)
        ) {
          if (value === null || value === undefined) {
            return;
          }

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

      const hiddenColumns = canvasSettings?.table_settings?.hiddenColumns || [];

      properties = properties.filter((property) => {
        const dataKey = getPropertyDataKey(property.key);
        return (
          !hiddenColumns.includes(dataKey) &&
          !hiddenColumns.includes(property.key)
        );
      });

      return properties;
    }, [data, canvasSettings, populateFromAndTo]);

    // Improved text container for shapes with overlay text
    const renderOverlayTextContainer = (
      widthPercentage: string = "70%",
      padding: string = "12px"
    ) => (
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
          padding,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: widthPercentage,
            display: "flex",
            flexDirection: "column",
            minHeight: "0",
            gap: "2px",
          }}
        >
          <AutoSizedTextContainer
            text={labelValue}
            containerWidth={(nodeSize.width * parseInt(widthPercentage)) / 100}
            containerHeight={nodeSize.height * 0.6}
            style={baseTextStyle}
          />

          {visibleProperties.length > 0 && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1px" }}
            >
              {visibleProperties.map((prop) => (
                <AutoSizedTextContainer
                  key={prop.key}
                  text={prop.value}
                  containerWidth={
                    (nodeSize.width * parseInt(widthPercentage)) / 100
                  }
                  containerHeight={nodeSize.height * 0.1}
                  style={baseTextStyle}
                  isProperty={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );

    // Improved text container for shapes with text below
    const renderBelowTextContainer = (padding: string = "8px") => (
      <div
        style={{
          width: "100%",
          padding: `0 ${padding}`,
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          minHeight: "0",
          gap: "2px",
        }}
      >
        <AutoSizedTextContainer
          text={labelValue}
          containerWidth={nodeSize.width - parseInt(padding) * 2}
          containerHeight={nodeSize.height * 0.4}
          style={baseTextStyle}
        />

        {visibleProperties.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            {visibleProperties.map((prop) => (
              <AutoSizedTextContainer
                key={prop.key}
                text={prop.value}
                containerWidth={nodeSize.width - parseInt(padding) * 2}
                containerHeight={nodeSize.height * 0.08}
                style={baseTextStyle}
                isProperty={true}
              />
            ))}
          </div>
        )}
      </div>
    );

    const renderShape = () => {
      // Only rectangular/bordered shapes need container padding
      const shapesNeedingContainerPadding = [
        "rectangle",
        "rounded",
        "square",
        "interface",
      ];
      const needsContainerPadding = shapesNeedingContainerPadding.includes(
        data.shape as string
      );

      const CONTAINER_PADDING = needsContainerPadding ? 8 : 0; // No padding for SVG shapes
      const effectiveWidth = nodeSize.width - CONTAINER_PADDING * 2;
      const effectiveHeight = nodeSize.height - CONTAINER_PADDING * 2;

      const containerStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        padding: `${CONTAINER_PADDING}px`,
        display: "flex",
        flexDirection: "column",
      };

      // Shapes with text below the visual element
      const shapesWithTextBelow = [
        "left-arrow",
        "right-arrow",
        "top-arrow",
        "bottom-arrow",
        "cylinder",
        ...HUMAN_FIGURE_SHAPES,
      ];

      if (shapesWithTextBelow.includes(data.shape as string)) {
        // Dynamic shape height with proper constraints to prevent clipping
        let shapeHeightPercentage;
        if (data.shape === "cylinder") {
          // For cylinder, ensure it can scale properly with container height
          shapeHeightPercentage = Math.min(
            0.8,
            Math.max(0.5, effectiveHeight > 200 ? 0.75 : 0.7)
          );
        } else {
          shapeHeightPercentage = Math.min(
            0.75,
            Math.max(0.4, effectiveHeight > 150 ? 0.65 : 0.6)
          );
        }

        const shapeHeight = effectiveHeight * shapeHeightPercentage;
        const textHeight = effectiveHeight - shapeHeight;

        return (
          <div style={containerStyle}>
            <div
              style={{
                height: `${shapeHeight}px`,
                width: "100%",
                flexShrink: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "visible", // Prevent clipping
                position: "relative",
              }}
            >
              <svg
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                  overflow: "visible", // Allow SVG to scale without clipping
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
                viewBox={SHAPE_DEFINITIONS[data.shape].viewBox}
                preserveAspectRatio="none" // Allow free scaling for all shapes in this category
                xmlns="http://www.w3.org/2000/svg"
              >
                {SHAPE_DEFINITIONS[data.shape].render(shapeProps)}
              </svg>
            </div>

            {textHeight > 20 && ( // Only show text if there's meaningful space
              <div
                style={{
                  width: "100%",
                  height: `${textHeight}px`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  overflow: "hidden",
                  padding: "4px 8px",
                  justifyContent: "flex-start",
                  minHeight: "20px", // Ensure minimum text space
                }}
              >
                <AutoSizedTextContainer
                  text={labelValue}
                  containerWidth={effectiveWidth - 16}
                  containerHeight={Math.max(textHeight * 0.6, 15)}
                  style={baseTextStyle}
                />

                {visibleProperties.length > 0 && textHeight > 40 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1px",
                      flex: 1,
                    }}
                  >
                    {visibleProperties.map((prop) => (
                      <AutoSizedTextContainer
                        key={prop.key}
                        text={prop.value}
                        containerWidth={effectiveWidth - 16}
                        containerHeight={Math.max(textHeight * 0.08, 12)}
                        style={baseTextStyle}
                        isProperty={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      // Shapes with overlay text
      const shapesWithOverlay = [
        "hexagon",
        "diamond",
        "triangle",
        "circle",
        "capsule",
        "document",
        "message-bubble",
      ];

      if (shapesWithOverlay.includes(data.shape as string)) {
        // Text width percentages for each shape
        const textWidthPercentage =
          data.shape === "diamond"
            ? 0.45
            : data.shape === "triangle"
              ? 0.55
              : data.shape === "circle"
                ? 0.65
                : data.shape === "message-bubble"
                  ? 0.75
                  : data.shape === "document"
                    ? 0.8
                    : data.shape === "capsule"
                      ? 0.75
                      : 0.7;

        const textWidth = effectiveWidth * textWidthPercentage;
        const textHeight = effectiveHeight * 0.85;

        return (
          <div style={containerStyle}>
            <div
              style={{ position: "relative", width: "100%", height: "100%" }}
            >
              <svg
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                }}
                viewBox={SHAPE_DEFINITIONS[data.shape].viewBox}
                preserveAspectRatio={
                  ["circle", "square"].includes(data.shape as string)
                    ? "xMidYMid meet"
                    : "none"
                }
                xmlns="http://www.w3.org/2000/svg"
              >
                {SHAPE_DEFINITIONS[data.shape].render(shapeProps)}
              </svg>

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
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    width: `${textWidthPercentage * 100}%`,
                    maxHeight: "85%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    overflow: "hidden",
                    padding: data.shape === "document" ? "8px 4px" : "4px",
                  }}
                >
                  <AutoSizedTextContainer
                    text={labelValue}
                    containerWidth={textWidth - 8}
                    containerHeight={textHeight * 0.7}
                    style={baseTextStyle}
                  />

                  {visibleProperties.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1px",
                      }}
                    >
                      {visibleProperties.map((prop) => (
                        <AutoSizedTextContainer
                          key={prop.key}
                          text={prop.value}
                          containerWidth={textWidth - 8}
                          containerHeight={textHeight * 0.08}
                          style={baseTextStyle}
                          isProperty={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Interface shape special case
      if (data.shape === "interface") {
        return (
          <div style={containerStyle}>
            <div
              style={{
                width: "100%",
                height: "100%",
                borderColor: data.style?.borderColor || "#000000",
                borderStyle: data.style?.borderStyle || "solid",
                borderWidth: `${data.style?.borderWidth || 1}px`,
                backgroundColor: data.style?.backgroundColor || "white",
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  borderBottom: `2px solid ${data.style?.borderColor || "#000000"}`,
                  padding: "8px",
                  fontWeight: "bold",
                  width: "100%",
                  textAlign: "center",
                  height: "auto",
                  flexShrink: 0,
                }}
              >
                <AutoSizedTextContainer
                  text="«interface»"
                  containerWidth={effectiveWidth - 16}
                  containerHeight={30}
                  style={baseTextStyle}
                />
              </div>
              <div
                style={{
                  padding: "12px",
                  flexGrow: 1,
                  width: "100%",
                  overflow: "hidden",
                }}
              >
                <AutoSizedTextContainer
                  text={labelValue}
                  containerWidth={effectiveWidth - 24}
                  containerHeight={effectiveHeight - 60}
                  style={baseTextStyle}
                />
              </div>
            </div>
          </div>
        );
      }

      // Default rectangular shapes
      return (
        <div style={containerStyle}>
          <div
            style={{
              width: "100%",
              height: "100%",
              borderColor: data.style?.borderColor || "#000000",
              borderStyle: data.style?.borderStyle || "solid",
              borderWidth: `${data.style?.borderWidth || 1}px`,
              backgroundColor: data.style?.backgroundColor || "white",
              padding: "12px",
              borderRadius: BORDER_RADIUS_MAP[data.shape] || "0px",
              display: "flex",
              flexDirection: "column",
              justifyContent:
                data.style?.verticalAlign === "top"
                  ? "flex-start"
                  : data.style?.verticalAlign === "bottom"
                    ? "flex-end"
                    : data.style?.verticalAlign === "middle"
                      ? "center"
                      : "flex-start",
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
            <div style={{ width: "100%", marginBottom: "4px", flexShrink: 0 }}>
              <AutoSizedTextContainer
                text={labelValue}
                containerWidth={effectiveWidth - 24}
                containerHeight={effectiveHeight * 0.6}
                style={{
                  ...baseTextStyle,
                  textAlign: data.style?.textAlign || "left",
                }}
              />
            </div>

            {visibleProperties.length > 0 && (
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  flex: 1,
                  overflow: "hidden",
                }}
              >
                {visibleProperties.map((prop) => (
                  <AutoSizedTextContainer
                    key={prop.key}
                    text={prop.value}
                    containerWidth={effectiveWidth - 24}
                    containerHeight={effectiveHeight * 0.08}
                    style={{
                      ...baseTextStyle,
                      textAlign: data.style?.textAlign || "left",
                    }}
                    isProperty={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      );
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
          ref={containerRef}
          style={{
            ...nodeStyle,
            width: nodeSize.width,
            height: nodeSize.height,
            boxShadow: selected ? "0 0 0 1px rgba(26, 25, 43, 0.3)" : "none",
            position: "relative",
            overflow: "hidden", // Keep this hidden to maintain clean edges
          }}
          className={`${data.style?.locked ? "cursor-not-allowed" : "cursor-pointer"}`}
          role="application"
          aria-label={`${data.shape} node`}
          aria-describedby={`node-${id}-desc`}
        >
          {/* Handles */}
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

          {isEditing ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px",
              }}
            >
              <TextareaAutosize
                value={labelValue}
                onChange={(e) => setLabelValue(e.target.value)}
                onBlur={handleBlur}
                // @ts-expect-error - ReactFlow types don't include onKeyDown
                onKeyDown={handleKeyDown}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  padding: "4px",
                  outline: "none",
                  resize: "none",
                  fontFamily: data.style?.fontFamily || "Arial",
                  fontSize: `${data.style?.fontSize || 12}px`,
                  textAlign: (data.style?.textAlign || "center") as any,
                }}
                autoFocus
                minRows={1}
                maxRows={10}
              />
            </div>
          ) : (
            <div
              className="w-full h-full"
              onDoubleClick={handleDoubleClick}
              style={{ position: "relative" }}
            >
              {renderShape()}
            </div>
          )}
        </div>
      </>
    );
  }
);

GenericNode.displayName = "GenericNode";
