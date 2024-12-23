import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { COLUMN_TYPES } from "@/types/column-types.enum";
import { Check, ChevronDown, ChevronRight, PlusCircle, X } from "lucide-react";
import { nanoid } from "nanoid";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import AddNodeSheet from "./add-node-sheet";
import AddTableCellTrigger from "./add-table-cell-relation-trigger";
import FlowTableHeader from "./flowTableHead";
import { Node } from "reactflow";
import SubTable from "./Subtable";

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
  columnId?: number;
}

interface ExpandedRows {
  [key: string]: boolean;
}

const defaultColumns: Column[] = [
  { key: "id", label: "ID", validationType: COLUMN_TYPES.STRING },
  { key: "title", label: "Title", validationType: COLUMN_TYPES.STRING },
];

interface FlowTableProps {
  canvasDetails: any;
  handleNewColumnCreation: (column: any) => void;
  handleNodeCustomDataChange: (nodeId: string, data: any) => void;
  onAddNode: (node: any) => void;
  relations: any[];
  fetchFolderCanvases: () => Promise<any>;
  fetchCanvasDetails: () => Promise<any>;
  handleDeleteColumn: (columnId: number, type: COLUMN_TYPES) => Promise<any>;
}

interface GroupNode extends Node {
  title: string;
  children: Node[];
}

