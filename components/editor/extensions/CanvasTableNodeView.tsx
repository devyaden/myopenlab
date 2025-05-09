"use client";

import type React from "react";
// @ts-ignore
import { NodeViewWrapper } from "@tiptap/react";
import { useEffect, useState, useRef } from "react";

interface CanvasTableNodeViewProps {
  node: {
    attrs: {
      tableId: string;
      rows: number;
      columns: number;
      data: string;
      width: number | null;
    };
  };
  updateAttributes: (attrs: Record<string, any>) => void;
  selected: boolean;
}

export default function CanvasTableNodeView({
  node,
  updateAttributes,
  selected,
}: CanvasTableNodeViewProps) {
  const [tableData, setTableData] = useState<string[][]>([]);
  const [isSelected, setIsSelected] = useState(selected);
  const [width, setWidth] = useState<number | null>(node.attrs.width);
  const tableRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (node.attrs.data) {
        const parsedData =
          typeof node.attrs.data === "string"
            ? JSON.parse(node.attrs.data)
            : node.attrs.data;

        // Ensure we have valid data
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          // Get headers to determine which columns might be relation columns
          const headers = parsedData[0] || [];
          const relationColumns = headers.map(
            (header: string, index: number) => ({
              index,
              isRelation: header.toLowerCase().includes("relation"),
            })
          );

          // Process the data and handle relations
          const stringifiedData = parsedData.map(
            (row: any[], rowIndex: number) => {
              if (!Array.isArray(row)) return [];

              return row.map((cell: any, cellIndex: number) => {
                // If this is the header row, just return the header text
                if (rowIndex === 0) return String(cell);

                // Check if this column is a relation column
                const isRelationColumn = relationColumns.find(
                  (col: { index: number; isRelation: boolean }) =>
                    col.index === cellIndex
                )?.isRelation;

                // Special handling for relation data
                if (isRelationColumn && cell) {
                  try {
                    let relationValue = cell;

                    // If it's a JSON string, parse it
                    if (
                      typeof cell === "string" &&
                      (cell.startsWith("[") || cell.startsWith("{"))
                    ) {
                      try {
                        relationValue = JSON.parse(cell);
                      } catch (e) {
                        // If parsing fails, use the original value
                        relationValue = cell;
                      }
                    }

                    // Extract labels from relation objects
                    if (Array.isArray(relationValue)) {
                      const labels = relationValue
                        .map((rel: any) => {
                          if (rel && rel.data && rel.data.label)
                            return rel.data.label;
                          if (rel && rel.label) return rel.label;
                          if (rel && typeof rel === "object") {
                            // Try to find a non-id string property
                            for (const key in rel) {
                              if (
                                typeof rel[key] === "string" &&
                                key !== "id"
                              ) {
                                return rel[key];
                              }
                            }
                          }
                          return null;
                        })
                        .filter(Boolean)
                        .join(", ");

                      return labels || "No relations";
                    }
                    // If it's a single relation object
                    else if (
                      relationValue &&
                      typeof relationValue === "object" &&
                      relationValue.id
                    ) {
                      if (relationValue.data && relationValue.data.label)
                        return relationValue.data.label;
                      if (relationValue.label) return relationValue.label;
                      // Try to find a non-id string property
                      for (const key in relationValue) {
                        if (
                          typeof relationValue[key] === "string" &&
                          key !== "id"
                        ) {
                          return relationValue[key];
                        }
                      }
                    }
                  } catch (e) {
                    console.error("Error processing relation data:", e);
                  }
                }

                // Ensure cell value is a string for non-relation data
                if (typeof cell === "object" && cell !== null) {
                  return JSON.stringify(cell);
                }
                return String(cell);
              });
            }
          );

          setTableData(stringifiedData);
        } else {
          console.error("Invalid table data format:", parsedData);
          setTableData([]);
        }
      }
    } catch (error) {
      console.error("Error parsing table data:", error);
      setTableData([]);
    }
  }, [node.attrs.data]);

  // Update isSelected when the selected prop changes
  useEffect(() => {
    setIsSelected(selected);
  }, [selected]);

  // Handle click to select
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSelected(true);
  };

  // Handle click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsSelected(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Resize handlers
  const startResize = (
    e: React.MouseEvent,
    directionX: number,
    directionY: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Get initial values
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = wrapperRef.current?.offsetWidth || 0;
    const startHeight = wrapperRef.current?.offsetHeight || 0;

    // Create resize function
    const resize = (moveEvent: MouseEvent) => {
      // Calculate deltas
      const deltaX = (moveEvent.clientX - startX) * directionX;
      const deltaY = (moveEvent.clientY - startY) * directionY;

      // Set new dimensions
      if (wrapperRef.current) {
        // Apply width changes if we're resizing horizontally
        if (directionX !== 0) {
          const newWidth = Math.max(300, startWidth + deltaX);
          wrapperRef.current.style.width = `${newWidth}px`;
          setWidth(newWidth);
          updateAttributes({ width: newWidth });
        }

        // Apply height changes if we're resizing vertically
        if (directionY !== 0) {
          const newHeight = Math.max(130, startHeight + deltaY);
          // For height, we adjust the table's style directly
          if (tableRef.current) {
            tableRef.current.style.height = `${newHeight}px`;
          }
        }
      }
    };

    // Create stop function
    const stopResize = () => {
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResize);
    };

    // Add event listeners
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
  };

  // Simple resize functions for each corner/edge
  const startResizeTopLeft = (e: React.MouseEvent) => startResize(e, -1, -1);
  const startResizeTop = (e: React.MouseEvent) => startResize(e, 0, -1);
  const startResizeTopRight = (e: React.MouseEvent) => startResize(e, 1, -1);
  const startResizeRight = (e: React.MouseEvent) => startResize(e, 1, 0);
  const startResizeBottomRight = (e: React.MouseEvent) => startResize(e, 1, 1);
  const startResizeBottom = (e: React.MouseEvent) => startResize(e, 0, 1);
  const startResizeBottomLeft = (e: React.MouseEvent) => startResize(e, -1, 1);
  const startResizeLeft = (e: React.MouseEvent) => startResize(e, -1, 0);

  // Check if we have valid table data
  const hasValidData = tableData.length > 0 && tableData[0].length > 0;

  return (
    <NodeViewWrapper
      className={`relative my-4 ${isSelected ? "is-selected" : ""}`}
      style={{
        width: width ? `${width}px` : "100%",
        maxWidth: "100%",
      }}
      ref={wrapperRef}
      onClick={handleClick}
    >
      {hasValidData ? (
        <div
          className={`relative rounded-md shadow-sm ${
            isSelected ? "border-blue-500 border-2" : "border border-gray-300"
          }`}
          ref={tableRef}
        >
          <div className="overflow-x-auto w-full">
            <div className="inline-block min-w-full">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-300">
                    {tableData[0]?.map((header, colIndex) => (
                      <th
                        key={`header-${colIndex}`}
                        className="border-r border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap"
                        style={{ minWidth: "180px", width: "180px" }}
                      >
                        <div className="truncate" title={header}>
                          {header || `Column ${colIndex + 1}`}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.slice(1).map((row, rowIndex) => (
                    <tr
                      key={`row-${rowIndex + 1}`}
                      className="border-b border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      {row.map((cell, colIndex) => (
                        <td
                          key={`cell-${rowIndex + 1}-${colIndex}`}
                          className="border-r border-gray-300 px-4 py-2 text-sm text-gray-700 whitespace-nowrap"
                          style={{ minWidth: "180px", width: "180px" }}
                        >
                          <div className="truncate" title={cell}>
                            {cell}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 border border-gray-300 rounded-md text-center text-gray-500">
          No table data available
        </div>
      )}

      {/* Resize handles - only visible when selected */}
      {isSelected && (
        <>
          {/* Corner resize handles */}
          <div
            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-nwse-resize"
            onMouseDown={startResizeTopLeft}
          />
          <div
            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-nesw-resize"
            onMouseDown={startResizeTopRight}
          />
          <div
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-nwse-resize"
            onMouseDown={startResizeBottomRight}
          />
          <div
            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-nesw-resize"
            onMouseDown={startResizeBottomLeft}
          />

          {/* Edge resize handles */}
          <div
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-ns-resize"
            onMouseDown={startResizeTop}
          />
          <div
            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-ew-resize"
            onMouseDown={startResizeRight}
          />
          <div
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-ns-resize"
            onMouseDown={startResizeBottom}
          />
          <div
            className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-ew-resize"
            onMouseDown={startResizeLeft}
          />
        </>
      )}
    </NodeViewWrapper>
  );
}
