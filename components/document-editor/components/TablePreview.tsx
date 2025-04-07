"use client";

import type React from "react";
import { useMemo, useState } from "react";
import type { Edge, Node } from "reactflow";

import type {
  HierarchyNode,
  SortDirection,
  SortField,
} from "@/components/canvas-new/table-view/table.types";

// Helper component to render a single row
const DisplayTableRow: React.FC<{
  node: HierarchyNode;
  level: number;
  columns: any[];
  toggleRowExpansion: (nodeId: string) => void;
  expandedRows: Set<string>;
  columnWidths: Record<string, number>;
}> = ({
  node,
  level,
  columns,
  toggleRowExpansion,
  expandedRows,
  columnWidths,
}) => {
  // Function to render cell values based on column type
  const renderCellValue = (value: any, type: string) => {
    switch (type) {
      case "Text":
      case "Relation":
      case "Rollup":
        return <span>{value || ""}</span>;
      case "Date":
      case "Created Time":
      case "Last edited time":
        return value ? (
          <span>{new Date(value).toLocaleDateString()}</span>
        ) : (
          <span>-</span>
        );
      case "Checkbox":
        return <span>{value ? "Yes" : "No"}</span>;
      case "Multiselect":
        return (
          <div
            className="max-w-[150px] truncate"
            title={Array.isArray(value) ? value.join(", ") : value || ""}
          >
            {Array.isArray(value) ? value.join(", ") : value || ""}
          </div>
        );
      case "Select":
        return (
          <span className="badge bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
            {value || ""}
          </span>
        );
      case "Long Text":
        return (
          <div className="max-w-[150px] truncate" title={value || ""}>
            {value || ""}
          </div>
        );
      case "Email":
        return value ? (
          <div className="max-w-[150px] truncate">
            <a
              href={`mailto:${value}`}
              className="text-blue-600 underline"
              title={value}
            >
              {value}
            </a>
          </div>
        ) : (
          <span>-</span>
        );
      case "Number":
        return <span className="font-mono">{value || ""}</span>;
      default:
        return <span>{value || ""}</span>;
    }
  };

  return (
    <tr className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
      {columns
        .filter((column) => column.title !== "id")
        .map((column) => (
          <td
            key={column.title}
            className="border-r border-gray-200 p-2 text-sm whitespace-nowrap overflow-hidden"
            style={{
              width: columnWidths[column.title]
                ? `${columnWidths[column.title]}px`
                : "auto",
              maxWidth: "200px",
            }}
          >
            {column.title === "task"
              ? node.data?.label
              : column.title === "type"
                ? node.data?.shape
                : renderCellValue(node.data[column.title], column.type)}
          </td>
        ))}
    </tr>
  );
};

