"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUser } from "@/lib/contexts/userContext";
import { ALL_SHAPES, SHAPES } from "@/lib/types/flow-table.types";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Filter,
  FilterX,
  MoreVertical,
  Plus,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Edge, Node } from "reactflow";
import * as z from "zod";
import { Checkbox } from "../../ui/checkbox";
import { AddColumnSidebar } from "../add-column-sidebar";
import { ViewModeSwitcher } from "../view-mode-switcher";
import SortableTableRow from "./sortable-table-row";
import {
  FilterGroup,
  FilterOperator,
  Filter as FilterType,
  HierarchyNode,
  SortDirection,
  SortField,
  TableViewProps,
} from "./table.types";
import { validationSchemas } from "./validations";

// Helper functions for column data mapping
const getDataKey = (column: any): string => {
  // If dataKey is explicitly set, use it
  if (column.dataKey) {
    return column.dataKey;
  }

  // Fallback for existing columns without dataKey
  if (column.title === "task") return "label";
  if (column.title === "type") return "shape";
  if (column.title === "id") return "id";

  // For all other columns, use the title as the key
  return column.title;
};

const isSpecialColumn = (column: any): boolean => {
  const dataKey = getDataKey(column);
  return ["label", "shape", "id"].includes(dataKey);
};

const TableView = forwardRef<
  { exportToCSV: () => void; exportToExcel: () => void },
  TableViewProps
