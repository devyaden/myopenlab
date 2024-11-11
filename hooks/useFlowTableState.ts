import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Node } from "reactflow";

import { COLUMN_TYPES } from "@/components/canvas/FlowTable/columns";
import {
  EditingNodeData,
  NewNodeData,
  NodeData,
} from "@/components/canvas/FlowTable/types";
import { format } from "path";

interface SubNode extends Node {
  parentId: string;
}

interface SubflowState {
  expandedRows: Set<string>;
  subNodes: { [key: string]: SubNode[] };
}

export const useTableState = (
  nodes: Node<NodeData>[],
  canvasId: number,
  onUpdateNode: (nodeId: string, newData: Partial<NodeData>) => void,
  onDeleteNode: (nodeId: string) => void,
  onAddNode: (nodeData: Partial<Node<NodeData>>) => void
) => {
  const [newNodeData, setNewNodeData] = useState<NewNodeData>({
    label: "",
    shape: "rectangle",
  });

  const [formattedData, setFormattedData] = useState<any>([]);

  const [customColumns, setCustomColumns] = useState<any>([]);

  const [newColumn, setNewColumn] = useState({
    name: "",
    type: "",
    relatedColumnId: null,
    relatedCanvasId: null,
  });

  const [subflowState, setSubflowState] = useState<SubflowState>({
    expandedRows: new Set(),
    subNodes: {},
  });

  const [newSubNode, setNewSubNode] = useState({
    parentId: "",
    label: "",
    shape: "rectangle",
  });

  const supabase = createClient();
  const { toast } = useToast();

  const handleAddNode = (): void => {
    if (!newNodeData.label) return;

    let type = "custom";
    let style = {};

    if (newNodeData.shape === "group") {
      type = "group";
      style = {
        width: 850,
        height: 450,
      };
    }

    onAddNode({
      type,
      data: {
        ...newNodeData,
        label: newNodeData.label,
      },
      position: { x: 0, y: 0 },
      style,
    });

    setNewNodeData({
      label: "",
      shape: "rectangle",
    });
  };

  const handleAddColumn = async () => {
    if (!newColumn.name || !newColumn.type) return;

    const column = {
      id: Date.now(), // Temporary ID until saved to DB
      name: newColumn.name,
      type: newColumn.type,
      // @ts-ignore
      validation: COLUMN_TYPES[newColumn.type.toUpperCase()].validation,
      order: customColumns.length,
      relatedColumnId: newColumn.relatedColumnId,
      relatedCanvasId: newColumn.relatedCanvasId,
    };

    try {
      // Add to database
      const { data, error } = await supabase
        .from("custom_columns")
        .insert([
          {
            name: column.name,
            type: column.type,
            validation: column.validation,
            order: column.order,
            canvas_id: canvasId,
            related_canvas_id: column.relatedCanvasId,
            related_column_id: column.relatedColumnId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      // @ts-ignore
      // setCustomColumns([...customColumns, data]);

      fetchCustomColumns();
      setNewColumn({
        name: "",
        type: "",
        relatedCanvasId: null,
        relatedColumnId: null,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add column",
        variant: "destructive",
      });
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      const { error } = await supabase
        .from("custom_columns")
        .delete()
        .eq("id", columnId);

      if (error) throw error;

      setCustomColumns(customColumns.filter((col: any) => col.id !== columnId));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete column",
        variant: "destructive",
      });
    }
  };

  const handleCustomValueChange = async (
    nodeId: string,
    columnId: number,
    value: string
  ) => {
    try {
      const { data, error } = await supabase
        .from("node_custom_data")
        .upsert(
          [
            {
              node_id: nodeId,
              column_id: columnId,
              canvas_id: canvasId,
              value: value,
            },
          ],
          {
            onConflict: "node_id, column_id",
          }
        )
        .select()
        .single();

      if (error) throw error;

      // Update local state if needed
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update value",
        variant: "destructive",
      });
    }
  };

  const toggleRowExpansion = (nodeId: string) => {
    const newExpandedRows = new Set(subflowState.expandedRows);
    if (newExpandedRows.has(nodeId)) {
      newExpandedRows.delete(nodeId);
    } else {
      newExpandedRows.add(nodeId);
    }
    setSubflowState((prev) => ({
      ...prev,
      expandedRows: newExpandedRows,
    }));
  };

  // Add subnode to a parent node
  const handleAddSubNode = async (parentId: string) => {
    console.log("🚀 ~ handleAddSubNode ~ parentId:", parentId);
    if (!newSubNode.label) return;

    const subNode: SubNode = {
      id: `subnode-${Date.now()}`,
      type: "custom",
      parentId,
      position: { x: 0, y: 0 },
      extent: "parent",
      data: {
        label: newSubNode.label,
        shape: newSubNode.shape,
        isSubNode: true,
        parentId,
      },
    };

    onAddNode(subNode);

    setNewSubNode({
      parentId: "",
      label: "",
      shape: "rectangle",
    });

    // Update local formattedData state
    // setFormattedData((prev: any) => {
    //   const parentIndex = prev.findIndex((node: any) => node.id === parentId);
    //   const parent = prev[parentIndex];
    //   parent.children.push(subNode);
    //   return [...prev];
    // });

    toast({
      title: "Success",
      description: "Subnode added successfully",
    });
  };

  // Delete subnode
  const handleDeleteSubNode = async (nodeId: string, parentId: string) => {
    try {
      // Update local state
      // setSubflowState((prev) => ({
      //   ...prev,
      //   subNodes: {
      //     ...prev.subNodes,
      //     [parentId]: prev.subNodes[parentId].filter(
      //       (node) => node.id !== nodeId
      //     ),
      //   },
      // }));

      // Remove from flow
      onDeleteNode(nodeId);

      // formatData();
      //update local formattedData state
      setFormattedData((prev: any) => {
        const parentIndex = prev.findIndex((node: any) => node.id === parentId);
        const parent = prev[parentIndex];
        parent.children = parent.children.filter(
          (node: any) => node.id !== nodeId
        );
        return [...prev];
      });

      toast({
        title: "Success",
        description: "Subnode deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete subnode",
        variant: "destructive",
      });
    }
  };

  const formatData = () => {
    const parentNodes = nodes.filter((node) => !node.parentId);

    const formattedData = parentNodes.map((node) => {
      const children = nodes.filter((n) => n.parentId === node.id);
      return {
        ...node,
        children,
      };
    });

    setFormattedData(formattedData);
  };

  const fetchCustomColumns = async () => {
    const { data: columnsData, error } = await supabase
      .from("custom_columns")
      .select(
        `
            *,
            node_custom_data (value, node_id),
            canvas:canvas!custom_columns_canvas_id_fkey (*),
            relatedCanvas:canvas!custom_columns_related_canvas_id_fkey (*)
          `
      )
      .eq("canvas_id", canvasId)
      .order("order");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch columns",
        variant: "destructive",
      });
      return;
    }

    const relatedColumnIds = columnsData
      .map((column) => column.related_column_id)
      .filter((id) => id != null);

    if (relatedColumnIds.length > 0) {
      const { data: relatedColumnsData, error: relatedError } = await supabase
        .from("custom_columns")
        .select(
          `
            *,
            node_custom_data (value, node_id)
          `
        )
        .in("id", relatedColumnIds);

      if (relatedError) {
        toast({
          title: "Error",
          description: "Failed to fetch related columns",
          variant: "destructive",
        });
        return;
      }

      const columnsWithRelatedData = columnsData.map((column) => ({
        ...column,
        related_column: relatedColumnsData.find(
          (relatedColumn) => relatedColumn.id === column.related_column_id
        ),
      }));

      const formattedData = columnsWithRelatedData?.map((column) => {
        let node_custom_data = column.node_custom_data;

        if (column.related_column?.node_custom_data) {
          node_custom_data = column.related_column.node_custom_data;
        }

        return {
          ...column,
          node_custom_data,
        };
      });

      setCustomColumns(formattedData);
    } else {
      setCustomColumns(columnsData);
    }
  };

  useEffect(() => {
    fetchCustomColumns();
  }, [canvasId]);

  useEffect(() => {
    console.log("🚀 ~ nodes.length:", nodes.length);
    formatData();
  }, [nodes.length]);

  return {
    newNodeData,
    formattedData,

    customColumns,
    newColumn,
    subflowState,
    newSubNode,
    setNewNodeData,
    handleAddNode,
    handleAddColumn,
    handleDeleteColumn,
    toggleRowExpansion,
    handleDeleteSubNode,
    handleAddSubNode,
    setNewColumn,

    setNewSubNode,
    handleCustomValueChange,
  };
};
