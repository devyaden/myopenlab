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

    // Process nodes with rollup and relation data
    const processedNodes = nodes.map((node) => {
      const newNode = { ...node };
      columns?.forEach((column) => {
        // Handle rollup columns
        if (column.type === "Rollup") {
          // Initialize with empty array if no rollup data exists
          newNode.data[column.title] = newNode.data[column.title] || [];
        }
        // Handle relation columns
        else if (column.type === "Relation") {
          const relationData = newNode.data[column.title];
          // Ensure relation data is always an array
          if (relationData) {
            newNode.data[column.title] = Array.isArray(relationData)
              ? relationData
              : [relationData];
          } else {
            newNode.data[column.title] = [];
          }
        }
      });
      return newNode;
    });

    return processedNodes.slice(0, displayRows).map((node) => {
      return filteredColumns.map((column) => {
        let cellValue;

        // Handle special case for 'task' column which is stored as 'label' in node data
        if (column.title === "task") {
          cellValue = node?.data?.label || "";
        } else if (column.title === "type") {
          cellValue = node?.data?.shape || "";
        } else {
          cellValue = node?.data?.[column.title];
        }

        // Handle different column types
        switch (column.type) {
          case "Number":
            return typeof cellValue === "number"
              ? cellValue.toString()
              : typeof cellValue === "string"
                ? parseFloat(cellValue).toString() || "0"
                : "0";

          case "Date":
          case "Created Time":
          case "Last edited time":
            return cellValue ? new Date(cellValue).toLocaleString() : "";

          case "Checkbox":
            return cellValue ? "Yes" : "No";

          case "Relation":
            if (cellValue && Array.isArray(cellValue)) {
              return (
                cellValue
                  .map((rel: any) => {
                    if (rel?.data?.label) return rel.data.label;
                    if (rel?.label) return rel.label;
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
                  .join(", ") || "No relations"
              );
            }
            return "No relations";

          case "Rollup":
            if (cellValue && Array.isArray(cellValue)) {
              return cellValue.join(", ") || "No data";
            }
            return "No data";

          case "Select":
          case "Multiselect":
            if (Array.isArray(cellValue)) {
              return cellValue.join(", ");
            }
            return cellValue || "";

          default:
            // For text and other types
            if (typeof cellValue === "object" && cellValue !== null) {
              return JSON.stringify(cellValue);
            }
            return String(cellValue || "");
        }
      });
    });
  }, [nodes, filteredColumns, displayRows, columns]);

  if (!nodes || !nodes.length || !columns || !columns.length) {
    return (
      <div className="text-center py-4 text-gray-500">
        No data available for preview
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[200px] border border-gray-200 rounded">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-300">
            {filteredColumns.map((column, index) => (
              <th
                key={`header-${index}`}
                className="border-r border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap"
                style={{ minWidth: "150px" }}
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
                  className="border-r border-gray-300 px-3 py-2 text-xs text-gray-700"
                  style={{ minWidth: "150px" }}
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
  );
}
