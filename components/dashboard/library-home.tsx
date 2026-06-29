"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeachingEmptyState } from "@/components/ui/teaching-empty-state";
import { GettingStartedChecklist } from "@/components/onboarding/getting-started-checklist";
import { ANCHORS } from "@/components/onboarding/onboarding-steps";
import { useSidebarStore } from "@/lib/store/useSidebar";
import { playbookHref } from "@/lib/playbook-href";
import { cn } from "@/lib/utils";
import { ArtifactCard, artifactType, type Artifact } from "./artifact-card";
import { RecentsRow } from "./recents-row";

const emit = (name: string, detail?: any) =>
  window.dispatchEvent(new CustomEvent(name, { detail }));

const FILTERS = [
  { key: null, label: "All" },
  { key: "hybrid", label: "Playbooks" },
  { key: "table", label: "Tables" },
  { key: "document", label: "Documents" },
] as const;

/**
 * The Library — an artifact-first home. Every Playbook / Table / Document in the
 * workspace as a modern card, filterable by type. Folders are an optional grouping
 * (Collections in the sidebar), and there is no "Root": uncategorized artifacts
 * appear inline. The one way to find is ⌘K — no in-page search box.
 */
export function LibraryHome() {
  const params = useSearchParams();
  const type = params.get("type");
  const folders = useSidebarStore((s) => s.folders);
  const rootCanvases = useSidebarStore((s) => s.rootCanvases);
  const isLoading = useSidebarStore((s) => s.isLoading);

  const artifacts = useMemo<Artifact[]>(() => {
    const inFolders = folders.flatMap((f) =>
      (f.canvases ?? []).map((c: any) => ({
        ...c,
        folderName: f.name,
        folderId: f.id,
      }))
    );
    // Dedupe by id. A move refetches folders + rootCanvases separately, so for one
    // render the moved artifact can momentarily exist in both lists — folder
    // membership wins so the card reflects the new collection immediately.
    const byId = new Map<string, Artifact>();
    for (const a of rootCanvases as Artifact[]) byId.set(a.id, a);
    for (const a of inFolders as Artifact[]) byId.set(a.id, a);
    return Array.from(byId.values());
  }, [folders, rootCanvases]);

  const filtered = useMemo(
    () => (type ? artifacts.filter((a) => artifactType(a) === type) : artifacts),
    [artifacts, type]
  );

  const recentPlaybookHref = useMemo(() => {
    const c = rootCanvases?.[0];
    return c?.id ? playbookHref(c.id, c.canvas_type) : null;
  }, [rootCanvases]);

  const empty = !isLoading && artifacts.length === 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Library
        </h1>
        <Button
          variant="signal"
          onClick={() => emit("olab:create-new", { type: "canvas" })}
          data-onboarding={ANCHORS.createNew}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Create new
        </Button>
      </div>

      <RecentsRow />

      <GettingStartedChecklist recentPlaybookHref={recentPlaybookHref} />

      {/* Type filters */}
      <div className="mb-4 mt-6 flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => {
          const active = (f.key ?? null) === (type ?? null);
          const href = f.key ? `/protected?type=${f.key}` : "/protected";
          return (
            <Link
              key={f.label}
              href={href}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                active
                  ? "border-signal bg-signal/10 text-signal"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {empty ? (
        <TeachingEmptyState
          title="Your Library is empty"
          description="Capture how your company operates — start with a Playbook (a process flow), a Table, or a Document."
          action={{
            label: "Create your first artifact",
            onClick: () => emit("olab:create-new", { type: "canvas" }),
          }}
        />
      ) : filtered.length === 0 && !isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No {type === "hybrid" ? "playbooks" : `${type}s`} yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading && artifacts.length === 0
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[92px] animate-pulse rounded-xl border border-border bg-muted/40"
                />
              ))
            : filtered.map((a) => <ArtifactCard key={a.id} artifact={a} />)}
        </div>
      )}
    </div>
  );
}

export default LibraryHome;
