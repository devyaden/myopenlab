"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  GitBranch,
  Table as TableIcon,
  File as FileIcon,
} from "lucide-react";
import {
  CommandDialog,
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
} from "@/components/editor/hooks/useFileSearch";
import { playbookHref } from "@/lib/playbook-href";
import { useOnboardingStore, ONBOARDING_STEP_IDS } from "@/lib/store/useOnboarding";

/**
 * Phase 5: a global Cmd+K command palette. One searchable, folder-grouped picker
 * over every playbook/table/document the user owns (cross-folder), reusing the
 * same module cache the @-mention search uses (components/editor/hooks/useFileSearch).
 * Mounted once in the protected layout so it works on every surface (dashboard,
 * playbook, table, document). cmdk does the fuzzy filtering; we match on name AND
 * human code (so "HR-01" finds the coded playbook), grouped by folder.
 */

function iconForType(type: string | null) {
  switch ((type ?? "").toLowerCase()) {
    case "document":
      return <FileText className="text-gray-500" />;
    case "table":
      return <TableIcon className="text-gray-500" />;
    case "hybrid":
      return <GitBranch className="text-gray-500" />;
    default:
      return <FileIcon className="text-gray-500" />;
  }
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<MentionFile[]>([]);
  const [loading, setLoading] = useState(false);
  const completeStep = useOnboardingStore((s) => s.completeStep);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Refresh so a file created moments ago in another surface shows up.
      invalidateFileCache();
      const all = await getAllFiles();
      setFiles(all);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Global Cmd/Ctrl+K toggles the palette. Other shortcuts are left untouched.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The getting-started checklist can open the palette via this event.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("olab:open-cmdk", onOpen);
    return () => window.removeEventListener("olab:open-cmdk", onOpen);
  }, []);

  useEffect(() => {
    if (open) {
      load();
      completeStep(ONBOARDING_STEP_IDS.tryCmdk);
    }
  }, [open, load, completeStep]);

  // Group by folder for the folder-grouped list; folderless files go last.
  const groups = useMemo(() => {
    const byFolder = new Map<string, MentionFile[]>();
    for (const f of files) {
      const key = f.folder_name || "";
      if (!byFolder.has(key)) byFolder.set(key, []);
      byFolder.get(key)!.push(f);
    }
    const named = Array.from(byFolder.entries())
      .filter(([k]) => k)
      .sort((a, b) => a[0].localeCompare(b[0]));
    const rootless = byFolder.get("") ?? [];
    return { named, rootless };
  }, [files]);

  const go = (f: MentionFile) => {
    setOpen(false);
    router.push(playbookHref(f.id, f.canvas_type));
  };

  const renderItem = (f: MentionFile) => (
    <CommandItem
      key={f.id}
      // cmdk filters on this value — include name + code so "HR-01" matches.
      value={`${f.name} ${f.code ?? ""} ${f.id}`}
      onSelect={() => go(f)}
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
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search playbooks, tables, documents… (name or code)" />
      <CommandList>
        <CommandEmpty>{loading ? "Loading…" : "No matches found."}</CommandEmpty>
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
    </CommandDialog>
  );
}
