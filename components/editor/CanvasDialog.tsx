"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { EntityPicker } from "./EntityPicker";
import { useDocumentStore } from "./hooks/useDocument";
import type { MentionFile } from "./hooks/useFileSearch";

interface CanvasDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCanvas: (canvasData: any) => void;
  /** Kept for back-compat; the picker is now cross-folder via EntityPicker. */
  canvases?: any[];
}

/**
 * Phase 5c: the flow-embed picker, now the shared searchable, folder-grouped
 * EntityPicker (cross-folder) instead of a folder-scoped live-preview grid.
 * The cross-folder cache row is lightweight, so the chosen playbook's flow is
 * fetched on Insert via the document store's refreshSingleCanvas.
 */
export default function CanvasDialog({
  isOpen,
  onClose,
  onInsertCanvas,
}: CanvasDialogProps) {
  const [selectedFile, setSelectedFile] = useState<MentionFile | null>(null);
  const [inserting, setInserting] = useState(false);

  // The dialog component stays mounted (only the Radix portal toggles), so reset
  // transient state on close — else a successful insert leaves it stuck.
  useEffect(() => {
    if (!isOpen) {
      setInserting(false);
      setSelectedFile(null);
    }
  }, [isOpen]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        document.body.style.pointerEvents = "";
        onClose();
      }
    },
    [onClose]
  );

  const handleInsert = useCallback(async () => {
    if (!selectedFile || inserting) return;
    setInserting(true);
    try {
      const full = await useDocumentStore
        .getState()
        .refreshSingleCanvas(selectedFile.id);
      const flow = full?.flowData?.[0];
      if (!flow || !Array.isArray(flow.nodes) || flow.nodes.length === 0) {
        toast.error("That playbook has no flow to embed yet.");
        setInserting(false);
        return;
      }
      const canvasData = {
        id: full.id,
        name: full.name,
        flowData: full.flowData,
        useRealTimeData: true,
      };
      document.body.style.pointerEvents = "";
      onClose();
      setTimeout(() => onInsertCanvas(canvasData), 10);
    } catch {
      toast.error("Couldn't load that playbook.");
      setInserting(false);
    }
  }, [selectedFile, inserting, onClose, onInsertCanvas]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Insert Playbook</DialogTitle>
          <DialogDescription>
            Search a playbook flow to embed live into your document.
          </DialogDescription>
        </DialogHeader>

        <EntityPicker
          allowedTypes={["hybrid"]}
          selectedId={selectedFile?.id ?? null}
          onSelect={(f) => setSelectedFile(f)}
          placeholder="Search playbooks by name or code…"
          emptyText="No playbooks found"
        />

        <DialogFooter className="mt-2 items-center sm:justify-between">
          <span className="truncate text-xs text-muted-foreground">
            {selectedFile ? `Selected: ${selectedFile.name}` : "Pick a playbook"}
          </span>
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleInsert}
              disabled={!selectedFile || inserting}
              className="min-w-[120px]"
            >
              {inserting ? "Loading…" : "Insert Playbook"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
