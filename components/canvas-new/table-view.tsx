import type React from "react";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, ChevronDown, MoreHorizontal, Plus } from "lucide-react";
import type { Node, Edge } from "reactflow";

interface TableViewProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
}

interface TableNode extends Node {
  children?: TableNode[];
  isExpanded?: boolean;
}

interface Column {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "date";
  accessor: (node: TableNode) => any;
}

const TableView: React.FC<TableViewProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
}) => {
  const [tableNodes, setTableNodes] = useState<TableNode[]>(
    convertToTableStructure(nodes)
  );
  const [columns, setColumns] = useState<Column[]>([
    {
      id: "name",
      name: "Name",
      type: "string",
      accessor: (node) => node.data.label,
    },
    { id: "type", name: "Type", type: "string", accessor: (node) => node.type },
    {
      id: "parent",
      name: "Parent",
      type: "string",
      accessor: (node) => node.parentNode || "None",
    },
  ]);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState<Column["type"]>("string");
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);

  useEffect(() => {
    setTableNodes(convertToTableStructure(nodes));
  }, [nodes]);

  function convertToTableStructure(nodes: Node[]): TableNode[] {
    const swimlanes = nodes.filter((node) => node.type === "swimlaneNode");
    const otherNodes = nodes.filter((node) => node.type !== "swimlaneNode");

    return [
      ...swimlanes.map((swimlane) => ({
        ...swimlane,
        children: nodes.filter((node) => node.parentNode === swimlane.id),
        isExpanded: true,
      })),
      ...otherNodes.filter((node) => !node.parentNode),
    ];
  }

  const toggleExpand = (nodeId: string) => {
    setTableNodes((prevNodes) => {
      return prevNodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, isExpanded: !node.isExpanded };
        }
        return node;
      });
    });
  };

  const renderTableRows = (nodes: TableNode[], depth = 0) => {
    return nodes.flatMap((node) => {
      const rows = [
        <TableRow key={node.id}>
          {columns.map((column) => (
            <TableCell
              key={column.id}
              style={{
                paddingLeft:
                  column.id === "name" ? `${depth * 20}px` : undefined,
              }}
            >
              {column.id === "name" &&
                node.children &&
                node.children.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mr-2 h-4 w-4 p-0"
                    onClick={() => toggleExpand(node.id)}
                  >
                    {node.isExpanded ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </Button>
                )}
              {renderCellContent(column, node)}
            </TableCell>
          ))}
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeNodeType(node.id)}>
                  Change Type
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => deleteNode(node.id)}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>,
      ];

      if (node.children && node.isExpanded) {
        rows.push(...renderTableRows(node.children, depth + 1));
      }

      return rows;
    });
  };

  const renderCellContent = (column: Column, node: TableNode) => {
    const value = column.accessor(node);
    switch (column.type) {
      case "string":
        return (
          <Input
            value={value}
            onChange={(e) =>
              updateNodeProperty(node.id, column.id, e.target.value)
            }
            className="w-full"
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) =>
              updateNodeProperty(
                node.id,
                column.id,
                Number.parseFloat(e.target.value)
              )
            }
            className="w-full"
          />
        );
      case "boolean":
        return (
          <Checkbox
            checked={value}
            onCheckedChange={(checked) =>
              updateNodeProperty(node.id, column.id, checked)
            }
          />
        );
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) =>
              updateNodeProperty(node.id, column.id, e.target.value)
            }
            className="w-full"
          />
        );
      default:
        return value;
    }
  };

  const updateNodeProperty = (
    nodeId: string,
    propertyId: string,
    value: any
  ) => {
    const updatedNodes = nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              [propertyId]: value,
            },
            ...(propertyId === "name"
              ? { data: { ...node.data, label: value } }
              : {}),
          }
        : node
    );
    onNodesChange(updatedNodes);
  };

  const changeNodeType = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      const newType =
        node.type === "genericNode" ? "swimlaneNode" : "genericNode";
      const updatedNodes = nodes.map((n) =>
        n.id === nodeId ? { ...n, type: newType } : n
      );
      onNodesChange(updatedNodes);
    }
  };

  const deleteNode = (nodeId: string) => {
    const updatedNodes = nodes.filter((node) => node.id !== nodeId);
    onNodesChange(updatedNodes);
  };

  const addNewNode = () => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: "genericNode",
      position: { x: 0, y: 0 },
      data: { label: "New Node" },
    };
    onNodesChange([...nodes, newNode]);
  };

  const addNewColumn = () => {
    if (newColumnName && newColumnType) {
      const newColumn: Column = {
        id: newColumnName.toLowerCase().replace(/\s+/g, "-"),
        name: newColumnName,
        type: newColumnType,
        accessor: (node) => node.data[newColumn.id] || "",
      };
      setColumns([...columns, newColumn]);

      // Initialize the new column with empty values for all nodes
      const updatedNodes = nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          [newColumn.id]: newColumnType === "boolean" ? false : "",
        },
      }));
      onNodesChange(updatedNodes);

      setNewColumnName("");
      setNewColumnType("string");
      setIsAddColumnDialogOpen(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <Button onClick={addNewNode}>
          <Plus className="mr-2 h-4 w-4" /> Add New Node
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id} className="whitespace-nowrap">
                  {column.name}
                </TableHead>
              ))}
              <TableHead>Actions</TableHead>
              <TableHead>
                <Dialog
                  open={isAddColumnDialogOpen}
                  onOpenChange={setIsAddColumnDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Column</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="column-name" className="text-right">
                          Column Name
                        </Label>
                        <Input
                          id="column-name"
                          value={newColumnName}
                          onChange={(e) => setNewColumnName(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="column-type" className="text-right">
                          Column Type
                        </Label>
                        <Select
                          value={newColumnType}
                          onValueChange={(value: Column["type"]) =>
                            setNewColumnType(value)
                          }
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select column type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={addNewColumn}>Add Column</Button>
                  </DialogContent>
                </Dialog>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderTableRows(tableNodes)}</TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TableView;
