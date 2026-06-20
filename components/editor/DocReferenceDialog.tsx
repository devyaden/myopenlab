"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ShieldCheck,
  BadgeCheck,
  ListChecks,
  KeyRound,
  type LucideIcon,
} from "lucide-react";
import { type MentionFile } from "./hooks/useFileSearch";
import { EntityPicker } from "./EntityPicker";

export interface DocReferenceInsert {
  docId: string;
  refType: string;
  label: string;
  code: string | null;
}

interface DocReferenceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (ref: DocReferenceInsert) => void;
}

const REF_TYPES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "template", label: "Template", icon: FileText },
  { value: "policy", label: "Policy", icon: ShieldCheck },
  { value: "standard", label: "Standard", icon: BadgeCheck },
  { value: "checklist", label: "Checklist", icon: ListChecks },
  { value: "authority", label: "Authority", icon: KeyRound },
  { value: "document", label: "Document", icon: FileText },
];

/**
 * Phase 3: picker for inserting a sub-document reference card. The user picks a
 * document they own and the cross-reference kind (Template / Policy / …). Lists
 * documents via the shared file-search cache (spans every folder).
 */
export default function DocReferenceDialog({
  isOpen,
  onClose,
  onInsert,
}: DocReferenceDialogProps) {
  const [refType, setRefType] = useState<string>("template");
  const [selectedFile, setSelectedFile] = useState<MentionFile | null>(null);

  // Start each open fresh (the component stays mounted across open/close).
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setRefType("template");
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

  const handleInsert = useCallback(() => {
    if (!selectedFile) return;
    const file = selectedFile;
    document.body.style.pointerEvents = "";
    onClose();
    setTimeout(() => {
      onInsert({
        docId: file.id,
        refType,
        label: file.name,
        code: file.code ?? null,
      });
    }, 10);
  }, [selectedFile, refType, onClose, onInsert]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Embed document reference</DialogTitle>
          <DialogDescription>
            Insert a live reference card to another document — its title, code,
            owner and last-edited stay in sync, and the card clicks through.
          </DialogDescription>
        </DialogHeader>

        {/* Reference type */}
        <div className="flex flex-wrap gap-2">
          {REF_TYPES.map((t) => {
            const Icon = t.icon;
            const active = refType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setRefType(t.value)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Searchable, folder-grouped picker (shared with the other embeds) */}
        <EntityPicker
          docsFirst
          selectedId={selectedFile?.id ?? null}
          onSelect={(f) => setSelectedFile(f)}
          placeholder="Search documents by name or code…"
          emptyText="No matching documents"
        />

        <DialogFooter className="mt-2 items-center sm:justify-between">
          <span className="truncate text-xs text-muted-foreground">
            {selectedFile ? `Selected: ${selectedFile.name}` : "Pick a document"}
          </span>
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleInsert}
              disabled={!selectedFile}
              className="min-w-[120px]"
            >
              Insert card
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
