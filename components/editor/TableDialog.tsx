"use client";

import type React from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTable: (rows: number, cols: number) => void;
}

export default function TableDialog({
  isOpen,
  onClose,
  onInsertTable,
}: TableDialogProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInsertTable(rows, cols);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Insert Table</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rows">Rows</Label>
              <Input
                id="rows"
                type="number"
                min="1"
                max="20"
                value={rows}
                onChange={(e) => setRows(Number.parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cols">Columns</Label>
              <Input
                id="cols"
                type="number"
                min="1"
                max="10"
                value={cols}
                onChange={(e) => setCols(Number.parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Insert</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
