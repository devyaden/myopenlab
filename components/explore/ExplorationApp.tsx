"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Map as MapIcon, MessageSquare, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/LocaleProvider";
import {
  useExplorationStore,
  type ExploreContext,
} from "@/lib/store/useExploration";
import { ExploreChat } from "./ExploreChat";
import { GovernanceBrowser } from "./GovernanceBrowser";
import { MapLegend } from "./MapLegend";
import { MapSearchPane, type MapNode } from "./MapSearchPane";


/**
 * The Map — the Atlas wayfinding & governance surface. One unified, light/dark
 * surface (no separate "exploration" dark skin): a top Locator + status strip, a
 * left find/filter pane, the relationship graph in the centre (with a legend),
 * and a collapsible read-only governance Q&A on the right. Rendered identically by
 * the in-app overlay and the standalone /explore route; `variant` only changes how
 * the close button behaves.
 */
export function ExplorationApp({
  variant,
  onClose,
}: {
  variant: "overlay" | "standalone";
  onClose?: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const context = useExplorationStore((s) => s.context);
  const setContext = useExplorationStore((s) => s.setContext);
  const exit = useExplorationStore((s) => s.exit);

  // The graph node to center/highlight. Seeded from the launch context so the Map
  // opens focused on the artifact it was launched from ("you are here") — and so
  // the graph component fetches with that focus on its first render.
  const [focusId, setFocusId] = useState<string | null>(
    () => context?.id ?? null
  );
  // Calm by default — the graph is the hero; Find, Ask and Legend open on demand.
  const [chatOpen, setChatOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  // Find-pane data + status counts, reported by the graph (one fetch, not two).
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edgeCount, setEdgeCount] = useState(0);

  const handleGraphData = useCallback(
    (gNodes: MapNode[], gEdgeCount: number) => {
      setNodes(gNodes);
      setEdgeCount(gEdgeCount);
    },
    []
  );

  const closeLegend = useCallback(() => setLegendOpen(false), []);

  const handlePick = useCallback(
    (ctx: ExploreContext) => {
      setFocusId(ctx.id);
      setContext(ctx);
    },
    [setContext]
  );

  const handleClear = useCallback(() => {
    setContext(null);
    setFocusId(null);
  }, [setContext]);

  const handleSelectNode = useCallback(
    (n: MapNode) => {
      const kind: ExploreContext["kind"] =
        n.group === "person"
          ? "person"
          : n.group === "role"
            ? "role"
            : n.group === "code"
              ? "code"
              : "canvas";
      setFocusId(n.id);
      setContext({ kind, id: n.id, label: n.label, code: n.code });
    },
    [setContext]
  );

  // A {CODE} source chip in an answer → resolve it, ground the chat, center the graph.
  const handleCode = useCallback(
    async (code: string) => {
      try {
        const res = await fetch(
          `/api/explore/resolve?code=${encodeURIComponent(code)}`
        );
        if (!res.ok) return;
        const j = await res.json();
        if (j.entity) {
          setFocusId(j.entity.id);
          setContext({
            kind: "canvas",
            id: j.entity.id,
            label: j.entity.name,
            code: j.entity.code ?? code,
          });
        }
      } catch {
        /* best-effort */
      }
    },
    [setContext]
  );

  const close = useCallback(() => {
    if (onClose) onClose();
    else if (variant === "standalone") router.push("/protected");
    else exit();
  }, [onClose, variant, router, exit]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background text-foreground">
      {/* Top strip — Locator + status chrome (one cohesive cluster). */}
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-signal/10 text-signal">
            <MapIcon size={17} />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="text-sm font-semibold text-foreground">The Map</div>
            <div className="truncate text-xs text-muted-foreground">
              Cross-references &amp; governance, at a glance
            </div>
          </div>
          {context && (
            <span className="ml-1 flex min-w-0 items-center gap-1.5 text-sm">
              <span className="text-faint-ink">/</span>
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-attention"
                aria-hidden
                title="You are here"
              />
              <span className="truncate font-medium text-foreground">
                {context.label}
              </span>
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <span className="mr-1 hidden text-xs tabular-nums text-muted-foreground md:inline">
            {nodes.length} artifacts · {edgeCount} links
          </span>
          <Button
            variant={searchOpen ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search className="mr-1.5 h-4 w-4" /> Find
          </Button>
          <Button
            variant={legendOpen ? "secondary" : "ghost"}
            size="sm"
            onClick={() => (legendOpen ? closeLegend() : setLegendOpen(true))}
          >
            <Info className="mr-1.5 h-4 w-4" /> Legend
          </Button>
          <Button
            variant={chatOpen ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setChatOpen((v) => !v)}
          >
            <MessageSquare className="mr-1.5 h-4 w-4" /> Ask
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            aria-label="Close the Map"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Body — find · graph · Q&A */}
      <div className="flex min-h-0 flex-1">
        {searchOpen && (
          <MapSearchPane
            nodes={nodes}
            selectedId={focusId}
            onSelect={handleSelectNode}
            onCollapse={() => setSearchOpen(false)}
          />
        )}

        <div className="relative min-w-0 flex-1">
          <GovernanceBrowser
            focusId={focusId}
            onPick={handlePick}
            onData={handleGraphData}
          />
          {legendOpen && <MapLegend onClose={closeLegend} />}
        </div>

        {chatOpen && (
          <div className="flex w-[36%] min-w-[320px] max-w-[520px] flex-col border-l border-border rtl:border-l-0 rtl:border-r">
            <ExploreChat
              scopeLabel={t("explore.scope.whole")}
              context={context}
              onClearContext={handleClear}
              onCode={handleCode}
              onCollapse={() => setChatOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
