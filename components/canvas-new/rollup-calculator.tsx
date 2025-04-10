"use client";

import { useEffect } from "react";
import type React from "react"; // Added import for React

interface RollupCalculatorProps {
  nodes: any[];
  columns: any[];
  onRollupChange: (nodeId: string, columnTitle: string, value: any) => void;
}

export const RollupCalculator: React.FC<RollupCalculatorProps> = ({
  nodes,
  columns,
  onRollupChange,
}) => {
  useEffect(() => {
    columns.forEach((column) => {
      if (column?.type === "Rollup") {
        nodes.forEach((node) => {
          const rollupValue = calculateRollup(node, column);
          onRollupChange(node.id, column.title, rollupValue);
        });
      }
    });
  }, [nodes, columns, onRollupChange]);

  const calculateRollup = (node: any, column: any) => {
    const relatedColumn = columns.find(
      (col) => col.title === column.rollupRelation
    );
    if (!relatedColumn) return null;

    const relatedNodes = nodes.filter(
      (n) => n.data[relatedColumn.title] === node.id
    );
    const values = relatedNodes
      .map((n) => n.data[column.rollupProperty])
      .filter((v) => v !== undefined && v !== null);

    switch (column.aggregationFunction) {
      case "Sum":
        return values.reduce((sum, value) => sum + Number(value), 0);
      case "Count":
        return values.length;
      case "Average":
        return values.length > 0
          ? values.reduce((sum, value) => sum + Number(value), 0) /
              values.length
          : null;
      case "Min":
        return values.length > 0 ? Math.min(...values.map(Number)) : null;
      case "Max":
        return values.length > 0 ? Math.max(...values.map(Number)) : null;
      default:
        return null;
    }
  };

  return null; // This component doesn't render anything
};
