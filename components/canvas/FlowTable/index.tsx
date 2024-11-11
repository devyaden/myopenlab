import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTableState } from "@/hooks/useFlowTableState";
import {
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import { FC, useState } from "react";
import FlowTableHeader from "./flowTableHead";
import { FlowTableEditorProps, NodeData } from "./types";

const FlowTable: FC<FlowTableEditorProps> = ({
  nodes,
  onUpdateNode,
  onDeleteNode,
  onAddNode,
  canvasId,
  folderId,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editableValues, setEditableValues] = useState<{ [key: string]: any }>(
    {}
  );

  const {
    newNodeData,
    formattedData,
    customColumns,
    newColumn,
    newSubNode,
    setNewNodeData,
    handleAddNode,
    handleAddColumn,
    handleDeleteColumn,
    handleDeleteSubNode,
    handleAddSubNode,
    setNewColumn,
    setNewSubNode,
    handleCustomValueChange,
  } = useTableState(nodes, canvasId, onUpdateNode, onDeleteNode, onAddNode);

  const saveChanges = async (nodeId: string) => {
    const updatedData = editableValues[nodeId];
    if (updatedData) {
      onUpdateNode(nodeId, updatedData);
      setEditableValues((prev) => {
        const newValues = { ...prev };
        delete newValues[nodeId];
        return newValues;
      });
    }
  };

  const toggleSubnodes = (nodeId: string) => {
    setSelectedNodeId(selectedNodeId === nodeId ? null : nodeId);
  };

  const renderSubnodes = (node: any) => {
    return (
      <div className="flex-1 flex flex-col min-h-0 space-y-4 ">
        <div className="bg-gray-50 p-4 rounded-lg flex-none">
          <h3 className="text-sm font-medium mb-2">إضافة عقدة فرعية جديدة</h3>
          <div className="flex gap-2 items-center">
            <Input
              placeholder="اسم العقدة الفرعية"
              value={newSubNode.label}
              onChange={(e) =>
                setNewSubNode((prev: any) => ({
                  ...prev,
                  label: e.target.value,
                  parentId: node?.id,
                }))
              }
              className="w-48"
            />
            <select
              value={newSubNode.shape}
              onChange={(e) =>
                setNewSubNode((prev: any) => ({
                  ...prev,
                  shape: e.target.value,
                }))
              }
              className="border rounded px-2 py-1"
            >
              <option value="rectangle">مستطيل</option>
              <option value="circle">دائرة</option>
              <option value="diamond">معين</option>
              <option value="group">مجموعة</option>
            </select>
            <Button
              size="sm"
              onClick={() => {
                handleAddSubNode(node?.id);
                // onClose();
              }}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              إضافة عقدة فرعية
            </Button>
          </div>
        </div>

        <div className="border rounded-lg flex-1 flex flex-col min-h-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white">
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الشكل</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {node?.children?.map((subNode: any) => (
                  <TableRow key={subNode.id} className="hover:bg-gray-50">
                    <TableCell className="max-w-0">
                      <div className="truncate">{subNode.data.label}</div>
                    </TableCell>
                    <TableCell>{subNode.data.shape}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          handleDeleteSubNode(subNode.id, subNode.id);
                          // onClose();
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  };

  const renderTableBody = () => (
    <TableBody>
      {formattedData.map((node: any, nodeIndex: number) => (
        <>
          <TableRow key={node.id} className="group hover:bg-gray-50">
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSubnodes(node.id)}
              >
                {selectedNodeId === node.id ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </Button>
            </TableCell>
            <TableCell>{node.id}</TableCell>
            <TableCell>
              <Input
                value={editableValues[node.id]?.label || node.data.label}
                onChange={(e) => {
                  setEditableValues((prev) => ({
                    ...prev,
                    [node.id]: {
                      ...prev[node.id],
                      label: e.target.value,
                    },
                  }));
                }}
              />
            </TableCell>
            <TableCell>
              <Input
                value={editableValues[node.id]?.shape || node.data.shape}
                onChange={(e) => {
                  setEditableValues((prev) => ({
                    ...prev,
                    [node.id]: {
                      ...prev[node.id],
                      shape: e.target.value,
                    },
                  }));
                }}
              />
            </TableCell>
            <TableCell>
              <div className="invisible group-hover:visible flex gap-2">
                <Button size="sm" onClick={() => saveChanges(node.id)}>
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDeleteNode(node.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
            {customColumns.map((column: any) => (
              <TableCell key={column.id}>
                <input
                  type={column.type === "number" ? "number" : "text"}
                  placeholder={`Enter ${column.name}`}
                  defaultValue={
                    column.node_custom_data?.[nodeIndex]?.value ?? ""
                  }
                  onChange={(e) =>
                    handleCustomValueChange(node.id, column.id, e.target.value)
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </TableCell>
            ))}
          </TableRow>
          {selectedNodeId === node.id && renderSubnodes(node || [])}
        </>
      ))}
    </TableBody>
  );

  console.log("🚀 ~ formattedData:", formattedData);

  return (
    <Card className="p-4 space-y-2">
      <CardContent>
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
              <option value="group">Group</option>
            </select>
            <Button onClick={handleAddNode} size="sm">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
        <div className="relative">
          <div className="overflow-y-auto max-h-[450px] border rounded-lg">
            <Table>
              <FlowTableHeader
                customColumns={customColumns}
                handleDeleteColumn={handleDeleteColumn}
                setNewColumn={setNewColumn}
                newColumn={newColumn}
                handleAddColumn={handleAddColumn}
                folderId={folderId}
                canvasId={canvasId}
              />
              {renderTableBody()}
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlowTable;
