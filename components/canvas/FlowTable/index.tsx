import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { COLUMN_TYPES } from "@/types/column-types.enum";
import { Check, PlusCircle, X } from "lucide-react";
import { nanoid } from "nanoid";
import { useCallback, useMemo, useState } from "react";
import AddNodeSheet from "./add-node-sheet";
import AddTableCellTrigger from "./add-table-cell-relation-trigger";
import FlowTableHeader from "./flowTableHead";

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
  { key: "id", label: "ID", validationType: "text" },
  { key: "title", label: "Title", validationType: "text" },
];

interface FlowTableProps {
  canvasDetails: any;
  handleNewColumnCreation: (column: any) => void;
  handleNodeCustomDataChange: (nodeId: string, data: any) => void;
  onAddNode: (node: any) => void;
  relations: any[];
  fetchFolderCanvases: () => Promise<any>;
}

const FlowTable = ({
  canvasDetails,
  handleNewColumnCreation,
  handleNodeCustomDataChange,
  onAddNode,
  relations,
  fetchFolderCanvases,
}: FlowTableProps) => {
  const [formattedNodes, setFormattedNodes] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  console.log("🚀 ~ columns:", columns);

  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRowData, setNewRowData] = useState<{ [key: string]: string }>({});

  const [editingCell, setEditingCell] = useState<{
    userId: string;
    field: string | null;
  }>({ userId: "", field: null });

  const [newColumn, setNewColumn] = useState<{
    name: string;
    validationType?: COLUMN_TYPES;
    target_canvas_id?: number;
    relation_id?: number;
    target_column?: string;
  }>({
    name: "",
    validationType: undefined,
    target_canvas_id: undefined,
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleEdit = async (nodeId: string, field: string, value: any) => {
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

  const addNewNode = () => {
    setIsAddingRow(true);
    const initialData: { [key: string]: string } = {};
    columns.forEach((col) => {
      console.log("🚀 ~ columns.forEach ~ col:", col);
      if (col.key === "id") {
        initialData[col.key] = nanoid();
      } else if (
        col.validationType !== COLUMN_TYPES.RELATION &&
        col.validationType !== COLUMN_TYPES.ROLLUP
      ) {
        initialData[col.key] = "";
      }
    });
    setNewRowData(initialData);
  };

  const handleSaveNewRow = async () => {
    setFormattedNodes([...formattedNodes, newRowData]);
    setIsAddingRow(false);
    setNewRowData({});

    await onAddNode({
      id: newRowData.id,
      data: {
        label: newRowData.title,
        customData: newRowData,
        shape: "rectangle",
      },
    });
  };

  const handleCancelNewRow = () => {
    setIsAddingRow(false);
    setNewRowData({});
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
        target_canvas_id: newColumn.target_canvas_id,
        relation_id: newColumn.relation_id,
        target_column: newColumn?.target_column,
      });

      // setColumns([
      //   ...columns,
      //   {
      //     key,
      //     label: newColumn.name,
      //     validationType: newColumn.validationType,
      //   },
      // ]);

      setNewColumn({
        name: "",
        validationType: undefined,
      });

      // close the sheet
    }
  };

  const deleteRow = (id: string) => {
    // setFormattedNodes(formattedNodes.filter((node) => node.id !== id));
  };

  const getTargetColumns = useCallback((column: any) => {
    const targetRelation = relations.find(
      (relation) => relation.id === column.relationId
    );

    const columns = targetRelation?.target_canvas?.nodes?.map((node: any) => ({
      id: node.node_id,
      title: node?.flow_data?.data?.label,
    }));

    return columns;
  }, []);

  useMemo(() => {
    const fNodes = canvasDetails?.nodes?.map((node: any) => {
      return {
        title: node?.flow_data?.data?.label,
        ...node.custom_data, // DONT CHANGE ORDER
        id: node.node_id,
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

      const relationColumns = relations.map((relation) => ({
        key: relation.target_canvas?.name,
        label: relation.target_canvas?.name,
        validationType: COLUMN_TYPES.RELATION,
        relationId: relation.id,
      }));

      const rollupColumns =
        canvasDetails?.rollups?.map((rollup: any) => ({
          key: rollup.target_column,
          label: rollup?.name,
          validationType: COLUMN_TYPES.ROLLUP,
          relationId: rollup.relationId,
        })) || [];

      // Combine columns and remove duplicates by key
      const combinedColumns = [
        ...columns,
        ...newColumns,
        ...relationColumns,
        ...rollupColumns,
      ];

      const uniqueColumns = Array.from(
        new Map(combinedColumns.map((col) => [col.key, col])).values()
      );

      setColumns(uniqueColumns);
    }
  }, [canvasDetails?.columns, relations]);

  const rollupNodeValues = useMemo(() => {
    const rollups = canvasDetails?.rollups;

    return rollups?.map((rollup: any) => {
      const relation = relations.find(
        (relation) => relation.id === rollup.relation_id
      );

      const targetCanvas = relation?.target_canvas;

      const nodeValues = targetCanvas?.nodes?.map((node: any) => {
        if (rollup.target_column === "id") {
          return {
            id: node.id,
            value: node.id,
          };
        } else if (rollup.target_column === "name") {
          return {
            id: node.id,
            value: node.flow_data?.data?.label,
          };
        } else {
          return {
            id: node.id,
            value: node.custom_data[rollup.target_column],
          };
        }
      });

      return {
        [rollup.target_column]: nodeValues,
      };
    });
  }, [canvasDetails]);

  const getRollupColumnValue = (column: Column, node: any, index: number) => {
    const value = rollupNodeValues?.find(
      (rollupValues: any) => rollupValues[column.key]
    );

    return value[column.key]?.[index]?.value;
  };

  return (
    <div className="p-4 space-y-4 bg-background text-foreground">
      <div className="">
        <h1 className="text-2xl font-bold">{canvasDetails?.name}</h1>
        <p className="">{canvasDetails?.description}</p>
      </div>
      <div className=" max-h-[450px] overflow-y-auto">
        <Table>
          <FlowTableHeader
            columns={columns}
            updateColumnTitle={updateColumnTitle}
            toggleColumnVisibility={toggleColumnVisibility}
            addNewColumn={addNewColumn}
            newColumn={newColumn}
            setNewColumn={setNewColumn}
            fetchFolderCanvases={fetchFolderCanvases}
            relations={relations}
            canvasDetails={canvasDetails}
          />
          <TableBody>
            {formattedNodes?.map((user, nodeIndex) => (
              <TableRow key={nodeIndex.toString()}>
                {columns
                  .filter((column) => !column.hidden)
                  .map((column, index) => (
                    <TableCell
                      key={index?.toString()}
                      className="cursor-pointer border-r"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (index === 0) {
                          setSelectedUser(user);
                        } else {
                          setEditingCell({
                            userId: user.id,
                            field: column.key,
                          });
                        }
                      }}
                    >
                      <>
                        {column.validationType === COLUMN_TYPES.RELATION ? (
                          <AddTableCellTrigger
                            label="Testing"
                            value={user[column.key]}
                            columns={getTargetColumns(column)}
                            onSelectValue={(value) => {
                              handleEdit(user.id, column.key, value);
                            }}
                          />
                        ) : column.validationType === COLUMN_TYPES.ROLLUP ? (
                          <span className="block min-h-[20px]">
                            {getRollupColumnValue(column, user, nodeIndex)}
                          </span>
                        ) : (
                          <>
                            {index !== 0 &&
                            editingCell.userId === user.id &&
                            editingCell.field === column.key ? (
                              <Input
                                autoFocus
                                defaultValue={user[column.key]}
                                onBlur={(e) => {
                                  handleEdit(
                                    user.id,
                                    column.key,
                                    e.target.value
                                  );
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
                          </>
                        )}
                      </>
                    </TableCell>
                  ))}
              </TableRow>
            ))}

            {isAddingRow && (
              <TableRow>
                {columns.map((column, index) => (
                  <TableCell key={index?.toString()}>
                    {column.key === "id" ? (
                      <span>{newRowData[column.key]}</span>
                    ) : (
                      column.validationType !== COLUMN_TYPES.RELATION &&
                      column.validationType !== COLUMN_TYPES.ROLLUP && (
                        <Input
                          value={newRowData[column.key]}
                          onChange={(e) =>
                            setNewRowData({
                              ...newRowData,
                              [column.key]: e.target.value,
                            })
                          }
                        />
                      )
                    )}
                  </TableCell>
                ))}
                <TableCell className="flex gap-2 justify-center">
                  <Button
                    onClick={handleSaveNewRow}
                    className="bg-green-500 hover:bg-green-600 text-white rounded p-4"
                    aria-label="Save Row"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handleCancelNewRow}
                    className="bg-red-500 hover:bg-red-600 text-white rounded p-4"
                    aria-label="Cancel Row"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Button onClick={addNewNode} variant="outline" className="gap-2">
        <PlusCircle className="w-4 h-4" />
        New Row
      </Button>

      <AddNodeSheet
        selectedNode={selectedUser}
        onClose={() => setSelectedUser(null)}
        handleEdit={handleEdit}
        columns={columns}
      />
    </div>
  );
};

export default FlowTable;
