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
        let cellValue;
        // Handle special case for 'task' column which is stored as 'label' in node data
        if (column.title === "task") {
          cellValue = node?.data?.label || "";
        } else if (column.title === "type") {
          cellValue = node?.data?.shape || "";
        } else {
          cellValue = node?.data?.[column.title] || "";
        }

        // Handle relation data
        if (
          cellValue &&
          typeof cellValue === "object" &&
          (Array.isArray(cellValue) || cellValue.id) &&
          (column.title.toLowerCase().includes("relation") ||
            column.type === "relation")
        ) {
          // If it's an array of relations
          if (Array.isArray(cellValue)) {
            // Extract labels from relation objects
            const relationLabels = cellValue
              .map((rel: any) => {
                if (rel && rel.data && rel.data.label) return rel.data.label;
                if (rel && rel.label) return rel.label;
                if (rel && typeof rel === "object") {
                  // Try to find the first string property to use as label
                  for (const key in rel) {
                    if (typeof rel[key] === "string" && key !== "id") {
                      return rel[key];
                    }
                  }
                }
                return null;
              })
              .filter(Boolean)
              .join(", ");

            return relationLabels || "No relations";
          }
          // If it's a single relation object
          else if (cellValue.id) {
            if (cellValue.data && cellValue.data.label)
              return cellValue.data.label;
            if (cellValue.label) return cellValue.label;
            // Try to find a non-id string property
            for (const key in cellValue) {
              if (typeof cellValue[key] === "string" && key !== "id") {
                return cellValue[key];
              }
            }
          }
        }

        // Convert other objects to strings to prevent React rendering errors
        if (typeof cellValue === "object" && cellValue !== null) {
          return JSON.stringify(cellValue);
        }
        return String(cellValue);
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
