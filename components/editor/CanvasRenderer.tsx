"use client"

// This component needs significant improvements to properly render ReactFlow canvases

import { useEffect, useState } from "react"
import ReactFlow, { Background, Controls, MiniMap } from "reactflow"
import "reactflow/dist/style.css"

interface CanvasRendererProps {
  canvasData: string
}

export default function CanvasRenderer({ canvasData }: CanvasRendererProps) {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      if (canvasData) {
        const parsedData = JSON.parse(canvasData)
        setNodes(parsedData.nodes || [])
        setEdges(parsedData.edges || [])
        setLoaded(true)
      }
    } catch (error) {
      console.error("Error parsing canvas data:", error)
    }
  }, [canvasData])

  if (!loaded) {
    return <div>Loading canvas...</div>
  }

  return (
    <div style={{ height: 300, width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        attributionPosition="bottom-right"
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
