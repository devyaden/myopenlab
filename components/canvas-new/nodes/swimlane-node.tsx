"use client";

import { memo, useState, useCallback, useEffect } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "reactflow";
import type React from "react";
import { PlusCircle } from "lucide-react";

interface Lane {
  id: string;
  label: string;
  height: number;
}

interface SwimlaneNodeData {
  label: string;
  lanes: Lane[];
  style?: React.CSSProperties & {
    fontFamily?: string;
    fontSize?: number;
    isBold?: boolean;
    isItalic?: boolean;
    isUnderline?: boolean;
    textAlign?: "left" | "center" | "right" | "justify";
    locked?: boolean;
    isVertical?: boolean;
    textColor?: string;
  };
  onLabelChange?: (nodeId: string, laneId: string, newLabel: string) => void;
  onAddLane?: (nodeId: string) => void;
  onLaneResize?: (nodeId: string, laneId: string, newHeight: number) => void;
}

export const SwimlaneNode = memo(
  ({ id, data, selected }: NodeProps<SwimlaneNodeData>) => {
    const [editingLane, setEditingLane] = useState<string | null>(null);
    const [labelValues, setLabelValues] = useState<Record<string, string>>({});
    const [laneHeights, setLaneHeights] = useState<Record<string, number>>({});

    useEffect(() => {
      const initialLabelValues: Record<string, string> = {};
      const initialLaneHeights: Record<string, number> = {};
      data.lanes.forEach((lane) => {
        initialLabelValues[lane.id] = lane.label;
        initialLaneHeights[lane.id] = lane.height;
      });
      setLabelValues(initialLabelValues);
      setLaneHeights(initialLaneHeights);
    }, [data.lanes]);

    const handleDoubleClick = useCallback(
      (laneId: string) => {
        if (!data.style?.locked) {
          setEditingLane(laneId);
        }
      },
      [data.style?.locked]
    );

    const handleBlur = useCallback(
      (laneId: string) => {
        setEditingLane(null);
        if (data.onLabelChange) {
          data.onLabelChange(id, laneId, labelValues[laneId]);
        }
      },
      [data, id, labelValues]
    );

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>, laneId: string) => {
        if (event.key === "Enter") {
          setEditingLane(null);
          if (data.onLabelChange) {
            data.onLabelChange(id, laneId, labelValues[laneId]);
          }
        }
      },
      [data, id, labelValues]
    );

    const handleAddLane = useCallback(() => {
      if (data.onAddLane) {
        data.onAddLane(id);
      }
    }, [data, id]);

    const handleResizeStart = useCallback(
      (event: React.MouseEvent, laneId: string) => {
        event.stopPropagation();
        const resizeStartY = event.clientY;

        const handleResizeMove = (moveEvent: MouseEvent) => {
          const deltaY = moveEvent.clientY - resizeStartY;
          const newHeight = Math.max(50, laneHeights[laneId] + deltaY);
          setLaneHeights((prev) => ({ ...prev, [laneId]: newHeight }));
          if (data.onLaneResize) {
            data.onLaneResize(id, laneId, newHeight);
          }
        };

        const handleResizeEnd = () => {
          window.removeEventListener("mousemove", handleResizeMove);
          window.removeEventListener("mouseup", handleResizeEnd);
        };

        window.addEventListener("mousemove", handleResizeMove);
        window.addEventListener("mouseup", handleResizeEnd);
      },
      [data, id, laneHeights]
    );

    const nodeStyle: React.CSSProperties = {
      width: "100%",
      height: "100%",
      borderWidth: "2px",
      borderStyle: "solid",
      borderColor: selected ? "#3182ce" : "#e2e8f0",
      borderRadius: "4px",
      minWidth: "400px",
      minHeight: "100px",
      ...data.style,
      fontFamily: data.style?.fontFamily || "Arial",
      fontSize: data.style?.fontSize || 12,
      fontWeight: data.style?.isBold ? "bold" : "normal",
      fontStyle: data.style?.isItalic ? "italic" : "normal",
      textDecoration: data.style?.isUnderline ? "underline" : "none",
      textAlign: data.style?.textAlign || "left",
    };

    const getLaneTextStyle = (laneId: string) => ({
      fontFamily: data.style?.fontFamily || "Arial",
      fontSize: `${data.style?.fontSize || 12}px`,
      fontWeight: data.style?.isBold ? "bold" : "normal",
      fontStyle: data.style?.isItalic ? "italic" : "normal",
      textDecoration: data.style?.isUnderline ? "underline" : "none",
      color: data.style?.textColor || "#000000",
    });

    return (
      <>
        <NodeResizer isVisible={selected} minWidth={400} minHeight={100} />
        <div
          style={nodeStyle}
          className={`${selected ? "ring-2 ring-blue-500" : ""}`}
        >
          <Handle type="target" position={Position.Left} className="w-3 h-3" />
          <div className="flex flex-col w-full h-full">
            {data.lanes.map((lane, index) => (
              <div
                key={lane.id}
                className="relative flex-grow border-b border-gray-200 last:border-b-0"
                style={{ height: laneHeights[lane.id] }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-10 bg-gray-100 border-r border-gray-300 flex items-center justify-center"
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                    textOrientation: "mixed",
                    ...getLaneTextStyle(lane.id),
                  }}
                >
                  {editingLane === lane.id ? (
                    <input
                      type="text"
                      value={labelValues[lane.id]}
                      onChange={(e) =>
                        setLabelValues({
                          ...labelValues,
                          [lane.id]: e.target.value,
                        })
                      }
                      onBlur={() => handleBlur(lane.id)}
                      onKeyDown={(e) => handleKeyDown(e, lane.id)}
                      className="w-full text-center bg-transparent border-none outline-none transform rotate-180"
                      style={{
                        writingMode: "horizontal-tb",
                        ...getLaneTextStyle(lane.id),
                      }}
                      autoFocus
                    />
                  ) : (
                    <div onDoubleClick={() => handleDoubleClick(lane.id)}>
                      {labelValues[lane.id]}
                    </div>
                  )}
                </div>
                <div className="ml-10 h-full"></div>
                {index < data.lanes.length - 1 && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-2 bg-gray-300 cursor-row-resize"
                    onMouseDown={(e) => handleResizeStart(e, lane.id)}
                  ></div>
                )}
              </div>
            ))}
          </div>
          {selected && (
            <div className="absolute bottom-2 right-2 p-2 bg-white bg-opacity-80 z-10">
              <PlusCircle
                className="w-6 h-6 cursor-pointer text-blue-500 hover:text-blue-600"
                onClick={handleAddLane}
              />
            </div>
          )}
          <Handle type="source" position={Position.Right} className="w-3 h-3" />
        </div>
      </>
    );
  }
);

SwimlaneNode.displayName = "SwimlaneNode";
