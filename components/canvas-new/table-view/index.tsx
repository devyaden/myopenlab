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
  MoreVertical,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type React from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { Edge, Node } from "reactflow";
import * as z from "zod";
import { Checkbox } from "../../ui/checkbox";
import { AddColumnSidebar } from "../add-column-sidebar";
import SortableTableRow from "./sortable-table-row";
import {
  HierarchyNode,
  SortDirection,
  SortField,
  TableViewProps,
  VIEW_MODE,
} from "./table.types";
import { validationSchemas } from "./validations";
import { ALL_SHAPES, SHAPES } from "@/lib/types/flow-table.types";
import { DropdownMenuSubTrigger } from "@radix-ui/react-dropdown-menu";
import Image from "next/image";
import { ViewModeSwitcher } from "../view-mode-switcher";

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
    console.log("------ edges --------", edges);

    const { user } = useUser();
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [newTaskName, setNewTaskName] = useState("");
    const [newShapeType, setNewShapeType] = useState("rectangle");
    const [isAddingRow, setIsAddingRow] = useState(false);
    const [isAddColumnSidebarOpen, setIsAddColumnSidebarOpen] = useState(false);
    const [editingCell, setEditingCell] = useState<{
      nodeId: string;
      column: string;
    } | null>(null);
    const [editedValue, setEditedValue] = useState<any>(null);

    const [validationError, setValidationError] = useState<string | null>(null);
    const [selectedParentId, setSelectedParentId] = useState<string | null>(
      null
    );
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

    let {
      columnWidths = {},
      hiddenNodeIds = new Set(),
      hiddenColumns = [],
    } = canvasSettings?.table_settings ?? {};

    // if type of hidden columns is an empty object, initialize it as a Set
    if (
      typeof hiddenColumns === "object" &&
      !Object.keys(hiddenColumns).length
    ) {
      hiddenColumns = [];
    }

    const updateTableSettings = (newSettings: any) => {
      // @ts-ignore
      updateCanvasSettings({ table_settings: newSettings });
    };

    // Add or remove columns from hiddenColumns based on data availability
    useEffect(() => {
      interface ColumnUpdate {
        name: string;
        shouldHide: boolean;
      }

      const columnsToUpdate: ColumnUpdate[] = [];
      const updatedColumns = [...columns];
      const defaultColumns = ["from", "to", "parent", "children"];
      const existingColumnTitles = new Set(columns.map((col) => col.title));

      // Check and add from/to columns if needed
      if (edges && edges.length > 0) {
        ["from", "to"].forEach((colName) => {
          if (!existingColumnTitles.has(colName)) {
            updatedColumns.push({
              title: colName,
              type: "Text",
            });
          }
          columnsToUpdate.push({ name: colName, shouldHide: false });
        });
      } else {
        ["from", "to"].forEach((colName) => {
          columnsToUpdate.push({ name: colName, shouldHide: true });
        });
      }

      // Check and add parent/children columns if needed
      const hasParentChildRelations = nodes.some(
        (node) =>
          node.parentNode || (node as HierarchyNode).children?.length > 0
      );

      if (hasParentChildRelations) {
        ["parent", "children"].forEach((colName) => {
          if (!existingColumnTitles.has(colName)) {
            updatedColumns.push({
              title: colName,
              type: "Text",
            });
          }
          columnsToUpdate.push({ name: colName, shouldHide: false });
        });
      } else {
        ["parent", "children"].forEach((colName) => {
          columnsToUpdate.push({ name: colName, shouldHide: true });
        });
      }

      // Update columns if new ones were added
      if (updatedColumns.length !== columns.length) {
        setColumns(updatedColumns);
      }

      // Update hiddenColumns based on the current state
      const updatedHiddenColumns = [...hiddenColumns];

      columnsToUpdate.forEach(({ name, shouldHide }) => {
        const isCurrentlyHidden = updatedHiddenColumns.includes(name);
        if (shouldHide && !isCurrentlyHidden) {
          updatedHiddenColumns.push(name);
        } else if (!shouldHide && isCurrentlyHidden) {
          const index = updatedHiddenColumns.indexOf(name);
          if (index > -1) {
            updatedHiddenColumns.splice(index, 1);
          }
        }
      });

      // Only update if there are changes
      if (
        JSON.stringify(updatedHiddenColumns) !== JSON.stringify(hiddenColumns)
      ) {
        updateTableSettings({
          ...canvasSettings.table_settings,
          hiddenColumns: updatedHiddenColumns,
        });
      }
    }, [
      edges,
      nodes,
      hiddenColumns,
      canvasSettings.table_settings,
      updateTableSettings,
      columns,
      setColumns,
    ]);

    // Cache for rollup and relation data
    const [rollupCache, setRollupCache] = useState<Record<string, any>>({});
    const [relationCache, setRelationCache] = useState<Record<string, any>>({});

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
          console.log("\nProcessing node:", node.id);

          // First, populate relation cache for all relation columns
          relationColumns.forEach((column) => {
            const relationData = node.data[column.title];

            if (relationData) {
              // Ensure relation data is stored as an array
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
            console.log("Found relation column:", relationColumn?.title);

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

            if (!relatedCanvas?.canvas_data?.nodes) {
              return;
            }

            const relatedCanvasNodes = relatedCanvas.canvas_data.nodes;

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
            console.log("Final rollup data:", rollupData);
          });
        });
      }

      // Set both caches with the new data
      setRollupCache(newRollupCache);
      setRelationCache(newRelationCache);
    }, [nodes, columns]);

    const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const startResizing = (columnTitle: string) => {
      document.body.classList.add("resizing");

      setResizingColumn(columnTitle);
    };

    const handleResize = useCallback(
      (mouseMoveEvent: MouseEvent) => {
        if (resizingColumn) {
          const columnElement = columnRefs.current[resizingColumn];
          if (!columnElement) return;

          const newWidth =
            mouseMoveEvent.clientX - columnElement.getBoundingClientRect().left;

          updateTableSettings({
            ...canvasSettings.table_settings,
            columnWidths: {
              ...columnWidths,
              [resizingColumn]: Math.max(100, newWidth),
            },
          });
        }
      },
      [resizingColumn]
    );

    const stopResizing = useCallback(() => {
      document.body.classList.remove("resizing");

      setResizingColumn(null);
    }, []);

    // Event listeners for resizing
    useEffect(() => {
      if (resizingColumn) {
        window.addEventListener("mousemove", handleResize);
        window.addEventListener("mouseup", stopResizing);
      }

      return () => {
        window.removeEventListener("mousemove", handleResize);
        window.removeEventListener("mouseup", stopResizing);
      };
    }, [resizingColumn, handleResize, stopResizing]);

    // column resizing ends here

    const handleDuplicateSelected = () => {
      let updatedNodes = [...nodes];
      selectedNodes.forEach((nodeId) => {
        const nodeToDuplicate = nodes.find((n) => n.id === nodeId);
        if (nodeToDuplicate) {
          const newNode = {
            ...nodeToDuplicate,
            id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            data: { ...nodeToDuplicate.data },
          };
          const index = updatedNodes.findIndex((n) => n.id === nodeId);
          updatedNodes.splice(index + 1, 0, newNode);
        }
      });
      onNodesChange(updatedNodes);
    };

    const enhanceNodesWithConnectionData = (
      nodes: Node[],
      edges: Edge[]
    ): Node[] => {
      if (!nodes?.length || !edges?.length) {
        return nodes;
      }

      // Create a map of connections for quick lookup
      const sourceConnections = new Map<string, string[]>();
      const targetConnections = new Map<string, string[]>();

      // Process all edges to build connection maps
      edges.forEach((edge) => {
        // Add target to source's outgoing connections
        if (!sourceConnections.has(edge.source)) {
          sourceConnections.set(edge.source, []);
        }
        sourceConnections.get(edge.source)?.push(edge.target);

        // Add source to target's incoming connections
        if (!targetConnections.has(edge.target)) {
          targetConnections.set(edge.target, []);
        }
        targetConnections.get(edge.target)?.push(edge.source);
      });

      // Enhance nodes with connection data
      return nodes.map((node) => {
        // Get source nodes (nodes that connect to this node)
        const fromNodes = targetConnections.get(node.id) || [];

        // Get target nodes (nodes this node connects to)
        const toNodes = sourceConnections.get(node.id) || [];

        // Find the labels for the connected nodes
        const fromLabels = fromNodes.map((id) => {
          const sourceNode = nodes.find((n) => n.id === id);
          return sourceNode ? sourceNode.data.label || id : id;
        });

        const toLabels = toNodes.map((id) => {
          const targetNode = nodes.find((n) => n.id === id);
          return targetNode ? targetNode.data.label || id : id;
        });

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
            let child = nodeMap.get(node.id);

            child = {
              ...child,
              data: {
                ...child?.data,
                parent: parent.data.label,
              },
            } as HierarchyNode;

            // Push child to parent's children
            parent.children.push(child);

            // Set children titles in parent's data
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

    const visibleNodes = useMemo(() => {
      return nodes.filter((node) => !hiddenNodeIds.has(node.id));
    }, [nodes, hiddenNodeIds]);

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
        const columnType = getColumnType(field);

        // Get the raw value
        let value =
          field === "task"
            ? node.data.label
            : field === "type"
              ? node.data.shape || ""
              : node.data[field];

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

      if (newTaskName.trim() === "") {
        alert("Please enter a task name");
        return;
      }

      // Get current user from auth
      const currentUser = user?.name || "Unknown User";
      const currentTime = new Date().toISOString();

      // Create initial data object
      const initialData: Record<string, any> = {
        label: newTaskName,
        shape: newShapeType,
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
      setNewTaskName("");
      setNewShapeType("rectangle");
      setSelectedParentId(null);
      setIsAddingRow(false);

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
        // Skip saving for Rollup columns as they are calculated automatically
        if (columnDef.type === "Rollup") {
          console.log(
            "Cannot edit rollup column, it's calculated automatically:",
            column
          );
          setEditingCell(null);
          setEditedValue(null);
          setValidationError(null);
          return;
        }

        // Get current user from auth
        const currentUser = user?.name || "Unknown User";
        const currentTime = new Date().toISOString();

        // For relation columns, we don't need to validate as they are arrays of objects
        if (columnDef.type === "Relation") {
          console.log("Saving relation data:", { nodeId, column, value });

          // Ensure value is an array
          const relationValue = Array.isArray(value) ? value : [];

          const updatedNodes = nodes.map((node) => {
            if (node.id === nodeId) {
              // Create new data object with relation value
              const newData = { ...node.data, [column]: relationValue };

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
                console.log(
                  "Found rollup columns that depend on this relation:",
                  relatedRollupColumns
                );
                // Force refresh of rollup data by simulating a change in nodes or columns
                setTimeout(() => {
                  // This will trigger the useEffect that updates rollup data
                  const nodesCopy = [...nodes];
                  onNodesChange(nodesCopy);
                }, 100);
              }

              console.log("Updated node data:", newData);
              return { ...node, data: newData };
            }
            return node;
          });

          console.log("Calling onNodesChange with updated nodes");
          onNodesChange(updatedNodes);
          setEditingCell(null);
          setEditedValue(null);
          setValidationError(null);
          return;
        }

        // For other column types, validate the data
        const { isValid, errorMessage } = validateField(columnDef?.type, value);
        if (isValid) {
          const updatedNodes = nodes.map((node) => {
            if (node.id === nodeId) {
              // Create new data object with the updated value
              const newData = { ...node.data, [column]: value };

              // Update system fields based on column types
              columns.forEach((col) => {
                if (col.type === "Last edited time") {
                  newData[col.title] = currentTime;
                } else if (col.type === "Last edited by") {
                  newData[col.title] = currentUser;
                }
              });

              if (column === "task") {
                newData.label = value;
              } else if (column === "type") {
                newData.shape = value;
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

      // Rebuild the full nodes array with the updated sibling order
      const updatedNodes = [...nodes];
      const siblingIndices = siblings.map((sibling) =>
        nodes.findIndex((n) => n.id === sibling.id)
      );

      // Replace old sibling nodes with the reordered ones
      updatedSiblings.forEach((sibling, index) => {
        updatedNodes[siblingIndices[index]] = sibling;
      });

      // Update the state to trigger a re-render with the new order
      onNodesChange(updatedNodes);
    };
    // Bulk deletion handler
    const handleDeleteSelected = () => {
      const updatedNodes = nodes.filter(
        (node) => !selectedNodes.includes(node.id)
      );
      // remove the parentNode with the selectnodes ids from other nodes as they are deleted
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
        setColumns(
          columns?.map((col) =>
            col.title === columnTitle ? { ...col, title: newTitle } : col
          )
        );
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

      const columnsData = canvas_data?.nodes?.map((node: Node) => {
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
            let value = node.data[col.title];

            // Handle special columns
            if (col.title === "task") {
              value = node.data.label;
            } else if (col.title === "type") {
              value = node.data.shape;
            } else if (col.title === "parent") {
              value = node.data.parent || "";
            } else if (col.title === "children") {
              value = node.data.children || "";
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
          let value = node.data[col.title];

          // Handle special columns
          if (col.title === "task") {
            value = node.data.label;
          } else if (col.title === "type") {
            value = node.data.shape;
          } else if (col.title === "parent") {
            value = node.data.parent || "";
          } else if (col.title === "children") {
            value = node.data.children || "";
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

    // Add this helper function before the return statement
    const isColumnSortable = (
      columnType: string | undefined,
      columnTitle: string
    ) => {
      // Special case for the type column which contains shape names
      if (columnTitle === "type") {
        return true;
      }
      const unsortableTypes = [
        "Select",
        "Multiselect",
        "Relation",
        "Rollup",
        "Checkbox",
      ];
      return !unsortableTypes.includes(columnType || "");
    };

    // Expose exportToCSV and exportToExcel methods to parent components
    useImperativeHandle(ref, () => ({
      exportToCSV,
      exportToExcel,
    }));

    return (
      <>
        <div className="w-full bg-white">
          <div className="flex items-center justify-between px-8 py-2 border-b border-gray-100">
            <div className="text-base text-gray-700 font-medium"></div>
            <div className="flex items-center gap-2 min-h-10">
              {(selectedNodes.length > 0 || sortField) && (
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
                          className={`sticky left-0 z-20 bg-white border-r border-gray-200 w-16 text-center ${
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
                                    // onClick={() => setIsHiddenColumnsMenuOpen(true)}
                                  >
                                    <ChevronDown className="h-4 w-4 mr-2" />
                                    Show/Hide Columns
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      Manage Hidden Columns
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    {columns.map((column) => (
                                      <div
                                        key={column.title}
                                        className="flex items-center justify-between"
                                      >
                                        <span>{column.title}</span>
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
                                    <DialogTrigger asChild>Close</DialogTrigger>
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
              {isAddingRow ? (
                <div className="flex items-center gap-4">
                  <Input
                    placeholder="Enter task name"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    className="flex-grow focus-visible:ring-0"
                  />
                  <Select value={newShapeType} onValueChange={setNewShapeType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select shape type" />
                    </SelectTrigger>
                    <SelectContent>
                      {shapeOptions.map((shape) => (
                        <SelectItem key={shape} value={shape || "default"}>
                          {shape || "Default"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={addNewRow}>Add</Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsAddingRow(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={addNewRow}
                  disabled={readOnly}
                  className="flex items-center text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Row
                </Button>
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
        </div>
      </>
    );
  }
);

export default TableView;
