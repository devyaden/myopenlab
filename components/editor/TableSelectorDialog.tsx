"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Plus,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import TablePreview from "./TablePreview";

interface TableSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTable: (tableData: any) => void;
  tableData: any;
  tables: any[];
}

// Define types for filters
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

type SortDirection = "asc" | "desc" | null;
type SortField = string | null;

export default function TableSelectorDialog({
  isOpen,
  onClose,
  onInsertTable,
  tableData,
  tables,
}: TableSelectorDialogProps) {
  // Step-based navigation (replaces tabs)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Original state from the component
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [displayRows, setDisplayRows] = useState<number>(5);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [showSortUI, setShowSortUI] = useState(false);

  // Filtering state
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<{
    groupId: string;
    filterId: string | null;
  } | null>(null);
  const [tempFilterValue, setTempFilterValue] = useState<any>("");

  // Implementation of the solution from GitHub issue
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // This is the key fix from the GitHub issue
      // We need to manually restore the pointer-events style that Radix UI sets
      document.body.style.pointerEvents = "";

      // Reset dialog state
      setTimeout(() => {
        setSortField(null);
        setSortDirection(null);
        setFilterGroups([]);
        setEditingFilter(null);
        setShowSortUI(false);
        setFilterDialogOpen(false);
        onClose();
      }, 10);
    }
  };

  // Initialize state based on tableData
  useEffect(() => {
    if (tableData) {
      setSelectedTable(tableData.id);
      setDisplayRows(Math.min(tableData.flowData?.[0]?.nodes?.length || 5, 5));
      // Get columns excluding 'id'
      const columnTitles = tableData.columns
        ?.filter((col: any) => col.title !== "id")
        .map((col: any) => col.title);
      setSelectedColumns(columnTitles || []);
    }
  }, [tableData]);

  // Combine the initial tableData with the tables array for selection
  const availableTables = useMemo(() => {
    const allTables = [...(tables || [])];

    // Add the initial tableData if it's not already in the list
    if (tableData && !allTables.some((table) => table.id === tableData.id)) {
      allTables.unshift(tableData);
    }

    return allTables;
  }, [tableData, tables]);

  // Get the selected table data
  const selectedTableData = useMemo(() => {
    return selectedTable
      ? availableTables.find((table) => table.id === selectedTable)
      : tableData;
  }, [selectedTable, availableTables, tableData]);

  // Calculate maximum rows and columns
  const maxRowsInSelectedTable =
    selectedTableData?.flowData?.nodes?.length || 0;

  // Get all available columns, excluding 'id' column
  const availableColumns = useMemo(() => {
    if (!selectedTableData) return [];
    return selectedTableData.columns
      .filter((col: any) => col.title !== "id")
      .map((column: any) => column.title);
  }, [selectedTableData]);

  // Get filtered columns based on selection
  const visibleColumns = useMemo(() => {
    return selectedColumns;
  }, [selectedColumns]);

  const toggleColumnSelection = (columnTitle: string) => {
    setSelectedColumns((prev) => {
      if (prev.includes(columnTitle)) {
        return prev.filter((title) => title !== columnTitle);
      } else {
        return [...prev, columnTitle];
      }
    });
  };

  // Handle table selection
  const handleTableSelect = (tableId: string) => {
    setSelectedTable(tableId);

    // Find the selected table
    const newSelectedTable = availableTables.find(
      (table) => table.id === tableId
    );

    if (newSelectedTable) {
      // Update display rows - initialize to minimum of total rows or 5
      const totalRows = newSelectedTable.flowData?.[0]?.nodes?.length || 0;
      setDisplayRows(Math.min(totalRows, 5));

      // Update selected columns
      const columnTitles = newSelectedTable.columns
        ?.filter((col: any) => col.title !== "id")
        .map((col: any) => col.title);

      setSelectedColumns(columnTitles || []);
    }
  };

  // Filter functions
  // Generate a unique ID
  const generateId = () =>
    `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Helper function to check if a column can be filtered
  const isColumnFilterable = (
    columnType: string | undefined,
    columnTitle: string
  ): boolean => {
    // Exclude id, Relation, and Rollup columns from filtering
    if (
      columnTitle === "id" ||
      columnType === "Relation" ||
      columnType === "Rollup"
    ) {
      return false;
    }

    return true;
  };

  // Add a new filter group
  const addFilterGroup = () => {
    // Find the first filterable column
    const firstFilterableColumn =
      availableColumns.find((col: any) =>
        isColumnFilterable(getColumnTypeForFilter(col), col)
      ) || "task";

    const newGroup: FilterGroup = {
      id: generateId(),
      filters: [
        {
          id: generateId(),
          column: firstFilterableColumn,
          operator: "contains",
          value: "placeholder_empty",
        },
      ],
      conjunction: "AND",
    };
    setFilterGroups([...filterGroups, newGroup]);
    setEditingFilter({
      groupId: newGroup.id,
      filterId: newGroup.filters[0].id,
    });
  };

  // Add a filter to a group
  const addFilterToGroup = (groupId: string) => {
    // Find the first filterable column
    const firstFilterableColumn =
      availableColumns.find((col: any) =>
        isColumnFilterable(getColumnTypeForFilter(col), col)
      ) || "task";

    const newFilter: FilterType = {
      id: generateId(),
      column: firstFilterableColumn,
      operator: "contains",
      value: "placeholder_empty",
    };

    setFilterGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, filters: [...group.filters, newFilter] }
          : group
      )
    );
    setEditingFilter({ groupId, filterId: newFilter.id });
  };

  // Remove a filter
  const removeFilter = (groupId: string, filterId: string) => {
    setFilterGroups((prev) => {
      // Get the current group
      const currentGroup = prev.find((g) => g.id === groupId);

      // If this is the only filter in the group, remove the whole group
      if (currentGroup && currentGroup.filters.length === 1) {
        return prev.filter((g) => g.id !== groupId);
      }

      // Otherwise just remove the filter from the group
      return prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              filters: group.filters.filter((f) => f.id !== filterId),
            }
          : group
      );
    });

    if (editingFilter?.filterId === filterId) {
      setEditingFilter(null);
    }
  };

  // Remove a filter group
  const removeFilterGroup = (groupId: string) => {
    setFilterGroups((prev) => prev.filter((group) => group.id !== groupId));

    if (editingFilter?.groupId === groupId) {
      setEditingFilter(null);
    }
  };

  // Toggle conjunction (AND/OR) for a filter group
  const toggleConjunction = (groupId: string) => {
    setFilterGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conjunction: group.conjunction === "AND" ? "OR" : "AND",
            }
          : group
      )
    );
  };

  // Update filter properties
  const updateFilter = (
    groupId: string,
    filterId: string,
    updates: Partial<FilterType>
  ) => {
    setFilterGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              filters: group.filters.map((filter) => {
                if (filter.id === filterId) {
                  const updatedFilter = { ...filter, ...updates };
                  // Ensure value is never an empty string
                  if (updatedFilter.value === "") {
                    updatedFilter.value = "placeholder_empty";
                  }
                  return updatedFilter;
                }
                return filter;
              }),
            }
          : group
      )
    );
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilterGroups([]);
    setEditingFilter(null);
  };

  // Helper function to check if a node matches a filter
  const matchesFilter = (node: any, filter: FilterType): boolean => {
    const { column, operator, value } = filter;

    // Handle placeholder empty values
    const actualValue = value === "placeholder_empty" ? "" : value;

    // Get the column value
    let nodeValue;
    if (column === "task") {
      nodeValue = node.data.label;
    } else if (column === "type") {
      nodeValue = node.data.shape;
    } else {
      nodeValue = node.data[column];
    }

    // Check empty values
    if (operator === "is_empty") {
      return nodeValue === undefined || nodeValue === null || nodeValue === "";
    }

    if (operator === "is_not_empty") {
      return nodeValue !== undefined && nodeValue !== null && nodeValue !== "";
    }

    // Checkbox specific operators
    if (operator === "true") {
      return nodeValue === true;
    }

    if (operator === "false") {
      return nodeValue === false;
    }

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
        typeof actualValue === "string" ? parseFloat(actualValue) : actualValue;
      const numNodeValue =
        typeof nodeValue === "string" ? parseFloat(nodeValue) : nodeValue;

      if (isNaN(numValue) || isNaN(numNodeValue)) {
        return false;
      }

      return numNodeValue > numValue;
    }

    if (operator === "less_than") {
      const numValue =
        typeof actualValue === "string" ? parseFloat(actualValue) : actualValue;
      const numNodeValue =
        typeof nodeValue === "string" ? parseFloat(nodeValue) : nodeValue;

      if (isNaN(numValue) || isNaN(numNodeValue)) {
        return false;
      }

      return numNodeValue < numValue;
    }

    return false;
  };

  // Helper function to get operators based on column type
  const getOperatorsForColumnType = (
    columnType: string | undefined,
    columnTitle: string
  ): FilterOperator[] => {
    // Special handling for task and type columns
    if (
      columnTitle === "task" ||
      columnTitle === "type" ||
      columnType === "Text" ||
      columnType === "Long Text" ||
      columnType === "Created by" ||
      columnType === "Last edited by"
    ) {
      return [
        "equals",
        "not_equals",
        "contains",
        "not_contains",
        "is_empty",
        "is_not_empty",
      ];
    }

    if (columnType === "Number") {
      return [
        "equals",
        "not_equals",
        "greater_than",
        "less_than",
        "is_empty",
        "is_not_empty",
      ];
    }

    if (
      columnType === "Date" ||
      columnType === "Created Time" ||
      columnType === "Last edited time"
    ) {
      return [
        "equals",
        "not_equals",
        "greater_than",
        "less_than",
        "is_empty",
        "is_not_empty",
      ];
    }

    if (columnType === "Checkbox") {
      return ["true", "false"];
    }

    if (columnType === "Select" || columnType === "Multiselect") {
      return ["equals", "not_equals", "is_empty", "is_not_empty"];
    }

    if (columnType === "Relation" || columnType === "Rollup") {
      return ["contains", "not_contains", "is_empty", "is_not_empty"];
    }

    // Default operators
    return [
      "equals",
      "not_equals",
      "contains",
      "not_contains",
      "is_empty",
      "is_not_empty",
    ];
  };

  // Get human-readable operator label
  const getOperatorLabel = (operator: FilterOperator): string => {
    switch (operator) {
      case "equals":
        return "equals";
      case "not_equals":
        return "does not equal";
      case "contains":
        return "contains";
      case "not_contains":
        return "does not contain";
      case "greater_than":
        return "is greater than";
      case "less_than":
        return "is less than";
      case "is_empty":
        return "is empty";
      case "is_not_empty":
        return "is not empty";
      case "true":
        return "is checked";
      case "false":
        return "is not checked";
      default:
        return operator;
    }
  };

  // Get input type for value based on column type
  const getInputTypeForValue = (
    columnType: string | undefined,
    operator: FilterOperator
  ): string => {
    if (
      operator === "is_empty" ||
      operator === "is_not_empty" ||
      operator === "true" ||
      operator === "false"
    ) {
      return "none"; // No input needed for these operators
    }

    if (columnType === "Number") {
      return "number";
    }

    if (
      columnType === "Date" ||
      columnType === "Created Time" ||
      columnType === "Last edited time"
    ) {
      return "date";
    }

    return "text";
  };

  // Get column type from title
  const getColumnTypeForFilter = (columnTitle: string): string | undefined => {
    if (columnTitle === "task") return "Text";
    if (columnTitle === "type") return "Select";

    const column = selectedTableData?.columns?.find(
      (col: any) => col.title === columnTitle
    );
    return column?.type;
  };

  // Determine if a column should show a select input for values
  const shouldUseSelectForValues = (
    columnType: string | undefined,
    columnTitle: string
  ): boolean => {
    return columnTitle === "type" || columnType === "Select";
  };

  // Get options for a column
  const getOptionsForColumn = (columnTitle: string): string[] => {
    if (columnTitle === "type") {
      return ["rectangle", "circle", "diamond", "hexagon", "cloud"];
    }

    const column = selectedTableData?.columns?.find(
      (col: any) => col.title === columnTitle
    );
    return column?.options || [];
  };

  // Add this helper function for sorting
  const isColumnSortable = (
    columnType: string | undefined,
    columnTitle: string
  ) => {
    // Exclude id, Relation, and Rollup columns from sorting
    if (
      columnTitle === "id" ||
      columnType === "Relation" ||
      columnType === "Rollup"
    ) {
      return false;
    }

    // Special case for the type column which contains shape names
    if (columnTitle === "type") {
      return true;
    }

    // Other unsortable types
    const unsortableTypes = ["Select", "Multiselect", "Checkbox"];

    return !unsortableTypes.includes(columnType || "");
  };

  // Filter and sort data
  const processedNodes = useMemo(() => {
    if (!selectedTableData?.flowData?.[0]?.nodes) return [];

    let nodes = [...selectedTableData.flowData[0].nodes];

    // Apply filters if there are any
    if (filterGroups.length > 0) {
      nodes = nodes.filter((node) => {
        // A node passes if it matches at least one filter group
        return filterGroups.some((group) => {
          // For AND conjunction, all filters must match
          // For OR conjunction, at least one filter must match
          const filtersMatch =
            group.conjunction === "AND"
              ? group.filters.every((filter) => matchesFilter(node, filter))
              : group.filters.some((filter) => matchesFilter(node, filter));

          return filtersMatch;
        });
      });
    }

    // Apply sorting if set
    if (sortField && sortDirection) {
      const columnType = getColumnTypeForFilter(sortField);

      nodes.sort((a, b) => {
        // Get values to compare
        let aValue =
          sortField === "task"
            ? a.data.label
            : sortField === "type"
              ? a.data.shape
              : a.data[sortField];

        let bValue =
          sortField === "task"
            ? b.data.label
            : sortField === "type"
              ? b.data.shape
              : b.data[sortField];

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
          // Convert to lowercase strings for comparison
          aValue = String(aValue || "").toLowerCase();
          bValue = String(bValue || "").toLowerCase();
        }

        // Apply sort direction
        if (sortDirection === "asc") {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    return nodes;
  }, [selectedTableData, filterGroups, sortField, sortDirection]);

  // Update the handleInsert function to use the processed data
  const handleInsert = () => {
    if (!selectedTableData) {
      console.error("No table selected or tables data is missing");
      return;
    }

    // Only use the columns that are actually selected
    const columnsData = [...selectedColumns];

    // If no columns are selected, show an error and return
    if (columnsData.length === 0) {
      console.error("No columns selected");
      return;
    }

    // Generate table data from nodes, only including selected columns
    let data: any = [];

    // Use processed (filtered & sorted) nodes instead of raw nodes
    if (processedNodes.length) {
      data = processedNodes.slice(0, displayRows).map((node: any) => {
        // For each node, only include data from selected columns
        return columnsData.map((columnTitle) => {
          let cellValue;
          // Handle special case for 'task' column which is stored as 'label' in node data
          if (columnTitle === "task") {
            cellValue = node?.data?.label || "";
          } else if (columnTitle === "type") {
            cellValue = node?.data?.shape || "";
          } else {
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
              return cellValue.map((rel: any) => {
                if (rel && typeof rel === "object") {
                  // Include only essential properties to avoid circular references
                  return {
                    id: rel.id,
                    label: rel.label || rel.data?.label || "",
                    // Include any important fields
                    ...Object.entries(rel)
                      .filter(
                        ([key]) =>
                          typeof key === "string" &&
                          key !== "id" &&
                          key !== "label"
                      )
                      .reduce(
                        (acc, [key, val]) => {
                          if (typeof val !== "object" || val === null) {
                            acc[key] = val;
                          }
                          return acc;
                        },
                        {} as Record<string, any>
                      ),
                  };
                }
                return rel;
              });
            }
            // For single relation object
            else if (cellValue.id) {
              return {
                id: cellValue.id,
                label: cellValue.label || cellValue.data?.label || "",
                // Include any important fields
                ...Object.entries(cellValue)
                  .filter(
                    ([key]) =>
                      typeof key === "string" && key !== "id" && key !== "label"
                  )
                  .reduce(
                    (acc, [key, val]) => {
                      if (typeof val !== "object" || val === null) {
                        acc[key] = val;
                      }
                      return acc;
                    },
                    {} as Record<string, any>
                  ),
              };
            }
          }

          // Ensure the value is a string to prevent React rendering issues
          if (typeof cellValue === "object" && cellValue !== null) {
            return JSON.stringify(cellValue);
          }
          return String(cellValue);
        });
      });
    } else {
      // Create empty data if no nodes exist
      data = Array(displayRows)
        .fill(0)
        .map(() => Array(columnsData.length).fill(""));
    }

    // Insert column headers at the beginning
    data.unshift([...columnsData]);

    // Fix pointer events before closing
    document.body.style.pointerEvents = "";

    // Close the dialog first
    setTimeout(() => {
      onClose();

      // Then insert the table after a small delay to ensure dialog is fully closed
      setTimeout(() => {
        onInsertTable({
          id: selectedTableData.id,
          rows: data.length,
          columns: selectedColumns.length,
          data: JSON.stringify(data),
        });
      }, 50);
    }, 10);
  };

  // Ensure pointer events are restored when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.pointerEvents = "";
    };
  }, []);

  // Also ensure pointer events are restored when dialog closes
  useEffect(() => {
    if (!isOpen) {
      document.body.style.pointerEvents = "";
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="sticky top-0 z-20 bg-white pt-4 pb-2 border-b">
          <DialogTitle>Insert Canvas Table</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 py-2">
          {loading ? (
            <div className="flex items-center justify-center p-6">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="ml-2 text-sm text-muted-foreground">
                Loading tables...
              </span>
            </div>
          ) : (
            <>
              {/* Step indicator */}
              <div className="flex items-center mb-6">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center h-8 w-8 rounded-full ${currentStep === 1 ? "bg-yadn-accent-green text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    1
                  </div>
                  <span className="text-xs mt-1">Select Table</span>
                </div>
                <div className="h-0.5 w-16 bg-muted mx-2" />
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center h-8 w-8 rounded-full ${currentStep === 2 ? "bg-yadn-accent-green text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    2
                  </div>
                  <span className="text-xs mt-1">Configure Table</span>
                </div>
              </div>

              {/* Step 1: Table Selection */}
              {currentStep === 1 && (
                <>
                  <div className="text-sm text-muted-foreground mb-4">
                    Select a canvas to create a table from:
                  </div>

                  <ScrollArea className="h-[400px] border rounded-md p-2">
                    <div className="grid grid-cols-1 gap-4">
                      {availableTables.length > 0 ? (
                        availableTables.map((table) => (
                          <div
                            key={table.id}
                            className={`border rounded-md p-3 cursor-pointer transition-all ${
                              selectedTable === table.id
                                ? "ring-2 ring-primary border-primary"
                                : "hover:border-gray-400"
                            }`}
                            onClick={() => handleTableSelect(table.id)}
                          >
                            <div className="font-medium mb-2">
                              {table.name || "Untitled Canvas"}
                            </div>
                            <div className="h-[150px] overflow-hidden border rounded-md bg-gray-50">
                              <TablePreview
                                nodes={table.flowData?.[0]?.nodes}
                                edges={table.flowData?.[0]?.edges}
                                columns={table.columns}
                                displayRows={5}
                                visibleColumns={table.columns
                                  ?.filter((col: any) => col.title !== "id")
                                  .map((col: any) => col.title)}
                              />
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              {table.flowData?.[0]?.nodes?.length || 0} rows,{" "}
                              {table.columns?.filter(
                                (col: any) => col.title !== "id"
                              ).length || 0}{" "}
                              columns
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No canvas tables available
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="flex justify-end mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        document.body.style.pointerEvents = "";
                        setTimeout(() => onClose(), 10);
                      }}
                      className="mr-2"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(2)}
                      disabled={!selectedTable}
                      className="bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-white"
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}

              {/* Step 2: Table Configuration */}
              {currentStep === 2 && selectedTableData && (
                <>
                  {/* Filtering & Sorting Controls */}
                  <div className="flex items-center gap-2 mb-4">
                    <Button
                      variant={filterGroups.length > 0 ? "default" : "outline"}
                      size="sm"
                      className={`text-sm ${filterGroups.length > 0 ? "bg-yadn-accent-green/10 text-yadn-accent-green hover:bg-yadn-accent-green/20 border-yadn-accent-green/20" : ""}`}
                      onClick={() => {
                        setFilterDialogOpen(!filterDialogOpen);
                        setShowSortUI(false);
                      }}
                    >
                      <Filter
                        className={`h-4 w-4 mr-2 ${filterGroups.length > 0 ? "text-yadn-accent-green" : ""}`}
                      />
                      Filter{" "}
                      {filterGroups.length > 0
                        ? `(${filterGroups.length})`
                        : ""}
                    </Button>

                    <Button
                      variant={sortField ? "default" : "outline"}
                      size="sm"
                      className={`text-sm ${sortField ? "bg-yadn-accent-green/10 text-yadn-accent-green hover:bg-yadn-accent-green/20 border-yadn-accent-green/20" : ""}`}
                      onClick={() => {
                        setShowSortUI(!showSortUI);
                        setFilterDialogOpen(false);
                      }}
                    >
                      <SlidersHorizontal
                        className={`h-4 w-4 mr-2 ${sortField ? "text-yadn-accent-green" : ""}`}
                      />
                      Sort {sortField ? `(${sortField})` : ""}
                    </Button>

                    {(sortField || filterGroups.length > 0) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-yadn-primary-red text-sm ml-auto"
                        onClick={() => {
                          setSortField(null);
                          setSortDirection(null);
                          clearAllFilters();
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear all
                      </Button>
                    )}
                  </div>

                  {/* Sort Options Section - Inline */}
                  {showSortUI && (
                    <div className="mb-6 border rounded-md overflow-hidden">
                      <div className="flex justify-between items-center p-3 bg-white border-b">
                        <h3 className="font-medium text-sm">Sort Options</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSortUI(false)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="p-4 bg-gray-50 space-y-3">
                        <div>
                          <div className="text-sm font-medium mb-1">
                            Sort by
                          </div>
                          <Select
                            value={sortField || "none"}
                            onValueChange={(value) => {
                              if (value && value !== "none") {
                                setSortField(value);
                                setSortDirection(sortDirection || "asc");
                              } else {
                                setSortField(null);
                                setSortDirection(null);
                              }
                            }}
                          >
                            <SelectTrigger className="w-full bg-white">
                              <SelectValue placeholder="Select a property" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {Array.from(
                                new Set(["task", "type", ...availableColumns])
                              )
                                .filter((col) => {
                                  // Filter only sortable columns
                                  return isColumnSortable(
                                    getColumnTypeForFilter(col),
                                    col
                                  );
                                })
                                .map((col) => (
                                  <SelectItem key={col} value={col}>
                                    {col}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {sortField && (
                          <div>
                            <div className="text-sm font-medium mb-1">
                              Direction
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant={
                                  sortDirection === "asc"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                className={`flex-1 ${sortDirection === "asc" ? "bg-yadn-accent-green text-white" : "bg-white"}`}
                                onClick={() => setSortDirection("asc")}
                              >
                                <ChevronUp className="h-4 w-4 mr-2" />
                                Ascending
                              </Button>
                              <Button
                                variant={
                                  sortDirection === "desc"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                className={`flex-1 ${sortDirection === "desc" ? "bg-yadn-accent-green text-white" : "bg-white"}`}
                                onClick={() => setSortDirection("desc")}
                              >
                                <ChevronDown className="h-4 w-4 mr-2" />
                                Descending
                              </Button>
                            </div>
                          </div>
                        )}

                        <Button
                          variant="default"
                          className="w-full mt-4 bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-white"
                          onClick={() => setShowSortUI(false)}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Filter Options Section - Inline */}
                  {filterDialogOpen && (
                    <div className="mb-6 border rounded-md overflow-hidden">
                      <div className="flex justify-between items-center p-3 bg-white border-b">
                        <h3 className="font-medium text-sm">Filter Options</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFilterDialogOpen(false)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="p-4 bg-gray-50 space-y-4">
                        {filterGroups.length > 0 ? (
                          // Show existing filter groups
                          filterGroups.map((group, groupIndex) => (
                            <div
                              key={group.id}
                              className="border border-gray-200 rounded-md p-3 space-y-3 bg-white"
                            >
                              {group.filters.map((filter, filterIndex) => {
                                const columnType = getColumnTypeForFilter(
                                  filter.column
                                );
                                const operators = getOperatorsForColumnType(
                                  columnType,
                                  filter.column
                                );
                                const inputType = getInputTypeForValue(
                                  columnType,
                                  filter.operator
                                );
                                const isEditing =
                                  editingFilter?.groupId === group.id &&
                                  editingFilter?.filterId === filter.id;

                                return (
                                  <div
                                    key={filter.id}
                                    className="grid grid-cols-[1fr,auto] gap-2"
                                  >
                                    <div className="flex flex-col space-y-2">
                                      <div className="flex flex-wrap gap-2 items-center">
                                        <Select
                                          value={filter.column}
                                          onValueChange={(value) => {
                                            // Reset operator and value when column changes
                                            const newColumnType =
                                              getColumnTypeForFilter(value);
                                            const newOperators =
                                              getOperatorsForColumnType(
                                                newColumnType,
                                                value
                                              );
                                            updateFilter(group.id, filter.id, {
                                              column: value,
                                              operator: newOperators[0],
                                              value: "",
                                            });
                                            setEditingFilter({
                                              groupId: group.id,
                                              filterId: filter.id,
                                            });
                                          }}
                                        >
                                          <SelectTrigger className="w-[120px]">
                                            <SelectValue placeholder="Column" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {Array.from(
                                              new Set([
                                                "task",
                                                "type",
                                                ...availableColumns,
                                              ])
                                            )
                                              .filter((col) =>
                                                isColumnFilterable(
                                                  getColumnTypeForFilter(col),
                                                  col
                                                )
                                              )
                                              .map((col) => (
                                                <SelectItem
                                                  key={col}
                                                  value={col}
                                                >
                                                  {col}
                                                </SelectItem>
                                              ))}
                                          </SelectContent>
                                        </Select>

                                        <Select
                                          value={filter.operator}
                                          onValueChange={(value) => {
                                            updateFilter(group.id, filter.id, {
                                              operator: value as FilterOperator,
                                              // Clear value if operator doesn't need one
                                              value: [
                                                "is_empty",
                                                "is_not_empty",
                                                "true",
                                                "false",
                                              ].includes(value)
                                                ? ""
                                                : filter.value,
                                            });
                                            setEditingFilter({
                                              groupId: group.id,
                                              filterId: filter.id,
                                            });
                                          }}
                                        >
                                          <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="Operator" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {operators.map((op) => (
                                              <SelectItem key={op} value={op}>
                                                {getOperatorLabel(op)}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>

                                        {inputType !== "none" && (
                                          <>
                                            {shouldUseSelectForValues(
                                              columnType,
                                              filter.column
                                            ) ? (
                                              <Select
                                                value={
                                                  filter.value ===
                                                  "placeholder_empty"
                                                    ? ""
                                                    : filter.value
                                                }
                                                onValueChange={(value) => {
                                                  updateFilter(
                                                    group.id,
                                                    filter.id,
                                                    {
                                                      value:
                                                        value ||
                                                        "placeholder_empty",
                                                    }
                                                  );
                                                }}
                                              >
                                                <SelectTrigger className="w-[120px]">
                                                  <SelectValue placeholder="Value" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {getOptionsForColumn(
                                                    filter.column
                                                  ).length > 0 ? (
                                                    getOptionsForColumn(
                                                      filter.column
                                                    ).map((option) => (
                                                      <SelectItem
                                                        key={option}
                                                        value={
                                                          option ||
                                                          "placeholder_empty"
                                                        }
                                                      >
                                                        {option || "(Empty)"}
                                                      </SelectItem>
                                                    ))
                                                  ) : (
                                                    <SelectItem value="no_options">
                                                      No options available
                                                    </SelectItem>
                                                  )}
                                                </SelectContent>
                                              </Select>
                                            ) : (
                                              <Input
                                                type={inputType}
                                                value={
                                                  filter.value ===
                                                  "placeholder_empty"
                                                    ? ""
                                                    : filter.value || ""
                                                }
                                                onChange={(e) => {
                                                  updateFilter(
                                                    group.id,
                                                    filter.id,
                                                    {
                                                      value:
                                                        e.target.value ||
                                                        "placeholder_empty",
                                                    }
                                                  );
                                                }}
                                                placeholder="Value"
                                                className="w-[120px]"
                                              />
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        removeFilter(group.id, filter.id)
                                      }
                                      className="h-9 w-9 rounded-full"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              })}

                              <div className="flex justify-between items-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addFilterToGroup(group.id)}
                                  className="flex items-center gap-1 text-xs border-yadn-accent-green text-yadn-accent-green"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add filter
                                </Button>

                                {filterGroups.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-yadn-primary-red hover:text-yadn-primary-red/80 text-xs"
                                    onClick={() => removeFilterGroup(group.id)}
                                  >
                                    Remove group
                                  </Button>
                                )}
                              </div>

                              {groupIndex < filterGroups.length - 1 && (
                                <div className="flex justify-center py-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleConjunction(group.id)}
                                    className="text-xs"
                                  >
                                    {group.conjunction === "AND"
                                      ? "Switch to OR"
                                      : "Switch to AND"}
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          // Empty state
                          <div className="text-center py-4">
                            <div className="text-gray-400 mb-2">
                              <Filter className="h-8 w-8 mx-auto mb-2" />
                              <p>No filters applied</p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={addFilterGroup}
                              className="flex items-center gap-1 mx-auto border-yadn-accent-green text-yadn-accent-green"
                            >
                              <Plus className="h-4 w-4" />
                              Add your first filter
                            </Button>
                          </div>
                        )}

                        {filterGroups.length > 0 && (
                          <Button
                            variant="outline"
                            onClick={addFilterGroup}
                            className="w-full flex items-center justify-center gap-1 border-yadn-accent-green text-yadn-accent-green"
                          >
                            <Plus className="h-4 w-4" />
                            Add filter group
                          </Button>
                        )}

                        <Button
                          variant="default"
                          className="w-full mt-4 bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-white"
                          onClick={() => setFilterDialogOpen(false)}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Rows and Columns Selection */}

                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">
                      Select Columns to Display:
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto border rounded-md p-3">
                      {availableColumns.map((columnTitle: any) => (
                        <div
                          key={columnTitle}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`column-${columnTitle}`}
                            checked={selectedColumns.includes(columnTitle)}
                            onCheckedChange={() =>
                              toggleColumnSelection(columnTitle)
                            }
                            className="border-yadn-accent-green data-[state=checked]:bg-yadn-accent-green"
                          />
                          <Label
                            htmlFor={`column-${columnTitle}`}
                            className="cursor-pointer"
                          >
                            {columnTitle}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded border border-gray-200 p-4 mt-2 mb-4">
                    <div className="text-sm font-medium mb-2">Preview:</div>
                    <div className="h-[200px] relative border rounded-md bg-gray-50 overflow-hidden">
                      <div className="absolute inset-0 overflow-auto">
                        <TablePreview
                          nodes={processedNodes}
                          edges={selectedTableData.flowData?.[0]?.edges}
                          columns={selectedTableData.columns}
                          displayRows={displayRows}
                          visibleColumns={visibleColumns}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="mr-2"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleInsert}
                      disabled={selectedColumns.length === 0}
                      className="bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-white"
                    >
                      Insert Table
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
