"use client";

import React from "react";

interface TablePreviewProps {
  nodes: any[];
  edges: any[];
  columns: any[];
  displayRows?: number;
  visibleColumns?: string[];
}

export default function TablePreview({
  nodes,
  edges,
  columns,
  displayRows = 5,
  visibleColumns,
}: TablePreviewProps) {
  // Filter columns to only show visible ones if specified
  const filteredColumns = visibleColumns
    ? columns.filter(
        (col) => visibleColumns.includes(col.title) && col.title !== "id"
      )
    : columns.filter((col) => col.title !== "id");

  // Get data from nodes
  const tableData = React.useMemo(() => {
    if (!nodes || !nodes.length) return [];

    return nodes.slice(0, displayRows).map((node) => {
      return filteredColumns.map((column) => {
        // Handle special case for 'task' column which is stored as 'label' in node data
        if (column.title === "task") {
          return node?.data?.label || "";
        }

        if (column.title === "type") {
          return node?.data?.shape || "";
        }

        return node?.data?.[column.title] || "";
      });
    });
  }, [nodes, filteredColumns, displayRows]);

  if (!nodes || !nodes.length || !columns || !columns.length) {
    return (
      <div className="text-center py-4 text-gray-500">
        No data available for preview
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[200px] border border-gray-200 rounded">
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-300">
            {filteredColumns.map((column, index) => (
              <th
                key={`header-${index}`}
                className="border-r border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700"
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, rowIndex) => (
            <tr
              key={`row-${rowIndex}`}
              className="border-b border-gray-300 hover:bg-gray-50"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={`cell-${rowIndex}-${cellIndex}`}
                  className="border-r border-gray-300 px-3 py-2 text-xs text-gray-700 truncate"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
