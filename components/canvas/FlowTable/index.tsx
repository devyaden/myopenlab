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
import { Edit2, PlusCircle, Save, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { Node } from "reactflow";
import {
  EditingNodeData,
  FlowTableEditorProps,
  NewEdgeData,
  NewNodeData,
  NodeData,
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
}) => {
  const [newNodeData, setNewNodeData] = useState<NewNodeData>({
    label: "",
    shape: "rectangle",
  });
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<EditingNodeData | null>(null);
  const [showEdges, setShowEdges] = useState<boolean>(false);
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
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Shape</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nodes.map((node) => (
                <TableRow key={node.id}>
                  <TableCell>{node.id}</TableCell>
                  <TableCell>
                    {editingNodeId === node.id ? (
                      <Input
                        value={editingNode?.label}
                        onChange={(e) =>
                          setEditingNode((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  label: e.target.value,
                                }
                              : null
                          )
                        }
                      />
                    ) : (
                      node.data.label
                    )}
                  </TableCell>
                  <TableCell>
                    {editingNodeId === node.id ? (
                      <select
                        value={editingNode?.shape}
                        onChange={(e) =>
                          setEditingNode((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  shape: e.target.value as NodeData["shape"],
                                }
                              : null
                          )
                        }
                        className="border rounded px-2"
                      >
                        <option value="rectangle">Rectangle</option>
                        <option value="circle">Circle</option>
                        <option value="diamond">Diamond</option>
                      </select>
                    ) : (
                      node.data.shape
                    )}
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
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
                Add Connection
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {edges.map((edge) => (
                <TableRow key={edge.id}>
                  <TableCell>
                    {nodes.find((n) => n.id === edge.source)?.data.label}
                  </TableCell>
                  <TableCell>
                    {nodes.find((n) => n.id === edge.target)?.data.label}
                  </TableCell>
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
