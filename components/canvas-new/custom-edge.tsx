import { useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSimpleBezierPath,
  getSmoothStepPath,
  getStraightPath,
} from "reactflow";
import "reactflow/dist/style.css";

const CustomEdge = (params: any) => {
  console.log("🚀 ~ CustomEdge ~ params:", params);

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
    type,
  } = params;

  const [isEditing, setIsEditing] = useState(false);
  const [labelText, setLabelText] = useState(data?.label || "");

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeTpe = style.edgeType || "default";

  const getEdgePath = (edgeType: string) => {
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
        return getBezierPath(pathParams);
      case "straight":
        return getStraightPath(pathParams)[0];
      case "step":
        return getSmoothStepPath({ ...pathParams, borderRadius: 0 })[0];
      case "smoothstep":
        return getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        })[0];
      case "simplebezier":
        return getSimpleBezierPath(pathParams);
      case "dashed":
        return edgePath;
      default:
        return edgePath;
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

  console.log(
    "------------------ path -----------------",
    getEdgePath(edgeTpe)
  );

  const labelStyles = {
    position: "absolute" as const,
    transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
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
  };

  const inputStyles = {
    width: "100%",
    background: "white",
    borderRadius: "4px",
    outline: "none",
    textAlign: "center" as const,
    border: "1px solid #ccc",
    fontSize: "12px",
    wordWrap: "break-word" as const,
    whiteSpace: "pre-wrap" as const,
  };

  return (
    <>
      {/* Main edge path */}
      {/* <path
        id={id}
        d={edgePath}
        className="react-flow__edge-path"
        strokeWidth={style.edgeType === "double" ? 2 : style.strokeWidth || 2}
        strokeDasharray={style.strokeDasharray}
        stroke={style.stroke || "#000"}
        style={style}
        markerEnd={markerEnd}
        onDoubleClick={handleDoubleClick}
      /> */}

      <BaseEdge path={getEdgePath(edgeTpe) as string} markerEnd={markerEnd} />

      {/* Parallel path for double line */}
      {/* {style.edgeType === "double" && (
        <path
          d={getParallelPath(edgePath, 3)}
          className="react-flow__edge-path"
          strokeWidth={2}
          stroke={style.stroke || "#000"}
          style={{
            ...style,
            strokeDasharray: style.strokeDasharray,
          }}
          markerEnd={markerEnd}
        />
      )} */}

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
