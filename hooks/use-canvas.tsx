import {
  InitialCanvasData,
  NodeData,
} from "@/components/canvas/FlowTable/types";
import { createClient } from "@/utils/supabase/client";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Edge, Node } from "reactflow";
import { useToast } from "./use-toast";

interface useCanvasProps {
  canvasId: string;
}

const useCanvas = ({ canvasId }: useCanvasProps) => {
  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [canvasDetails, setCanvasDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [rfInstance, setRfInstance] = useState<any>(null);
  const [canvasTitle, setCanvasTitle] = useState<string>("My Canvas");
  const [isEditing, setIsEditing] = useState(false);

  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const onAddNode = useCallback(
    async (nodeData: Partial<Node<NodeData>>) => {
      const id = nanoid();
      const newNode: Node = {
        id,
        type: nodeData.type || "custom",
        position: { x: 0, y: 0 },
        draggable: true,
        style: nodeData.style || {},
        parentId: nodeData.parentId,
        extent: nodeData.extent,
        data: {
          shape: nodeData.data?.shape || "rectangle",
          label: nodeData.data?.label || `New Node ${nodes.length + 1}`,
          onLabelChange: (newLabel: string) =>
            handleNodeLabelChange(id, newLabel),
          ...nodeData.data,
        },
      };

      const { error, data } = await supabase.from("nodes").insert([
        {
          canvas_id: canvasDetails?.id,
        },
      ]);

      setNodes((prevNodes) => [...prevNodes, newNode]);
    },
    [nodes]
  );

  const handleNodeLabelChange = useCallback(
    (nodeId: string, newLabel: string) => {
      console.log("🚀 ~ handleNodeLabelChange ~ nodeId:", nodeId, newLabel);
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                label: newLabel,
              },
            };
          }
          return node;
        })
      );
    },
    []
  );

  // Handler for deleting nodes
  const onDeleteNode = useCallback(
    (nodeId: string) => {
      // remove childresn and their edges

      // First remove any connected edges
      const newEdges = edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );
      setEdges(newEdges);

      // Then remove the node
      setNodes((prevNodes) =>
        prevNodes.filter(
          (node) => node.id !== nodeId || node.parentId === nodeId
        )
      );
    },
    [edges]
  );

  const onSave = useCallback(() => {
    if (rfInstance) {
      const flow = rfInstance?.toObject();
      console.log("🚀 ~ onSave ~ flow:", flow);

      handleFlowDataChange(flow);

      // localStorage.setItem(flowKey, JSON.stringify(flow));
    }
  }, [rfInstance]);

  const handleTitleChange = async (newTitle: string) => {
    setCanvasTitle(newTitle);
    setIsEditing(false);

    if (canvasDetails) {
      // Update existing canvas title
      const { error } = await supabase
        .from("canvases")
        .update({ name: newTitle })
        .eq("id", canvasId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update canvas title",
          variant: "destructive",
        });
      }
    }
  };

  const fetchCanvasDetails = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("canvases")
      .select("*")
      .eq("id", canvasId)
      .single();
    console.log("🚀 ~ fetchCanvasDetails ~ data:", data);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch canvas data",
        variant: "destructive",
      });
      router.back();
    }

    if (data) {
      setCanvasTitle(data.name);

      setCanvasDetails(data);
    }
    setLoading(false);
  };

  const handleFlowDataChange = async (data: InitialCanvasData) => {
    const { error } = await supabase
      .from("canvases")
      .update({
        flow_data: data,
      })
      .eq("id", canvasId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save the changes",
        variant: "destructive",
      });
    } else {
      toast({
        title: "success",
        description: "Changes saved successfully",
      });
    }
  };

  const handleCreateNewConnection = async (data: any) => {
    console.log("handleCreateNewConnection", data);
    const { error } = await supabase
      .from("node_connections")
      .insert([data])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create new connection",
        variant: "destructive",
      });
    }

    toast({
      title: "نجاح",
      description: "تم إنشاء الملف بنجاح",
    });
  };

  // fetch canvas data
  useEffect(() => {
    fetchCanvasDetails();
  }, [canvasId]);

  return {
    nodes,
    onAddNode,
    onDeleteNode,
    edges,
    setEdges,
    canvasDetails,
    loading,
    rfInstance,
    setRfInstance,
    canvasTitle,
    setCanvasTitle,
    isEditing,
    setIsEditing,
    handleTitleChange,
    onSave,
    handleFlowDataChange,
    handleCreateNewConnection,
  };
};

export default useCanvas;
