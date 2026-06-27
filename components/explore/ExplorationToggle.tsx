"use client";

import { useExplorationStore } from "@/lib/store/useExploration";
import { useT } from "@/lib/i18n/LocaleProvider";
import { triggerExplore } from "./iris";
import { Telescope } from "lucide-react";

/**
 * The control that enters exploration mode. `floating` is the primary, app-wide
 * affordance (works on every protected route, incl. editors); `inline` is a
 * compact version for placing in a header button cluster. Hidden while active —
 * the overlay provides its own exit.
 */
export function ExplorationToggle({
  variant = "floating",
}: {
  variant?: "floating" | "inline";
}) {
  const t = useT();
  const active = useExplorationStore((s) => s.active);
  if (active) return null;

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    triggerExplore({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };

  if (variant === "inline") {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted"
        title={t("explore.enter")}
        aria-label={t("explore.enter")}
      >
        <Telescope size={17} />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-primary/30 bg-background/90 px-4 py-3 text-foreground shadow-lg backdrop-blur transition-opacity hover:opacity-90 rtl:left-4 rtl:right-auto"
      aria-label={t("explore.enter")}
    >
      <Telescope size={18} className="text-primary" />
      <span className="text-sm font-medium">{t("explore.enter")}</span>
    </button>
  );
}
