// Sample ReactFlow diagrams data
export const reactFlowDiagrams = [
  {
    id: "flow-1",
    title: "Simple Workflow",
    description: "A basic workflow with sequential steps",
    flowData: {
      nodes: [
        { id: "1", position: { x: 250, y: 5 }, data: { label: "Start" } },
        { id: "2", position: { x: 250, y: 100 }, data: { label: "Process" } },
        { id: "3", position: { x: 250, y: 200 }, data: { label: "Decision" } },
        { id: "4", position: { x: 100, y: 300 }, data: { label: "Option A" } },
        { id: "5", position: { x: 400, y: 300 }, data: { label: "Option B" } },
      ],
      edges: [
        { id: "e1-2", source: "1", target: "2" },
        { id: "e2-3", source: "2", target: "3" },
        { id: "e3-4", source: "3", target: "4" },
        { id: "e3-5", source: "3", target: "5" },
      ],
    },
  },
  {
    id: "flow-2",
    title: "System Architecture",
    description: "A diagram showing system components and their relationships",
    flowData: {
      nodes: [
        { id: "1", position: { x: 250, y: 50 }, data: { label: "Frontend" } },
        {
          id: "2",
          position: { x: 250, y: 150 },
          data: { label: "API Gateway" },
        },
        { id: "3", position: { x: 100, y: 250 }, data: { label: "Service A" } },
        { id: "4", position: { x: 250, y: 250 }, data: { label: "Service B" } },
        { id: "5", position: { x: 400, y: 250 }, data: { label: "Service C" } },
        { id: "6", position: { x: 250, y: 350 }, data: { label: "Database" } },
      ],
      edges: [
        { id: "e1-2", source: "1", target: "2" },
        { id: "e2-3", source: "2", target: "3" },
        { id: "e2-4", source: "2", target: "4" },
        { id: "e2-5", source: "2", target: "5" },
        { id: "e3-6", source: "3", target: "6" },
        { id: "e4-6", source: "4", target: "6" },
        { id: "e5-6", source: "5", target: "6" },
      ],
    },
  },
  {
    id: "flow-3",
    title: "Data Flow Diagram",
    description: "A diagram showing how data flows through a system",
    flowData: {
      nodes: [
        {
          id: "1",
          position: { x: 100, y: 100 },
          data: { label: "User Input" },
        },
        {
          id: "2",
          position: { x: 300, y: 100 },
          data: { label: "Validation" },
        },
        {
          id: "3",
          position: { x: 500, y: 100 },
          data: { label: "Processing" },
        },
        {
          id: "4",
          position: { x: 300, y: 200 },
          data: { label: "Data Store" },
        },
        { id: "5", position: { x: 500, y: 300 }, data: { label: "Output" } },
      ],
      edges: [
        { id: "e1-2", source: "1", target: "2" },
        { id: "e2-3", source: "2", target: "3" },
        { id: "e3-4", source: "3", target: "4" },
        { id: "e4-3", source: "4", target: "3" },
        { id: "e3-5", source: "3", target: "5" },
      ],
    },
  },
  {
    id: "flow-4",
    title: "State Machine",
    description: "A state machine diagram showing transitions between states",
    flowData: {
      nodes: [
        { id: "1", position: { x: 250, y: 50 }, data: { label: "Initial" } },
        { id: "2", position: { x: 100, y: 150 }, data: { label: "Loading" } },
        { id: "3", position: { x: 400, y: 150 }, data: { label: "Ready" } },
        { id: "4", position: { x: 100, y: 300 }, data: { label: "Error" } },
        { id: "5", position: { x: 400, y: 300 }, data: { label: "Success" } },
      ],
      edges: [
        { id: "e1-2", source: "1", target: "2" },
        { id: "e2-3", source: "2", target: "3" },
        { id: "e2-4", source: "2", target: "4" },
        { id: "e3-5", source: "3", target: "5" },
        { id: "e4-2", source: "4", target: "2" },
        { id: "e5-2", source: "5", target: "2" },
      ],
    },
  },
];
