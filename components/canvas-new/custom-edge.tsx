import { useState } from "react";
import {
  EdgeLabelRenderer,
  getBezierPath,
  getSimpleBezierPath,
  getSmoothStepPath,
  getStraightPath,
  Position,
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
      case "double":
        return getDoubleLinePath(pathParams);
      default:
        return getSmoothStepPath(pathParams)[0];
    }
  };

  const handleDoubleClick = (event: { preventDefault: () => void }) => {
    console.log("🚀 ~ CustomEdge ~ event:", event);
    event.preventDefault();
    setIsEditing(true);
  };

  console.log("------- isEditing", isEditing);

  const handleLabelChange = (event: { target: { value: any } }) => {
    setLabelText(event.target.value);
  };

  const handleLabelBlur = () => {
    setIsEditing(false);
    if (data.onLabelChange) {
      data.onLabelChange(id, labelText);
    }
  };

  const labelStyles = {
    position: "absolute" as const,
    transform: `translate(-50%, -50%)`,
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

  const edgePathData = getEdgePath(edgeType);

  return (
    <>
      {edgeType === "double" ? (
        <>
          <path
            id={`${id}-1`}
            d={edgePathData.path1}
            className="react-flow__edge-path"
            strokeWidth={style.strokeWidth || 1}
            stroke={style.stroke || "#000"}
            style={{ ...style }}
            markerEnd={markerEnd}
            onDoubleClick={handleDoubleClick}
          />
          <path
            id={`${id}-2`}
            d={edgePathData.path2}
            className="react-flow__edge-path"
            strokeWidth={style.strokeWidth || 1}
            stroke={style.stroke || "#000"}
            style={style}
            markerEnd={markerEnd}
            onDoubleClick={handleDoubleClick}
          />
        </>
      ) : (
        <path
          id={id}
          d={edgePathData as string}
          className="react-flow__edge-path"
          strokeWidth={style.strokeWidth || 2}
          stroke={style.stroke || "#000"}
          style={style}
          markerEnd={markerEnd}
          onDoubleClick={handleDoubleClick}
        />
      )}

      <EdgeLabelRenderer>
        <div
          style={{
            ...labelStyles,
            // transform: `translate(-50%, -50%) translate(${edgePathData.labelX}px,${edgePathData.labelY}px)`,
          }}
          className="nodrag nopan"
        >
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
