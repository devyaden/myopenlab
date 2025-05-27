"use client";

import type React from "react";
// @ts-ignore
import { NodeViewWrapper } from "@tiptap/react";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useDocumentStore } from "../hooks/useDocument";

interface CanvasTableNodeViewProps {
  node: {
    attrs: {
      tableId: string;
      rows: number;
      columns: number;
      data: string;
      width: number | null;
      // New dynamic attributes
      filterConfig: string;
      sortConfig: string | null;
      selectedColumns: string;
      displayRows: number;
      isDynamic: boolean;
      lastUpdated: string | null;
    };
  };
  updateAttributes: (attrs: Record<string, any>) => void;
  selected: boolean;
}

// Type definitions for filters
type FilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "greater_than"
  | "less_than"
  | "is_empty"
  | "is_not_empty"
  | "true"
  | "false";

interface FilterType {
  id: string;
  column: string;
  operator: FilterOperator;
  value: any;
}

interface FilterGroup {
  id: string;
  filters: FilterType[];
  conjunction: "AND" | "OR";
}

// Helper function to get data key (same as in TableView)
const getDataKey = (column: any): string => {
  // If dataKey is explicitly set, use it
  if (column.dataKey) {
    return column.dataKey;
  }

  // If data_key from database is set, use it
  if (column.data_key) {
    return column.data_key;
  }

  // Fallback for existing columns without dataKey
  if (column.title === "task") return "label";
  if (column.title === "type") return "shape";
  if (column.title === "id") return "id";

  // For all other columns, use the title as the key
  return column.title;
};

