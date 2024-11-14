import {
  InitialCanvasData,
  NodeData,
} from "@/components/canvas/FlowTable/types";
import { createClient } from "@/utils/supabase/client";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  Edge,
  EdgeChange,
  MarkerType,
  Node,
  NodeChange,
  useReactFlow,
} from "reactflow";
import useCanvasParams from "./use-canvas-params";
import { useToast } from "./use-toast";
import { ICreateColumn } from "@/types/flow-table.types";
import { COLUMN_TYPES } from "@/types/column-types.enum";

const useCanvas = () => {
  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [canvasDetails, setCanvasDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [rfInstance, setRfInstance] = useState<any>(null);
  const [canvasTitle, setCanvasTitle] = useState<string>("My Canvas");
  const [isEditing, setIsEditing] = useState(false);
  const [relations, setRelations] = useState<any[]>([]);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const { canvasId } = useCanvasParams();

  const supabase = createClient();
  const { toast } = useToast();
  const { screenToFlowPosition, setViewport, setCenter } = useReactFlow();

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
            handleNodeDataChange(id, {
              label: newLabel,
            }),
          ...nodeData.data,
        },
      };

      setNodes((prevNodes) => [...prevNodes, newNode]);

      const { error, data } = await supabase.from("nodes").insert([
        {
          canvas_id: canvasDetails?.id,
          node_id: id,
          flow_data: newNode,
          custom_data: nodeData?.data?.customData ?? {},
        },
      ]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to sync node with the server",
          variant: "destructive",
        });
      }

      await onSave();
    },
    [nodes]
  );

  const handleNodeDataChange = useCallback(
    async (nodeId: string, newData: Partial<NodeData>) => {
      let effectedNode = null;

      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.id === nodeId) {
            const newNode = {
              ...node,
              data: {
                ...node.data,
                ...newData,
              },
            };
            effectedNode = newNode;
            return newNode;
          } else return node;
        })
      );

      if (!effectedNode) return;

      const { error } = await supabase
        .from("nodes")
        .update({ flow_data: effectedNode })
        .eq("node_id", nodeId);
    },
    []
  );

  // Handler for deleting nodes
  const onDeleteNode = useCallback(
    async (nodeId: string) => {
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

      // delete from db
      const { error } = await supabase
        .from("nodes")
        .delete()
        .eq("node_id", nodeId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to sync node with the server",
          variant: "destructive",
        });
      }
    },
    [edges]
  );

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
      .select(
        `
    *,
    nodes (id, node_id, flow_data, custom_data),
    columns (id, name, data_type, validation, order, key)
  `
      )
      .eq("id", canvasId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch canvas data",
        variant: "destructive",
      });
      //   router.back();
    }

    if (data) {
      setCanvasTitle(data.name);

      setNodes(data.flow_data?.nodes);
      setEdges(data?.flow_data?.edges);

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

  // canvas handling functions

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((ns) => applyNodeChanges(changes, ns)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((es) => applyEdgeChanges(changes, es)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `e${params.source}-${params.target}`,
        markerEnd: { type: MarkerType.ArrowClosed },
      };
      const newEdges = addEdge(newEdge, edges);
      setEdges(newEdges);
    },
    [edges, setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper?.current) return;

      const reactFlowBounds =
        reactFlowWrapper?.current?.getBoundingClientRect();
      const shapeType = event.dataTransfer.getData("application/reactflow");

      // Only create new node if we have a shape type (meaning it came from the sidebar)
      if (shapeType) {
        const position = screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const id = nanoid();

        const newNode: Node = {
          id,
          type: "custom",
          position,
          draggable: true,
          data: {
            shape: shapeType,
            label: `New ${shapeType}`,
          },
        };

        await onAddNode(newNode);
      }
    },
    [nodes, setNodes]
  );

  const onNodesDelete = useCallback(
    async (deleted: Node[]) => {
      const newEdges = edges.filter(
        (edge) =>
          !deleted.some(
            (node) => node.id === edge.source || node.id === edge.target
          )
      );
      setEdges(newEdges);

      const deletedIds = deleted.map((deletedNode) => deletedNode.id);

      // delete from db
      const { data, error } = await supabase
        .from("nodes")
        .delete()
        .in("node_id", deletedIds);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to sync node with the server",
          variant: "destructive",
        });
      }
    },
    [edges, setEdges]
  );

  // table handler functions

  const onUpdateNode = useCallback(
    (nodeId: string, newData: Partial<NodeData>) => {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...newData,
                },
              }
            : node
        )
      );
    },
    []
  );

  // Handler for updating edges
  const onUpdateEdge = useCallback(
    (changes: { id: string; source?: string; target?: string }) => {
      setEdges((prevEdges) =>
        prevEdges.map((edge) =>
          edge.id === changes.id
            ? {
                ...edge,
                source: changes.source || edge.source,
                target: changes.target || edge.target,
              }
            : edge
        )
      );
    },
    []
  );

  // Handler for deleting edges
  const onDeleteEdge = useCallback((edgeId: string) => {
    setEdges((prevEdges) => prevEdges.filter((edge) => edge.id !== edgeId));
  }, []);

  // Handler for adding new edges
  const onAddEdge = useCallback((edge: Partial<Edge>) => {
    const newEdge: Edge = {
      id: `e${edge.source}-${edge.target}`,
      source: edge.source!,
      target: edge.target!,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed },
      ...edge,
    };
    setEdges((prevEdges) => [...prevEdges, newEdge]);
  }, []);

  const onSave = useCallback(async () => {
    if (rfInstance) {
      const flow = rfInstance?.toObject();

      await handleFlowDataChange(flow);

      // localStorage.setItem(flowKey, JSON.stringify(flow));
    }
  }, [rfInstance]);

  const handleTransform = useCallback(
    (x: number, y: number) => {
      setCenter(x, y, { duration: 800, zoom: 1 });
    },
    [setViewport]
  );

  // canvas handling functions end here

  // flowtable functions

  const handleNewColumnCreation = async (newColumn: ICreateColumn) => {
    if (newColumn.data_type === COLUMN_TYPES.RELATION) {
      const { data, error } = await supabase
        .from("relations")
        .insert([
          {
            source_canvas_id: canvasDetails?.id,
            name: newColumn.name,
            target_canvas_id: newColumn.target_canvas_id,
          },
        ])
        .select();
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to create new relation",
          variant: "destructive",
        });

        throw error;
      }
    } else {
      const { data, error } = await supabase
        .from("columns")
        .insert([
          {
            canvas_id: canvasDetails?.id,
            ...newColumn,
          },
        ])
        .select();
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to create new column",
          variant: "destructive",
        });

        throw error;
      }
    }
  };

  const handleNodeCustomDataChange = async (nodeId: string, newData: any) => {
    const { data: existingNode, error } = await supabase
      .from("nodes")
      .select("custom_data")
      .eq("node_id", nodeId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update node dat",
        variant: "destructive",
      });
      return;
    }

    const updatedData = {
      ...existingNode.custom_data,
      ...newData,
    };

    const { error: updateError } = await supabase
      .from("nodes")
      .update({ custom_data: updatedData })
      .eq("node_id", nodeId);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to update node data",
        variant: "destructive",
      });
    }
  };

  const fetchFolderCanvases = async () => {
    const { data, error } = await supabase
      .from("canvases")
      .select("*")
      .eq("folder_id", canvasDetails?.folder_id)
      .neq("id", canvasDetails?.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch folder canvases",
        variant: "destructive",
      });
    }

    return { data, error };
  };

  const fetchCanvasRelations = async () => {
    const { data, error } = await supabase
      .from("relations")
      .select(
        `
      *,
      source_canvas:source_canvas_id (
        id, 
        name, 
        columns (id, name, data_type, validation, order, key)
      ),
      target_canvas:target_canvas_id (
        id, 
        name, 
        columns (id, name, data_type, validation, order, key),
        nodes (id, node_id, flow_data, custom_data)
      )
    `
      )
      .eq("source_canvas_id", canvasDetails?.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch relations",
        variant: "destructive",
      });
    }

    if (!error) {
      setRelations(data);
    }
  };

  const handleDeleteColumn = async (columnId: number) => {
    const { error } = await supabase
      .from("columns")
      .delete()
      .eq("id", columnId);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete column",
        variant: "destructive",
      });
    }
  };
  // flowtable functions end here

  // fetch canvas data
  useEffect(() => {
    fetchCanvasDetails();
  }, [canvasId, nodes.length]);

  useEffect(() => {
    if (canvasDetails) {
      fetchCanvasRelations();
    }
  }, [canvasDetails]);

  return {
    nodes,
    setNodes,
    onAddNode,
    onDeleteNode,
    edges,
    canvasDetails,
    loading,
    canvasTitle,
    setCanvasTitle,
    isEditing,
    setIsEditing,
    handleTitleChange,
    onSave,
    handleFlowDataChange,
    handleCreateNewConnection,

    // canvas functions
    onNodesChange,
    onEdgesChange,
    setEdges,
    reactFlowWrapper,
    onDragOver,
    onDrop,
    onNodesDelete,
    onUpdateNode,
    onUpdateEdge,
    onDeleteEdge,
    onAddEdge,
    onConnect,
    handleTransform,
    rfInstance,
    setRfInstance,

    // flow table
    handleNewColumnCreation,
    handleNodeCustomDataChange,
    fetchFolderCanvases,
    relations,
    handleDeleteColumn,
  };
};

export default useCanvas;
