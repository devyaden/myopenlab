"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import TablePreview from "./TablePreview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TableSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTable: (tableData: any) => void;
  tableData: any;
  tables: any[];
}

export default function TableSelectorDialog({
  isOpen,
  onClose,
  onInsertTable,
  tableData,
  tables,
}: TableSelectorDialogProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [displayRows, setDisplayRows] = useState<number | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("table-selection");

  // Implementation of the solution from GitHub issue
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // This is the key fix from the GitHub issue
      // We need to manually restore the pointer-events style that Radix UI sets
      document.body.style.pointerEvents = "";

      // Add a small timeout to ensure the dialog is fully closed
      setTimeout(() => {
        onClose();
      }, 10);
    }
  };

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
    }
  }, [tableData]);

  // Combine the initial tableData with the tables array for selection
  const availableTables = useMemo(() => {
    const allTables = [...(tables || [])];

    // Add the initial tableData if it's not already in the list
    if (tableData && !allTables.some((table) => table.id === tableData.id)) {
      allTables.unshift(tableData);
    }

    return allTables;
  }, [tableData, tables]);

  // Get the selected table data
  const selectedTableData = useMemo(() => {
    return selectedTable
      ? availableTables.find((table) => table.id === selectedTable)
      : tableData;
  }, [selectedTable, availableTables, tableData]);

  // Calculate maximum rows and columns
  const maxRowsInSelectedTable =
    selectedTableData?.flowData?.nodes?.length || 0;

  // Get all available columns, excluding 'id' column
  const availableColumns = useMemo(() => {
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

  // Handle table selection
  const handleTableSelect = (tableId: string) => {
    setSelectedTable(tableId);

    // Find the selected table
    const newSelectedTable = availableTables.find(
      (table) => table.id === tableId
    );

    if (newSelectedTable) {
      // Update display rows
      setDisplayRows(newSelectedTable.flowData?.nodes?.length || 0);

      // Update selected columns
      const columnTitles = newSelectedTable.columns
        ?.filter((col: any) => col.title !== "id")
        .map((col: any) => col.title);

      setSelectedColumns(columnTitles || []);

      // Switch to the column selection tab
      setActiveTab("column-selection");
    }
  };

  // Update the handleInsert function to properly filter out unselected columns
  const handleInsert = () => {
    if (!selectedTableData) {
      console.error("No table selected or tables data is missing");
      return;
    }

    // Only use the columns that are actually selected
    const columnsData = [...selectedColumns];

    // If no columns are selected, show an error and return
    if (columnsData.length === 0) {
      console.error("No columns selected");
      return;
    }

    // Generate table data from nodes, only including selected columns
    let data: any = [];

    if (selectedTableData.flowData?.nodes?.length) {
      data = selectedTableData.flowData.nodes
        .slice(0, displayRows)
        .map((node: any) => {
          // For each node, only include data from selected columns
          return columnsData.map((columnTitle) => {
            let cellValue;
            // Handle special case for 'task' column which is stored as 'label' in node data
            if (columnTitle === "task") {
              cellValue = node?.data?.label || "";
            } else if (columnTitle === "type") {
              cellValue = node?.data?.shape || "";
            } else {
              cellValue = node?.data?.[columnTitle] || "";
            }

            // Special handling for relation data
            if (
              cellValue &&
              typeof cellValue === "object" &&
              (Array.isArray(cellValue) || cellValue.id) &&
              columnTitle.toLowerCase().includes("relation")
            ) {
              // We need to preserve the original relation data structure
              // but also ensure it can be stringified properly

              // For relation arrays, make sure each object can be safely stringified
              if (Array.isArray(cellValue)) {
                return cellValue.map((rel: any) => {
                  if (rel && typeof rel === "object") {
                    // Include only essential properties to avoid circular references
                    return {
                      id: rel.id,
                      label: rel.label || rel.data?.label || "",
                      // Include any important fields
                      ...Object.entries(rel)
                        .filter(
                          ([key]) =>
                            typeof key === "string" &&
                            key !== "id" &&
                            key !== "label"
                        )
                        .reduce(
                          (acc, [key, val]) => {
                            if (typeof val !== "object" || val === null) {
                              acc[key] = val;
                            }
                            return acc;
                          },
                          {} as Record<string, any>
                        ),
                    };
                  }
                  return rel;
                });
              }
              // For single relation object
              else if (cellValue.id) {
                return {
                  id: cellValue.id,
                  label: cellValue.label || cellValue.data?.label || "",
                  // Include any important fields
                  ...Object.entries(cellValue)
                    .filter(
                      ([key]) =>
                        typeof key === "string" &&
                        key !== "id" &&
                        key !== "label"
                    )
                    .reduce(
                      (acc, [key, val]) => {
                        if (typeof val !== "object" || val === null) {
                          acc[key] = val;
                        }
                        return acc;
                      },
                      {} as Record<string, any>
                    ),
                };
              }
            }

            // Ensure the value is a string to prevent React rendering issues
            if (typeof cellValue === "object" && cellValue !== null) {
              return JSON.stringify(cellValue);
            }
            return String(cellValue);
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

    // Fix pointer events before closing
    document.body.style.pointerEvents = "";

    // Close the dialog first
    setTimeout(() => {
      onClose();

      // Then insert the table after a small delay to ensure dialog is fully closed
      setTimeout(() => {
        onInsertTable({
          id: selectedTableData.id,
          rows: data.length,
          columns: selectedColumns.length,
          data: JSON.stringify(data),
        });
      }, 50);
    }, 10);
  };

  // Ensure pointer events are restored when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.pointerEvents = "";
    };
  }, []);

  // Also ensure pointer events are restored when dialog closes
  useEffect(() => {
    if (!isOpen) {
      document.body.style.pointerEvents = "";
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Insert Canvas Table</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-2 text-sm text-muted-foreground">
              Loading tables...
            </span>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="table-selection">Select Table</TabsTrigger>
              <TabsTrigger
                value="column-selection"
                disabled={!selectedTableData}
              >
                Configure Table
              </TabsTrigger>
            </TabsList>

            <TabsContent value="table-selection">
              <div className="text-sm text-muted-foreground mb-4">
                Select a canvas to create a table from:
              </div>

              <ScrollArea className="h-[400px] border rounded-md p-2">
                <div className="grid grid-cols-1 gap-4">
                  {availableTables.length > 0 ? (
                    availableTables.map((table) => (
                      <div
                        key={table.id}
                        className={`border rounded-md p-3 cursor-pointer transition-all ${
                          selectedTable === table.id
                            ? "ring-2 ring-primary border-primary"
                            : "hover:border-gray-400"
                        }`}
                        onClick={() => handleTableSelect(table.id)}
                      >
                        <div className="font-medium mb-2">
                          {table.name || "Untitled Canvas"}
                        </div>
                        <div className="h-[150px] overflow-hidden border rounded-md bg-gray-50">
                          <TablePreview
                            nodes={table.flowData?.nodes}
                            edges={table.flowData?.edges}
                            columns={table.columns}
                            displayRows={5}
                            visibleColumns={table.columns
                              ?.filter((col: any) => col.title !== "id")
                              .map((col: any) => col.title)}
                          />
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {table.flowData?.nodes?.length || 0} rows,{" "}
                          {table.columns?.filter(
                            (col: any) => col.title !== "id"
                          ).length || 0}{" "}
                          columns
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No canvas tables available
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    document.body.style.pointerEvents = "";
                    setTimeout(() => onClose(), 10);
                  }}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setActiveTab("column-selection")}
                  disabled={!selectedTable}
                >
                  Next
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="column-selection">
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

                  <div className="flex justify-end mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("table-selection")}
                      className="mr-2"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleInsert}
                      disabled={selectedColumns.length === 0}
                    >
                      Insert Table
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
