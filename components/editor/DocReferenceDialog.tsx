"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  ShieldCheck,
  BadgeCheck,
  ListChecks,
  KeyRound,
  Loader2,
  Search,
  type LucideIcon,
} from "lucide-react";
import { searchFiles, preloadFiles, type MentionFile } from "./hooks/useFileSearch";

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
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<MentionFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refType, setRefType] = useState<string>("template");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    preloadFiles();
    let active = true;
    searchFiles(query)
      .then((res) => {
        if (active) setFiles(res);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, query]);

  // Prefer documents; a reference card models a sub-document. Other coded
  // artifacts (a coded flow/table) are still allowed so HR-01-style links work.
  const docs = useMemo(() => {
    const isDoc = (f: MentionFile) => (f.canvas_type ?? "") === "document";
    const docsFirst = [...files].sort(
      (a, b) => Number(isDoc(b)) - Number(isDoc(a))
    );
    return docsFirst;
  }, [files]);

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
    const file = files.find((f) => f.id === selectedId);
    if (!file) return;
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
  }, [files, selectedId, refType, onClose, onInsert]);

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

        {/* Search */}
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents by name or code…"
            className="pl-9"
            autoFocus
          />
        </div>

        {/* List */}
        <div className="max-h-[40vh] min-h-[200px] overflow-y-auto rounded-md border">
          {loading ? (
            <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Loading documents…</span>
            </div>
          ) : docs.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">
              No matching documents
            </div>
          ) : (
            <ul className="divide-y">
              {docs.map((f) => {
                const selected = f.id === selectedId;
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(f.id)}
                      onDoubleClick={handleInsert}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                        selected ? "bg-primary/5" : "hover:bg-slate-50"
                      }`}
                    >
                      <FileText className="h-4 w-4 shrink-0 text-slate-500" />
                      <span className="flex-1 truncate text-sm font-medium">
                        {f.name}
                      </span>
                      {f.code && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">
                          {f.code}
                        </span>
                      )}
                      {f.folder_name && (
                        <span className="truncate text-xs text-slate-400">
                          {f.folder_name}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="mt-2 space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!selectedId} className="min-w-[120px]">
            Insert card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
