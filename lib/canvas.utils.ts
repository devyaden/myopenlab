import { Node, NodePositionChange, XYPosition } from "reactflow";
import { Node as ReactflowNode } from "reactflow";

type GetHelperLinesResult = {
  horizontal?: number;
  vertical?: number;
  snapPosition: Partial<XYPosition>;
};

// this utility function can be called with a position change (inside onNodesChange)
// it checks all other nodes and calculated the helper line positions and the position where the current node should snap to
export function getHelperLines(
  change: NodePositionChange,
  nodes: Node[],
  distance = 5
): GetHelperLinesResult {
  const defaultResult = {
    horizontal: undefined,
    vertical: undefined,
    snapPosition: { x: undefined, y: undefined },
  };
  const nodeA = nodes.find((node) => node.id === change.id);

  if (!nodeA || !change.position) {
    return defaultResult;
  }

  const nodeABounds = {
    left: change.position.x,
    right: change.position.x + (nodeA?.width ?? 0),
    top: change.position.y,
    bottom: change.position.y + (nodeA?.height ?? 0),
    width: nodeA?.width ?? 0,
    height: nodeA?.height ?? 0,
  };

  let horizontalDistance = distance;
  let verticalDistance = distance;

  return nodes
    .filter((node) => node.id !== nodeA.id)
    .reduce<GetHelperLinesResult>((result, nodeB) => {
      const nodeBBounds = {
        left: nodeB.position.x,
        right: nodeB.position.x + (nodeB?.width ?? 0),
        top: nodeB.position.y,
        bottom: nodeB.position.y + (nodeB?.height ?? 0),
        width: nodeB?.width ?? 0,
        height: nodeB?.height ?? 0,
      };

      //  |‾‾‾‾‾‾‾‾‾‾‾|
      //  |     A     |
      //  |___________|
      //  |
      //  |
      //  |‾‾‾‾‾‾‾‾‾‾‾|
      //  |     B     |
      //  |___________|
      const distanceLeftLeft = Math.abs(nodeABounds.left - nodeBBounds.left);

      if (distanceLeftLeft < verticalDistance) {
        result.snapPosition.x = nodeBBounds.left;
        result.vertical = nodeBBounds.left;
        verticalDistance = distanceLeftLeft;
      }

      //  |‾‾‾‾‾‾‾‾‾‾‾|
      //  |     A     |
      //  |___________|
      //              |
      //              |
      //  |‾‾‾‾‾‾‾‾‾‾‾|
      //  |     B     |
      //  |___________|
      const distanceRightRight = Math.abs(
        nodeABounds.right - nodeBBounds.right
      );

      if (distanceRightRight < verticalDistance) {
        result.snapPosition.x = nodeBBounds.right - nodeABounds.width;
        result.vertical = nodeBBounds.right;
        verticalDistance = distanceRightRight;
      }

      //              |‾‾‾‾‾‾‾‾‾‾‾|
      //              |     A     |
      //              |___________|
      //              |
      //              |
      //  |‾‾‾‾‾‾‾‾‾‾‾|
      //  |     B     |
      //  |___________|
      const distanceLeftRight = Math.abs(nodeABounds.left - nodeBBounds.right);

      if (distanceLeftRight < verticalDistance) {
        result.snapPosition.x = nodeBBounds.right;
        result.vertical = nodeBBounds.right;
        verticalDistance = distanceLeftRight;
      }

      //  |‾‾‾‾‾‾‾‾‾‾‾|
      //  |     A     |
      //  |___________|
      //              |
      //              |
      //              |‾‾‾‾‾‾‾‾‾‾‾|
      //              |     B     |
      //              |___________|
      const distanceRightLeft = Math.abs(nodeABounds.right - nodeBBounds.left);

      if (distanceRightLeft < verticalDistance) {
        result.snapPosition.x = nodeBBounds.left - nodeABounds.width;
        result.vertical = nodeBBounds.left;
        verticalDistance = distanceRightLeft;
      }

      //  |‾‾‾‾‾‾‾‾‾‾‾|‾‾‾‾‾|‾‾‾‾‾‾‾‾‾‾‾|
      //  |     A     |     |     B     |
      //  |___________|     |___________|
      const distanceTopTop = Math.abs(nodeABounds.top - nodeBBounds.top);

      if (distanceTopTop < horizontalDistance) {
        result.snapPosition.y = nodeBBounds.top;
        result.horizontal = nodeBBounds.top;
        horizontalDistance = distanceTopTop;
      }

      //  |‾‾‾‾‾‾‾‾‾‾‾|
      //  |     A     |
      //  |___________|_________________
      //                    |           |
      //                    |     B     |
      //                    |___________|
      const distanceBottomTop = Math.abs(nodeABounds.bottom - nodeBBounds.top);

      if (distanceBottomTop < horizontalDistance) {
        result.snapPosition.y = nodeBBounds.top - nodeABounds.height;
        result.horizontal = nodeBBounds.top;
        horizontalDistance = distanceBottomTop;
      }

      //  |‾‾‾‾‾‾‾‾‾‾‾|     |‾‾‾‾‾‾‾‾‾‾‾|
      //  |     A     |     |     B     |
      //  |___________|_____|___________|
      const distanceBottomBottom = Math.abs(
        nodeABounds.bottom - nodeBBounds.bottom
      );

      if (distanceBottomBottom < horizontalDistance) {
        result.snapPosition.y = nodeBBounds.bottom - nodeABounds.height;
        result.horizontal = nodeBBounds.bottom;
        horizontalDistance = distanceBottomBottom;
      }

      //                    |‾‾‾‾‾‾‾‾‾‾‾|
      //                    |     B     |
      //                    |           |
      //  |‾‾‾‾‾‾‾‾‾‾‾|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
      //  |     A     |
      //  |___________|
      const distanceTopBottom = Math.abs(nodeABounds.top - nodeBBounds.bottom);

      if (distanceTopBottom < horizontalDistance) {
        result.snapPosition.y = nodeBBounds.bottom;
        result.horizontal = nodeBBounds.bottom;
        horizontalDistance = distanceTopBottom;
      }

      return result;
    }, defaultResult);
}

