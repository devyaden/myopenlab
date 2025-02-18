import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { COLUMN_TYPES } from "@/lib/types/column-types.enum";
import { Fragment } from "react";
import AddTableCellTrigger from "./add-table-cell-relation-trigger";
import FlowTableHeader from "./flowTableHead";

interface SubTableProps {
  columns: any[];
  updateColumnTitle: (id: string, title: string) => void;
  toggleColumnVisibility: (id: string) => void;
  setNewColumn: (column: any) => void;
  addNewColumn: () => void;
  newColumn: any;
  relations: any[];
  canvasDetails: any;
  fetchFolderCanvases: () => Promise<any>;
  handleDeleteColumn: (columnId: number, type: COLUMN_TYPES) => Promise<any>;
  data: { id: string; name: string; description: string }[];
  setSelectedUser: (user: any) => void;
  setEditingCell: (cell: { userId: string; field: string | null }) => void;
  getTargetColumns: (column: any) => any[];
  getRollupColumnValue: (column: any, user: any, nodeIndex: number) => any;
  handleEdit: (userId: string, field: string, value: any) => void;
  editingCell: { userId: string; field: string | null };
}

const SubTable: React.FC<SubTableProps> = ({
  columns,
  updateColumnTitle,
  toggleColumnVisibility,
  setNewColumn,
  addNewColumn,
  newColumn,
  fetchFolderCanvases,
  relations,
  canvasDetails,
  handleDeleteColumn,
  data,
  setSelectedUser,
  setEditingCell,
  getTargetColumns,
  getRollupColumnValue,
  handleEdit,
  editingCell,
}) => {
  return (
    <div className="w-full bg-gray-50 p-4 border-t">
      <Table className="w-full">
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
          handleDeleteColumn={handleDeleteColumn}
          isSubHeader
        />
        <TableBody>
          {data?.map((user: any, nodeIndex) => (
            <Fragment key={nodeIndex.toString()}>
              <TableRow key={nodeIndex.toString()}>
                <TableCell></TableCell>
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
                          // <AddTableCellTrigger
                          //   label="Testing"
                          //   value={user[column.key]}
                          //   onSelectValue={(value) => {
                          //     handleEdit(user.id, column.key, value);
                          //   }}
                          // />
                          <></>
                        ) : column.validationType === COLUMN_TYPES.ROLLUP ? (
                          <span className="block min-h-[20px]">
                            {getRollupColumnValue(column, user, nodeIndex)}
                          </span>
                        ) : (
                          <>
                            {index !== 0 &&
                            editingCell?.userId === user.id &&
                            editingCell?.field === column.key ? (
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
            </Fragment>
          ))}

          {/* {isAddingRow && (
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
              )} */}
        </TableBody>
      </Table>
    </div>
  );
};

export default SubTable;
