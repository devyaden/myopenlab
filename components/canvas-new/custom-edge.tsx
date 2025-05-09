"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import {
  EdgeLabelRenderer,
  getBezierPath,
  getSimpleBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type Position,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

const getDoubleLinePath = ({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
}: {
  sourceX: number;
  sourceY: number;
  sourcePosition?: Position;
  targetX: number;
  targetY: number;
  targetPosition?: Position;
}) => {
  const offset = 5;

  const [path1, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0,
  });

  // Offset calculation for double-line effect
  const isVertical = Math.abs(targetY - sourceY) > Math.abs(targetX - sourceX);
  const offsetX = isVertical ? offset : 0;
  const offsetY = isVertical ? 0 : offset;

  const [path2] = getSmoothStepPath({
    sourceX: sourceX + offsetX,
    sourceY: sourceY + offsetY,
    sourcePosition,
    targetX: targetX + offsetX,
    targetY: targetY + offsetY,
    targetPosition,
    borderRadius: 0,
  });

  return { path1, path2, labelX, labelY };
};

const CustomEdge = (params: any) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    data,
    markerEnd,
  } = params;

  const [isEditing, setIsEditing] = useState(false);
  const [labelText, setLabelText] = useState(data?.label || "");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const reactFlowInstance = useReactFlow();

  // Calculate the midpoint for the label
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  useEffect(() => {
    // Focus the input when editing starts
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Extract the stroke color from style or use default
  const strokeColor = style.stroke || "#000";

  // Create a unique marker ID based on the edge ID and color
  const markerId = `edgeMarker-${id}-${strokeColor.replace("#", "")}`;

  // Create a custom marker end with the same color as the edge
  const customMarkerEnd = `url(#${markerId})`;

  // Ensure edge visibility with appropriate style
  const enhancedStyle = {
    ...style,
    opacity: style.opacity !== undefined ? style.opacity : 1.0,
    strokeWidth: style.strokeWidth || 2,
    filter: "none",
    mixBlendMode: "normal",
    shapeRendering: "crispEdges",
    vectorEffect: "non-scaling-stroke",
  };

  const edgeType = style.edgeType || "default";

  const getEdgePath = (edgeType: string): any => {
    const pathParams = {
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    };

    switch (edgeType) {
      case "default":
        return getBezierPath(pathParams)[0];
      case "straight":
        return getStraightPath(pathParams)[0];
      case "step":
        return getSmoothStepPath({ ...pathParams, borderRadius: 0 })[0];
      case "smoothstep":
        return getSmoothStepPath(pathParams)[0];
      case "simplebezier":
        return getSimpleBezierPath(pathParams)[0];
      case "dashed":
        return getSmoothStepPath(pathParams)[0];
      case "dotted":
        return getSmoothStepPath(pathParams)[0];
      case "double":
        return getDoubleLinePath(pathParams);
      case "animated":
        return getSmoothStepPath(pathParams)[0];
      default:
        return getSmoothStepPath(pathParams)[0];
    }
  };

  const handleDoubleClick = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setIsEditing(true);
  };

  const handleLabelChange = (event: { target: { value: any } }) => {
    setLabelText(event.target.value);
  };

  const handleLabelBlur = () => {
    setIsEditing(false);
    if (data.onLabelChange) {
      data.onLabelChange(id, labelText);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleLabelBlur();
    }
  };

  const labelStyles = {
    position: "absolute" as const,
    transform: `translate(-50%, -50%) translate(${midX}px, ${midY}px)`,
    fontSize: 12,
    pointerEvents: "all" as const,
    maxWidth: "200px",
    wordWrap: "break-word" as const,
    textAlign: "center" as const,
    backgroundColor: "white",
    padding: labelText.trim() ? "4px" : "0",
    borderRadius: "4px",
    border: labelText.trim() ? "1px solid transparent" : "none",
    display: labelText.trim() || isEditing ? "block" : "none",
    zIndex: 1000,
  };

  const inputStyles = {
    width: "100%",
    minWidth: "80px",
    background: "white",
    borderRadius: "4px",
    outline: "none",
    textAlign: "center" as const,
    border: "1px solid #ccc",
    fontSize: "12px",
    padding: "4px",
    wordWrap: "break-word" as const,
    whiteSpace: "pre-wrap" as const,
    zIndex: 1001,
  };

  const edgePathData = getEdgePath(edgeType);

  return (
    <>
      {/* Define a custom marker with the same color as the edge */}
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill={strokeColor}
            style={{
              filter: "none",
              shapeRendering: "crispEdges",
              vectorEffect: "non-scaling-stroke",
            }}
          />
        </marker>
      </defs>

      {edgeType === "double" ? (
        <g style={{ isolation: "isolate" }}>
          <path
            id={`${id}-1`}
            d={edgePathData.path1}
            className="react-flow__edge-path"
            strokeWidth={enhancedStyle.strokeWidth || 1}
            stroke={strokeColor}
            fill="none"
            style={{
              ...enhancedStyle,
              filter: "none",
              mixBlendMode: "normal",
              shapeRendering: "crispEdges",
              vectorEffect: "non-scaling-stroke",
            }}
            markerEnd={customMarkerEnd}
            onDoubleClick={handleDoubleClick}
          />
          <path
            id={`${id}-2`}
            d={edgePathData.path2}
            className="react-flow__edge-path"
            strokeWidth={enhancedStyle.strokeWidth || 1}
            stroke={strokeColor}
            fill="none"
            style={{
              ...enhancedStyle,
              filter: "none",
              mixBlendMode: "normal",
              shapeRendering: "crispEdges",
              vectorEffect: "non-scaling-stroke",
              markerEnd: undefined,
            }}
            onDoubleClick={handleDoubleClick}
          />
        </g>
      ) : edgeType === "animated" ? (
        <path
          id={id}
          d={edgePathData as string}
          className="react-flow__edge-path animated-edge-path"
          strokeWidth={enhancedStyle.strokeWidth || 2}
          stroke={strokeColor}
          fill="none"
          style={{
            ...enhancedStyle,
            markerEnd: undefined,
            strokeDasharray: "5, 5",
            filter: "none",
            mixBlendMode: "normal",
            shapeRendering: "crispEdges",
            vectorEffect: "non-scaling-stroke",
          }}
          markerEnd={customMarkerEnd}
          onDoubleClick={handleDoubleClick}
        />
      ) : (
        <path
          id={id}
          d={edgePathData as string}
          className="react-flow__edge-path"
          strokeWidth={enhancedStyle.strokeWidth || 2}
          stroke={strokeColor}
          fill="none"
          style={{
            ...enhancedStyle,
            markerEnd: undefined,
            filter: "none",
            mixBlendMode: "normal",
            shapeRendering: "crispEdges",
            vectorEffect: "non-scaling-stroke",
          }}
          markerEnd={customMarkerEnd}
          onDoubleClick={handleDoubleClick}
        />
      )}

      <EdgeLabelRenderer>
        <div style={labelStyles} className="nodrag nopan">
          {isEditing ? (
            <textarea
              ref={inputRef}
              value={labelText}
              onChange={handleLabelChange}
              onBlur={handleLabelBlur}
              onKeyDown={handleKeyDown}
              className="nodrag nopan"
              style={inputStyles}
              autoFocus
            />
          ) : (
            labelText
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;
