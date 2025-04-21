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
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  MoreVertical,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
} from "./table.types";
import { validationSchemas } from "./validations";
import { CANVAS_TYPE } from "@/types/store";

const TableView: React.FC<TableViewProps> = ({
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
}) => {
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
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<HierarchyNode | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState<string | null>(
    null
  );
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [deleteColumnDialog, setDeleteColumnDialog] = useState<string | null>(
    null
  );
  const [columnWrapping, setColumnWrapping] = useState<Set<string>>(new Set());
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
  if (typeof hiddenColumns === "object" && !Object.keys(hiddenColumns).length) {
    hiddenColumns = [];
  }

  // Cache for rollup and relation data
  const [rollupCache, setRollupCache] = useState<Record<string, any>>({});
  const [relationCache, setRelationCache] = useState<Record<string, any>>({});

  // Update rollup cache when relevant data changes
  useEffect(() => {
    console.log("Updating rollup cache for columns:", columns);

    const newRollupCache: Record<string, any> = {};
    const newRelationCache: Record<string, any> = {};

    // Process rollup columns
    const rollupColumns = columns?.filter((col) => col?.type === "Rollup");
    console.log("Found rollup columns:", rollupColumns);

    if (rollupColumns?.length) {
      // Create a map of relation columns to easily lookup by related canvas ID
      const relationColumns = columns?.filter(
        (col) => col?.type === "Relation" && col.related_canvas_id
      );

      const relationColumnMap = new Map(
        relationColumns.map((col) => [col.related_canvas_id, col])
      );

      console.log("Available relation columns:", relationColumns);
      console.log(
        "Relation column map:",
        Object.fromEntries(relationColumnMap)
      );

      nodes.forEach((node) => {
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

        // Then process rollup columns
        rollupColumns.forEach((column) => {
          console.log(
            `Processing rollup column ${column.title} for node ${node.id}`
          );

          // For rollup columns, we need to know:
          // 1. Which canvas the rollup is related to (via rollup_relation)
          // 2. Which property on the related canvas to use (via rollup_column_id)

          const relatedCanvasId = column.rollup_relation;
          if (!relatedCanvasId) {
            console.warn(
              `No related canvas ID for rollup column ${column.title}`
            );
            return;
          }

          // Find related canvas data
          const relatedCanvas = column?.rollup_column?.canvas;
          if (!relatedCanvas?.canvas_data?.[0]?.nodes) {
            console.warn(
              `No canvas data found for rollup related canvas ${relatedCanvasId}`
            );
            return;
          }

          const relatedCanvasNodes = relatedCanvas.canvas_data[0].nodes;
          console.log(`Related canvas has ${relatedCanvasNodes.length} nodes`);

          // Find the property to rollup
          const rollupColumnTargetTitle = column?.rollup_column?.title;
          if (!rollupColumnTargetTitle) {
            console.warn(
              `No target column specified for rollup ${column.title}`
            );
            return;
          }

          console.log("Rollup target property:", rollupColumnTargetTitle);

          // Find the relation column that connects to the canvas used by this rollup
          const relationColumn = relationColumnMap.get(relatedCanvasId);
          if (!relationColumn) {
            console.warn(
              `No relation column found for canvas ID ${relatedCanvasId}`
            );
            return;
          }

          console.log(
            "Using relation column for rollup:",
            relationColumn.title
          );

          const relationColumnTitle = relationColumn.title;

          // Get relation data from the node
          const relationData = node.data[relationColumnTitle];
          console.log(`Relation data for node ${node.id}:`, relationData);

          // Skip if no relation data
          if (
            !relationData ||
            !Array.isArray(relationData) ||
            relationData.length === 0
          ) {
            console.log(`No relation data for node ${node.id}`);
            newRollupCache[`${node.id}-${column.title}`] = [];
            return;
          }

          // Extract IDs from relation data
          const relationIds = relationData.map((item) => item.id);
          console.log("Relation IDs:", relationIds);

          // Create a set for faster lookups
          const relationIdSet = new Set(relationIds);

          // Filter related nodes that match the relation IDs
          const matchingRelatedNodes = relatedCanvasNodes.filter(
            (relNode: Node) => relationIdSet.has(relNode.id)
          );

          console.log(
            `Found ${matchingRelatedNodes.length} matching related nodes`
          );

          // Create rollup data with label and value
          const rollupData = matchingRelatedNodes.map((relNode: Node) => {
            const value = relNode.data[rollupColumnTargetTitle];
            return {
              label: relNode.data.label || relNode.id,
              value: value,
              sourceId: relNode.id,
            };
          });

          console.log("Generated rollup data:", rollupData);

          // Store in cache
          newRollupCache[`${node.id}-${column.title}`] = rollupData;
        });
      });
    }

    // Set both caches with the new data
    setRollupCache(newRollupCache);
    setRelationCache(newRelationCache);
  }, [nodes, columns]);

  const updateTableSettings = (newSettings: any) => {
    // @ts-ignore
    updateCanvasSettings({ table_settings: newSettings });
  };

  const getAllDescendantIds = (nodeId: string, allNodes: Node[]): string[] => {
    const descendants: string[] = [];
    const collect = (id: string) => {
      allNodes.forEach((node) => {
        if (node.parentNode === id) {
          descendants.push(node.id);
          collect(node.id);
        }
      });
    };
    collect(nodeId);
    return descendants;
  };

  // column resizing code

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

  // Modified insertRollupDataIntoNodes to use cache
  const insertRollupDataIntoNodes = (nodes: Node[]): Node[] => {
    return nodes.map((node) => {
      const newNode = { ...node };
      columns?.forEach((column) => {
        // Handle rollup data from cache
        if (column.type === "Rollup") {
          const rollupData = rollupCache[`${node.id}-${column.title}`];
          if (rollupData) {
            console.log(
              `Found rollup data for node ${node.id}, column ${column.title}:`,
              rollupData
            );
            newNode.data[column.title] = rollupData;
          } else {
            console.log(
              `No rollup data found for node ${node.id}, column ${column.title}`
            );
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
              console.warn(
                `Relation data not in array format for node ${node.id}, column ${column.title}`
              );
              newNode.data[column.title] = [];
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
    let updatedNodes = insertRollupDataIntoNodes(visibleNodes); // Changed from nodes to visibleNodes
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
              aValue = a.data.shape || a?.type || "";
              bValue = b.data.shape || b?.type || "";
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
  }, [visibleNodes, sortField, sortDirection, columns, edges]);
  // For bulk deletion: Get all visible nodes for "Select All" functionality
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
    if (newTaskName.trim() === "") {
      alert("Please enter a task name");
      return;
    }

    const newNode = {
      id: `node-${Date.now()}`,
      type: "genericNode",
      position: { x: 0, y: 0 },
      data: {
        label: newTaskName,
        shape: newShapeType,
      },
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

      // For relation columns, we don't need to validate as they are arrays of objects
      if (columnDef.type === "Relation") {
        console.log("Saving relation data:", { nodeId, column, value });

        // Ensure value is an array
        const relationValue = Array.isArray(value) ? value : [];

        const updatedNodes = nodes.map((node) => {
          if (node.id === nodeId) {
            // Update the node data with the new relation value
            const newData = { ...node.data, [column]: relationValue };
            // Also update the relationCache to ensure consistent rendering
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
            const newData = { ...node.data, [column]: value };
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

  const shapeOptions = [
    "rectangle",
    "rounded",
    "circle",
    "diamond",
    "hexagon",
    "triangle",
    "useCase",
    "actor",
    "class",
    "interface",
  ];

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
          setEditingCell={setEditingCell}
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

  return (
    <>
      <div className="w-full bg-white">
        <div className="flex items-center justify-between px-8 py-2 border-b border-gray-100">
          <div className="text-base text-gray-700 font-medium"></div>
          <div className="flex items-center gap-2 min-h-10">
            {selectedNodes.length > 0 && (
              <>
                <Button
                  variant="outline"
                  className="text-gray-500 font-medium text-sm hover:bg-gray-50 ml-2 rounded-md"
                  onClick={() => setDeleteSelectedDialogOpen(true)}
                  disabled={selectedNodes.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>

                <Button
                  variant="outline"
                  className="text-gray-500 font-medium text-sm hover:bg-gray-50 ml-2 rounded-md"
                  onClick={handleDuplicateSelected}
                  disabled={selectedNodes.length === 0}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
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
                        selectedNodes.length > 0 ? "bg-blue-50" : "bg-gray-50"
                      }`}
                    >
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
                              selectedNodes.length < visibleNodeIds.length;
                          }
                        }}
                        checked={selectedNodes.length === visibleNodeIds.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedNodes(visibleNodeIds);
                          } else {
                            setSelectedNodes([]);
                          }
                        }}
                      />
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
                            className={`border-r border-gray-200 text-center ${
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
                              onMouseDown={() => startResizing(column.title)}
                            />

                            <DropdownMenu>
                              <DropdownMenuTrigger
                                asChild
                                disabled={editingColumnTitle === column.title}
                              >
                                <div
                                  className="flex items-center cursor-pointer"
                                  onClick={(e) => {
                                    if (editingColumnTitle === column.title) {
                                      e.preventDefault();
                                      e.stopPropagation();
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
                                      {/* {getColumnIcon(column.type)} */}
                                      <span>{column.title}</span>
                                      {/* {getSortIcon(column.title as SortField)} */}
                                    </div>
                                  )}
                                </div>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="start"
                                className="w-56"
                              >
                                <DropdownMenuItem
                                  onSelect={() =>
                                    startEditingColumnTitle(column.title)
                                  }
                                >
                                  Edit property
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSortField(column.title as SortField);
                                    setSortDirection("asc");
                                  }}
                                >
                                  Sort ascending
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSortField(column.title as SortField);
                                    setSortDirection("desc");
                                  }}
                                >
                                  Sort descending
                                </DropdownMenuItem>
                                {!hiddenColumns?.includes(column.title) && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      toggleColumnVisibility(column.title)
                                    }
                                  >
                                    Hide in view
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDuplicateColumn(column.title)
                                  }
                                >
                                  Duplicate property
                                </DropdownMenuItem>
                                {!isDefaultColumn(column.title) && (
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
                        <DropdownMenuTrigger>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={addNewColumn}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Column
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
                                <DialogTitle>Manage Hidden Columns</DialogTitle>
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
                                        !hiddenColumns?.includes(column.title)
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
                <TableBody>
                  {/* Wrap table body with DndContext and SortableContext for row reordering */}
                  <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={sortedHierarchy.map((node) => node.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {renderHierarchy(sortedHierarchy)}
                    </SortableContext>
                  </DndContext>
                </TableBody>
              </Table>
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
                variant="ghost"
                className="w-full justify-start text-gray-500 hover:text-gray-900"
                onClick={() => setIsAddingRow(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Row
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
                Are you sure you want to delete this column? This action cannot
                be undone.
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
                Are you sure you want to delete the selected nodes? This action
                cannot be undone. Children of deleted nodes will become
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
};

export default TableView;