>(
  (
    {
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      columns,
      setColumns,
      onAddColumn,
      currentFolderCanvases,
      canvasId,
      canvasType,
      canvasSettings,
      updateCanvasSettings,
      viewMode,
      onViewModeChange,
      readOnly,
    },
    ref
  ) => {
    const { user } = useUser();
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [selectedParentId, setSelectedParentId] = useState<string | null>(
      null
    );
    const [isAddColumnSidebarOpen, setIsAddColumnSidebarOpen] = useState(false);
    const [editingCell, setEditingCell] = useState<{
      nodeId: string;
      column: string;
    } | null>(null);
    const [editedValue, setEditedValue] = useState<any>(null);

    const [validationError, setValidationError] = useState<string | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [nodeToDelete, setNodeToDelete] = useState<HierarchyNode | null>(
      null
    );
    const [editingColumnTitle, setEditingColumnTitle] = useState<string | null>(
      null
    );
    const [newColumnTitle, setNewColumnTitle] = useState("");
    const [deleteColumnDialog, setDeleteColumnDialog] = useState<string | null>(
      null
    );
    const [columnWrapping, setColumnWrapping] = useState<Set<string>>(
      new Set()
    );
    const [frozenColumns, setFrozenColumns] = useState<Set<string>>(new Set());

    // State for bulk deletion
    const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
    const [deleteSelectedDialogOpen, setDeleteSelectedDialogOpen] =
      useState(false);

    const [resizingColumn, setResizingColumn] = useState<string | null>(null);
    const [startX, setStartX] = useState<number>(0);
    const [startWidth, setStartWidth] = useState<number>(0);

    // Add column refs for resizing
    const columnRefs = useRef<{ [key: string]: HTMLTableCellElement | null }>(
      {}
    );

    // Add cache for rollup and relation data
    const [rollupCache, setRollupCache] = useState<{ [key: string]: any }>({});

    const [relationCache, setRelationCache] = useState<{ [key: string]: any }>(
      {}
    );

    // Update rollup cache when relevant data changes
    useEffect(() => {
      const newRollupCache: Record<string, any> = {};
      const newRelationCache: Record<string, any> = {};

      // Process rollup columns
      const rollupColumns = columns?.filter((col) => col?.type === "Rollup");

      if (rollupColumns?.length) {
        // Create a map of relation columns to easily lookup by related canvas ID
        const relationColumns = columns?.filter(
          (col) => col?.type === "Relation" && col.related_canvas_id
        );

        const relationColumnMap = new Map(
          relationColumns.map((col) => [col.related_canvas_id, col])
        );

        nodes.forEach((node) => {
          relationColumns.forEach((column) => {
            const relationData = node.data[column.title];

            if (relationData) {
              const relationArray = Array.isArray(relationData)
                ? relationData
                : [relationData];
              newRelationCache[`${node.id}-${column.title}`] = relationArray;
            } else {
              newRelationCache[`${node.id}-${column.title}`] = [];
            }
          });

          rollupColumns.forEach((column) => {
            const relatedCanvasId = column?.rollup_column?.canvas?.id;

            if (!relatedCanvasId) {
              return;
            }

            const relationColumn = relationColumnMap.get(relatedCanvasId);

            if (!relationColumn) {
              return;
            }

            // Get relation data from the node
            const relationData = node.data[relationColumn.title];

            if (
              !relationData ||
              !Array.isArray(relationData) ||
              relationData.length === 0
            ) {
              newRollupCache[`${node.id}-${column.title}`] = [];
              return;
            }

            // Get the target column to rollup
            const rollupColumnTargetTitle = column?.rollup_column?.title;

            if (!rollupColumnTargetTitle) {
              return;
            }

            // Get the related canvas data from the relation column
            const relatedCanvas = relationColumn.related_canvas;

            const relatedCanvasNodes =
              relatedCanvas?.canvas_data?.[0].nodes ??
              relatedCanvas?.canvas_data?.nodes ??
              [];

            // Extract IDs from relation data
            const relationIds = relationData.map((item) => item.id);

            // Create a set for faster lookups
            const relationIdSet = new Set(relationIds);

            // Filter related nodes that match the relation IDs
            const matchingRelatedNodes = relatedCanvasNodes.filter(
              (relNode: Node) => relationIdSet.has(relNode.id)
            );

            const rollupData = matchingRelatedNodes.map((relNode: Node) => {
              if (rollupColumnTargetTitle === "type") {
                return {
                  label: relNode.data.shape || relNode.id,
                  value: relNode.data.shape || relNode.id,
                  sourceId: relNode.id,
                };
              }

              if (rollupColumnTargetTitle === "task") {
                return {
                  label: relNode.data.label || relNode.id,
                  value: relNode.data.label || relNode.id,
                  sourceId: relNode.id,
                };
              }

              const value = relNode.data[rollupColumnTargetTitle];

              return {
                label: relNode.data.label || relNode.id,
                value: value,
                sourceId: relNode.id,
              };
            });

            // Store in cache
            newRollupCache[`${node.id}-${column.title}`] = rollupData;
          });
        });
      }

      // Set both caches with the new data
      setRollupCache(newRollupCache);
      setRelationCache(newRelationCache);
    }, [nodes, columns]);

    let {
      columnWidths = {},
      hiddenNodeIds = new Set(),
      hiddenColumns = [],
    } = canvasSettings?.table_settings ?? {};

    // Function to update table settings
    const updateTableSettings = (settings: any) => {
      updateCanvasSettings({
        ...canvasSettings,
        table_settings: settings,
      });
    };

    // Add resize event handlers
    useEffect(() => {
      if (!resizingColumn) return;

      const handleMouseMove = (e: MouseEvent) => {
        if (!resizingColumn || !columnRefs.current[resizingColumn]) return;

        const currentX = e.clientX;
        const difference = currentX - startX;
        const newWidth = Math.max(100, startWidth + difference); // Minimum width of 100px

        // Update the column width in the state
        const newColumnWidths = { ...columnWidths };
        newColumnWidths[resizingColumn] = newWidth;
        updateTableSettings({
          ...canvasSettings?.table_settings,
          columnWidths: newColumnWidths,
        });
      };

      const handleMouseUp = () => {
        setResizingColumn(null);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }, [
      resizingColumn,
      startX,
      startWidth,
      columnWidths,
      canvasSettings?.table_settings,
    ]);

    const startResizing = (columnTitle: string) => {
      const column = columnRefs.current[columnTitle];
      if (!column) return;

      const event = window.event as MouseEvent;
      setResizingColumn(columnTitle);
      setStartX(event?.clientX || 0);
      setStartWidth(column.offsetWidth);
    };

    // Handle duplicate selected rows
    const handleDuplicateSelected = () => {
      if (readOnly || selectedNodes.length === 0) return;

      const nodesToDuplicate = nodes.filter((node) =>
        selectedNodes.includes(node.id)
      );
      const newNodes = nodesToDuplicate.map((node) => {
        const uniqueId = `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        return {
          ...node,
          id: uniqueId,
          // Keep parentNode if it exists and isn't being deleted
          parentNode: node.parentNode,
          data: { ...node.data },
        };
      });

      onNodesChange([...nodes, ...newNodes]);
      setSelectedNodes([]);
    };

    // Create hierarchy from nodes
    const createHierarchy = (nodes: Node[]): HierarchyNode[] => {
      const nodeMap = new Map<string, Node>();
      nodes.forEach((node) => nodeMap.set(node.id, node));

      // Convert nodes to hierarchy nodes
      const hierarchyNodes: HierarchyNode[] = nodes.map((node) => ({
        ...node,
        children: [],
      }));

      // Establish parent-child relationships
      hierarchyNodes.forEach((node) => {
        const parentId = (nodeMap.get(node.id) as any)?.parentNode;
        if (parentId) {
          const parent = hierarchyNodes.find((n) => n.id === parentId);
          if (parent) {
            parent.children.push(node);
          }
        }
      });

      // Return only top-level nodes
      return hierarchyNodes.filter((node) => {
        const nodeData = nodeMap.get(node.id);
        return !nodeData?.parentNode;
      });
    };

    // Enhance nodes with connection data
    const enhanceNodesWithConnectionData = (
      nodes: Node[],
      edges: Edge[]
    ): Node[] => {
      return nodes.map((node) => {
        const incomingEdges = edges.filter((edge) => edge.target === node.id);
        const outgoingEdges = edges.filter((edge) => edge.source === node.id);

        return {
          ...node,
          data: {
            ...node.data,
            incoming: incomingEdges.map((edge) => edge.source),
            outgoing: outgoingEdges.map((edge) => edge.target),
          },
        };
      });
    };

    // Filter state
    const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [editingFilter, setEditingFilter] = useState<{
      groupId: string;
      filterId: string | null;
    } | null>(null);
    const [tempFilterValue, setTempFilterValue] = useState<any>("");
    const [showFilterUI, setShowFilterUI] = useState(false);

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
        columns.find((col) => isColumnFilterable(col.type, col.title))?.title ||
        "task";

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
        columns.find((col) => isColumnFilterable(col.type, col.title))?.title ||
        "task";

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

    // if type of hidden columns is an empty object, initialize it as a Set
    if (
      typeof hiddenColumns === "object" &&
      !Object.keys(hiddenColumns).length
    ) {
      hiddenColumns = [];
    }

    // Helper function to check if a node matches a filter
    const matchesFilter = (node: Node, filter: FilterType): boolean => {
      const { column, operator, value } = filter;

      // Handle placeholder empty values
      const actualValue = value === "placeholder_empty" ? "" : value;

      const columnDef = columns.find((col) => col.title === column);
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
          typeof actualValue === "string"
            ? parseFloat(actualValue)
            : actualValue;
        const numNodeValue =
          typeof nodeValue === "string" ? parseFloat(nodeValue) : nodeValue;

        if (isNaN(numValue) || isNaN(numNodeValue)) {
          return false;
        }

        return numNodeValue > numValue;
      }

      if (operator === "less_than") {
        const numValue =
          typeof actualValue === "string"
            ? parseFloat(actualValue)
            : actualValue;
        const numNodeValue =
          typeof nodeValue === "string" ? parseFloat(nodeValue) : nodeValue;

        if (isNaN(numValue) || isNaN(numNodeValue)) {
          return false;
        }

        return numNodeValue < numValue;
      }

      return false;
    };

    const visibleNodes = useMemo(() => {
      let filteredNodes = nodes.filter((node) => !hiddenNodeIds.has(node.id));

      // If we have active filters, apply them
      if (filterGroups.length > 0) {
        filteredNodes = filteredNodes.filter((node) => {
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

      return filteredNodes;
    }, [nodes, hiddenNodeIds, filterGroups]);

    const insertRollupDataIntoNodes = (nodes: Node[]): Node[] => {
      return nodes.map((node) => {
        const newNode = { ...node };
        columns?.forEach((column) => {
          // Handle rollup data from cache
          if (column.type === "Rollup") {
            const rollupData = rollupCache[`${node.id}-${column.title}`];
            if (rollupData) {
              newNode.data[column.title] = rollupData;
            } else {
              // Initialize with empty array if no rollup data exists
              newNode.data[column.title] = [];
            }
          }
          // Handle relation data from cache or directly from node data
          else if (column.type === "Relation") {
            // Check for data in the relationCache first
            if (relationCache[`${node.id}-${column.title}`]) {
              newNode.data[column.title] =
                relationCache[`${node.id}-${column.title}`];
            }
            // If not in cache, use existing node data if it exists
            else if (node.data[column.title]) {
              // Ensure relation data is always an array
              if (Array.isArray(node.data[column.title])) {
                newNode.data[column.title] = node.data[column.title];
              } else {
                // Convert non-array data to array
                newNode.data[column.title] = [node.data[column.title]];
              }
            }
            // Initialize as empty array if no data exists
            else {
              newNode.data[column.title] = [];
            }
          }
        });
        return newNode;
      });
    };

    const sortedHierarchy = useMemo(() => {
      let updatedNodes = insertRollupDataIntoNodes(visibleNodes);
      updatedNodes = enhanceNodesWithConnectionData(updatedNodes, edges);
      const hierarchy = createHierarchy(updatedNodes);

      if (!sortField || !sortDirection) return hierarchy;

      const getColumnType = (columnTitle: string) => {
        const column = columns.find((col) => col.title === columnTitle);
        return column?.type;
      };

      const getSortableValue = (node: HierarchyNode, field: string) => {
        const column = columns.find((col) => col.title === field);
        const dataKey = column ? getDataKey(column) : field;
        const columnType = getColumnType(field);

        // Get the raw value using dataKey
        let value;
        switch (dataKey) {
          case "label":
            value = node.data.label;
            break;
          case "shape":
            value = node.data.shape || "";
            break;
          case "id":
            value = node.id;
            break;
          default:
            value = node.data[field];
        }

        // Handle different column types
        switch (columnType) {
          case "Number":
            return typeof value === "number"
              ? value
              : typeof value === "string"
                ? parseFloat(value) || 0
                : 0;

          case "Date":
          case "Created Time":
          case "Last edited time":
            return value ? new Date(value).getTime() : 0;

          case "Checkbox":
            return value ? 1 : 0;

          case "Select":
          case "Multiselect":
          case "Relation":
          case "Rollup":
            // These types are not sortable
            return null;

          default:
            // For text and other types (including type/shape), convert to string
            return String(value || "").toLowerCase();
        }
      };

      const sortNodes = (nodes: HierarchyNode[]): HierarchyNode[] => {
        return nodes
          .sort((a, b) => {
            const columnType = getColumnType(sortField);

            // Skip sorting for unsortable types
            if (
              ["Select", "Multiselect", "Relation", "Rollup"].includes(
                columnType || ""
              )
            ) {
              return 0;
            }

            const aValue = getSortableValue(a, sortField);
            const bValue = getSortableValue(b, sortField);

            // Handle null values
            if (aValue === null && bValue === null) return 0;
            if (aValue === null) return 1;
            if (bValue === null) return -1;

            const sortOrder = sortDirection === "asc" ? 1 : -1;

            if (aValue < bValue) return -1 * sortOrder;
            if (aValue > bValue) return 1 * sortOrder;
            return 0;
          })
          .map((node) => ({
            ...node,
            children: sortNodes(node.children),
          }));
      };

      return sortNodes(hierarchy);
    }, [visibleNodes, sortField, sortDirection, columns, edges]);

    const flattenHierarchy = (
      nodes: HierarchyNode[],
      level = 0
    ): { node: HierarchyNode; level: number }[] => {
      return nodes.flatMap((node) => {
        const isExpanded = expandedRows.has(node.id);
        return [
          { node, level },
          ...(isExpanded ? flattenHierarchy(node.children, level + 1) : []),
        ];
      });
    };

    const visibleNodeIds = flattenHierarchy(sortedHierarchy).map(
      ({ node }) => node.id
    );

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
    const getColumnTypeForFilter = (
      columnTitle: string
    ): string | undefined => {
      if (columnTitle === "task") return "Text";
      if (columnTitle === "type") return "Select";

      const column = columns.find((col) => col.title === columnTitle);
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
        return shapeOptions;
      }

      const column = columns.find((col) => col.title === columnTitle);
      return column?.options || [];
    };

    const deleteNode = (nodeId: string, deleteChildren = false) => {
      const nodesToDelete = new Set<string>([nodeId]);

      if (deleteChildren) {
        const hierarchy = createHierarchy(nodes);
        const collectChildrenIds = (node: HierarchyNode) => {
          node.children.forEach((child) => {
            nodesToDelete.add(child.id);
            collectChildrenIds(child);
          });
        };
        const nodeToDelete = hierarchy.find((node) => node.id === nodeId);
        if (nodeToDelete) {
          collectChildrenIds(nodeToDelete);
        }
      }

      const updatedNodes = nodes.filter((node) => !nodesToDelete.has(node.id));
      onNodesChange(updatedNodes);
    };

    const addNewRow = () => {
      if (readOnly) return;

      const taskName = "";
      const shapeType = "rectangle";

      // Get current user from auth
      const currentUser = user?.name || "Unknown User";
      const currentTime = new Date().toISOString();

      // Create initial data object
      const initialData: Record<string, any> = {
        label: taskName,
        shape: shapeType,
      };

      // Add system fields based on column types
      columns.forEach((col) => {
        if (col.type === "Last edited time" || col.type === "Created Time") {
          initialData[col.title] = currentTime;
        } else if (col.type === "Last edited by" || col.type === "Created by") {
          initialData[col.title] = currentUser;
        }
      });

      const newNode = {
        id: `node-${Date.now()}`,
        type: "genericNode",
        position: { x: 0, y: 0 },
        data: initialData,
        parentNode:
          selectedParentId !== "no-parent" ? selectedParentId : undefined,
      };

      onNodesChange([...nodes, newNode] as Node[]);
      setSelectedParentId(null);

      if (newNode.parentNode) {
        setExpandedRows((prev) => new Set(prev).add(newNode.parentNode!));
      }
    };

    const addNewColumn = () => {
      if (readOnly) return;
      setIsAddColumnSidebarOpen(true);
    };

    const handleAddColumn = (columnData: any) => {
      onAddColumn(columnData);
    };

    const validateField = (
      type: string,
      value: any
    ): { isValid: boolean; errorMessage: string | null } => {
      const schema =
        validationSchemas[type as keyof typeof validationSchemas] || z.string();
      let result;
      if (type === "Multiselect") {
        result = schema.safeParse(
          Array.isArray(value) ? value : [value].filter(Boolean)
        );
      } else if (type === "Checkbox") {
        result = schema.safeParse(value === true);
      } else if (
        type === "Date" ||
        type === "Created Time" ||
        type === "Last edited time"
      ) {
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          return { isValid: false, errorMessage: "Invalid date or time" };
        }
        result = schema.safeParse(dateValue.toISOString());
      } else if (type === "Phone Number") {
        const isValidPhone = /^\+?[1-9]\d{1,14}$/.test(value);
        return {
          isValid: isValidPhone,
          errorMessage: isValidPhone ? null : "Invalid phone number format",
        };
      } else {
        result = schema.safeParse(value);
      }

      return {
        isValid: result.success,
        errorMessage: result.success ? null : result.error.errors[0].message,
      };
    };

    const handleSave = (nodeId: string, column: string, value: any) => {
      if (readOnly) return;

      const columnDef = columns?.find((col) => col.title === column);
      if (columnDef) {
        if (columnDef.type === "Rollup") {
          setEditingCell(null);
          setEditedValue(null);
          setValidationError(null);
          return;
        }

        const dataKey = getDataKey(columnDef);

        const currentUser = user?.name || "Unknown User";
        const currentTime = new Date().toISOString();

        if (columnDef.type === "Relation") {
          const relationValue = Array.isArray(value) ? value : [];

          const updatedNodes = nodes.map((node) => {
            if (node.id === nodeId) {
              const newData = { ...node.data };

              // Use dataKey for storing relation data
              if (dataKey !== column) {
                newData[dataKey] = relationValue;
              } else {
                newData[column] = relationValue;
              }

              // Update system fields based on column types
              columns.forEach((col) => {
                if (col.type === "Last edited time") {
                  newData[col.title] = currentTime;
                } else if (col.type === "Last edited by") {
                  newData[col.title] = currentUser;
                }
              });

              // Update relation cache
              const newRelationCache = { ...relationCache };
              newRelationCache[`${nodeId}-${column}`] = relationValue;
              setRelationCache(newRelationCache);

              // Update rollup data that depends on this relation
              const relatedRollupColumns = columns.filter(
                (col) =>
                  col.type === "Rollup" &&
                  col.rollup_relation === columnDef.related_canvas_id
              );

              if (relatedRollupColumns.length > 0) {
                // Force refresh of rollup data by simulating a change in nodes or columns
                setTimeout(() => {
                  // This will trigger the useEffect that updates rollup data
                  const nodesCopy = [...nodes];
                  onNodesChange(nodesCopy);
                }, 100);
              }

              return { ...node, data: newData };
            }
            return node;
          });

          onNodesChange(updatedNodes);
          setEditingCell(null);
          setEditedValue(null);
          setValidationError(null);
          return;
        }

        const { isValid, errorMessage } = validateField(columnDef?.type, value);

        if (isValid) {
          const updatedNodes = nodes.map((node) => {
            if (node.id === nodeId) {
              const newData = { ...node.data };

              columns.forEach((col) => {
                if (col.type === "Last edited time") {
                  newData[col.title] = currentTime;
                } else if (col.type === "Last edited by") {
                  newData[col.title] = currentUser;
                }
              });

              switch (dataKey) {
                case "label":
                  newData.label = value;
                  break;
                case "shape":
                  newData.shape = value;
                  break;
                case "id":
                  newData.id = value;
                  break;
                default:
                  newData[column] = value;
              }

              return { ...node, data: newData };
            }
            return node;
          });

          onNodesChange(updatedNodes);
          setEditingCell(null);
          setEditedValue(null);
          setValidationError(null);
        } else {
          setValidationError(errorMessage);
        }
      }
    };

    const shapeOptions: SHAPES[] = ALL_SHAPES;

    const toggleRowExpansion = (nodeId: string) => {
      setExpandedRows((prevExpandedRows) => {
        const newExpandedRows = new Set(prevExpandedRows);
        if (newExpandedRows.has(nodeId)) {
          newExpandedRows.delete(nodeId);
        } else {
          let currentNode = nodes.find((n) => n.id === nodeId);
          while (currentNode && currentNode.parentNode) {
            newExpandedRows.add(currentNode.parentNode);
            currentNode = nodes.find((n) => n.id === currentNode?.parentNode);
          }
          newExpandedRows.add(nodeId);
        }
        return newExpandedRows;
      });
    };

    const handleDeleteClick = (node: HierarchyNode) => {
      if (readOnly) return;
      setNodeToDelete(node);
      setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = (deleteChildren: boolean) => {
      try {
        if (nodeToDelete) {
          deleteNode(nodeToDelete.id, deleteChildren);

          setExpandedRows((prev) => {
            const newExpandedRows = new Set(prev);
            if (deleteChildren) {
              const nodesToRemove = new Set<string>([nodeToDelete.id]);
              const collectChildrenIds = (node: HierarchyNode) => {
                node.children.forEach((child) => {
                  nodesToRemove.add(child.id);
                  collectChildrenIds(child);
                });
              };
              collectChildrenIds(nodeToDelete);
              nodesToRemove.forEach((id) => newExpandedRows.delete(id));
            } else {
              newExpandedRows.delete(nodeToDelete.id);
            }
            return newExpandedRows;
          });
        }
      } finally {
        setDeleteDialogOpen(false);
        setNodeToDelete(null);
      }
    };

    // Row reordering handler
    const handleDragEnd = (event: any) => {
      const { active, over } = event;

      // If no movement occurred, do nothing
      if (!over || active.id === over.id) return;

      // Find the dragged node and the target node
      const activeNode = nodes.find((n) => n.id === active.id);
      const overNode = nodes.find((n) => n.id === over.id);

      if (!activeNode || !overNode) return;

      // Ensure both nodes are siblings (same parent)
      const parentId = activeNode.parentNode || null;
      if (parentId !== (overNode.parentNode || null)) {
        console.warn("Cannot reorder nodes with different parents.");
        return;
      }

      // Get all siblings (nodes with the same parent)
      const siblings = nodes.filter((n) => (n.parentNode || null) === parentId);
      const siblingIds = siblings.map((n) => n.id);

      // Determine old and new indices within siblings
      const oldIndex = siblingIds.indexOf(active.id);
      const newIndex = siblingIds.indexOf(over.id);

      if (oldIndex === -1 || newIndex === -1) {
        console.error("Could not find indices for reordering.");
        return;
      }

      // Reorder the siblings array
      const updatedSiblings = [...siblings];
      const [movedNode] = updatedSiblings.splice(oldIndex, 1); // Remove the dragged node
      updatedSiblings.splice(newIndex, 0, movedNode); // Insert it at the new position

      const updatedNodes = [...nodes];
      const siblingIndices = siblings.map((sibling) =>
        nodes.findIndex((n) => n.id === sibling.id)
      );

      updatedSiblings.forEach((sibling, index) => {
        updatedNodes[siblingIndices[index]] = sibling;
      });

      onNodesChange(updatedNodes);
    };

    const handleDeleteSelected = () => {
      const updatedNodes = nodes.filter(
        (node) => !selectedNodes.includes(node.id)
      );

      updatedNodes.forEach((node) => {
        if (node.parentNode && selectedNodes.includes(node.parentNode)) {
          node.parentNode = undefined;
        }
      });
      onNodesChange(updatedNodes);
      setExpandedRows((prev) => {
        const newExpandedRows = new Set(prev);
        selectedNodes.forEach((id) => newExpandedRows.delete(id));
        return newExpandedRows;
      });
      setSelectedNodes([]);
      setDeleteSelectedDialogOpen(false);
    };

    const isDefaultColumn = (columnTitle: string) => {
      return ["task", "type", "parent", "children"].includes(columnTitle);
    };

    const handleColumnTitleEdit = (columnTitle: string, newTitle: string) => {
      if (newTitle.trim() && newTitle !== columnTitle) {
        const columnBeingRenamed = columns?.find(
          (col) => col.title === columnTitle
        );

        setColumns(
          columns?.map((col) =>
            col.title === columnTitle
              ? {
                  ...col,
                  title: newTitle,

                  dataKey: col.dataKey || getDataKey(col),
                }
              : col
          )
        );

        // Only update node data if it's not a special column
        if (columnBeingRenamed && !isSpecialColumn(columnBeingRenamed)) {
          const updatedNodes = nodes.map((node) => {
            const newData = { ...node.data };
            if (newData[columnTitle] !== undefined) {
              newData[newTitle] = newData[columnTitle];
              delete newData[columnTitle];
            }
            return { ...node, data: newData };
          });
          onNodesChange(updatedNodes);
        }
      }
      setEditingColumnTitle(null);
      setNewColumnTitle("");
    };

    const handleDeleteColumn = (columnTitle: string) => {
      setColumns(columns.filter((col) => col.title !== columnTitle));
      const updatedNodes = nodes.map((node) => {
        const newData = { ...node.data };
        delete newData[columnTitle];
        return { ...node, data: newData };
      });
      onNodesChange(updatedNodes);
      setDeleteColumnDialog(null);
    };

    const handleDuplicateColumn = (columnTitle: string) => {
      const originalColumn = columns.find((col) => col.title === columnTitle);
      if (originalColumn) {
        let newTitle = `${columnTitle} copy`;
        let counter = 1;
        while (columns.some((col) => col.title === newTitle)) {
          newTitle = `${columnTitle} copy ${counter}`;
          counter++;
        }

        const newColumn = { ...originalColumn, title: newTitle };
        setColumns([...columns, newColumn]);

        const updatedNodes = nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            [newTitle]: node.data[columnTitle],
          },
        }));
        onNodesChange(updatedNodes);
      }
    };

    const toggleColumnVisibility = (columnTitle: string) => {
      const updatedHiddenColumns = hiddenColumns.includes(columnTitle)
        ? hiddenColumns.filter((col: string) => col !== columnTitle)
        : [...hiddenColumns, columnTitle];

      updateTableSettings({
        ...canvasSettings.table_settings,
        hiddenColumns: updatedHiddenColumns,
      });
    };

    const getRelatedCanvasNodes = (canvas_data: any) => {
      if (!canvas_data) return null;

      const canvasNodes = canvas_data?.[0]?.nodes ?? canvas_data?.nodes;

      const columnsData = canvasNodes?.map((node: Node) => {
        return { ...node.data, id: node.id };
      });

      const canvasDetails = {
        canvasName: canvas_data.name,
        columns: columnsData,
      };

      return canvasDetails;
    };

    const getRelatedCanvasesWithColumns = useCallback(() => {
      const relationColumns = columns.filter((col) => col?.type === "Relation");

      if (relationColumns.length === 0) return [];

      return relationColumns.map((column) => {
        return {
          canvasName: column.related_canvas?.name,
          columns: column.related_canvas?.columns,
          id: column.related_canvas?.id,
        };
      });
    }, [{ ...columns }, canvasId]);

    // Handle individual node sorting
    const sortByNode = (nodeId: string, sortDirection: "asc" | "desc") => {
      // Find the node and get a sortable column from it
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      // Choose the first sortable column
      const firstSortableColumn =
        columns.find((col) => isColumnSortable(col.type, col.title))?.title ||
        "task";

      // Set the sort parameters
      setSortField(firstSortableColumn as SortField);
      setSortDirection(sortDirection);
    };

    const addFilterForNode = (nodeId: string, columnTitle: string) => {
      const columnType = getColumnTypeForFilter(columnTitle);
      if (!isColumnFilterable(columnType, columnTitle)) {
        const firstFilterableColumn =
          columns.find((col) => isColumnFilterable(col.type, col.title))
            ?.title || "task";
        columnTitle = firstFilterableColumn;
      }

      // Find the node
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const columnDef = columns.find((col) => col.title === columnTitle);
      const dataKey = columnDef ? getDataKey(columnDef) : columnTitle;

      let value;
      switch (dataKey) {
        case "label":
          value = node.data.label;
          break;
        case "shape":
          value = node.data.shape;
          break;
        case "id":
          value = node.id;
          break;
        default:
          value = node.data[columnTitle];
      }

      if (value === undefined) return;

      const newGroup: FilterGroup = {
        id: generateId(),
        filters: [
          {
            id: generateId(),
            column: columnTitle,
            operator: typeof value === "string" ? "equals" : "equals",
            value: value === "" ? "placeholder_empty" : value,
          },
        ],
        conjunction: "AND",
      };

      setFilterGroups([...filterGroups, newGroup]);
      setFilterDialogOpen(true);
    };

    const duplicateNode = (nodeId: string) => {
      if (readOnly) return;

      const nodeToDuplicate = nodes.find((node) => node.id === nodeId);
      if (!nodeToDuplicate) return;

      const uniqueId = `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newNode = {
        ...nodeToDuplicate,
        id: uniqueId,
        data: { ...nodeToDuplicate.data },
      };

      onNodesChange([...nodes, newNode]);
    };

    console.log("----- editign cell:", editingCell);

    const renderHierarchy = (
      nodes: HierarchyNode[],
      level = 0
    ): JSX.Element[] => {
      return nodes.flatMap((node) => {
        const isExpanded = expandedRows.has(node.id);
        const hasChildren = node.children.length > 0;

        return [
          <SortableTableRow
            key={node.id}
            node={node}
            level={level}
            columns={columns}
            editingCell={editingCell}
            editedValue={editedValue}
            validationError={validationError}
            setEditingCell={readOnly ? () => {} : setEditingCell}
            setEditedValue={setEditedValue}
            setValidationError={setValidationError}
            handleSave={handleSave}
            toggleRowExpansion={toggleRowExpansion}
            handleDeleteClick={handleDeleteClick}
            selectedNodes={selectedNodes}
            setSelectedNodes={setSelectedNodes}
            expandedRows={expandedRows}
            hiddenColumns={hiddenColumns}
            frozenColumns={frozenColumns}
            columnWrapping={columnWrapping}
            getRelatedCanvasNodes={getRelatedCanvasNodes}
            columnWidths={columnWidths}
            nodeToDelete={nodeToDelete}
            handleDeleteConfirm={handleDeleteConfirm}
            shapeOptions={shapeOptions}
            readOnly={readOnly}
            sortByNode={!readOnly ? sortByNode : undefined}
            addFilterForNode={!readOnly ? addFilterForNode : undefined}
            duplicateNode={!readOnly ? duplicateNode : undefined}
          />,
          ...(isExpanded && hasChildren
            ? renderHierarchy(node.children, level + 1)
            : []),
        ];
      });
    };

    const startEditingColumnTitle = (columnTitle: string) => {
      setEditingColumnTitle(columnTitle);
      setNewColumnTitle(columnTitle);
    };

    const exportToCSV = () => {
      // Get visible columns
      const visibleColumns = columns.filter(
        (column) =>
          !hiddenColumns?.includes(column.title) && column.title !== "id"
      );

      // Create CSV header
      const headers = visibleColumns.map((col) => col.title).join(",");

      // Create CSV rows
      const rows = flattenHierarchy(sortedHierarchy).map(({ node }) => {
        return visibleColumns
          .map((col) => {
            const dataKey = getDataKey(col);
            let value;

            // Get value using dataKey
            switch (dataKey) {
              case "label":
                value = node.data.label;
                break;
              case "shape":
                value = node.data.shape;
                break;
              case "id":
                value = node.id;
                break;
              default:
                value = node.data[col.title];
            }

            // Handle different column types
            switch (col.type) {
              case "Rollup":
                const rollupData = rollupCache[`${node.id}-${col.title}`] || [];
                value = rollupData.map((item: any) => item.value).join(", ");
                break;
              case "Relation":
                const relationData =
                  relationCache[`${node.id}-${col.title}`] || [];
                value = relationData
                  .map((item: any) => item.label || item.id)
                  .join(", ");
                break;
              case "Multiselect":
                if (Array.isArray(value)) {
                  value = value.join(", ");
                }
                break;
              case "Checkbox":
                value = value ? "Yes" : "No";
                break;
              case "Date":
              case "Created Time":
              case "Last edited time":
                if (value) {
                  value = new Date(value).toISOString();
                }
                break;
              default:
                if (Array.isArray(value)) {
                  value = value.map((v) => v.label || v).join(", ");
                } else if (typeof value === "object" && value !== null) {
                  value = JSON.stringify(value);
                }
            }

            // Handle strings with commas
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value || "";
          })
          .join(",");
      });

      // Combine header and rows
      const csvContent = [headers, ...rows].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "table_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const exportToExcel = () => {
      // Get visible columns
      const visibleColumns = columns.filter(
        (column) =>
          !hiddenColumns?.includes(column.title) && column.title !== "id"
      );

      // Create Excel content
      const rows = flattenHierarchy(sortedHierarchy).map(({ node }) => {
        return visibleColumns.map((col) => {
          const dataKey = getDataKey(col);
          let value;

          // Get value using dataKey
          switch (dataKey) {
            case "label":
              value = node.data.label;
              break;
            case "shape":
              value = node.data.shape;
              break;
            case "id":
              value = node.id;
              break;
            default:
              value = node.data[col.title];
          }

          // Handle different column types
          switch (col.type) {
            case "Rollup":
              const rollupData = rollupCache[`${node.id}-${col.title}`] || [];
              value = rollupData.map((item: any) => item.value).join(", ");
              break;
            case "Relation":
              const relationData =
                relationCache[`${node.id}-${col.title}`] || [];
              value = relationData
                .map((item: any) => item.label || item.id)
                .join(", ");
              break;
            case "Multiselect":
              if (Array.isArray(value)) {
                value = value.join(", ");
              }
              break;
            case "Checkbox":
              value = value ? "Yes" : "No";
              break;
            case "Date":
            case "Created Time":
            case "Last edited time":
              if (value) {
                value = new Date(value).toISOString();
              }
              break;
            default:
              if (Array.isArray(value)) {
                value = value.map((v) => v.label || v).join(", ");
              } else if (typeof value === "object" && value !== null) {
                value = JSON.stringify(value);
              }
          }

          return value || "";
        });
      });

      // Create HTML table
      const table = document.createElement("table");
      const thead = document.createElement("thead");
      const tbody = document.createElement("tbody");

      // Add headers
      const headerRow = document.createElement("tr");
      visibleColumns.forEach((col) => {
        const th = document.createElement("th");
        th.textContent = col.title;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Add rows
      rows.forEach((row) => {
        const tr = document.createElement("tr");
        row.forEach((cell) => {
          const td = document.createElement("td");
          td.textContent = cell;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);

      // Convert to Excel
      const html = table.outerHTML;
      const blob = new Blob([html], { type: "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "table_export.xls";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // Expose exportToCSV and exportToExcel methods to parent components
    useImperativeHandle(ref, () => ({
      exportToCSV,
      exportToExcel,
    }));

    // Add this helper function before the return statement
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

    return (
      <>
        <div className="w-full bg-white">
          <div className="flex items-center justify-between px-8 py-2 border-b border-gray-100">
            <div className="text-base text-gray-700 font-medium"></div>
            <div className="flex items-center gap-2 min-h-10">
              {(selectedNodes.length > 0 ||
                sortField ||
                filterGroups.length > 0) && (
                <>
                  {sortField && (
                    <Button
                      variant="outline"
                      className="text-red-600 font-medium text-sm hover:bg-red-50 ml-2 rounded-md"
                      onClick={() => {
                        setSortField(null);
                        setSortDirection(null);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear sorting
                    </Button>
                  )}
                  {filterGroups.length > 0 && (
                    <Button
                      variant="outline"
                      className="text-red-600 font-medium text-sm hover:bg-red-50 ml-2 rounded-md"
                      onClick={clearAllFilters}
                    >
                      <FilterX className="h-4 w-4 mr-2" />
                      Clear filters
                    </Button>
                  )}
                  {selectedNodes.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        className="text-gray-500 font-medium text-sm hover:bg-gray-50 ml-2 rounded-md"
                        onClick={() => setDeleteSelectedDialogOpen(true)}
                        disabled={selectedNodes.length === 0 || readOnly}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>

                      <Button
                        variant="outline"
                        className="text-gray-500 font-medium text-sm hover:bg-gray-50 ml-2 rounded-md"
                        onClick={handleDuplicateSelected}
                        disabled={selectedNodes.length === 0 || readOnly}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </Button>
                    </>
                  )}
                </>
              )}

              {!readOnly && (
                <>
                  <Button
                    variant={filterGroups.length > 0 ? "default" : "outline"}
                    className={`text-sm hover:bg-gray-50 ml-2 rounded-md ${filterGroups.length > 0 ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" : "text-gray-500"}`}
                    onClick={() => {
                      // Just open the dialog without adding a filter group
                      setFilterDialogOpen(true);
                    }}
                  >
                    <Filter
                      className={`h-4 w-4 mr-2 ${filterGroups.length > 0 ? "text-blue-700" : ""}`}
                    />
                    Filter{" "}
                    {filterGroups.length > 0 ? `(${filterGroups.length})` : ""}
                  </Button>

                  <Button
                    variant={sortField ? "default" : "outline"}
                    className={`text-sm hover:bg-gray-50 ml-2 rounded-md ${sortField ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" : "text-gray-500"}`}
                    onClick={() => setShowFilterUI(!showFilterUI)}
                  >
                    <SlidersHorizontal
                      className={`h-4 w-4 mr-2 ${sortField ? "text-blue-700" : ""}`}
                    />
                    Sort {sortField ? `(${sortField})` : ""}
                  </Button>
                </>
              )}

              {canvasType === "hybrid" && (
                <>
                  <div className="ml-auto flex items-center">
                    <ViewModeSwitcher
                      viewMode={viewMode}
                      onViewModeChange={onViewModeChange}
                      canvasType={canvasType}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 mx-auto bg-gray-50 min-h-full flex max-w-[95vw]">
          <div className="rounded-lg border bg-white overflow-hidden flex-1 ">
            <div className="overflow-x-auto w-full  !px-0 ">
              {/* Add max-w-screen */}
              <div
                className="overflow-x-auto relative"
                style={{
                  maxWidth: "calc(100vw - 32px)",
                  maxHeight: "calc(100vh - 280px)",
                }}
              >
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <Table
                    style={{
                      minWidth: "max-content",
                      position: "relative",
                    }}
                  >
                    <TableHeader className="p-0 bg-gray-50 ">
                      <TableRow className="group">
                        <TableHead
                          className={`sticky left-0 z-20 bg-white border-r border-gray-200 w-16 text-left pl-2 ${
                            selectedNodes.length > 0
                              ? "bg-blue-50"
                              : "bg-gray-50"
                          }`}
                        >
                          {!readOnly && (
                            <Checkbox
                              className={`transition-opacity ${
                                selectedNodes.length > 0
                                  ? "opacity-100"
                                  : "opacity-0 group-hover:opacity-100"
                              }`}
                              ref={(el) => {
                                if (el) {
                                  // @ts-ignore
                                  el.indeterminate =
                                    selectedNodes.length > 0 &&
                                    selectedNodes.length <
                                      visibleNodeIds.length;
                                }
                              }}
                              checked={
                                selectedNodes.length === visibleNodeIds.length
                              }
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedNodes(visibleNodeIds);
                                } else {
                                  setSelectedNodes([]);
                                }
                              }}
                            />
                          )}
                        </TableHead>
                        {columns
                          .filter(
                            (column) =>
                              !hiddenColumns?.includes(column.title) &&
                              column.title !== "id"
                          )
                          .map((column) => {
                            const width = columnWidths[column.title] || 200;

                            return (
                              <TableHead
                                key={column.title}
                                ref={(el) =>
                                  (columnRefs.current[column.title] = el)
                                }
                                className={`border-r border-gray-200 text-center group ${
                                  frozenColumns.has(column.title)
                                    ? "sticky left-16 z-10"
                                    : "relative"
                                }`}
                                style={{
                                  width: `${width}px`,
                                  minWidth: `${width}px`,
                                  maxWidth: `${width}px`,
                                }}
                              >
                                <div
                                  className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent"
                                  onMouseDown={() =>
                                    startResizing(column.title)
                                  }
                                />

                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    asChild
                                    disabled={
                                      editingColumnTitle === column.title
                                    }
                                  >
                                    <div
                                      className="flex items-center cursor-pointer"
                                      onClick={(e) => {
                                        if (
                                          editingColumnTitle === column.title
                                        ) {
                                          e.preventDefault();
                                          e.stopPropagation();
                                        } else if (!readOnly) {
                                          startEditingColumnTitle(column.title);
                                        }
                                      }}
                                    >
                                      {editingColumnTitle === column.title ? (
                                        <Input
                                          value={newColumnTitle}
                                          onChange={(e) =>
                                            setNewColumnTitle(e.target.value)
                                          }
                                          onBlur={() =>
                                            handleColumnTitleEdit(
                                              column.title,
                                              newColumnTitle
                                            )
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              handleColumnTitleEdit(
                                                column.title,
                                                newColumnTitle
                                              );
                                            }
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          autoFocus
                                          className="h-7 w-32 focus-visible:ring-0"
                                        />
                                      ) : (
                                        <div className="flex items-center justify-center w-full">
                                          <span>{column.title}</span>
                                          <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                            {sortField === column.title && (
                                              <span className="text-gray-500">
                                                {sortDirection === "asc" ? (
                                                  <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                  <ChevronDown className="h-4 w-4" />
                                                )}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="start"
                                    className="w-56"
                                  >
                                    {sortField === column.title && (
                                      <>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSortField(null);
                                            setSortDirection(null);
                                          }}
                                          className="text-red-600 font-medium gap-2"
                                        >
                                          <X className="h-4 w-4" />
                                          Clear sorting
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                      </>
                                    )}
                                    {!readOnly && (
                                      <DropdownMenuItem
                                        onSelect={() =>
                                          startEditingColumnTitle(column.title)
                                        }
                                      >
                                        Edit property
                                      </DropdownMenuItem>
                                    )}
                                    {isColumnSortable(
                                      column.type,
                                      column.title
                                    ) && (
                                      <>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSortField(
                                              column.title as SortField
                                            );
                                            setSortDirection("asc");
                                          }}
                                        >
                                          Sort ascending
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSortField(
                                              column.title as SortField
                                            );
                                            setSortDirection("desc");
                                          }}
                                        >
                                          Sort descending
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {!hiddenColumns?.includes(column.title) &&
                                      !readOnly && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            toggleColumnVisibility(column.title)
                                          }
                                        >
                                          Hide in view
                                        </DropdownMenuItem>
                                      )}
                                    {!readOnly && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleDuplicateColumn(column.title)
                                        }
                                      >
                                        Duplicate property
                                      </DropdownMenuItem>
                                    )}
                                    {!isDefaultColumn(column.title) &&
                                      !readOnly && (
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() =>
                                            setDeleteColumnDialog(column.title)
                                          }
                                        >
                                          Delete property
                                        </DropdownMenuItem>
                                      )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableHead>
                            );
                          })}

                        <TableHead
                          style={{
                            position: "sticky",
                            right: 0,
                            zIndex: 30,
                            backgroundColor: "#fff",
                            boxShadow: "-2px 0 2px -1px rgba(0,0,0,0.1)",
                          }}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 opacity-0 group-hover:opacity-100 ${
                                  readOnly ? "hidden" : ""
                                }`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={addNewColumn}
                                className={readOnly ? "hidden" : ""}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add New Column
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={exportToCSV}>
                                <Download className="h-4 w-4 mr-2" />
                                Export as CSV
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={exportToExcel}>
                                <Download className="h-4 w-4 mr-2" />
                                Export as Excel
                              </DropdownMenuItem>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <ChevronDown className="h-4 w-4 mr-2" />
                                    Show/Hide Columns
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px] overflow-hidden">
                                  <DialogHeader>
                                    <DialogTitle>
                                      Manage Column Visibility
                                    </DialogTitle>
                                    <DialogDescription>
                                      Toggle columns to show or hide them. Icons
                                      indicate which operations are available.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 my-4 max-h-[50vh] overflow-y-auto pr-2">
                                    {columns.map((column) => (
                                      <div
                                        key={column.title}
                                        className="flex items-center justify-between py-2 border-b border-gray-100"
                                      >
                                        <div className="flex items-center">
                                          <span>{column.title}</span>
                                          <div className="flex ml-2 space-x-1">
                                            {isColumnSortable(
                                              column.type,
                                              column.title
                                            ) && (
                                              <span
                                                className="tooltip"
                                                aria-label="Sortable"
                                              >
                                                <SlidersHorizontal className="h-3 w-3 text-gray-400" />
                                              </span>
                                            )}
                                            {!["Rollup", "Relation"].includes(
                                              column.type || ""
                                            ) && (
                                              <span
                                                className="tooltip"
                                                aria-label="Filterable"
                                              >
                                                <Filter className="h-3 w-3 text-gray-400" />
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <Switch
                                          checked={
                                            !hiddenColumns?.includes(
                                              column.title
                                            )
                                          }
                                          onCheckedChange={() =>
                                            toggleColumnVisibility(column.title)
                                          }
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <DialogFooter>
                                    <DialogTrigger asChild>
                                      <Button>Close</Button>
                                    </DialogTrigger>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <SortableContext
                      items={sortedHierarchy.map((node) => node.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <TableBody>{renderHierarchy(sortedHierarchy)}</TableBody>
                    </SortableContext>
                  </Table>
                </DndContext>
              </div>
            </div>
            <div className="p-4 border-t sticky bottom-0 bg-white">
              {!readOnly && (
                <div
                  className="flex items-center cursor-pointer"
                  onClick={addNewRow}
                >
                  <div className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 mr-2">
                    <Plus className="h-3.5 w-3.5 text-gray-600" />
                  </div>
                  <span className="text-sm text-gray-600">Add New Note</span>
                </div>
              )}
            </div>
          </div>

          <AddColumnSidebar
            isOpen={isAddColumnSidebarOpen}
            onClose={() => setIsAddColumnSidebarOpen(false)}
            onAddColumn={handleAddColumn}
            canvases={currentFolderCanvases}
            canvasId={canvasId}
            relationCanvases={getRelatedCanvasesWithColumns()}
            columns={columns}
          />

          <AlertDialog
            open={!!deleteColumnDialog}
            onOpenChange={() => setDeleteColumnDialog(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Column</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this column? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    deleteColumnDialog && handleDeleteColumn(deleteColumnDialog)
                  }
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Node</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this node
                  {nodeToDelete?.children.length ? " and its children" : ""}?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteConfirm(false)}
                >
                  Delete Node Only
                </Button>
                {nodeToDelete?.children.length ? (
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteConfirm(true)}
                  >
                    Delete Node and Children
                  </Button>
                ) : null}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Bulk deletion confirmation dialog */}
          <AlertDialog
            open={deleteSelectedDialogOpen}
            onOpenChange={setDeleteSelectedDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Selected Nodes</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the selected nodes? This
                  action cannot be undone. Children of deleted nodes will become
                  top-level nodes unless also selected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSelected}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Filter Dialog */}
          <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Filter</DialogTitle>
                <DialogDescription>
                  Add filters to show only the items that match your criteria.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {filterGroups.length > 0 ? (
                  // Show existing filter groups
                  filterGroups.map((group, groupIndex) => (
                    <div
                      key={group.id}
                      className="border border-gray-200 rounded-md p-4 space-y-4"
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
                                  <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Column" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[
                                      { title: "task", type: "Text" },
                                      { title: "type", type: "Select" },
                                      ...columns.filter(
                                        (col) =>
                                          !hiddenColumns?.includes(col.title) &&
                                          isColumnFilterable(
                                            col.type,
                                            col.title
                                          ) &&
                                          col.title !== "task" && // Exclude task since we added it manually
                                          col.title !== "type" // Exclude type since we added it manually
                                      ),
                                    ].map((col) => (
                                      <SelectItem
                                        key={col.title}
                                        value={col.title}
                                      >
                                        {col.title}
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
                                  <SelectTrigger className="w-[170px]">
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
                                          filter.value === "placeholder_empty"
                                            ? undefined
                                            : filter.value
                                        }
                                        onValueChange={(value) => {
                                          updateFilter(group.id, filter.id, {
                                            value,
                                          });
                                        }}
                                      >
                                        <SelectTrigger className="w-[150px]">
                                          <SelectValue placeholder="Value" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {getOptionsForColumn(filter.column)
                                            .length > 0 ? (
                                            getOptionsForColumn(
                                              filter.column
                                            ).map((option) => (
                                              <SelectItem
                                                key={option}
                                                value={
                                                  option || "placeholder_empty"
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
                                          filter.value === "placeholder_empty"
                                            ? ""
                                            : filter.value || ""
                                        }
                                        onChange={(e) => {
                                          updateFilter(group.id, filter.id, {
                                            value:
                                              e.target.value ||
                                              "placeholder_empty",
                                          });
                                        }}
                                        placeholder="Value"
                                        className="w-[150px]"
                                      />
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFilter(group.id, filter.id)}
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
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Add filter
                        </Button>

                        {filterGroups.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => removeFilterGroup(group.id)}
                          >
                            Remove group
                          </Button>
                        )}

                        {groupIndex < filterGroups.length - 1 && (
                          <div className="w-full text-center text-sm text-gray-500 mt-2">
                            {group.conjunction === "AND" ? "AND" : "OR"}
                          </div>
                        )}
                      </div>

                      {groupIndex < filterGroups.length - 1 && (
                        <div className="flex justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleConjunction(group.id)}
                            className="text-sm"
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
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <Filter className="h-8 w-8 mx-auto mb-2" />
                      <p>No filters applied</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={addFilterGroup}
                      className="flex items-center gap-1 mx-auto"
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
                    className="w-full flex items-center justify-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add filter group
                  </Button>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setFilterDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    // Apply filters
                    setFilterDialogOpen(false);

                    // Process any placeholder values before applying
                    setFilterGroups((prevGroups) =>
                      prevGroups.map((group) => ({
                        ...group,
                        filters: group.filters.map((filter) => {
                          // If using placeholder, convert to empty string for the actual filter logic
                          if (filter.value === "placeholder_empty") {
                            return {
                              ...filter,
                              value: "",
                            };
                          }
                          return filter;
                        }),
                      }))
                    );
                  }}
                >
                  Apply
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Sort UI Dropdown */}
          {showFilterUI && (
            <div className="absolute top-20 right-10 z-50 bg-white border border-gray-200 rounded-md shadow-lg p-4 min-w-[300px] space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Sort</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilterUI(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Sort by</div>
                <Select
                  value={sortField || "none"}
                  onValueChange={(value) => {
                    if (value && value !== "none") {
                      setSortField(value as SortField);
                      setSortDirection(sortDirection || "asc");
                    } else {
                      setSortField(null);
                      setSortDirection(null);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {columns
                      .filter((col) => {
                        // Filter only sortable columns
                        return (
                          isColumnSortable(col.type, col.title) &&
                          !hiddenColumns?.includes(col.title)
                        );
                      })
                      .map((col) => (
                        <SelectItem key={col.title} value={col.title}>
                          {col.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {sortField && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Direction</div>
                  <div className="flex gap-2">
                    <Button
                      variant={sortDirection === "asc" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setSortDirection("asc")}
                    >
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Ascending
                    </Button>
                    <Button
                      variant={sortDirection === "desc" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setSortDirection("desc")}
                    >
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Descending
                    </Button>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowFilterUI(false);
                }}
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </>
    );
  }
);

export default TableView;
