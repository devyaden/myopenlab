"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { LexicalEditor } from "lexical";
import { useEffect, useMemo, useState } from "react";
import { INSERT_CANVAS_TABLE_COMMAND } from "../plugins/CanvasTablePlugin";
import TablePreview from "./TablePreview";

interface TableSelectorDialogProps {
  activeEditor: LexicalEditor;
  onClose: () => void;
  tableData: any;
  tables: any[];
}

export default function TableSelectorDialog({
  activeEditor,
  onClose,
  tableData,
  tables,
}: TableSelectorDialogProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [displayRows, setDisplayRows] = useState<number | null>(null);
  const [displayColumns, setDisplayColumns] = useState<number | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  // Initialize state based on tableData
  useEffect(() => {
    if (tableData) {
      setSelectedTable(tableData.id);
      setDisplayRows(tableData.flowData?.nodes?.length || 0);
      // Get columns excluding 'id'
      const columnTitles = tableData.columns
        ?.filter((col: any) => col.title !== "id")
        .map((col: any) => col.title);
      setSelectedColumns(columnTitles || []);
      setDisplayColumns(columnTitles?.length || 0);
    }
  }, [tableData]);

  // Get the selected table data
  const selectedTableData = useMemo(() => {
    return selectedTable && tables?.length
      ? tables.find((table) => table.id === selectedTable)
      : tableData;
  }, [selectedTable, tables, tableData]);

  // Calculate maximum rows and columns
  const maxRowsInSelectedTable =
    selectedTableData?.flowData?.nodes?.length || 0;
  const maxColumnsInSelectedTable =
    selectedTableData?.columns?.filter((col: any) => col.title !== "id")
      .length || 0;

  // Get all available columns, excluding 'id' column
  const availableColumns: any = useMemo(() => {
    if (!selectedTableData) return [];
    return selectedTableData.columns
      .filter((col: any) => col.title !== "id")
      .map((column: any) => column.title);
  }, [selectedTableData]);

  // Get filtered columns based on selection
  const visibleColumns = useMemo(() => {
    return selectedColumns;
  }, [selectedColumns]);

  const toggleColumnSelection = (columnTitle: string) => {
    setSelectedColumns((prev) => {
      if (prev.includes(columnTitle)) {
        return prev.filter((title) => title !== columnTitle);
      } else {
        return [...prev, columnTitle];
      }
    });
  };

  const handleInsert = () => {
    if (!selectedTableData) {
      console.error("No table selected or tables data is missing");
      return;
    }

    // Get selected columns
    const columnsData = selectedColumns;

    // Generate table data from nodes
    let data = [];

    if (selectedTableData.flowData?.nodes?.length) {
      data = selectedTableData.flowData.nodes
        .slice(0, displayRows)
        .map((node: any) => {
          return columnsData.map((columnTitle) => {
            // Handle special case for 'task' column which is stored as 'label' in node data
            if (columnTitle === "task") {
              return node?.data?.label || "";
            }

            if (columnTitle === "type") {
              return node?.data?.shape || "";
            }
            return node?.data?.[columnTitle] || "";
          });
        });
    } else {
      // Create empty data if no nodes exist
      data = Array(displayRows)
        .fill(0)
        .map(() => Array(columnsData.length).fill(""));
    }

    // Insert column headers at the beginning
    data.unshift([...columnsData]);

    // Insert the table
    if (activeEditor) {
      activeEditor.dispatchCommand(INSERT_CANVAS_TABLE_COMMAND, {
        id: selectedTableData.id,
        rows: data.length,
        columns: columnsData.length,
        data,
      });

      onClose();
    } else {
      console.error("activeEditor is undefined or null");
    }
  };

  return (
    <>
      <div className="sm:max-w-[550px]">
        <p className="font-bold mb-4">Insert Table</p>

        {loading ? (
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-2 text-sm text-muted-foreground">
              Loading tables...
            </span>
          </div>
        ) : (
          <>
            {selectedTableData && (
              <>
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayRows">
                      Rows to Display ({displayRows}/{maxRowsInSelectedTable})
                    </Label>
                    <div className="pt-2">
                      <Slider
                        id="displayRows"
                        min={1}
                        max={Math.max(1, maxRowsInSelectedTable)}
                        step={1}
                        value={[displayRows || maxRowsInSelectedTable]}
                        onValueChange={(value) => setDisplayRows(value[0])}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <Label className="mb-2 block">
                    Select Columns to Display:
                  </Label>
                  <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto border rounded-md p-3">
                    {availableColumns.map((columnTitle: any) => (
                      <div
                        key={columnTitle}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`column-${columnTitle}`}
                          checked={selectedColumns.includes(columnTitle)}
                          onCheckedChange={() =>
                            toggleColumnSelection(columnTitle)
                          }
                        />
                        <Label
                          htmlFor={`column-${columnTitle}`}
                          className="cursor-pointer"
                        >
                          {columnTitle}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded border border-gray-200 p-4 mt-2">
                  <div className="text-sm font-medium mb-2">Preview:</div>
                  <div className="overflow-auto max-h-[250px]">
                    <TablePreview
                      nodes={selectedTableData.flowData?.nodes}
                      edges={selectedTableData.flowData?.edges}
                      columns={selectedTableData.columns}
                      displayRows={displayRows || maxRowsInSelectedTable}
                      visibleColumns={visibleColumns}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <div className="mt-4">
          <Button variant="outline" onClick={onClose} className="mr-2">
            Cancel
          </Button>
          <Button
            onClick={handleInsert}
            disabled={selectedColumns.length === 0}
            className=" bg-yadn-pink"
          >
            Insert Table
          </Button>
        </div>
      </div>
    </>
  );
}
