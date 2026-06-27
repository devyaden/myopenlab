"use client";

import { useCallback, useState } from "react";
import { MessageSquare } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useExplorationStore, type ExploreContext } from "@/lib/store/useExploration";
import { ExploreChat } from "./ExploreChat";
import { GovernanceBrowser } from "./GovernanceBrowser";

/**
 * The self-contained exploration surface: governance chat + relationship browser.
 * Rendered identically by the in-app overlay and the standalone /explore route —
 * `variant` only affects the outer framing the caller provides. It carries
 * `data-mode="exploration"` so the dark exploration skin applies in both contexts.
 * Imports nothing editor-specific.
 */
export function ExplorationApp({
  variant: _variant,
}: {
  variant: "overlay" | "standalone";
}) {
  const t = useT();
  const context = useExplorationStore((s) => s.context);
  const setContext = useExplorationStore((s) => s.setContext);
  // The graph node to center/highlight (driven by clicks in either pane).
  const [focusId, setFocusId] = useState<string | null>(null);
  // The chat pane can be hidden to give a chart the full width.
  const [chatOpen, setChatOpen] = useState(true);

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

  // A {CODE} source chip in an answer → resolve it, ground the chat on it, and
  // center the graph on it.
  const handleCode = useCallback(
    async (code: string) => {
      try {
        const res = await fetch(`/api/explore/resolve?code=${encodeURIComponent(code)}`);
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

  return (
    <div
      data-mode="exploration"
      className="relative flex h-full w-full overflow-hidden bg-background text-foreground"
    >
      {chatOpen && (
        <div className="flex w-[42%] min-w-[340px] max-w-[560px] flex-col border-r border-border rtl:border-l rtl:border-r-0">
          <ExploreChat
            scopeLabel={t("explore.scope.whole")}
            context={context}
            onClearContext={handleClear}
            onCode={handleCode}
            onCollapse={() => setChatOpen(false)}
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <GovernanceBrowser focusId={focusId} onPick={handlePick} />
      </div>

      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg hover:opacity-90 rtl:left-auto rtl:right-4"
        >
          <MessageSquare size={16} />
          {t("explore.chat.showChat")}
        </button>
      )}
    </div>
  );
}
