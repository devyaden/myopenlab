"use client";

import { useState } from "react";
import { EdgeLabelRenderer, getSmoothStepPath } from "reactflow";
import "reactflow/dist/style.css";

const CustomEdge = ({
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
}: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [labelText, setLabelText] = useState(data?.label || "");

  const edgeType = data?.type || "default";

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  let strokeDasharray;
  switch (edgeType) {
    case "dashed":
      strokeDasharray = "5,5";
      break;
    case "dotted":
      strokeDasharray = "1,5";
      break;
  }

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

  const labelStyles: any = {
    position: "absolute",
    transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
    fontSize: 12,
    pointerEvents: "all",
    maxWidth: "200px", // Changed to maxWidth
    wordWrap: "break-word",
    // whiteSpace: "pre-wrap",
    textAlign: "center" as const,
    backgroundColor: "white",
    padding: labelText.trim() ? "4px" : "0", // Conditional padding
    borderRadius: "4px",
    border: labelText.trim() ? "1px solid transparent" : "none", // Conditional border
    display: labelText.trim() || isEditing ? "block" : "none", // Hide if no text and not editing
  };

  const inputStyles = {
    width: "100%",
    // minHeight: "24px",
    background: "white",
    borderRadius: "4px",
    // padding: "2px 4px",
    outline: "none",
    textAlign: "center" as const,
    // marginBottom: "12px",
    border: "1px solid #ccc",
    fontSize: "12px",
    wordWrap: "break-word" as const,
    whiteSpace: "pre-wrap" as const,
  };

  return (
    <>
      <path
        id={id}
        d={edgePath}
        className="react-flow__edge-path"
        strokeWidth={2}
        strokeDasharray={strokeDasharray}
        stroke="#000"
        style={style}
        markerEnd={markerEnd}
        onDoubleClick={handleDoubleClick}
      />
      {style.edgeType === "double" && (
        <path
          d={edgePath}
          className="react-flow__edge-path"
          strokeWidth={2}
          stroke="#000"
          style={{ ...style, transform: "translate(0, 3px)" }}
        />
      )}
      <EdgeLabelRenderer>
        <div style={labelStyles} className="nodrag nopan">
          {isEditing ? (
            <textarea
              value={labelText}
              onChange={handleLabelChange}
              onBlur={handleLabelBlur}
              className="nodrag nopan"
              style={inputStyles}
              autoFocus
            />
          ) : (
            labelText.trim() && (
              <div
                onDoubleClick={handleDoubleClick}
                style={{
                  minHeight: "20px",
                  wordBreak: "break-word",
                }}
              >
                {labelText}
              </div>
            )
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;
