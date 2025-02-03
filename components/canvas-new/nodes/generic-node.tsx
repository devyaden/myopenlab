import { memo, useState, useCallback, useEffect } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import type React from "react";

interface GenericNodeProps {
  data: {
    label: string;
    style?: React.CSSProperties & {
      fontFamily?: string;
      fontSize?: number;
      isBold?: boolean;
      isItalic?: boolean;
      isUnderline?: boolean;
      textAlign?: "left" | "center" | "right" | "justify";
      shape?: "rectangle" | "rounded" | "circle";
      locked?: boolean;
      borderStyle?: string;
      borderWidth?: number;
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
    const [nodeSize, setNodeSize] = useState({
      width: data.style?.width || 150,
      height: data.style?.height || 50,
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
      (evt: any, { width, height }: { width: number; height: number }) => {
        setNodeSize({ width, height });
      },
      []
    );

    const nodeStyle: React.CSSProperties = {
      ...data.style,
      width: nodeSize.width,
      height: nodeSize.height,
      fontFamily: data.style?.fontFamily || "Arial",
      fontSize: data.style?.fontSize || 12,
      fontWeight: data.style?.isBold ? "bold" : "normal",
      fontStyle: data.style?.isItalic ? "italic" : "normal",
      textDecoration: data.style?.isUnderline ? "underline" : "none",
      textAlign: data.style?.textAlign || "left",
      borderRadius:
        data.style?.shape === "rounded"
          ? "8px"
          : data.style?.shape === "circle"
            ? "50%"
            : "0",
      zIndex: selected ? 1 : 0,
      borderWidth: data.style?.borderWidth || 2,
      borderStyle: data.style?.borderStyle || "solid",
      borderColor: selected ? "#3b82f6" : "#d1d5db",
    };

    return (
      <>
        <NodeResizer
          isVisible={selected}
          minWidth={100}
          minHeight={50}
          onResize={handleResize}
        />
        <div
          className={`bg-white p-2 shadow-md ${
            selected ? "ring-2 ring-blue-500" : ""
          } ${data.style?.locked ? "cursor-not-allowed" : "cursor-pointer"}`}
          style={nodeStyle}
        >
          <Handle
            type="target"
            position={Position.Top}
            className="w-3 h-3"
            isConnectable={isConnectable}
          />
          {isEditing ? (
            <input
              type="text"
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full text-center bg-transparent border-none outline-none"
              autoFocus
            />
          ) : (
            <div className="text-center" onDoubleClick={handleDoubleClick}>
              {labelValue}
            </div>
          )}
          <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3"
            isConnectable={isConnectable}
          />
        </div>
      </>
    );
  }
);

GenericNode.displayName = "GenericNode";
