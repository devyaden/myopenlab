"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  getAllFiles,
  invalidateFileCache,
  type MentionFile,
} from "./hooks/useFileSearch";
import {
  FileText,
  GitBranch,
  Table as TableIcon,
  File as FileIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Phase 5c: the ONE searchable, folder-grouped picker reused by the embed
 * dialogs (flow / table / document-reference) — the same cmdk shell as the
 * Cmd+K palette and the relation picker. It lists the user's canvases
 * cross-folder (via the shared useFileSearch cache; no directory people), grouped
 * by folder, matched by name AND code. `allowedTypes` restricts the candidate
 * canvas_type set (e.g. ['hybrid'] for a flow embed, ['table','hybrid'] for a
 * table embed). Callers do any heavy follow-up (fetch columns/flowData) in
 * onSelect — the cross-folder cache rows are lightweight.
 */

function iconForType(t: string | null) {
  switch ((t ?? "").toLowerCase()) {
    case "document":
      return <FileText className="text-slate-500" />;
    case "table":
      return <TableIcon className="text-emerald-600" />;
    case "hybrid":
      return <GitBranch className="text-indigo-600" />;
    default:
      return <FileIcon className="text-slate-500" />;
  }
}

interface EntityPickerProps {
  /** Restrict to these canvas_types (lowercase). Undefined = all canvases. */
  allowedTypes?: string[];
  /** Sort documents to the top (the doc-reference picker). */
  docsFirst?: boolean;
  onSelect: (file: MentionFile) => void;
  disabled?: boolean;
  placeholder?: string;
  emptyText?: string;
  /** Highlight the currently-chosen row (for select-then-configure flows). */
  selectedId?: string | null;
}

export function EntityPicker({
  allowedTypes,
  docsFirst,
  onSelect,
  disabled,
  placeholder = "Search by name or code…",
  emptyText = "No matches found.",
  selectedId,
}: EntityPickerProps) {
  const [files, setFiles] = useState<MentionFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Refresh on mount so a just-created embeddable shows up (matches the palette).
  useEffect(() => {
    let active = true;
    setLoading(true);
    invalidateFileCache();
    getAllFiles()
      .then((all) => {
        if (active) setFiles(all);
      })
      .catch(() => {
        if (active) setFiles([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = allowedTypes
      ? files.filter((f) =>
          allowedTypes.includes((f.canvas_type ?? "").toLowerCase())
        )
      : files;
    if (docsFirst) {
      list = [...list].sort(
        (a, b) =>
          Number((b.canvas_type ?? "") === "document") -
          Number((a.canvas_type ?? "") === "document")
      );
    }
    return list;
  }, [files, allowedTypes, docsFirst]);

  const groups = useMemo(() => {
    const byFolder = new Map<string, MentionFile[]>();
    for (const f of filtered) {
      const k = f.folder_name || "";
      if (!byFolder.has(k)) byFolder.set(k, []);
      byFolder.get(k)!.push(f);
    }
    const named = Array.from(byFolder.entries())
      .filter(([k]) => k)
      .sort((a, b) => a[0].localeCompare(b[0]));
    const rootless = byFolder.get("") ?? [];
    return { named, rootless };
  }, [filtered]);

  const renderItem = (f: MentionFile) => (
    <CommandItem
      key={f.id}
      // cmdk filters on this value — include name + code so "HR-01" matches.
      value={`${f.name} ${f.code ?? ""} ${f.id}`}
      onSelect={() => {
        if (!disabled) onSelect(f);
      }}
      className={cn("gap-2", selectedId === f.id && "bg-accent")}
    >
      {iconForType(f.canvas_type)}
      <span className="flex-1 truncate">{f.name}</span>
      {f.code && (
        <span className="rounded bg-muted px-1 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
          {f.code}
        </span>
      )}
    </CommandItem>
  );

  return (
    <Command className="rounded-md border">
      <CommandInput placeholder={placeholder} />
      <CommandList className="max-h-[40vh]">
        <CommandEmpty>{loading ? "Loading…" : emptyText}</CommandEmpty>
        {groups.named.map(([folder, items]) => (
          <CommandGroup key={folder} heading={folder}>
            {items.map(renderItem)}
          </CommandGroup>
        ))}
        {groups.rootless.length > 0 && (
          <CommandGroup heading="No folder">
            {groups.rootless.map(renderItem)}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
