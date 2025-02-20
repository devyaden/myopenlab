import { MarkerType } from "reactflow";
import { useCallback } from "react";

const useEdgeStyleHandler = (
  selectedEdge: string | null,
  currentState: any,
  updateState: any
) => {
  return useCallback(
    (edgeStyle: string) => {
      if (!selectedEdge) return;

      const getEdgeTypeAndStyle = (styleType: string) => {
        const baseStyle = {
          strokeWidth: 2,
          markerEnd: { type: MarkerType.ArrowClosed },
        };

        switch (styleType) {
          case "default":
            return {
              type: "default",
              style: { ...baseStyle },
            };

          case "straight":
            return {
              type: "default",
              style: {
                ...baseStyle,
                edgeType: "straight",
              },
            };

          case "step":
            return {
              type: "step",
              style: { ...baseStyle },
            };

          case "smoothstep":
            return {
              type: "smoothstep",
              style: { ...baseStyle },
            };

          case "simplebezier":
            return {
              type: "default",
              style: {
                ...baseStyle,
                edgeType: "simplebezier",
              },
            };

          case "dashed":
            return {
              type: "default",
              style: {
                ...baseStyle,
                strokeDasharray: "5,5",
              },
            };

          case "dotted":
            return {
              type: "default",
              style: {
                ...baseStyle,
                strokeDasharray: "1,5",
              },
            };

          case "double":
            return {
              type: "default",
              style: {
                ...baseStyle,
                strokeWidth: 3,
                strokeDasharray: undefined,
                className: "double-line",
              },
            };

          default:
            return {
              type: "default",
              style: { ...baseStyle },
            };
        }
      };

      updateState({
        edges: currentState.edges.map((edge: any) => {
          if (edge.id === selectedEdge) {
            const { type, style } = getEdgeTypeAndStyle(edgeStyle);
            return {
              ...edge,
              type,
              style: {
                ...edge.style,
                ...style,
              },
            };
          }
          return edge;
        }),
      });
    },
    [selectedEdge, currentState.edges, updateState]
  );
};

export default useEdgeStyleHandler;
