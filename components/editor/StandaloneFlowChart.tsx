"use client"
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState } from "reactflow"
import "reactflow/dist/style.css"
import { edgeTypes, nodeTypes, onReactFlowError } from "../canvas-new/flow-config"

interface StandaloneFlowChartProps {
  nodes: any[]
  edges: any[]
  title: string
}

export default function StandaloneFlowChart({ nodes, edges, title }: StandaloneFlowChartProps) {
  const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes)
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges)

  return (
    <div className="flow-chart-container" style={{ width: "100%", height: "300px", marginBottom: "20px" }}>
      <h3 style={{ textAlign: "center", marginBottom: "10px" }}>{title}</h3>
      <div style={{ width: "100%", height: "250px", border: "1px solid #ddd", borderRadius: "4px" }}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onError={onReactFlowError}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-right"
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  )
}
