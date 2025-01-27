import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { PlusCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { NodeRelationModalProps } from "../FlowTable/types";

const NodeRelationModal: React.FC<NodeRelationModalProps> = ({
  nodeId,
  canvasId,
  folderId,
  onCreateRelation,
}) => {
  const [canvases, setCanvases] = useState<any[]>([]);
  const [selectedCanvas, setSelectedCanvas] = useState<any | null>(null);
  const [targetNodes, setTargetNodes] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCanvases = async () => {
      if (!isOpen || !folderId) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("canvas")
          .select(`id, name, flow_data`)
          .eq("folder_id", folderId)
          .neq("id", canvasId);

        if (error) {
          toast({
            title: "Error fetching canvases",
            description: error.message,
          });
        }
        if (data) setCanvases(data);
      } catch (error) {
        console.error("Error fetching canvases:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCanvases();
  }, [folderId, canvasId, isOpen]);

  useEffect(() => {
    if (selectedCanvas?.flow_data) {
      // @ts-ignore
      const nodes = selectedCanvas.flow_data?.nodes || [];
      setTargetNodes(nodes);
    }
  }, [selectedCanvas]);

  const handleCreateRelation = async (targetNodeId: string) => {
    if (!selectedCanvas) return;

    const relation = {
      source_canvas_id: canvasId,
      target_canvas_id: selectedCanvas.id,
      source_node_id: nodeId,
      target_node_id: targetNodeId,
      folder_id: folderId,
    };

    await onCreateRelation(relation);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mb-4">
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Relation
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-3xl bg-white shadow-lg p-6 rounded-lg"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Create Node Relation
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">
              Loading canvases...
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-700">
                  Select Canvas
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {canvases.map((canvas) => (
                    <Button
                      key={canvas.id}
                      variant={
                        selectedCanvas?.id === canvas.id ? undefined : "outline"
                      }
                      onClick={() => setSelectedCanvas(canvas)}
                      className="w-full justify-start p-2"
                    >
                      {canvas.name}
                    </Button>
                  ))}
                </div>
              </div>

              {selectedCanvas && (
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-700">
                    Select Target Node
                  </h3>
                  <Table className="w-full border border-gray-200">
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="py-2 px-4 text-left">
                          Node
                        </TableHead>
                        <TableHead className="py-2 px-4 text-left">
                          Type
                        </TableHead>
                        <TableHead className="py-2 px-4 text-left">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {targetNodes.map((node) => (
                        <TableRow
                          key={node.id}
                          className="hover:bg-gray-50 border-b"
                        >
                          <TableCell className="py-2 px-4">
                            {node.data.label}
                          </TableCell>
                          <TableCell className="py-2 px-4">
                            {node.data.shape}
                          </TableCell>
                          <TableCell className="py-2 px-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreateRelation(node.id)}
                              className="text-sm"
                            >
                              Select
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NodeRelationModal;
