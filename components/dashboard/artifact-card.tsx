"use client";

import Link from "next/link";
import {
  FileText,
  FolderClosed,
  FolderInput,
  MoreHorizontal,
  Pencil,
  Table2,
  Trash2,
  Workflow,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CodeChip } from "@/components/ui/code-chip";
import { playbookHref } from "@/lib/playbook-href";
import { cn } from "@/lib/utils";

export interface Artifact {
  id: string;
  name: string;
  code?: string | null;
  canvas_type?: string | null;
  folderName?: string | null;
  folderId?: string | null;
}

/** Null/legacy canvas_type is a Playbook (hybrid) — centralized here. */
export function artifactType(c: { canvas_type?: string | null }) {
  const t = (c.canvas_type ?? "hybrid").toLowerCase();
  return t === "table" || t === "document" ? t : "hybrid";
}

const META: Record<
  string,
  { label: string; icon: typeof Workflow; token: string }
> = {
  hybrid: { label: "Playbook", icon: Workflow, token: "--node-hybrid" },
  table: { label: "Table", icon: Table2, token: "--node-table" },
  document: { label: "Document", icon: FileText, token: "--node-document" },
};

const emit = (name: string, detail: any) =>
  window.dispatchEvent(new CustomEvent(name, { detail }));

export function ArtifactCard({ artifact }: { artifact: Artifact }) {
  const type = artifactType(artifact);
  const meta = META[type];
  const Icon = meta.icon;
  const href = playbookHref(artifact.id, type);

  return (
    <div className="group relative">
      <Link
        href={href}
        className="block rounded-xl border border-border bg-card p-4 transition-all hover:border-signal/40 hover:shadow-atlas-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
      >
        <div className="flex items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
            style={{
              background: `hsl(var(${meta.token}) / 0.14)`,
              borderColor: `hsl(var(${meta.token}) / 0.35)`,
              color: `hsl(var(${meta.token}))`,
            }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate pr-6 font-medium text-foreground">
              {artifact.name || "Untitled"}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{meta.label}</span>
              {artifact.code && (
                <CodeChip code={artifact.code} copyable={false} size="sm" />
              )}
            </div>
          </div>
        </div>
        {artifact.folderName && (
          <div className="mt-3 flex items-center gap-1 text-xs text-faint-ink">
            <FolderClosed className="h-3 w-3" />
            <span className="truncate">{artifact.folderName}</span>
          </div>
        )}
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "absolute right-2 top-2 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground focus:opacity-100 group-hover:opacity-100"
            )}
            aria-label="Artifact actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              emit("olab:rename-item", {
                id: artifact.id,
                name: artifact.name,
                kind: "canvas",
              })
            }
          >
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              emit("olab:move-item", {
                id: artifact.id,
                name: artifact.name,
                folderId: artifact.folderId ?? null,
              })
            }
          >
            <FolderInput className="mr-2 h-4 w-4" />
            Move to collection
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() =>
              emit("olab:delete-item", {
                id: artifact.id,
                name: artifact.name,
                kind: "canvas",
              })
            }
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default ArtifactCard;
