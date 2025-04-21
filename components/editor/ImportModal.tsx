"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => void;
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleImport = () => {
    if (!file) {
      setError("Please select a file to import");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        onImport(data);
        onClose();
      } catch (error) {
        setError("Invalid JSON file. Please select a valid file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="file-upload" className="text-sm font-medium">
              Select JSON file to import
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="border rounded p-2"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleImport}>Import</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