export default function CanvasTableNodeView({
  node,
  updateAttributes,
  selected,
}: CanvasTableNodeViewProps) {
  // State variables
  const [tableData, setTableData] = useState<string[][]>([]);
  const [isSelected, setIsSelected] = useState(selected);
  const [width, setWidth] = useState<number | null>(node.attrs.width);
  const [height, setHeight] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });

  // Refs
  const tableRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get data from document store
  const { folderCanvases, refreshSingleCanvas } = useDocumentStore();

  // Parse saved configuration
  const savedConfig = useMemo(() => {
    try {
      return {
        filterGroups: node.attrs.filterConfig
          ? JSON.parse(node.attrs.filterConfig)
          : [],
        sortConfig: node.attrs.sortConfig
          ? JSON.parse(node.attrs.sortConfig)
          : null,
        selectedColumns: node.attrs.selectedColumns
          ? JSON.parse(node.attrs.selectedColumns)
          : [],
        displayRows: node.attrs.displayRows || 5,
        isDynamic: node.attrs.isDynamic !== false, // Default to true
      };
    } catch (e) {
      console.error("Error parsing saved configuration:", e);
      return {
        filterGroups: [],
        sortConfig: null,
        selectedColumns: [],
        displayRows: 5,
        isDynamic: true,
      };
    }
  }, [
    node.attrs.filterConfig,
    node.attrs.sortConfig,
    node.attrs.selectedColumns,
    node.attrs.displayRows,
    node.attrs.isDynamic,
  ]);

  // Get the current table data from folderCanvases
  const currentTableData = useMemo(() => {
    if (!node.attrs.tableId || !savedConfig.isDynamic) return null;
    return folderCanvases.find((canvas) => canvas.id === node.attrs.tableId);
  }, [folderCanvases, node.attrs.tableId, savedConfig.isDynamic]);

  // Check if we have valid table data
  const hasValidData = useMemo(() => {
    return tableData.length > 0 && tableData[0].length > 0;
  }, [tableData]);

  // Professional height calculation using actual DOM measurements
  const calculateOptimalHeight = useCallback(() => {
    if (!hasValidData) return 300;

    const dataRowCount = tableData.length - 1; // Exclude header
    if (dataRowCount <= 0) return 200;

    // Professional calculation: each row needs enough space to be fully readable
    const HEADER_HEIGHT = 55; // Actual measured header height with padding
    const MIN_ROW_HEIGHT = 50; // Comfortable minimum row height with padding
    const CONTAINER_PADDING = 16; // Top + bottom padding
    const BORDER_HEIGHT = 4; // Border thickness (2px top + 2px bottom)
    const SAFETY_MARGIN = 8; // Extra space to prevent cutoff

    const calculatedHeight =
      HEADER_HEIGHT +
      dataRowCount * MIN_ROW_HEIGHT +
      CONTAINER_PADDING +
      BORDER_HEIGHT +
      SAFETY_MARGIN;

    // Reasonable boundaries
    const MIN_TABLE_HEIGHT = 200;
    const MAX_TABLE_HEIGHT = 600;

    if (calculatedHeight > MAX_TABLE_HEIGHT) {
      return MAX_TABLE_HEIGHT; // Will use internal scrolling
    }

    return Math.max(calculatedHeight, MIN_TABLE_HEIGHT);
  }, [tableData.length, hasValidData]);

  // Get the optimal height
  const optimalHeight = calculateOptimalHeight();

  // Simple row height calculation - let CSS handle the distribution
  const calculateRowHeight = useCallback(() => {
    if (!hasValidData) return 50;

    const containerHeight = height || optimalHeight;
    const HEADER_HEIGHT = 55;
    const CONTAINER_PADDING = 16;
    const SAFETY_MARGIN = 8;
    const availableHeight =
      containerHeight - HEADER_HEIGHT - CONTAINER_PADDING - SAFETY_MARGIN;
    const dataRowCount = tableData.length - 1;

    if (dataRowCount <= 0) return 50;

    const calculatedRowHeight = availableHeight / dataRowCount;
    return Math.max(calculatedRowHeight, 45); // Minimum readable height
  }, [tableData.length, hasValidData, height, optimalHeight]);

  // Get current row height and check if we need vertical scroll
  const rowHeight = calculateRowHeight();
  const needsVerticalScroll = tableData.length > 0 && optimalHeight >= 600;

  // Helper functions
  const getColumnTypeForFilter = useCallback(
    (columnTitle: string): string | undefined => {
      if (columnTitle === "task") return "Text";
      if (columnTitle === "type") return "Select";

      const column = currentTableData?.columns?.find(
        (col: any) => col.title === columnTitle
      );
      return column?.type;
    },
    [currentTableData]
  );

  const matchesFilter = useCallback(
    (node: any, filter: FilterType): boolean => {
      const { column, operator, value } = filter;
      const actualValue = value === "placeholder_empty" ? "" : value;

      // Find the column definition to get the proper dataKey
      const columnDef = currentTableData?.columns?.find(
        (col: any) => col.title === column
      );
      const dataKey = columnDef ? getDataKey(columnDef) : column;

      // Get the column value using dataKey
      let nodeValue;
      switch (dataKey) {
        case "label":
          nodeValue = node.data.label;
          break;
        case "shape":
          nodeValue = node.data.shape;
          break;
        case "id":
          nodeValue = node.id;
          break;
        default:
          nodeValue = node.data[column];
      }

      // Check empty values
      if (operator === "is_empty") {
        return (
          nodeValue === undefined || nodeValue === null || nodeValue === ""
        );
      }

      if (operator === "is_not_empty") {
        return (
          nodeValue !== undefined && nodeValue !== null && nodeValue !== ""
        );
      }

      // Checkbox specific operators
      if (operator === "true") return nodeValue === true;
      if (operator === "false") return nodeValue === false;

      // Return false if we're trying to compare with empty values
      if (nodeValue === undefined || nodeValue === null || nodeValue === "") {
        return false;
      }

      // Text comparison operators
      if (operator === "equals") {
        if (typeof nodeValue === "string" && typeof actualValue === "string") {
          return nodeValue.toLowerCase() === actualValue.toLowerCase();
        }
        return nodeValue === actualValue;
      }

      if (operator === "not_equals") {
        if (typeof nodeValue === "string" && typeof actualValue === "string") {
          return nodeValue.toLowerCase() !== actualValue.toLowerCase();
        }
        return nodeValue !== actualValue;
      }

      if (operator === "contains") {
        if (typeof nodeValue === "string" && typeof actualValue === "string") {
          return nodeValue.toLowerCase().includes(actualValue.toLowerCase());
        }
        if (Array.isArray(nodeValue)) {
          return nodeValue.some((item) =>
            typeof item === "string"
              ? item.toLowerCase().includes(String(actualValue).toLowerCase())
              : String(item)
                  .toLowerCase()
                  .includes(String(actualValue).toLowerCase())
          );
        }
        return String(nodeValue)
          .toLowerCase()
          .includes(String(actualValue).toLowerCase());
      }

      if (operator === "not_contains") {
        if (typeof nodeValue === "string" && typeof actualValue === "string") {
          return !nodeValue.toLowerCase().includes(actualValue.toLowerCase());
        }
        if (Array.isArray(nodeValue)) {
          return !nodeValue.some((item) =>
            typeof item === "string"
              ? item.toLowerCase().includes(String(actualValue).toLowerCase())
              : String(item)
                  .toLowerCase()
                  .includes(String(actualValue).toLowerCase())
          );
        }
        return !String(nodeValue)
          .toLowerCase()
          .includes(String(actualValue).toLowerCase());
      }

      // Numeric comparison operators
      if (operator === "greater_than") {
        const numValue =
          typeof actualValue === "string"
            ? parseFloat(actualValue)
            : actualValue;
        const numNodeValue =
          typeof nodeValue === "string" ? parseFloat(nodeValue) : nodeValue;

        if (isNaN(numValue) || isNaN(numNodeValue)) return false;
        return numNodeValue > numValue;
      }

      if (operator === "less_than") {
        const numValue =
          typeof actualValue === "string"
            ? parseFloat(actualValue)
            : actualValue;
        const numNodeValue =
          typeof nodeValue === "string" ? parseFloat(nodeValue) : nodeValue;

        if (isNaN(numValue) || isNaN(numNodeValue)) return false;
        return numNodeValue < numValue;
      }

      return false;
    },
    [currentTableData]
  );

  // Process nodes with filters and sorting
  const processedNodes = useMemo(() => {
    if (!currentTableData?.flowData?.[0]?.nodes || !savedConfig.isDynamic) {
      return [];
    }

    let nodes = [...currentTableData.flowData[0].nodes];

    // Apply filters if there are any
    if (savedConfig.filterGroups.length > 0) {
      nodes = nodes.filter((node) => {
        return savedConfig.filterGroups.some((group: FilterGroup) => {
          const filtersMatch =
            group.conjunction === "AND"
              ? group.filters.every((filter) => matchesFilter(node, filter))
              : group.filters.some((filter) => matchesFilter(node, filter));
          return filtersMatch;
        });
      });
    }

    // Apply sorting if set
    if (savedConfig.sortConfig?.field && savedConfig.sortConfig?.direction) {
      const { field: sortField, direction: sortDirection } =
        savedConfig.sortConfig;
      const columnType = getColumnTypeForFilter(sortField);

      nodes.sort((a, b) => {
        // Find the column definition to get the proper dataKey
        const columnDef = currentTableData?.columns?.find(
          (col: any) => col.title === sortField
        );
        const dataKey = columnDef ? getDataKey(columnDef) : sortField;

        let aValue, bValue;
        switch (dataKey) {
          case "label":
            aValue = a.data.label;
            bValue = b.data.label;
            break;
          case "shape":
            aValue = a.data.shape;
            bValue = b.data.shape;
            break;
          case "id":
            aValue = a.id;
            bValue = b.id;
            break;
          default:
            aValue = a.data[sortField];
            bValue = b.data[sortField];
        }

        // Handle different types of data
        if (columnType === "Number") {
          aValue =
            typeof aValue === "number" ? aValue : parseFloat(aValue) || 0;
          bValue =
            typeof bValue === "number" ? bValue : parseFloat(bValue) || 0;
        } else if (
          columnType === "Date" ||
          columnType === "Created Time" ||
          columnType === "Last edited time"
        ) {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        } else {
          aValue = String(aValue || "").toLowerCase();
          bValue = String(bValue || "").toLowerCase();
        }

        if (sortDirection === "asc") {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    return nodes;
  }, [currentTableData, savedConfig, getColumnTypeForFilter, matchesFilter]);

  // Generate table data from processed nodes
  const generateTableData = useCallback(() => {
    if (!savedConfig.isDynamic) {
      // Use static data for non-dynamic tables
      try {
        if (node.attrs.data) {
          const parsedData =
            typeof node.attrs.data === "string"
              ? JSON.parse(node.attrs.data)
              : node.attrs.data;

          if (Array.isArray(parsedData) && parsedData.length > 0) {
            return parsedData.map((row: any[]) => {
              if (!Array.isArray(row)) return [];
              return row.map((cell: any) => {
                if (typeof cell === "object" && cell !== null) {
                  return JSON.stringify(cell);
                }
                return String(cell);
              });
            });
          }
        }
        return [];
      } catch (error) {
        console.error("Error parsing static table data:", error);
        return [];
      }
    }

    // Generate dynamic data
    if (!currentTableData || savedConfig.selectedColumns.length === 0) {
      return [];
    }

    let data: string[][] = [];

    if (processedNodes.length > 0) {
      data = processedNodes
        .slice(0, savedConfig.displayRows)
        .map((node: any) => {
          return savedConfig.selectedColumns.map((columnTitle: string) => {
            // Find the column definition to get the proper dataKey
            const columnDef = currentTableData?.columns?.find(
              (col: any) => col.title === columnTitle
            );
            const dataKey = columnDef ? getDataKey(columnDef) : columnTitle;

            let cellValue;
            switch (dataKey) {
              case "label":
                cellValue = node?.data?.label || "";
                break;
              case "shape":
                cellValue = node?.data?.shape || "";
                break;
              case "id":
                cellValue = node?.id || "";
                break;
              default:
                cellValue = node?.data?.[columnTitle] || "";
            }

            // Special handling for relation data
            if (
              cellValue &&
              typeof cellValue === "object" &&
              (Array.isArray(cellValue) || cellValue.id) &&
              columnTitle.toLowerCase().includes("relation")
            ) {
              if (Array.isArray(cellValue)) {
                const labels = cellValue
                  .map((rel: any) => {
                    if (rel && rel.data && rel.data.label)
                      return rel.data.label;
                    if (rel && rel.label) return rel.label;
                    if (rel && typeof rel === "object") {
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

                return labels || "No relations";
              } else if (cellValue.id) {
                if (cellValue.data && cellValue.data.label)
                  return cellValue.data.label;
                if (cellValue.label) return cellValue.label;
                for (const key in cellValue) {
                  if (typeof cellValue[key] === "string" && key !== "id") {
                    return cellValue[key];
                  }
                }
              }
            }

            // Ensure cell value is a string
            if (typeof cellValue === "object" && cellValue !== null) {
              return JSON.stringify(cellValue);
            }
            return String(cellValue);
          });
        });
    } else {
      // Create empty data if no nodes exist
      data = Array(savedConfig.displayRows)
        .fill(0)
        .map(() => Array(savedConfig.selectedColumns.length).fill(""));
    }

    // Insert column headers at the beginning
    data.unshift([...savedConfig.selectedColumns]);
    return data;
  }, [node.attrs.data, savedConfig, currentTableData, processedNodes]);

  // Load table data
  const loadTableData = useCallback(
    async (forceRefresh = false) => {
      if (forceRefresh) {
        setIsRefreshing(true);
      }
      setIsLoading(true);
      setError(null);

      try {
        // If this is a dynamic table and we're forcing a refresh, get fresh data from database
        if (savedConfig.isDynamic && forceRefresh && node.attrs.tableId) {
          console.log("Refreshing canvas data for table:", node.attrs.tableId);
          try {
            await refreshSingleCanvas(node.attrs.tableId);
            console.log("Canvas data refreshed successfully");
          } catch (refreshError) {
            console.error("Error refreshing canvas data:", refreshError);
          }
        }

        const data = generateTableData();
        setTableData(data);

        // Update the lastUpdated timestamp
        if (savedConfig.isDynamic) {
          updateAttributes({ lastUpdated: new Date().toISOString() });
        }

        console.log("Table data loaded:", data.length, "rows");
      } catch (error) {
        console.error("Error loading table data:", error);
        setError("Failed to load table data");
        setTableData([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [
      generateTableData,
      savedConfig.isDynamic,
      updateAttributes,
      node.attrs.tableId,
      refreshSingleCanvas,
    ]
  );

  // Auto-adjust height when table data changes - professional approach
  useEffect(() => {
    if (hasValidData) {
      const newOptimalHeight = calculateOptimalHeight();
      setHeight(newOptimalHeight);

      // Apply height with proper box-sizing
      if (wrapperRef.current && tableRef.current) {
        wrapperRef.current.style.height = `${newOptimalHeight}px`;
        wrapperRef.current.style.boxSizing = "border-box";
        tableRef.current.style.height = `${newOptimalHeight}px`;
        tableRef.current.style.boxSizing = "border-box";
      }
    }
  }, [hasValidData, tableData.length, calculateOptimalHeight]);

  // Initial load and setup refresh interval
  useEffect(() => {
    loadTableData(false);
  }, [loadTableData, savedConfig.isDynamic, node.attrs.tableId]);

  // Show scroll hint for tables with many columns
  useEffect(() => {
    if (hasValidData && tableData[0]?.length > 3) {
      const scrollHint = document.getElementById("scroll-hint");
      if (scrollHint) {
        setTimeout(() => {
          scrollHint.style.opacity = "1";
        }, 1000);

        setTimeout(() => {
          scrollHint.style.opacity = "0";
        }, 4000);
      }
    }
  }, [hasValidData, tableData]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSelected) return;

      // Copy table data with Ctrl+C
      if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        const csvData = tableData.map((row) => row.join("\t")).join("\n");
        navigator.clipboard.writeText(csvData).then(() => {
          // Show brief feedback
          const feedback = document.createElement("div");
          feedback.textContent = "Table copied to clipboard!";
          feedback.className =
            "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50";
          document.body.appendChild(feedback);
          setTimeout(() => document.body.removeChild(feedback), 2000);
        });
      }

      // Refresh with F5 or Ctrl+R
      if (
        (e.key === "F5" || (e.ctrlKey && e.key === "r")) &&
        savedConfig.isDynamic
      ) {
        e.preventDefault();
        loadTableData(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSelected, tableData, savedConfig.isDynamic, loadTableData]);

  // Update isSelected when the selected prop changes
  useEffect(() => {
    setIsSelected(selected);
  }, [selected]);

  // Handle click to select
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSelected(true);
  }, []);

  // Handle right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  }, []);

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsSelected(false);
      }
      setContextMenu({ visible: false, x: 0, y: 0 });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Context menu functions
  const toggleDynamicUpdates = useCallback(() => {
    const newIsDynamic = !savedConfig.isDynamic;
    updateAttributes({ isDynamic: newIsDynamic });

    if (newIsDynamic) {
      loadTableData(true);
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }

    setContextMenu({ visible: false, x: 0, y: 0 });
  }, [savedConfig.isDynamic, updateAttributes, loadTableData]);

  const forceRefresh = useCallback(async () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
    await loadTableData(true);
  }, [loadTableData]);

  const resetToStatic = useCallback(async () => {
    updateAttributes({
      isDynamic: false,
      data: node.attrs.data,
    });

    await loadTableData(false);
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, [updateAttributes, node.attrs.data, loadTableData]);

  // Enhanced resize handlers
  const startResize = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent,
      directionX: number,
      directionY: number
    ) => {
      e.preventDefault();
      e.stopPropagation();

      const isTouch = "touches" in e;
      const startX = isTouch ? e.touches[0].clientX : e.clientX;
      const startY = isTouch ? e.touches[0].clientY : e.clientY;
      const startWidth = wrapperRef.current?.offsetWidth || 0;
      const startHeight = wrapperRef.current?.offsetHeight || 0;

      const resize = (moveEvent: MouseEvent | TouchEvent) => {
        const clientX =
          "touches" in moveEvent
            ? moveEvent.touches[0].clientX
            : moveEvent.clientX;
        const clientY =
          "touches" in moveEvent
            ? moveEvent.touches[0].clientY
            : moveEvent.clientY;

        const deltaX = (clientX - startX) * directionX;
        const deltaY = (clientY - startY) * directionY;

        if (wrapperRef.current) {
          if (directionX !== 0) {
            const newWidth = Math.max(400, startWidth + deltaX);
            wrapperRef.current.style.width = `${newWidth}px`;
            setWidth(newWidth);
            updateAttributes({ width: newWidth });
          }

          if (directionY !== 0) {
            const currentOptimalHeight = calculateOptimalHeight();
            const newHeight = Math.max(
              currentOptimalHeight,
              startHeight + deltaY
            );
            setHeight(newHeight);
            wrapperRef.current.style.height = `${newHeight}px`;
            if (tableRef.current) {
              tableRef.current.style.height = `${newHeight}px`;
            }
          }
        }
      };

      const stopResize = () => {
        document.removeEventListener("mousemove", resize as EventListener);
        document.removeEventListener("mouseup", stopResize);
        document.removeEventListener("touchmove", resize as EventListener);
        document.removeEventListener("touchend", stopResize);
      };

      document.addEventListener("mousemove", resize as EventListener);
      document.addEventListener("mouseup", stopResize);
      document.addEventListener("touchmove", resize as EventListener);
      document.addEventListener("touchend", stopResize);
    },
    [calculateOptimalHeight, updateAttributes]
  );

  // Resize function handlers
  const startResizeTopLeft = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => startResize(e, -1, -1),
    [startResize]
  );
  const startResizeTop = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => startResize(e, 0, -1),
    [startResize]
  );
  const startResizeTopRight = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => startResize(e, 1, -1),
    [startResize]
  );
  const startResizeRight = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => startResize(e, 1, 0),
    [startResize]
  );
  const startResizeBottomRight = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => startResize(e, 1, 1),
    [startResize]
  );
  const startResizeBottom = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => startResize(e, 0, 1),
    [startResize]
  );
  const startResizeBottomLeft = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => startResize(e, -1, 1),
    [startResize]
  );
  const startResizeLeft = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => startResize(e, -1, 0),
    [startResize]
  );

  // Show loading state
  if (isLoading) {
    return (
      <NodeViewWrapper
        className={`relative my-4 ${isSelected ? "is-selected" : ""}`}
        style={{
          width: width ? `${Math.max(width, 400)}px` : "100%",
          height: height ? `${height}px` : `${optimalHeight}px`,
          maxWidth: "100%",
          minWidth: "400px",
          minHeight: `${Math.max(optimalHeight, 200)}px`,
        }}
        ref={wrapperRef}
        onClick={handleClick}
      >
        <div className="p-4 border border-gray-300 rounded-md text-center text-gray-500 h-full flex items-center justify-center">
          <div>
            <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-500 rounded-full mx-auto mb-2"></div>
            Loading table data...
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // Show error state
  if (error) {
    return (
      <NodeViewWrapper
        className={`relative my-4 ${isSelected ? "is-selected" : ""}`}
        style={{
          width: width ? `${Math.max(width, 400)}px` : "100%",
          height: height ? `${height}px` : `${optimalHeight}px`,
          maxWidth: "100%",
          minWidth: "400px",
          minHeight: `${Math.max(optimalHeight, 200)}px`,
        }}
        ref={wrapperRef}
        onClick={handleClick}
      >
        <div className="p-4 border border-red-300 rounded-md text-center text-red-500 bg-red-50 h-full flex items-center justify-center">
          <div>
            <div className="mb-2">⚠️ Error loading table</div>
            <div className="text-sm mb-2">{error}</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                loadTableData(true);
              }}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      className={`relative my-4 ${isSelected ? "is-selected" : ""}`}
      style={{
        width: width ? `${Math.max(width, 400)}px` : "100%",
        height: height ? `${height}px` : `${optimalHeight}px`,
        maxWidth: "100%",
        minWidth: "400px",
        minHeight: `${Math.max(optimalHeight, 200)}px`,
      }}
      ref={wrapperRef}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      tabIndex={0}
      role="table"
      aria-label={`Canvas table with ${tableData.length - 1} rows and ${tableData[0]?.length || 0} columns`}
    >
      {hasValidData ? (
        <div
          className={`relative rounded-md shadow-sm h-full ${
            isSelected ? "border-blue-500 border-2" : "border border-gray-300"
          } overflow-hidden`}
          ref={tableRef}
          style={{ height: height ? `${height}px` : `${optimalHeight}px` }}
        >
          {/* Row count indicator for large tables */}
          {needsVerticalScroll && (
            <div className="absolute top-2 left-2 z-10">
              <div className="bg-blue-100 border border-blue-300 rounded px-2 py-1 text-xs text-blue-700 flex items-center">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
                {tableData.length - 1} rows
              </div>
            </div>
          )}

          {/* Horizontal scroll container */}
          <div className="w-full h-full flex flex-col relative">
            {/* Scroll indicator shadows */}
            <div
              className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none opacity-0 transition-opacity duration-200"
              id="left-shadow"
            ></div>
            <div
              className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none opacity-0 transition-opacity duration-200"
              id="right-shadow"
            ></div>

            <div
              className={`overflow-x-auto w-full h-full ${needsVerticalScroll ? "overflow-y-auto" : "overflow-y-hidden"}`}
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#CBD5E0 #F7FAFC",
              }}
              onScroll={(e) => {
                const target = e.target as HTMLDivElement;
                const leftShadow = target.parentElement?.querySelector(
                  "#left-shadow"
                ) as HTMLElement;
                const rightShadow = target.parentElement?.querySelector(
                  "#right-shadow"
                ) as HTMLElement;

                if (leftShadow && rightShadow) {
                  if (target.scrollLeft > 10) {
                    leftShadow.style.opacity = "1";
                  } else {
                    leftShadow.style.opacity = "0";
                  }

                  const isAtEnd =
                    target.scrollLeft >=
                    target.scrollWidth - target.clientWidth - 10;
                  if (!isAtEnd && target.scrollWidth > target.clientWidth) {
                    rightShadow.style.opacity = "1";
                  } else {
                    rightShadow.style.opacity = "0";
                  }
                }
              }}
            >
              <div
                className={`h-full flex flex-col ${needsVerticalScroll ? "" : "min-h-full"} pb-2`}
                style={{
                  minWidth: `${Math.max(tableData[0]?.length * 200, 600)}px`,
                }}
              >
                <table
                  className={`w-full border-collapse ${needsVerticalScroll ? "table-auto" : "flex-1 flex flex-col"}`}
                >
                  <thead
                    className={`${needsVerticalScroll ? "sticky top-0" : "flex-shrink-0 sticky top-0"} z-5 bg-white`}
                  >
                    <tr
                      className={`bg-gray-50 border-b-2 border-gray-300 ${needsVerticalScroll ? "" : "flex"}`}
                    >
                      {tableData[0]?.map((header, colIndex) => (
                        <th
                          key={`header-${colIndex}`}
                          className="border-r border-gray-300 px-3 py-3 text-left text-sm font-bold text-gray-800 bg-gray-50 border-b border-gray-300"
                          style={
                            needsVerticalScroll
                              ? {
                                  minWidth: "200px",
                                  width: "200px",
                                  height: "50px", // Updated to match calculation
                                  position: "sticky",
                                  top: 0,
                                  zIndex: 10,
                                }
                              : {
                                  minWidth: "200px",
                                  width: "200px",
                                  height: "50px", // Updated to match calculation
                                  display: "flex",
                                  alignItems: "center",
                                  flexShrink: 0,
                                  position: "sticky",
                                  top: 0,
                                  zIndex: 10,
                                }
                          }
                        >
                          <div
                            className="truncate w-full font-semibold flex items-center h-full"
                            title={header}
                          >
                            {header || `Column ${colIndex + 1}`}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody
                    className={`${needsVerticalScroll ? "" : "flex-1 flex flex-col"} bg-white`}
                  >
                    {tableData.slice(1).map((row, rowIndex) => (
                      <tr
                        key={`row-${rowIndex + 1}`}
                        className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${needsVerticalScroll ? "" : "flex flex-1"} ${
                          rowIndex % 2 === 0 ? "bg-white" : "bg-gray-25"
                        }`}
                        style={
                          needsVerticalScroll
                            ? { minHeight: "45px" }
                            : { minHeight: `${Math.max(rowHeight, 45)}px` }
                        }
                      >
                        {row.map((cell, colIndex) => (
                          <td
                            key={`cell-${rowIndex + 1}-${colIndex}`}
                            className="border-r border-gray-200 px-3 py-2 text-sm text-gray-700 align-top"
                            style={
                              needsVerticalScroll
                                ? {
                                    minWidth: "200px",
                                    width: "200px",
                                    minHeight: "45px",
                                  }
                                : {
                                    minWidth: "200px",
                                    width: "200px",
                                    height: `${Math.max(rowHeight, 45)}px`,
                                    flexShrink: 0,
                                    display: "flex",
                                    alignItems: "center",
                                  }
                            }
                          >
                            <div className="w-full overflow-hidden">
                              <div
                                className="truncate cursor-help hover:text-blue-600 transition-colors"
                                title={`${cell}\n\nDouble-click to copy • Row ${rowIndex + 1}, Column ${colIndex + 1}`}
                                onClick={(e) => {
                                  if (e.detail === 2) {
                                    navigator.clipboard
                                      .writeText(cell)
                                      .then(() => {
                                        const element = e.target as HTMLElement;
                                        const originalText =
                                          element.textContent;
                                        const originalColor =
                                          element.style.color;
                                        element.textContent = "✓ Copied!";
                                        element.style.color = "#059669";
                                        element.style.fontWeight = "bold";
                                        setTimeout(() => {
                                          element.textContent = originalText;
                                          element.style.color = originalColor;
                                          element.style.fontWeight = "";
                                        }, 1200);
                                      })
                                      .catch(() => {
                                        const textArea =
                                          document.createElement("textarea");
                                        textArea.value = cell;
                                        document.body.appendChild(textArea);
                                        textArea.select();
                                        document.execCommand("copy");
                                        document.body.removeChild(textArea);
                                      });
                                  }
                                }}
                              >
                                {cell || "-"}
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Scroll hints */}
            {tableData[0]?.length > 3 && (
              <div
                className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-3 py-1 rounded-full pointer-events-none opacity-0 transition-opacity duration-300 flex items-center gap-1"
                id="scroll-hint"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16l-4-4m0 0l4-4m-4 4h18"
                  />
                </svg>
                Scroll to see more columns
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>
            )}

            {needsVerticalScroll && (
              <div className="absolute right-2 bottom-8 bg-black bg-opacity-75 text-white text-xs px-3 py-1 rounded-full pointer-events-none opacity-75 flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7l4-4m0 0l4 4m-4-4v18"
                  />
                </svg>
                Scroll for more rows
              </div>
            )}
          </div>

          {/* Enhanced refresh button with export options */}
          {savedConfig.isDynamic && isSelected && (
            <div className="absolute top-8 right-2 z-10 flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  loadTableData(true);
                }}
                disabled={isRefreshing}
                className={`p-1 rounded transition-colors ${
                  isRefreshing
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                title={isRefreshing ? "Refreshing..." : "Refresh table data"}
              >
                <svg
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const csvData = tableData
                    .map((row) => row.join(","))
                    .join("\n");
                  const blob = new Blob([csvData], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `table-${node.attrs.tableId}-${new Date().toISOString().split("T")[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="p-1 rounded transition-colors bg-green-500 text-white hover:bg-green-600"
                title="Export as CSV"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 border border-gray-300 rounded-md text-center text-gray-500 h-full flex items-center justify-center">
          <div>
            <svg
              className="w-12 h-12 mx-auto mb-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div className="text-sm">No table data available</div>
            {savedConfig.isDynamic && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  loadTableData(true);
                }}
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Refresh Data
              </button>
            )}
          </div>
        </div>
      )}

      {/* Resize handles - only visible when selected */}
      {isSelected && (
        <>
          <div
            className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-blue-500 rounded-full z-20 cursor-nwse-resize touch-none"
            onMouseDown={startResizeTopLeft}
            onTouchStart={startResizeTopLeft}
          />
          <div
            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 rounded-full z-20 cursor-nesw-resize touch-none"
            onMouseDown={startResizeTopRight}
            onTouchStart={startResizeTopRight}
          />
          <div
            className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-blue-500 rounded-full z-20 cursor-nwse-resize touch-none"
            onMouseDown={startResizeBottomRight}
            onTouchStart={startResizeBottomRight}
          />
          <div
            className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-blue-500 rounded-full z-20 cursor-nesw-resize touch-none"
            onMouseDown={startResizeBottomLeft}
            onTouchStart={startResizeBottomLeft}
          />
          <div
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full z-20 cursor-ns-resize touch-none"
            onMouseDown={startResizeTop}
            onTouchStart={startResizeTop}
          />
          <div
            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full z-20 cursor-ew-resize touch-none"
            onMouseDown={startResizeRight}
            onTouchStart={startResizeRight}
          />
          <div
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full z-20 cursor-ns-resize touch-none"
            onMouseDown={startResizeBottom}
            onTouchStart={startResizeBottom}
          />
          <div
            className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full z-20 cursor-ew-resize touch-none"
            onMouseDown={startResizeLeft}
            onTouchStart={startResizeLeft}
          />

          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {tableData[0]?.length || 0} columns × {tableData.length - 1 || 0}{" "}
            rows
            {needsVerticalScroll && (
              <span className="ml-2 text-blue-200">• Scrollable</span>
            )}
          </div>
        </>
      )}

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-50 bg-white border border-gray-200 shadow-lg rounded-md py-1 min-w-[200px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 text-sm text-gray-500 border-b border-gray-100">
            Table Options
          </div>

          <button
            onClick={forceRefresh}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center"
            disabled={!savedConfig.isDynamic}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh Now
          </button>

          <button
            onClick={() => {
              const csvData = tableData.map((row) => row.join("\t")).join("\n");
              navigator.clipboard.writeText(csvData).then(() => {
                setContextMenu({ visible: false, x: 0, y: 0 });
                const feedback = document.createElement("div");
                feedback.textContent = "Table copied to clipboard!";
                feedback.className =
                  "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50";
                document.body.appendChild(feedback);
                setTimeout(() => document.body.removeChild(feedback), 2000);
              });
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy Table
          </button>

          <button
            onClick={() => {
              const csvData = tableData.map((row) => row.join(",")).join("\n");
              const blob = new Blob([csvData], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `table-${node.attrs.tableId}-${new Date().toISOString().split("T")[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              setContextMenu({ visible: false, x: 0, y: 0 });
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export CSV
          </button>

          <div className="border-t border-gray-200 my-1"></div>

          <button
            onClick={toggleDynamicUpdates}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center"
          >
            <div
              className={`w-2 h-2 rounded-full mr-2 ${savedConfig.isDynamic ? "bg-green-500" : "bg-gray-400"}`}
            ></div>
            {savedConfig.isDynamic ? "Disable" : "Enable"} Live Updates
          </button>

          {savedConfig.isDynamic && (
            <button
              onClick={resetToStatic}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-orange-600 flex items-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
                />
              </svg>
              Convert to Static
            </button>
          )}

          <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100">
            {savedConfig.isDynamic ? (
              <>
                <div>🟢 Live table - auto-updates every 30s</div>
                <div>
                  Showing {savedConfig.displayRows} rows from "
                  {currentTableData?.name || "Unknown"}"
                </div>
                {savedConfig.filterGroups.length > 0 && (
                  <div>
                    📊 {savedConfig.filterGroups.length} filter(s) applied
                  </div>
                )}
                {savedConfig.sortConfig && (
                  <div>↕️ Sorted by {savedConfig.sortConfig.field}</div>
                )}
              </>
            ) : (
              <div>📄 Static table - data won't update</div>
            )}
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}