export const sortNodes = (node: ReactflowNode, nodes: ReactflowNode[]) => {
  nodes = [...nodes].sort((a, b) => {
    if (a.id === node.id) return 1;
    if (b.id === node.id) return -1;
    return 0;
  });
  const children = nodes.filter((n) => n.parentId === node.id);
  children.forEach((child) => {
    nodes = sortNodes(child, nodes);
  });

  return nodes;
};

export const findAbsolutePosition = (
  currentNode: ReactflowNode,
  allNodes: ReactflowNode[]
): { x: number; y: number } => {
  if (!currentNode?.parentId) {
    return { x: currentNode.position.x, y: currentNode.position.y };
  }

  const parentNode = allNodes.find((n) => n.id === currentNode.parentId);
  if (!parentNode) {
    return { x: currentNode.position.x, y: currentNode.position.y };
    //throw new Error(`Parent node with id ${currentNode.parentId} not found`);
  }

  const parentPosition = findAbsolutePosition(parentNode, allNodes);
  return {
    x: parentPosition.x + currentNode.position.x,
    y: parentPosition.y + currentNode.position.y,
  };
};

// COMPLETE INTEGRATION GUIDE

// 1. First, add these utility functions to your utils file or create a new one:

/**
 * Calculate the overlap percentage between two rectangles
 * Returns the percentage of rect1 that overlaps with rect2
 */
export const calculateOverlapPercentage = (
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): number => {
  const left = Math.max(rect1.x, rect2.x);
  const right = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
  const top = Math.max(rect1.y, rect2.y);
  const bottom = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);

  if (left >= right || top >= bottom) {
    return 0;
  }

  const intersectionArea = (right - left) * (bottom - top);
  const rect1Area = rect1.width * rect1.height;
  return (intersectionArea / rect1Area) * 100;
};

export const shouldGroupNodes = (
  draggedNode: { x: number; y: number; width: number; height: number },
  targetNode: { x: number; y: number; width: number; height: number },
  overlapThreshold: number = 60
): boolean => {
  const overlapPercentage = calculateOverlapPercentage(draggedNode, targetNode);
  return overlapPercentage >= overlapThreshold;
};

export const findBestParentNode = (
  draggedNode: any,
  allNodes: any[],
  absolutePosition: { x: number; y: number }
): any | null => {
  const draggedRect = {
    x: absolutePosition.x,
    y: absolutePosition.y,
    width: draggedNode.width || 100,
    height: draggedNode.height || 100,
  };

  let bestCandidate: any | null = null;
  let highestOverlap = 0;

  for (const node of allNodes) {
    if (node.id === draggedNode.id || node.parentNode === draggedNode.id) {
      continue;
    }

    const nodeRect = {
      x: node.position.x,
      y: node.position.y,
      width: node.width || 100,
      height: node.height || 100,
    };

    if (shouldGroupNodes(draggedRect, nodeRect)) {
      const overlapPercentage = calculateOverlapPercentage(
        draggedRect,
        nodeRect
      );
      if (overlapPercentage > highestOverlap) {
        highestOverlap = overlapPercentage;
        bestCandidate = node;
      }
    }
  }

  return bestCandidate;
};