// Main TableDisplay component
const TablePreview = ({
  nodes,
  edges,
  columns,
  canvasSettings,
  visibleColumns,
  displayRows,
}: {
  nodes: Node[];
  edges: Edge[];
  columns: { title: string; type: string }[];
  canvasSettings?: {
    table_settings?: {
      columnWidths?: Record<string, number>;
      hiddenColumns?: string[];
    };
  };
  visibleColumns?: string[];
  displayRows?: number;
}) => {
  console.log("🚀 ~ nodes:", nodes);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { columnWidths = {}, hiddenColumns = [] } =
    canvasSettings?.table_settings ?? {};

  // Filter columns to display
  const displayColumns = useMemo(() => {
    if (visibleColumns) {
      return columns.filter((col) => visibleColumns.includes(col.title));
    }
    return columns.filter((col) => !hiddenColumns.includes(col.title));
  }, [columns, visibleColumns, hiddenColumns]);

  // Create hierarchy
  const createHierarchy = (nodes: Node[]): HierarchyNode[] => {
    const nodeMap = new Map<string, HierarchyNode>();
    const rootNodes: HierarchyNode[] = [];

    nodes.forEach((node) => {
      const hierarchyNode: HierarchyNode = { ...node, children: [] };
      nodeMap.set(node.id, hierarchyNode);
    });

    nodes.forEach((node) => {
      if (node.parentNode) {
        const parent = nodeMap.get(node.parentNode);
        if (parent) {
          const child = nodeMap.get(node.id)!;
          child.data = { ...child.data, parent: parent.data.label };
          parent.children.push(child);
          parent.data = {
            ...parent.data,
            children: parent.children.map((c) => c.data.label).join(", "),
          };
        }
      } else {
        rootNodes.push(nodeMap.get(node.id)!);
      }
    });

    return rootNodes;
  };

  // Enhance nodes with connection data (from/to)
  const enhanceNodesWithConnectionData = (
    nodes: Node[],
    edges: Edge[]
  ): Node[] => {
    if (!edges.length) return nodes;

    const sourceConnections = new Map<string, string[]>();
    const targetConnections = new Map<string, string[]>();

    edges.forEach((edge) => {
      if (!sourceConnections.has(edge.source))
        sourceConnections.set(edge.source, []);
      sourceConnections.get(edge.source)!.push(edge.target);

      if (!targetConnections.has(edge.target))
        targetConnections.set(edge.target, []);
      targetConnections.get(edge.target)!.push(edge.source);
    });

    return nodes.map((node) => {
      const fromNodes = targetConnections.get(node.id) || [];
      const toNodes = sourceConnections.get(node.id) || [];
      const fromLabels = fromNodes.map(
        (id) => nodes.find((n) => n.id === id)?.data.label || id
      );
      const toLabels = toNodes.map(
        (id) => nodes.find((n) => n.id === id)?.data.label || id
      );

      return {
        ...node,
        data: {
          ...node.data,
          from: fromLabels.join(", "),
          to: toLabels.join(", "),
        },
      };
    });
  };

  const insertRollupDataIntoNodes = (nodes: Node[]): Node[] => {
    if (!nodes?.length || !columns?.length) {
      return nodes;
    }

    const rollupColumns = columns?.filter((col) => col.type === "Rollup");
    if (!rollupColumns.length) {
      return nodes;
    }

    const relationColumnMap = new Map(
      columns
        ?.filter((col: any) => col.type === "Relation" && col.related_canvas_id)
        .map((col: any) => [col.related_canvas_id, col])
    );

    return nodes.map((node) => {
      rollupColumns.forEach((column: any) => {
        const relatedCanvas = column?.rollup_column?.canvas;
        if (!relatedCanvas?.canvas_data?.[0]?.nodes) return;

        const relatedCanvasNodes = relatedCanvas.canvas_data[0].nodes;
        const rollupColumnSourceTitle = column?.title;
        const rollupColumnTargetTitle = column?.rollup_column?.title;

        const relationColumn = relationColumnMap.get(relatedCanvas.id);
        if (!relationColumn) return;

        const relationColumnTitle = relationColumn.title;
        const currentRelationColumnData = node.data[relationColumnTitle]?.map(
          (n: Node) => n.id
        );
        if (!currentRelationColumnData?.length) return;

        const relationIdSet = new Set(currentRelationColumnData);
        const rollupData = relatedCanvasNodes
          .filter((n: Node) => relationIdSet.has(n.id))
          .map((filteredNode: Node) => ({
            label: filteredNode.data[rollupColumnSourceTitle],
            value: filteredNode.data[rollupColumnTargetTitle],
          }));

        node.data[column.title] = rollupData;
      });

      return node;
    });
  };

  // Compute sorted and limited hierarchy
  const sortedHierarchy = useMemo(() => {
    let updatedNodes = insertRollupDataIntoNodes(nodes);
    updatedNodes = enhanceNodesWithConnectionData(updatedNodes, edges);
    const hierarchy = createHierarchy(updatedNodes);

    if (!sortField || !sortDirection) return hierarchy;

    const sortNodes = (nodes: HierarchyNode[]): HierarchyNode[] => {
      return nodes
        .sort((a, b) => {
          let aValue: string | number = "";
          let bValue: string | number = "";
          switch (sortField) {
            case "id":
              aValue = a.id;
              bValue = b.id;
              break;
            case "task":
              aValue = a.data.label || "";
              bValue = b.data.label || "";
              break;
            case "type":
              aValue = a.data.shape || a.type || "";
              bValue = b.data.shape || b.type || "";
              break;
          }
          const sortOrder = sortDirection === "asc" ? 1 : -1;
          return aValue > bValue ? sortOrder : -sortOrder;
        })
        .map((node) => ({
          ...node,
          children: sortNodes(node.children),
        }));
    };
    return sortNodes(hierarchy);
  }, [nodes, edges, sortField, sortDirection]);

  const limitedHierarchy = useMemo(() => {
    return displayRows
      ? sortedHierarchy.slice(0, displayRows)
      : sortedHierarchy;
  }, [sortedHierarchy, displayRows]);

  // Toggle row expansion
  const toggleRowExpansion = (nodeId: string) => {
    setExpandedRows((prev) => {
      const newExpandedRows = new Set(prev);
      if (newExpandedRows.has(nodeId)) {
        newExpandedRows.delete(nodeId);
      } else {
        let currentNode = nodes.find((n) => n.id === nodeId);
        while (currentNode && currentNode.parentNode) {
          newExpandedRows.add(currentNode.parentNode);
          // @ts-ignore
          currentNode = nodes.find((n) => n.id === currentNode.parentNode);
        }
        newExpandedRows.add(nodeId);
      }
      return newExpandedRows;
    });
  };

  // Render hierarchy recursively
  const renderHierarchy = (
    nodes: HierarchyNode[],
    level = 0
  ): JSX.Element[] => {
    return nodes.flatMap((node) => {
      const isExpanded = expandedRows.has(node.id);
      const hasChildren = node.children.length > 0;

      return [
        <DisplayTableRow
          key={node.id}
          node={node}
          level={level}
          columns={displayColumns}
          toggleRowExpansion={toggleRowExpansion}
          expandedRows={expandedRows}
          columnWidths={columnWidths}
        />,
        ...(isExpanded && hasChildren
          ? renderHierarchy(node.children, level + 1)
          : []),
      ];
    });
  };

  return (
    <div className="p-4 mx-auto bg-white min-h-full flex max-w-[95vw]">
      <div className="rounded-lg border border-gray-300 shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto w-full !px-0">
          <div
            className="overflow-x-auto relative"
            style={{
              maxWidth: "calc(100vw - 32px)",
              maxHeight: "calc(100vh - 280px)",
            }}
          >
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300">
                  {displayColumns
                    .filter(
                      (column) =>
                        !hiddenColumns?.includes(column.title) &&
                        column.title !== "id"
                    )
                    .map((column) => (
                      <th
                        key={column.title}
                        className="border-r border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700"
                        style={{
                          width: columnWidths[column.title]
                            ? `${columnWidths[column.title]}px`
                            : "auto",
                        }}
                      >
                        {column.title}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>{renderHierarchy(limitedHierarchy)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablePreview;
