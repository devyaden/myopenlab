"use client";

import CustomEdge from "@/components/canvas-new/custom-edge";
import { GenericNode } from "@/components/canvas-new/nodes/generic-node";
import { ImageNode } from "@/components/canvas-new/nodes/image-node";
import { SwimlaneNode } from "@/components/canvas-new/nodes/swimlane-node";
import { TextNode } from "@/components/canvas-new/nodes/text-node";
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
import ReactFlow, {
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

export type ReactFlowData = {
  id: string;
  title: string;
  description?: string;
  flowData: {
    nodes: any[];
    edges: any[];
  };
};

const nodeTypes = {
  genericNode: GenericNode,
  swimlaneNode: SwimlaneNode,
  textNode: TextNode,
  imageNode: ImageNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

export type SerializedReactFlowNode = Spread<
  {
    flowId: string;
    title: string;
    flowData: {
      nodes: any[];
      edges: any[];
    };
  },
  SerializedLexicalNode
>;

export class ReactFlowNode extends DecoratorNode<JSX.Element> {
  __flowId: string;
  __title: string;
  __flowData: {
    nodes: any[];
    edges: any[];
  };

  static getType(): string {
    return "react-flow";
  }

  static clone(node: ReactFlowNode): ReactFlowNode {
    return new ReactFlowNode(
      node.__flowId,
      node.__title,
      node.__flowData,
      node.__key
    );
  }

  constructor(
    flowId: string,
    title: string,
    flowData: { nodes: any[]; edges: any[] },
    key?: NodeKey
  ) {
    super(key);
    this.__flowId = flowId;
    this.__title = title;
    this.__flowData = flowData;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement("div");
    div.className = "react-flow-container";
    return div;
  }

  updateDOM(): false {
    return false;
  }

  getFlowId(): string {
    return this.__flowId;
  }

  getTitle(): string {
    return this.__title;
  }

  getFlowData(): { nodes: any[]; edges: any[] } {
    return this.__flowData;
  }

  static importJSON(serializedNode: SerializedReactFlowNode): ReactFlowNode {
    const { flowId, title, flowData } = serializedNode;
    const node = new ReactFlowNode(flowId, title, flowData);
    return node;
  }

  exportJSON(): SerializedReactFlowNode {
    return {
      flowId: this.__flowId,
      title: this.__title,
      flowData: this.__flowData,
      type: "react-flow",
      version: 1,
    };
  }

  decorate(editor: LexicalEditor): JSX.Element {
    return (
      <ReactFlowComponent
        flowId={this.__flowId}
        title={this.__title}
        flowData={this.__flowData}
        nodeKey={this.__key}
      />
    );
  }
}

// Separate the flow rendering into its own component
function FlowRenderer({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
}: {
  nodes: any[];
  edges: any[];
  onNodesChange: any;
  onEdgesChange: any;
}) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    fitView && fitView();
  }, [nodes, edges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      // fitViewOptions={{ padding: 1 }}
      edgesFocusable={false}
      nodesDraggable={false}
      nodesConnectable={false}
      nodesFocusable={false}
      draggable={false}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      panOnDrag={false}
      elementsSelectable={false}
      // Optional if you also want to lock zooming
      zoomOnDoubleClick={false}
      minZoom={0.2}
      maxZoom={0.2}
      proOptions={{
        hideAttribution: true,
      }}
    ></ReactFlow>
  );
}

function ReactFlowComponent({
  flowId,
  title,
  flowData,
  nodeKey,
}: {
  flowId: string;
  title: string;
  flowData: { nodes: any[]; edges: any[] };
  nodeKey: NodeKey;
}): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState(flowData?.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowData?.edges);
  const reactFlowWrapper = useRef(null);

  return (
    <div className="my-4 border border-gray-200 rounded-md overflow-hidden shadow-sm">
      {/* <div className="bg-gray-50 p-2 flex justify-between items-center">
        <h3 className="text-sm font-medium">{title}</h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs bg-white border border-gray-300 rounded px-2 py-1"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div> */}
      <div
        className={`transition-all duration-300 ${expanded ? "h-[500px]" : "h-[300px]"}`}
        style={{ width: "100%" }}
        ref={reactFlowWrapper}
      >
        <ReactFlowProvider>
          <FlowRenderer
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}

export function $createReactFlowNode(
  flowId: string,
  title: string,
  flowData: { nodes: any[]; edges: any[] }
): ReactFlowNode {
  return new ReactFlowNode(flowId, title, flowData);
}

export function $isReactFlowNode(
  node: LexicalNode | null | undefined
): node is ReactFlowNode {
  return node instanceof ReactFlowNode;
}
