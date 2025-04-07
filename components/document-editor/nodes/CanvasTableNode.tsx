"use client";

import type React from "react";
import {
  DecoratorNode,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import { useEffect, useRef, useState } from "react";

export type TableData = {
  id: string;
  rows: number;
  columns: number;
  data: string[][];
};

export type SerializedTableNode = Spread<
  {
    tableId: string;
    rows: number;
    columns: number;
    data: string[][];
  },
  SerializedLexicalNode
>;

export class CanvasTableNode extends DecoratorNode<JSX.Element> {
  __tableId: string;
  __rows: number;
  __columns: number;
  __data: string[][];

  static getType(): string {
    return "table-node";
  }

  static clone(node: CanvasTableNode): CanvasTableNode {
    return new CanvasTableNode(
      node.__tableId,
      node.__rows,
      node.__columns,
      node.__data,
      node.__key
    );
  }

  constructor(
    tableId: string,
    rows: number,
    columns: number,
    data: string[][],
    key?: NodeKey
  ) {
    super(key);
    this.__tableId = tableId;
    this.__rows = rows;
    this.__columns = columns;
    this.__data = data;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement("div");
    div.className = "table-node-container";
    return div;
  }

  updateDOM(): false {
    return false;
  }

  getTableId(): string {
    return this.__tableId;
  }

  getRows(): number {
    return this.__rows;
  }

  getColumns(): number {
    return this.__columns;
  }

  getData(): string[][] {
    return this.__data;
  }

  static importJSON(serializedNode: SerializedTableNode): CanvasTableNode {
    const { tableId, rows, columns, data } = serializedNode;
    const node = new CanvasTableNode(tableId, rows, columns, data);
    return node;
  }

  exportJSON(): SerializedTableNode {
    return {
      tableId: this.__tableId,
      rows: this.__rows,
      columns: this.__columns,
      data: this.__data,
      type: "table-node",
      version: 1,
    };
  }

  decorate(editor: LexicalEditor): JSX.Element {
    return (
      <TableComponent
        tableId={this.__tableId}
        rows={this.__rows}
        columns={this.__columns}
        data={this.__data}
        nodeKey={this.__key}
      />
    );
  }
}

function TableComponent({
  tableId,
  rows,
  columns,
  data,
  nodeKey,
}: {
  tableId: string;
  rows: number;
  columns: number;
  data: string[][];
  nodeKey: NodeKey;
}): JSX.Element {
  const [tableData, setTableData] = useState<string[][]>(data);
  const [isSelected, setIsSelected] = useState(false);
  const [width, setWidth] = useState<number | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  // Handle click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsSelected(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Simple resize functions for each corner/edge
  const startResizeTopLeft = (e: React.MouseEvent) => startResize(e, -1, -1);
  const startResizeTop = (e: React.MouseEvent) => startResize(e, 0, -1);
  const startResizeTopRight = (e: React.MouseEvent) => startResize(e, 1, -1);
  const startResizeRight = (e: React.MouseEvent) => startResize(e, 1, 0);
  const startResizeBottomRight = (e: React.MouseEvent) => startResize(e, 1, 1);
  const startResizeBottom = (e: React.MouseEvent) => startResize(e, 0, 1);
  const startResizeBottomLeft = (e: React.MouseEvent) => startResize(e, -1, 1);
  const startResizeLeft = (e: React.MouseEvent) => startResize(e, -1, 0);

  // Main resize function
  const startResize = (
    e: React.MouseEvent,
    directionX: number,
    directionY: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Get initial values
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = wrapperRef.current?.offsetWidth || 0;
    const startHeight = wrapperRef.current?.offsetHeight || 0;

    // Create resize function
    const resize = (moveEvent: MouseEvent) => {
      // Calculate deltas
      const deltaX = (moveEvent.clientX - startX) * directionX;
      const deltaY = (moveEvent.clientY - startY) * directionY;

      // Set new dimensions
      if (wrapperRef.current) {
        // Apply width changes if we're resizing horizontally
        if (directionX !== 0) {
          const newWidth = Math.max(300, startWidth + deltaX);
          wrapperRef.current.style.width = `${newWidth}px`;
          setWidth(newWidth);
        }

        // Apply height changes if we're resizing vertically
        if (directionY !== 0) {
          const newHeight = Math.max(130, startHeight + deltaY);
          // For height, we adjust the table's style directly
          if (tableRef.current) {
            tableRef.current.style.height = `${newHeight}px`;
          }
        }
      }
    };

    // Create stop function
    const stopResize = () => {
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResize);
    };

    // Add event listeners
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
  };

  return (
    <div
      className={`relative my-4 table-node-wrapper ${isSelected ? "is-selected" : ""}`}
      style={{
        width: width ? `${width}px` : "100%",
        maxWidth: "100%",
      }}
      ref={wrapperRef}
      onClick={() => setIsSelected(true)}
    >
      <div
        className={`overflow-auto rounded-md shadow-sm ${isSelected ? "border-blue-500 border-2" : "border border-gray-300"}`}
        ref={tableRef}
      >
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-300">
              {tableData[0]?.map((header, colIndex) => (
                <th
                  key={`header-${colIndex}`}
                  className="border-r border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700"
                >
                  {header || `Column ${colIndex + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.slice(1).map((row, rowIndex) => (
              <tr
                key={`row-${rowIndex + 1}`}
                className="border-b border-gray-300 hover:bg-gray-50 transition-colors"
              >
                {row.map((cell, colIndex) => (
                  <td
                    key={`cell-${rowIndex + 1}-${colIndex}`}
                    className="border-r border-gray-300 px-4 py-2 text-sm text-gray-700 overflow-hidden"
                    style={{ maxWidth: "200px" }}
                  >
                    <div className="truncate" title={cell}>
                      {cell}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resize handles - only visible when selected */}
      {isSelected && (
        <>
          {/* Top-left */}
          <div
            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-nwse-resize"
            onMouseDown={startResizeTopLeft}
          />

          {/* Top */}
          <div
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-ns-resize"
            onMouseDown={startResizeTop}
          />

          {/* Top-right */}
          <div
            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-nesw-resize"
            onMouseDown={startResizeTopRight}
          />

          {/* Right */}
          <div
            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-ew-resize"
            onMouseDown={startResizeRight}
          />

          {/* Bottom-right */}
          <div
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-nwse-resize"
            onMouseDown={startResizeBottomRight}
          />

          {/* Bottom */}
          <div
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-ns-resize"
            onMouseDown={startResizeBottom}
          />

          {/* Bottom-left */}
          <div
            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-nesw-resize"
            onMouseDown={startResizeBottomLeft}
          />

          {/* Left */}
          <div
            className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full z-10 cursor-ew-resize"
            onMouseDown={startResizeLeft}
          />
        </>
      )}
    </div>
  );
}

export function $createTableNode(
  tableId: string,
  rows: number,
  columns: number,
  data: string[][]
): CanvasTableNode {
  return new CanvasTableNode(tableId, rows, columns, data);
}

export function $isTableNode(
  node: LexicalNode | null | undefined
): node is CanvasTableNode {
  return node instanceof CanvasTableNode;
}
