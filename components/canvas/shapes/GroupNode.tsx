import { memo, useCallback, useState } from "react";
import { NodeResizer, useReactFlow } from "reactflow";

interface GroupNodeData {
  label?: string;
  backgroundColor?: string;
  borderColor?: string;
  children?: string[]; // Array of child node IDs

  onLabelChange?: (newLabel: string) => void;
}

interface GroupNodeProps {
  data: GroupNodeData;
  selected?: boolean;
}

const GroupNode = memo(({ data, selected }: GroupNodeProps) => {
  const [dimensions, setDimensions] = useState({ width: 300, height: 250 });
  const reactFlow = useReactFlow();

  const onResize = useCallback(
    (_: any, { width, height }: { width: number; height: number }) => {
      setDimensions({ width, height });

      // Adjust child nodes when group is resized
      //   if (data.children) {
      //     const childNodes = reactFlow
      //       .getNodes()
      //       .filter((node) => data.children?.includes(node.id));

      //     const updatedNodes = childNodes.map((childNode) => {
      //       // Ensure child nodes stay within group bounds
      //       const childPosition = {
      //         x: Math.max(0, Math.min(childNode.position.x, width - 100)),
      //         y: Math.max(0, Math.min(childNode.position.y, height - 100)),
      //       };

      //       return {
      //         ...childNode,
      //         parentNode: childNode.parentNode,
      //         position: childPosition,
      //       };
      //     });

      //     reactFlow.setNodes((nodes) =>
      //       nodes.map(
      //         (node) =>
      //           updatedNodes.find((updated) => updated.id === node.id) || node
      //       )
      //     );
      //   }
    },
    [data.children, reactFlow]
  );

  return (
    <div
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
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
