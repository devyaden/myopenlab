import { HierarchyItem } from "@/lib/interfaces/canvas";
import { useCallback, useReducer } from "react";
import { Edge, Node } from "reactflow";

interface State {
  nodes: Node[];
  edges: Edge[];
  hierarchyData: HierarchyItem[];
}

interface HistoryState extends State {
  past: State[];
  future: State[];
}

type Action =
  | { type: "SET_NODES"; payload: Node[] }
  | { type: "SET_EDGES"; payload: Edge[] }
  | { type: "SET_HIERARCHY_DATA"; payload: HierarchyItem[] }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET" };

const initialState: HistoryState = {
  nodes: [],
  edges: [],
  hierarchyData: [],
  past: [],
  future: [],
};

function historyReducer(state: HistoryState, action: Action): HistoryState {
  const { past, nodes, edges, hierarchyData } = state;

  switch (action.type) {
    case "SET_NODES":
      return {
        past: [...past, { nodes, edges, hierarchyData }],
        nodes: action.payload,
        edges,
        hierarchyData,
        future: [],
      };
    case "SET_EDGES":
      return {
        past: [...past, { nodes, edges, hierarchyData }],
        nodes,
        edges: action.payload,
        hierarchyData,
        future: [],
      };
    case "SET_HIERARCHY_DATA":
      return {
        past: [...past, { nodes, edges, hierarchyData }],
        nodes,
        edges,
        hierarchyData: action.payload,
        future: [],
      };
    case "UNDO":
      if (past.length === 0) return state;
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      return {
        past: newPast,
        nodes: previous.nodes,
        edges: previous.edges,
        hierarchyData: previous.hierarchyData,
        future: [{ nodes, edges, hierarchyData }, ...state.future],
      };
    case "REDO":
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...past, { nodes, edges, hierarchyData }],
        nodes: next.nodes,
        edges: next.edges,
        hierarchyData: next.hierarchyData,
        future: newFuture,
      };
    case "RESET":
      return {
        ...initialState,
        past: [...past, { nodes, edges, hierarchyData }],
      };
    default:
      return state;
  }
}

export function useHistory(
  initialNodes: Node[],
  initialEdges: Edge[],
  initialHierarchyData: HierarchyItem[]
) {
  const [state, dispatch] = useReducer(historyReducer, {
    ...initialState,
    nodes: initialNodes,
    edges: initialEdges,
    hierarchyData: initialHierarchyData,
  });

  const setNodes = useCallback((newNodes: Node[]) => {
    dispatch({ type: "SET_NODES", payload: newNodes });
  }, []);

  const setEdges = useCallback((newEdges: Edge[]) => {
    dispatch({ type: "SET_EDGES", payload: newEdges });
  }, []);

  const setHierarchyData = useCallback((newHierarchyData: HierarchyItem[]) => {
    dispatch({ type: "SET_HIERARCHY_DATA", payload: newHierarchyData });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    nodes: state.nodes,
    edges: state.edges,
    hierarchyData: state.hierarchyData,
    setNodes,
    setEdges,
    setHierarchyData,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
