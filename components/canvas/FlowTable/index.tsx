import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useCanvas from "@/hooks/use-canvas";
import { COLUMN_TYPES } from "@/types/column-types.enum";
import {
  ArrowDownUp,
  ArrowUpDown,
  Copy,
  Edit,
  Eye,
  Filter,
  Lock,
  Plus,
  PlusCircle,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  [key: string]: string;
}

interface Column {
  key: string;
  label: string;
  hidden?: boolean;
  validationType?: string;
}

const defaultColumns: Column[] = [
  { key: "name", label: "Name", validationType: "text" },
  { key: "id", label: "ID", validationType: "text" },
];

const FlowTable = ({}) => {
  const {
    canvasDetails,
    nodes,
    handleNewColumnCreation,
    handleNodeCustomDataChange,
  } = useCanvas();
  const [formattedNodes, setFormattedNodes] = useState<any[]>([]);

  const [users, setUsers] = useState<User[]>([
    {
      id: "001",
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "+1-555-123-4567",
    },
    {
      id: "002",
      name: "Jane Smith",
      email: "jane.smith@email.com",
      phone: "+1-555-987-6543",
    },
    {
      id: "003",
      name: "Alex Johnson",
      email: "alex.johnson@email.com",
      phone: "+1-555-456-7890",
    },
    {
      id: "004",
      name: "Emily Brown",
      email: "emily.brown@email.com",
      phone: "+1-555-234-5678",
    },
    {
      id: "005",
      name: "Michael Lee",
      email: "michael.lee@email.com",
      phone: "+1-555-876-5432",
    },
  ]);

  const [columns, setColumns] = useState<Column[]>(defaultColumns);

  const [editingCell, setEditingCell] = useState<{
    userId: string;
    field: string | null;
  }>({ userId: "", field: null });

  const [newColumn, setNewColumn] = useState<{
    name: string;
    validationType?: COLUMN_TYPES;
  }>({
    name: "",
    validationType: undefined,
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleEdit = async (nodeId: string, field: string, value: string) => {
    console.log(
      "🚀 ~ handleEdit ~ userId: string, field: string, value: string:",
      nodeId,
      field,
      value
    );
    // updated formatted nodes
    const updatedNodes = formattedNodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          [field]: value,
        };
      }
      return node;
    });

    setFormattedNodes(updatedNodes);

    // update node custom data
    await handleNodeCustomDataChange(nodeId, {
      [field]: value,
    });
  };

  const addNewUser = () => {
    const newId = String(users.length + 1).padStart(3, "0");
    setUsers([
      ...users,
      {
        id: newId,
        name: "New User",
        email: "new.user@email.com",
        phone: "+1-555-000-0000",
      },
    ]);
  };

  const sortColumn = (key: string, direction: "asc" | "desc") => {
    const sorted = [...users].sort((a, b) => {
      if (direction === "asc") {
        return a[key] > b[key] ? 1 : -1;
      }
      return a[key] < b[key] ? 1 : -1;
    });
    setUsers(sorted);
  };

  const toggleColumnVisibility = (key: string) => {
    setColumns(
      columns.map((col) =>
        col.key === key ? { ...col, hidden: !col.hidden } : col
      )
    );
  };

  const updateColumnTitle = (key: string, newTitle: string) => {
    setColumns(
      columns.map((col) =>
        col.key === key ? { ...col, label: newTitle } : col
      )
    );
  };

  const addNewColumn = async () => {
    if (newColumn.name && newColumn.validationType) {
      const key = newColumn.name.toLowerCase().replace(" ", "_");

      await handleNewColumnCreation({
        name: newColumn.name,
        data_type: newColumn.validationType,
        order: columns.length + 1,
        key,
      });

      setColumns([
        ...columns,
        {
          key,
          label: newColumn.name,
          validationType: newColumn.validationType,
        },
      ]);

      // close the sheet
    }
  };

  useMemo(() => {
    const fNodes = canvasDetails?.nodes?.map((node: any) => {
      return {
        id: node.node_id,
        title: node?.flow_data?.data?.label,
        ...node.custom_data,
      };
    });

    setFormattedNodes(fNodes);
  }, [canvasDetails?.nodes]);

  useMemo(() => {
    if (canvasDetails?.columns) {
      const newColumns = canvasDetails.columns.map((column: any) => ({
        key: column.key,
        label: column.name,
        validationType: column.data_type,
      }));

      const mergedColumns = [
        ...columns.filter(
          (existingColumn) =>
            !newColumns.some(
              (newColumn: Column) => newColumn.key === existingColumn.key
            )
        ),
        ...newColumns,
      ];

      setColumns(mergedColumns);
    }
  }, [canvasDetails?.columns]);

  return (
    <div className="p-4 space-y-4 bg-background text-foreground">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {columns
              .filter((column) => !column.hidden)
              .map((column) => (
                <TableHead key={column.key}>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2">
                      {column.label}
                      <ArrowUpDown className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <div className="p-2">
                        <Input
                          defaultValue={column.label}
                          onBlur={(e) =>
                            updateColumnTitle(column.key, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updateColumnTitle(
                                column.key,
                                e.currentTarget.value
                              );
                              e.currentTarget.blur();
                            }
                          }}
                        />
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2">
                        <Edit className="w-4 h-4" />
                        Edit property
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Sparkles className="w-4 h-4" />
                        Set up AI autofill
                        <span className="ml-2 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
                          New
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => sortColumn(column.key, "asc")}
                        className="gap-2"
                      >
                        <ArrowDownUp className="w-4 h-4" />
                        Sort ascending
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => sortColumn(column.key, "desc")}
                        className="gap-2"
                      >
                        <ArrowDownUp className="w-4 h-4 rotate-180" />
                        Sort descending
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Filter className="w-4 h-4" />
                        Filter
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => toggleColumnVisibility(column.key)}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Hide in view
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Lock className="w-4 h-4" />
                        Freeze up to column
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Copy className="w-4 h-4" />
                        Duplicate property
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-red-500">
                        <Trash2 className="w-4 h-4" />
                        Delete property
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <span className="text-sm">Wrap column</span>
                        <Switch />
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableHead>
              ))}
            <TableHead>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add new column</span>
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Add New Column</SheetTitle>
                    <SheetDescription>
                      Enter the details for the new column.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4 ">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newColumn.name}
                        onChange={(e) =>
                          setNewColumn({ ...newColumn, name: e.target.value })
                        }
                        className="col-span-3 "
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="validationType">Type</Label>
                      <Select
                        value={newColumn.validationType}
                        onValueChange={(value) =>
                          setNewColumn({
                            ...newColumn,
                            validationType: value as COLUMN_TYPES,
                          })
                        }
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={COLUMN_TYPES.STRING}>
                            Text
                          </SelectItem>
                          <SelectItem value={COLUMN_TYPES.NUMBER}>
                            Number
                          </SelectItem>
                          <SelectItem value={COLUMN_TYPES.DATE}>
                            Date
                          </SelectItem>
                          <SelectItem value={COLUMN_TYPES.BOOLEAN}>
                            Boolean
                          </SelectItem>
                          <SelectItem value={COLUMN_TYPES.RELATION}>
                            Relation
                          </SelectItem>
                          <SelectItem value={COLUMN_TYPES.ROLLUP}>
                            Rollup
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={addNewColumn}>Add Column</Button>
                </SheetContent>
              </Sheet>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {formattedNodes?.map((user) => (
            <TableRow key={user.id} onClick={() => setSelectedUser(user)}>
              {columns
                .filter((column) => !column.hidden)
                .map((column) => (
                  <TableCell
                    key={column.key}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCell({ userId: user.id, field: column.key });
                    }}
                  >
                    {editingCell.userId === user.id &&
                    editingCell.field === column.key ? (
                      <Input
                        autoFocus
                        defaultValue={user[column.key]}
                        onBlur={(e) => {
                          handleEdit(user.id, column.key, e.target.value);
                          setEditingCell({ userId: "", field: null });
                        }}
                        type={
                          column.validationType === COLUMN_TYPES.NUMBER
                            ? "number"
                            : "text"
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleEdit(
                              user.id,
                              column.key,
                              e.currentTarget.value
                            );
                            setEditingCell({ userId: "", field: null });
                          }
                        }}
                      />
                    ) : (
                      <span className="block min-h-[20px]">
                        {user[column.key]}
                      </span>
                    )}
                  </TableCell>
                ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button onClick={addNewUser} variant="outline" className="gap-2">
        <PlusCircle className="w-4 h-4" />
        New page
      </Button>
      <Sheet open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>User Details</SheetTitle>
            <SheetDescription>
              Information about the selected user.
            </SheetDescription>
          </SheetHeader>
          {selectedUser && (
            <div className="py-4">
              {columns.map((column) => (
                <div key={column.key} className="mb-4">
                  <Label htmlFor={column.key}>{column.label}</Label>
                  <Input
                    id={column.key}
                    value={selectedUser[column.key]}
                    onChange={(e) =>
                      handleEdit(selectedUser.id, column.key, e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FlowTable;
