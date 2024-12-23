import {
  InitialCanvasData,
  NodeData,
} from "@/components/canvas/FlowTable/types";
import { COLUMN_TYPES } from "@/types/column-types.enum";
import { ICreateColumn } from "@/types/flow-table.types";
import {
  findAbsolutePosition,
  getHelperLines,
  sortNodes,
} from "@/utils/canvas.utils";
import { createClient } from "@/utils/supabase/client";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
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

const useCanvas = () => {
  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);

  const [edges, setEdges] = useState<Edge[]>([]);
  const [canvasDetails, setCanvasDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [rfInstance, setRfInstance] = useState<any>(null);
  const [canvasTitle, setCanvasTitle] = useState<string>("My Canvas");
  const [isEditing, setIsEditing] = useState(false);
  const [relations, setRelations] = useState<any[]>([]);
  const connectingNodeId = useRef<string | null>(null);
  const [intersectingNode, setIntersectingNode] = useState<Node | any>(null);
  const [helperLineHorizontal, setHelperLineHorizontal] = useState<
    number | undefined
  >(undefined);
  const [helperLineVertical, setHelperLineVertical] = useState<
    number | undefined
  >(undefined);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { canvasId } = useCanvasParams();
  const supabase = createClient();
  const { toast } = useToast();
  const { screenToFlowPosition, setViewport, setCenter, getIntersectingNodes } =
    useReactFlow();

  const onAddNode = useCallback(
    async (nodeData: Partial<Node<NodeData>>) => {
      console.log("🚀 ~ nodeData:", nodeData);
      const id = nodeData?.id ?? nanoid();
      const newNode: Node = {
        id,
        type: nodeData.type || "custom",
        position: nodeData.position ?? { x: 0, y: 0 },
        draggable: true,
        style: nodeData.style || {},
        parentId: nodeData.parentId,
        extent: nodeData.extent,
        data: {
          shape: nodeData.data?.shape || "square",
          label: nodeData.data?.label || `New Node ${nodes.length + 1}`,
          onLabelChange: (newLabel: string) =>
            handleNodeDataChange(id, {
              label: newLabel,
            }),

          onNodeResize: (dimensions: { height: number; width: number }) => {
            handleNodeResizing(id, dimensions);
          },

          style: {},

          ...nodeData.data,
        },
      };

      setNodes((prevNodes) => [...prevNodes, newNode]);

      if (nodeData.type === "text") return; // Don't save text nodes to the database

      const { error, data } = await supabase.from("nodes").insert([
        {
          canvas_id: canvasDetails?.id,
          node_id: id,
          flow_data: newNode,
          custom_data: nodeData?.data?.customData ?? {},
        },
      ]);

      // await onSave();
      // await fetchCanvasDetails();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to sync node with the server",
          variant: "destructive",
        });
      }
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
    columns (id, name, data_type, validation, order, key),
    rollups (id, name, relation_id, target_column)
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
      router.replace("/protected");
    }

    if (data) {
      setCanvasTitle(data.name);

      setNodes(
        data?.nodes?.map((node: any) => {
          const nodeFromFlowData = data?.flow_data?.nodes?.find(
            (nd: any) => nd.id === node.node_id
          );

          const id = node?.node_id;

          return {
            ...node?.flow_data,
            ...nodeFromFlowData,
            data: {
              ...node?.flow_data?.data,
              onLabelChange: (newLabel: string) =>
                handleNodeDataChange(id, {
                  label: newLabel,
                }),

              onNodeResize: (dimensions: { height: number; width: number }) => {
                handleNodeResizing(id, dimensions);
              },
            },
          };
        })
      );
      setEdges(data?.flow_data?.edges);

      setCanvasDetails(data);
    }
    setLoading(false);
  };

  const handleFlowDataChange = async (data: InitialCanvasData) => {
    const { error, data: updatedCanvas } = await supabase
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

  const customApplyNodeChanges = useCallback(
    (changes: NodeChange[], nds: Node[]): Node[] => {
      // reset the helper lines (clear existing lines, if any)
      setHelperLineHorizontal(undefined);
      setHelperLineVertical(undefined);

      // this will be true if it's a single node being dragged
      // inside we calculate the helper lines and snap position for the position where the node is being moved to
      if (
        changes.length === 1 &&
        changes[0].type === "position" &&
        changes[0].dragging &&
        changes[0].position
      ) {
        // @ts-ignore
        const helperLines = getHelperLines(changes[0], nds);

        // if we have a helper line, we snap the node to the helper line position
        // this is being done by manipulating the node position inside the change object
        changes[0].position.x =
          helperLines.snapPosition.x ?? changes[0].position.x;
        changes[0].position.y =
          helperLines.snapPosition.y ?? changes[0].position.y;

        // if helper lines are returned, we set them so that they can be displayed
        setHelperLineHorizontal(helperLines.horizontal);
        setHelperLineVertical(helperLines.vertical);
      }

      return applyNodeChanges(changes, nds);
    },
    []
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((ns) => customApplyNodeChanges(changes, ns)),
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

  // testing
  const findGroupNodeAtPosition = (position: { x: number; y: number }) => {
    return nodes.find(
      (node: any) =>
        node.type === "group" &&
        position.x >= node.position.x &&
        position.x <= node.position.x + node.width &&
        position.y >= node.position.y &&
        position.y <= node.position.y + node.height
    );
  };

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
          type:
            shapeType === "group" || shapeType === "text"
              ? shapeType
              : "custom",
          position,
          draggable: true,
          data: {
            shape: shapeType,
            label: `New ${shapeType}`,
          },
        };

        const parentNode = findGroupNodeAtPosition(position);
        console.log("🚀 ~ parentNode:", parentNode);
        if (parentNode) {
          newNode.parentId = parentNode.id;
        }

        await onAddNode(newNode);
      }
    },
    [nodes, setNodes]
  );

  const onNodeDrag = useCallback((event: any, node: Node) => {
    connectingNodeId.current = node.id;

    const intersectingNodes = getIntersectingNodes(node, false);
    setIntersectingNode(intersectingNodes[intersectingNodes.length - 1]);
  }, []);

  const onNodeDragStop = (evt: any, node: Node) => {
    const connectingNodeIdCurrent = connectingNodeId?.current;
    const children = nodes.filter((n) => n.parentId === node.id);
    let sortedNodes: Node[];
    if (children.length == 0) {
      sortedNodes = [...nodes].sort((a, b) => {
        if (a.id === node.id) return 1;
        if (b.id === node.id) return -1;
        return 0;
      });
    } else {
      sortedNodes = sortNodes(node, nodes);
    }
    setNodes(sortedNodes);

    setNodes((nodes: Node[]) =>
      nodes.map((n) => {
        if (n.id === connectingNodeIdCurrent) {
          const absolutePosition = findAbsolutePosition(n, nodes);

          if (!intersectingNode) {
            return {
              ...n,
              parentId: "",
              position: absolutePosition,
            };
          } else if (n.id !== intersectingNode.id) {
            const targetAbsolutePosition = findAbsolutePosition(
              intersectingNode,
              nodes
            );
            return {
              ...n,
              parentId: intersectingNode.id,
              position: {
                x: absolutePosition.x - targetAbsolutePosition.x,
                y: absolutePosition.y - targetAbsolutePosition.y,
              },
            };
          }
        }
        return n;
      })
    );
  };

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

      const newNodes = nodes.map((node) => {
        if (deletedIds.includes(node.parentId as string)) {
          return {
            ...node,
            parentId: null,
          };
        }
        return node;
      });

      setNodes(newNodes as Node[]);

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

      onSave();
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
      let flow = rfInstance?.toObject();

      // flow = {
      //   nodes,
      //   edges,
      //   ...flow,
      // };

      // updated nodes flow data

      if (Boolean(flow?.nodes?.length)) await handleFlowDataChange(flow);

      // localStorage.setItem(flowKey, JSON.stringify(flow));
    }
  }, [rfInstance]);

  const handleTransform = useCallback(
    (x: number, y: number) => {
      setCenter(x, y, { duration: 800, zoom: 1 });
    },
    [setViewport]
  );

  const onNodeDragStart = (
    evt: React.DragEvent<HTMLDivElement>,
    node: Node
  ) => {
    connectingNodeId.current = node?.id;

    if (!node) return;
    setNodes((nodes) =>
      nodes.map((n) => {
        if (n.id === node?.id) {
          const absolutePosition = findAbsolutePosition(n, nodes);
          return {
            ...n,
            parentId: "",
            position: absolutePosition,
          };
        }
        return n;
      })
    );
  };

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

      await fetchCanvasRelations();
    } else if (newColumn.data_type === COLUMN_TYPES.ROLLUP) {
      const { data, error } = await supabase
        .from("rollups")
        .insert([
          {
            canvas_id: canvasDetails?.id,
            name: newColumn.name,
            relation_id: newColumn.relation_id,
            target_column: newColumn.target_column,
          },
        ])
        .select();
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to create new rollup",
          variant: "destructive",
        });

        throw error;
      }

      await fetchCanvasDetails();
    } else {
      const { data, error } = await supabase
        .from("columns")
        .insert([
          {
            canvas_id: canvasDetails?.id,
            data_type: newColumn.data_type,
            name: newColumn.name,
            order: newColumn.order,
            key: newColumn.key,
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

      await fetchCanvasDetails();
    }

    // await fetchCanvasDetails();
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
        description: "Failed to update node data",
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

    await fetchCanvasDetails();
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

  const fetchCanvasRelations = useCallback(async () => {
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
      .eq("source_canvas_id", canvasId);

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
  }, []);

  const handleDeleteColumn = async (columnId: number, type: COLUMN_TYPES) => {
    if (type === COLUMN_TYPES.RELATION) {
      const { error } = await supabase
        .from("relations")
        .delete()
        .eq("id", columnId);
      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete relation",
          variant: "destructive",
        });
      }
    } else if (type === COLUMN_TYPES.ROLLUP) {
      const { error } = await supabase
        .from("rollups")
        .delete()
        .eq("id", columnId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete rollup",
          variant: "destructive",
        });
      }
    } else {
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
    }
    await fetchCanvasRelations();
    await fetchCanvasDetails();
  };

  const handleNodeResizing = useCallback(
    (nodeId: string, newSize: { width: number; height: number }) => {
      setNodes((prevNodes: Node[]) =>
        prevNodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,

                data: {
                  ...node.data,
                  style: {
                    ...node?.data.style,
                    width: newSize.width,
                    height: newSize.height,
                  },
                },
              }
            : node
        )
      );
    },
    []
  );

  useEffect(() => {
    if (canvasId) {
      fetchCanvasDetails();
      fetchCanvasRelations();
    }
  }, [canvasId]);

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
    fetchCanvasDetails,

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
    helperLineHorizontal,
    helperLineVertical,
    onNodeDrag,
    onNodeDragStart,
    onNodeDragStop,
    handleNodeResizing,
  };
};

export default useCanvas;
