import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Edit2, Save, Trash2, XCircle } from "lucide-react";
import NodeRelationModal from "../NodeRelationModal";
import { NodeRelation } from "./types";

interface FlowTableBodyProps {
  nodes: any[];
  relations: any[];
  editingNodeId: string;
  editingNode: any;
  setEditingNode: any;
  handleSaveEdit: () => void;
  handleEditNode: (node: any) => void;
  onDeleteNode: (id: string) => void;
  handleDeleteRelation: (id: string) => void;
  handleNewRelation: (relation: Partial<NodeRelation>) => void;
  canvasId: number;
  folderId: number;
  customColumns: any[];
  handleCustomValueChange: (
    nodeId: string,
    columnId: string,
    value: string
  ) => void;
}

const FlowTableBody = ({
  nodes,
  relations,
  editingNodeId,
  editingNode,
  setEditingNode,
  handleSaveEdit,
  handleEditNode,
  onDeleteNode,
  handleDeleteRelation,
  handleNewRelation,
  canvasId,
  folderId,
  customColumns,
  handleCustomValueChange,
}: FlowTableBodyProps) => {
  return (
    <TableBody>
      {nodes.map((node) => (
        <TableRow key={node.id}>
          <TableCell>{node.id}</TableCell>
          <TableCell>
            {editingNodeId === node.id ? (
              <Input
                value={editingNode?.label}
                onChange={(e) =>
                  setEditingNode((prev: any) =>
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

          {customColumns.map((column) => (
            <TableCell key={column.id}>
              <input
                type={column.type === "number" ? "number" : "text"}
                placeholder={`Enter ${column.name}`}
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
};

export default FlowTableBody;