const FlowTable = ({
  canvasDetails,
  handleNewColumnCreation,
  handleNodeCustomDataChange,
  onAddNode,
  relations,
  fetchFolderCanvases,
  fetchCanvasDetails,
  handleDeleteColumn,
}: FlowTableProps) => {
  const [formattedNodes, setFormattedNodes] = useState<any[]>([]);

  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRowData, setNewRowData] = useState<{ [key: string]: string }>({});
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>(
    {}
  );

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

    await onAddNode({
      id: newRowData.id,
      type: "custom",
      data: {
        label: newRowData.title,
        customData: newRowData,
        shape: "square",
      },
    });
    setNewRowData({});
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

      setNewColumn({
        name: "",
        validationType: undefined,
      });

      // close the sheet
    }
  };

  const getTargetColumns = useCallback(
    (column: any) => {
      const targetRelation = relations.find(
        (relation) => relation.id === column.relationId
      );

      const columns = targetRelation?.target_canvas?.nodes?.map(
        (node: any) => ({
          id: node.node_id,
          title: node?.flow_data?.data?.label,
        })
      );

      return columns;
    },
    [relations]
  );

  useMemo(() => {
    if (!canvasDetails?.nodes) return;

    const groupNodes = canvasDetails.nodes
      .filter((node: any) => node.flow_data?.type === "group")
      .map((node: any) => ({
        title: node?.flow_data?.data?.label,
        ...node.custom_data, // DONT CHANGE ORDER
        id: node.node_id,
      }));

    const groupNodesWithChildren = groupNodes.map((groupNode: Node) => {
      const children = canvasDetails.flow_data?.nodes
        ?.filter((node: Node) => node.parentId === groupNode.id)
        .map((node: any) => {
          const nodeCustomData = canvasDetails.nodes.find(
            (n: any) => n.node_id === node.node_id
          )?.custom_data;

          return {
            title: node?.data?.label,
            ...nodeCustomData, // DONT CHANGE ORDER
            id: node.id,
            type: node?.type,
          };
        });

      return {
        ...groupNode,
        children,
      };
    });

    const childNodeIds: string[] = groupNodesWithChildren.flatMap(
      (groupNode: GroupNode) =>
        groupNode.children.map((child: Node) => child.id)
    );

    const nodes = canvasDetails.nodes
      .filter(
        (node: any) =>
          node.flow_data?.type !== "group" &&
          !childNodeIds.includes(node.node_id)
      )
      .map((node: any) => {
        const nodeCustomData = canvasDetails.nodes.find(
          (n: any) => n.node_id === node.node_id
        )?.custom_data;

        return {
          title: node?.flow_data?.data?.label,
          ...nodeCustomData, // DONT CHANGE ORDER
          id: node.node_id,
          type: node?.type,
        };
      });

    const allNodes = [...groupNodesWithChildren, ...nodes];
    const uniqueNodes = Array.from(
      new Set(allNodes.map((node) => node.id))
    ).map((id) => allNodes.find((node) => node.id === id));

    setFormattedNodes(uniqueNodes);
  }, [canvasDetails?.nodes]);

  useMemo(() => {
    if (canvasDetails?.columns) {
      const newColumns = canvasDetails.columns.map((column: any) => ({
        columnId: column.id,
        key: column.key,
        label: column.name,
        validationType: column.data_type,
      }));

      const relationColumns = relations.map((relation) => ({
        key: relation.target_canvas?.name,
        label: relation.target_canvas?.name,
        validationType: COLUMN_TYPES.RELATION,
        relationId: relation.id,
        columnId: relation.id,
      }));

      const rollupColumns =
        canvasDetails?.rollups?.map((rollup: any) => ({
          key: rollup.target_column,
          label: rollup?.name,
          validationType: COLUMN_TYPES.ROLLUP,
          relationId: rollup.relationId,
          columnId: rollup.id,
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
  }, [canvasDetails?.columns, relations, canvasDetails?.rollups]);

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

  const handleColumnDeletion = async (id: number, type: COLUMN_TYPES) => {
    await handleDeleteColumn(id, type);

    // update local state
    setColumns(columns.filter((col) => col.columnId !== id));
  };

  const toggleRowExpansion = (userId: string) => {
    setExpandedRows((prev: ExpandedRows) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  useEffect(() => {
    fetchCanvasDetails();
  }, []);

  return (
    <div className="p-4 space-y-4 bg-background text-foreground h-full">
      <div className="">
        <h1 className="text-2xl font-bold">{canvasDetails?.name}</h1>
        <p className="">{canvasDetails?.description}</p>
      </div>
      <div className="flex flex-col h-[74vh]">
        <div className="overflow-y-auto">
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
              handleDeleteColumn={handleColumnDeletion}
            />
            <TableBody>
              {formattedNodes?.map((user, nodeIndex) => (
                <Fragment key={nodeIndex.toString()}>
                  <TableRow key={nodeIndex.toString()}>
                    <TableCell
                      className="w-[50px] cursor-pointer"
                      onClick={() => toggleRowExpansion(user.id)}
                    >
                      {expandedRows[user.id] ? (
                        <ChevronDown />
                      ) : (
                        <ChevronRight />
                      )}
                    </TableCell>

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
                            ) : column.validationType ===
                              COLUMN_TYPES.ROLLUP ? (
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
                                      setEditingCell({
                                        userId: "",
                                        field: null,
                                      });
                                    }}
                                    type={
                                      column.validationType ===
                                      COLUMN_TYPES.NUMBER
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
                                        setEditingCell({
                                          userId: "",
                                          field: null,
                                        });
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

                  {expandedRows[user.id] && (
                    <TableRow>
                      <TableCell colSpan={columns.length + 1}>
                        <SubTable
                          data={user?.children}
                          columns={columns}
                          updateColumnTitle={updateColumnTitle}
                          toggleColumnVisibility={toggleColumnVisibility}
                          addNewColumn={addNewColumn}
                          newColumn={newColumn}
                          setNewColumn={setNewColumn}
                          fetchFolderCanvases={fetchFolderCanvases}
                          relations={relations}
                          canvasDetails={canvasDetails}
                          handleDeleteColumn={handleColumnDeletion}
                          handleEdit={handleEdit}
                          setEditingCell={setEditingCell}
                          getTargetColumns={getTargetColumns}
                          getRollupColumnValue={getRollupColumnValue}
                          editingCell={editingCell}
                          setSelectedUser={setSelectedUser}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
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
      </div>

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
