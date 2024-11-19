import { memo, useCallback, useState } from "react";
import { NodeProps, NodeResizer, useReactFlow } from "reactflow";

const GroupNode = memo(({ data, selected, id }: NodeProps) => {
  const style = data.style;
  const [dimensions, setDimensions] = useState({
    width: style?.height ?? 200,
    height: style?.width ?? 300,
  });
  const reactFlow = useReactFlow();

  const onResize = useCallback(
    (_: any, { width, height }: { width: number; height: number }) => {
      setDimensions({ width, height });

      reactFlow.setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                style: { ...node.style, width, height },
              }
            : node
        )
      );

      if (data.onNodeResize) {
        data.onNodeResize({ width, height });
      }

      const childNodes = reactFlow
        .getNodes()
        .filter((node) => data.parentId === node.id);

      const updatedNodes = childNodes.map((childNode) => {
        const childPosition = {
          x: Math.max(0, Math.min(childNode.position.x, width - 100)),
          y: Math.max(0, Math.min(childNode.position.y, height - 100)),
        };

        return {
          ...childNode,
          parentId: childNode.parentId,
          position: childPosition,
        };
      });

      reactFlow.setNodes((nodes) =>
        nodes.map(
          (node) =>
            updatedNodes.find((updated) => updated.id === node.id) || node
        )
      );
    },
    [reactFlow]
  );

  return (
    <div
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
      // className={className}
    >
      {selected && (
        <NodeResizer
          isVisible={selected}
          onResize={onResize}
          keepAspectRatio={false}
          minWidth={100}
          minHeight={100}
          handleStyle={{
            width: "8px",
            height: "8px",
            backgroundColor: "#1a192b",
          }}
        />
      )}
    </div>
  );
});

GroupNode.displayName = "GroupNode";

export default GroupNode;
