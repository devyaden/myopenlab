"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TeachingEmptyState } from "@/components/ui/teaching-empty-state";
import { useSidebarStore } from "@/lib/store/useSidebar";
import { ArtifactCard, type Artifact } from "./artifact-card";

const emit = (name: string, detail?: any) =>
  window.dispatchEvent(new CustomEvent(name, { detail }));

/**
 * A Collection (folder) rendered through the Atlas shell — the same artifact-card
 * grid as the Library, scoped to this collection. No in-page search (⌘K is the
 * one find); no "Root". Create/rename/delete are delegated to the AppShell.
 */
export function CollectionView({ folderId }: { folderId: string }) {
  const folders = useSidebarStore((s) => s.folders);
  const isLoading = useSidebarStore((s) => s.isLoading);
  const folder = folders.find((f) => f.id === folderId);

  const artifacts = useMemo<Artifact[]>(
    () =>
      ((folder?.canvases ?? []) as any[]).map((c) => ({
        ...c,
        folderName: folder?.name,
      })),
    [folder]
  );

  if (!folder) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[92px] animate-pulse rounded-xl border border-border bg-muted/40"
              />
            ))}
          </div>
        ) : (
          <TeachingEmptyState
            title="Collection not found"
            description="This collection may have been deleted."
            action={{ label: "Back to Library", href: "/protected" }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6">
      <Link
        href="/protected"
        className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Library
      </Link>

      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-1.5">
          <h1 className="truncate font-display text-2xl font-semibold text-foreground">
            {folder.name}
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Collection actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() =>
                  emit("olab:rename-item", {
                    id: folder.id,
                    name: folder.name,
                    kind: "folder",
                  })
                }
              >
                <Pencil className="mr-2 h-4 w-4" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() =>
                  emit("olab:delete-item", {
                    id: folder.id,
                    name: folder.name,
                    kind: "folder",
                  })
                }
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button
          variant="signal"
          onClick={() =>
            emit("olab:create-new", { type: "canvas", folderId: folder.id })
          }
        >
          <Plus className="mr-1.5 h-4 w-4" /> Create new
        </Button>
      </div>

      {artifacts.length === 0 ? (
        <TeachingEmptyState
          title="This collection is empty"
          description="Add a Playbook, Table, or Document to this collection."
          action={{
            label: "Create here",
            onClick: () =>
              emit("olab:create-new", { type: "canvas", folderId: folder.id }),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {artifacts.map((a) => (
            <ArtifactCard key={a.id} artifact={a} />
          ))}
        </div>
      )}
    </div>
  );
}

export default CollectionView;
