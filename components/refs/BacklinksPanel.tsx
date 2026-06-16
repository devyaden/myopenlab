"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GitFork, Link2, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { playbookHref } from "@/lib/playbook-href";
import type { Backlink, OutgoingReference } from "@/lib/refs/resolver";
import { subscribeEmbedRefresh } from "@/lib/realtime/embed-refresh";

/**
 * Phase 5: the "what references this" panel. Surfaces the Phase 2 cross-reference
 * spine on every artifact — both incoming backlinks ("Referenced by") and
 * outgoing references ("References"). Reads GET /api/refs?canvasId=… (owner-scoped,
 * already built/tested) and navigates each row by canvas_type via playbookHref.
 *
 * Trigger lives in the shared header so it appears on all three surfaces; the
 * panel body fetches its own data (lazily on first open, then on every open and
 * whenever this artifact is saved/applied — via the embed-refresh bus).
 */

interface BacklinksPanelProps {
  canvasId: string;
  code?: string | null;
}

function humanizeType(type: string): string {
  return type
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function CodeChip({ code }: { code?: string | null }) {
  if (!code) return null;
  return (
    <span className="rounded bg-muted px-1 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
      {code}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
      {humanizeType(type)}
    </span>
  );
}

export function BacklinksPanel({ canvasId, code }: BacklinksPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingReference[]>([]);
  const [loadedOnce, setLoadedOnce] = useState(false);
  // Guard against stale responses (reqSeq) AND setState-after-unmount (mountedRef).
  const reqSeq = useRef(0);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!canvasId) return;
    const seq = ++reqSeq.current;
    const live = () => mountedRef.current && seq === reqSeq.current;
    setLoading(true);
    try {
      // Include the code so references that target this artifact by code (with a
      // still-null to_canvas) are also returned — listBacklinks ORs both arms.
      const params = new URLSearchParams({ canvasId });
      if (code) params.set("code", code);
      const res = await fetch(`/api/refs?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        if (live()) {
          setBacklinks([]);
          setOutgoing([]);
        }
        return;
      }
      const json = await res.json();
      if (!live()) return; // unmounted, or a newer request superseded this one
      setBacklinks(Array.isArray(json.backlinks) ? json.backlinks : []);
      setOutgoing(Array.isArray(json.outgoing) ? json.outgoing : []);
    } catch {
      if (live()) {
        setBacklinks([]);
        setOutgoing([]);
      }
    } finally {
      if (live()) {
        setLoading(false);
        setLoadedOnce(true);
      }
    }
  }, [canvasId, code]);

  // One lightweight fetch on mount (and when the code resolves) to populate the
  // count badge.
  useEffect(() => {
    if (canvasId) load();
  }, [canvasId, load]);

  // Only refresh + subscribe to change signals while the panel is OPEN. This
  // avoids a refetch on every ~2s canvas autosave when the panel is closed (the
  // reference graph doesn't change on node moves/styling anyway).
  useEffect(() => {
    if (!open || !canvasId) return;
    load();
    const unsub = subscribeEmbedRefresh(canvasId, () => load());
    return unsub;
  }, [open, canvasId, load]);

  const navigate = (id?: string | null, canvasType?: string | null) => {
    if (!id) return;
    setOpen(false);
    router.push(playbookHref(id, canvasType));
  };

  const total = backlinks.length + outgoing.length;

  if (!canvasId) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          title="References & backlinks for this artifact"
        >
          <GitFork className="h-4 w-4" />
          <span className="hidden sm:inline">References</span>
          {loadedOnce && total > 0 && (
            <span className="ml-0.5 rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground">
              {total}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold text-gray-900">
            References
          </span>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Link2 className="h-3.5 w-3.5" />
            <span>{loading ? "Loading…" : `${total} link${total === 1 ? "" : "s"}`}</span>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-2">
            {total === 0 && !loading && (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                Nothing references this yet.
                <div className="mt-1 text-xs">
                  Use <span className="font-mono">@</span> to link this to other
                  playbooks, or embed it elsewhere.
                </div>
              </div>
            )}

            {backlinks.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <ArrowDownLeft className="h-3 w-3" />
                  Referenced by
                </div>
                {backlinks.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    disabled={!b.fromCanvas?.id}
                    onClick={() =>
                      navigate(b.fromCanvas?.id, b.fromCanvas?.canvas_type)
                    }
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                      b.fromCanvas?.id
                        ? "hover:bg-gray-100"
                        : "cursor-default opacity-60"
                    )}
                  >
                    <span className="flex-1 truncate text-gray-800">
                      {b.fromCanvas?.name || "Untitled"}
                    </span>
                    <CodeChip code={b.fromCanvas?.code} />
                    <TypeBadge type={b.type} />
                  </button>
                ))}
              </div>
            )}

            {outgoing.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3" />
                  References
                </div>
                {outgoing.map((o) => {
                  const targetName =
                    o.toCanvas?.name || o.to_code || "Unresolved";
                  const targetCode = o.toCanvas?.code || o.to_code;
                  const resolvable = !!o.toCanvas?.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      disabled={!resolvable}
                      onClick={() =>
                        navigate(o.toCanvas?.id, o.toCanvas?.canvas_type)
                      }
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                        resolvable
                          ? "hover:bg-gray-100"
                          : "cursor-default opacity-60"
                      )}
                      title={resolvable ? undefined : "Target not found yet"}
                    >
                      <span className="flex-1 truncate text-gray-800">
                        {targetName}
                        {!resolvable && (
                          <span className="ml-1 text-[10px] text-amber-600">
                            (unresolved)
                          </span>
                        )}
                      </span>
                      <CodeChip code={targetCode} />
                      <TypeBadge type={o.type} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
