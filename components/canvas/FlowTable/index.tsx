import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { Edit2, PlusCircle, Save, Trash2, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Node } from "reactflow";
import NodeRelationModal from "../NodeRelationModal";
import { COLUMN_TYPES } from "./columns";
import FlowTableHeader from "./flowTableHead";
import {
  EditingNodeData,
  FlowTableEditorProps,
  NewEdgeData,
  NewNodeData,
  NodeData,
  NodeRelation,
} from "./types";

const FlowTable: React.FC<FlowTableEditorProps> = ({
  nodes,
  edges,
  onUpdateNode,
  onDeleteNode,
  onAddNode,
  onUpdateEdge,
  onDeleteEdge,
  onAddEdge,
  canvasId,
  folderId,
}) => {
  const [newNodeData, setNewNodeData] = useState<NewNodeData>({
    label: "",
    shape: "rectangle",
  });
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<EditingNodeData | null>(null);
  const [showEdges, setShowEdges] = useState<boolean>(false);
  const [relations, setRelations] = useState<NodeRelation[]>([]);

  const [customColumns, setCustomColumns] = useState<any>([]);
  console.log("🚀 ~ customColumns:", customColumns);
  const [newColumn, setNewColumn] = useState({
    name: "",
    type: "",
  });

  const supabase = createClient();
  const { toast } = useToast();

  const [newEdge, setNewEdge] = useState<NewEdgeData>({
    source: "",
    target: "",
  });

  const handleAddNode = (): void => {
    if (!newNodeData.label) return;

    onAddNode({
      type: "custom",
      data: {
        ...newNodeData,
        label: newNodeData.label,
      },
      position: { x: 0, y: 0 },
    });

    setNewNodeData({
      label: "",
      shape: "rectangle",
    });
  };

  const handleEditNode = (node: Node<NodeData>): void => {
    setEditingNodeId(node.id);
    setEditingNode({
      ...node.data,
      id: node.id,
    });
  };

  const handleSaveEdit = (): void => {
    if (!editingNode) return;

    onUpdateNode(editingNode.id, {
      label: editingNode.label,
      shape: editingNode.shape,
    });

    setEditingNodeId(null);
    setEditingNode(null);
  };

  const handleAddEdge = (): void => {
    if (!newEdge.source || !newEdge.target) return;

    onAddEdge({
      source: newEdge.source,
      target: newEdge.target,
    });

    setNewEdge({
      source: "",
      target: "",
    });
  };

  const fetchRelations = async () => {
    const { data, error } = await supabase
      .from("node_connections")
      .select(
        `
        *,
        target_canvas:canvas!node_connections_target_canvas_id_fkey (
          name,
          flow_data
        )
      `
      )
      .eq("source_canvas_id", canvasId);

    if (error) {
      console.error("Error fetching relations:", error);
      return;
    }

    setRelations(data || []);
  };

  const handleDeleteRelation = async (relationId: number) => {
    const { error } = await supabase
      .from("node_connections")
      .delete()
      .eq("id", relationId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete relation",
        variant: "destructive",
      });
      return;
    }

    fetchRelations();
  };

  const handleNewRelation = async (data: any) => {
    const { error } = await supabase.from("node_connections").insert([data]);
    if (error) {
      console.error("Error creating relation:", error);
      return;
    }

    fetchRelations();
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
          },
        ])
        .select()
        .single();

      if (error) throw error;
      // @ts-ignore
      setCustomColumns([...customColumns, data]);
      setNewColumn({ name: "", type: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add column",
        variant: "destructive",
      });
    }
  };

  // Function to delete a custom column
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

  useEffect(() => {
    const fetchCustomColumns = async () => {
      const { data, error } = await supabase
        .from("custom_columns")
        .select(
          `
    *,
    node_custom_data (
      value
    )
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

      setCustomColumns(data || []);
    };

    fetchCustomColumns();
  }, [canvasId]);

  useEffect(() => {
    fetchRelations();
  }, []);

  // Modified table body to include custom columns
  const renderTableBody = () => (
    <TableBody>
      {nodes.map((node, nodeIndex) => (
        <TableRow key={node.id}>
          <TableCell>{node.id}</TableCell>
          <TableCell>
            {editingNodeId === node.id ? (
              <Input
                value={editingNode?.label}
                onChange={(e) =>
                  setEditingNode((prev) =>
                    prev ? { ...prev, label: e.target.value } : null
                  )
                }
              />
            ) : (
              node.data.label
            )}
          </TableCell>
          <TableCell>{node.data.shape}</TableCell>
          <TableCell>
            {relations
              .filter((relation) => relation.source_node_id === node.id)
              .map((relation) => (
                <div key={relation.id} className="flex items-center">
                  <span>
                    {relation.target_canvas?.name}--{">"}
                    {relation.target_node_id}{" "}
                  </span>
                  <XCircle
                    className="w-4 h-4 text-red-500 ml-2 cursor-pointer"
                    onClick={() => handleDeleteRelation(relation.id)}
                  />
                </div>
              ))}
          </TableCell>
          <TableCell>
            <div className="flex gap-2">
              {editingNodeId === node.id ? (
                <Button size="sm" onClick={handleSaveEdit}>
                  <Save className="w-4 h-4" />
                </Button>
              ) : (
                <Button size="sm" onClick={() => handleEditNode(node)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDeleteNode(node.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>

              <NodeRelationModal
                nodeId={node.id}
                canvasId={canvasId}
                folderId={folderId}
                onCreateRelation={handleNewRelation}
              />
            </div>
          </TableCell>

          {customColumns.map((column: any) => (
            <TableCell key={column.id}>
              <input
                type={column.type === "number" ? "number" : "text"}
                placeholder={`Enter ${column.name}`}
                defaultValue={column.node_custom_data?.[nodeIndex]?.value ?? ""}
                onChange={(e) =>
                  handleCustomValueChange(node.id, column.id, e.target.value)
                }
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-4 mb-4">
        <Button variant="outline" onClick={() => setShowEdges(!showEdges)}>
          {showEdges ? "Show Nodes" : "Show Connections"}
        </Button>
      </div>

      {!showEdges ? (
        <>
          <div className="bg-white p-4 rounded-md shadow">
            <h3 className="font-semibold mb-2">Add New Node</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Node Label"
                value={newNodeData.label}
                onChange={(e) =>
                  setNewNodeData({
                    ...newNodeData,
                    label: e.target.value,
                  })
                }
                className="flex-1"
              />
              <select
                value={newNodeData.shape}
                onChange={(e) =>
                  setNewNodeData({
                    ...newNodeData,
                    shape: e.target.value as NodeData["shape"],
                  })
                }
                className="border rounded px-2"
              >
                <option value="rectangle">Rectangle</option>
                <option value="circle">Circle</option>
                <option value="diamond">Diamond</option>
              </select>
              <Button onClick={handleAddNode}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          <Table>
            <FlowTableHeader
              customColumns={customColumns}
              handleDeleteColumn={handleDeleteColumn}
              setNewColumn={setNewColumn}
              newColumn={newColumn}
              handleAddColumn={handleAddColumn}
            />
            {renderTableBody()}
          </Table>
        </>
      ) : (
        <>
          <div className="bg-white p-4 rounded-md shadow">
            <h3 className="font-semibold mb-2">Add New Connection</h3>
            <div className="flex gap-2">
              <select
                value={newEdge.source}
                onChange={(e) =>
                  setNewEdge({
                    ...newEdge,
                    source: e.target.value,
                  })
                }
                className="border rounded px-2"
              >
                <option value="">Select Source Node</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data.label}
                  </option>
                ))}
              </select>
              <select
                value={newEdge.target}
                onChange={(e) =>
                  setNewEdge({
                    ...newEdge,
                    target: e.target.value,
                  })
                }
                className="border rounded px-2"
              >
                <option value="">Select Target Node</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data.label}
                  </option>
                ))}
              </select>
              <Button onClick={handleAddEdge}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {edges.map((edge) => (
                <TableRow key={edge.id}>
                  <TableCell>{edge.source}</TableCell>
                  <TableCell>{edge.target}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDeleteEdge(edge.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
};

export default FlowTable;
