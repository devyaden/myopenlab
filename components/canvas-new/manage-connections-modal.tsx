import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ManageConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: any;
  nodes: any[];
  edges: any[];
  onCreateConnection: (sourceId: string, targetId: string) => void;
  onDeleteConnection: (connectionId: string) => void;
}

export default function ManageConnectionsModal({
  isOpen,
  onClose,
  selectedNode,
  nodes,
  edges,
  onCreateConnection,
  onDeleteConnection,
}: ManageConnectionsModalProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [connections, setConnections] = useState<any[]>([]);

  useEffect(() => {
    if (selectedNode) {
      const nodeConnections = edges.filter(
        (edge) =>
          edge.source === selectedNode.id || edge.target === selectedNode.id
      );
      setConnections(nodeConnections);
    }
  }, [selectedNode, edges]);

  const handleCreateConnection = () => {
    if (selectedNode && selectedTargetId) {
      onCreateConnection(selectedNode.id, selectedTargetId);
      setSelectedTargetId("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Manage Connections for {selectedNode?.data.label}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-connection" className="text-sm font-medium">
              Create New Connection
            </Label>
            <div className="flex items-center space-x-2">
              <Select
                value={selectedTargetId}
                onValueChange={setSelectedTargetId}
              >
                <SelectTrigger id="new-connection" className="flex-1">
                  <SelectValue placeholder="Select a node" />
                </SelectTrigger>
                <SelectContent>
                  {nodes
                    .filter((node) => node.id !== selectedNode?.id)
                    .map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.data.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleCreateConnection}
                disabled={!selectedTargetId}
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Existing Connections</Label>
            <ScrollArea className="h-[200px] w-full rounded-md border">
              {connections.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">
                  No existing connections
                </p>
              ) : (
                <div className="p-4 space-y-2">
                  {connections.map((connection) => (
                    <Card key={connection.id}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {connection.source === selectedNode?.id
                              ? "To:"
                              : "From:"}
                          </span>
                          <span>
                            {
                              nodes.find(
                                (n) =>
                                  n.id ===
                                  (connection.source === selectedNode?.id
                                    ? connection.target
                                    : connection.source)
                              )?.data.label
                            }
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteConnection(connection.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
