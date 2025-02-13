"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCanvas: (name: string, description: string) => void;
}

export function CreateCanvasModal({
  isOpen,
  onClose,
  onCreateCanvas,
}: CreateCanvasModalProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  const handleCreate = () => {
    if (name.trim()) {
      onCreateCanvas(name, description);
      setName("");
      setDescription("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Canvas</DialogTitle>
          <DialogDescription>
            Enter a name and description for your new canvas.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              id="name"
              placeholder="Canvas name"
              className="col-span-4"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Textarea
              id="description"
              placeholder="Canvas description"
              className="col-span-4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create Canvas</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
