"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Check,
  ChevronDown,
  X,
  Plus,
  Layers,
  Sparkles,
  Blocks,
  Share2,
  Command,
  Rocket,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/lib/store/useOnboarding";
import { useT } from "@/lib/i18n/LocaleProvider";
import {
  buildChecklist,
  ANCHORS,
  type ChecklistCtaKind,
} from "./onboarding-steps";

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  plus: Plus,
  layers: Layers,
  sparkles: Sparkles,
  blocks: Blocks,
  "share-2": Share2,
  command: Command,
};

function capture(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  import("posthog-js")
    .then((m) => m.default?.capture?.(event, props))
    .catch(() => {});
}

function clickAnchor(anchor: string) {
  if (typeof document === "undefined") return;
  const el = document.querySelector<HTMLElement>(`[data-onboarding="${anchor}"]`);
  el?.click();
}

interface Props {
  /** Deep-link to the user's most recent playbook, if any (for editor-only items). */
  recentPlaybookHref?: string | null;
}

/**
 * The persistent spine of the redesign: a glassy, collapsible, dismissible card
 * of Tier-1 activation items that auto-check from the user's real actions.
 * Mounted under the dashboard greeting. Honors prefers-reduced-motion.
 */
export const GettingStartedChecklist: React.FC<Props> = ({
  recentPlaybookHref,
}) => {
  const router = useRouter();
  const {
    completedStepIds,
    dismissedChecklist,
    teamSize,
    isHydrated,
    dismissChecklist,
  } = useOnboardingStore();

  const [collapsed, setCollapsed] = useState(false);
  const completedToastShown = useRef(false);
  const t = useT();

  const items = useMemo(
    () => buildChecklist(teamSize === "Just me"),
    [teamSize]
  );
  const doneCount = items.filter((i) =>
    completedStepIds.includes(i.id)
  ).length;
  const total = items.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const allDone = doneCount >= total;

  // Quiet completion nudge — one toast, one suggested next step, then dismiss.
  useEffect(() => {
    if (!isHydrated || dismissedChecklist) return;
    if (allDone && !completedToastShown.current) {
      completedToastShown.current = true;
      capture("onboarding.activated");
      toast.success(t("onboarding.checklist.toast"), {
        duration: 6000,
        icon: "🎉",
      });
      const timer = setTimeout(() => dismissChecklist(), 1200);
      return () => clearTimeout(timer);
    }
  }, [allDone, isHydrated, dismissedChecklist, dismissChecklist, t]);

  if (!isHydrated || dismissedChecklist || allDone) return null;

  const runCta = (kind: ChecklistCtaKind) => {
    capture("onboarding.checklist_cta", { kind });
    switch (kind) {
      case "create":
        clickAnchor(ANCHORS.createNew);
        break;
      case "open-editor":
      case "ask-ai":
        if (recentPlaybookHref) router.push(recentPlaybookHref);
        else clickAnchor(ANCHORS.createNew);
        break;
      case "cmdk":
        window.dispatchEvent(new CustomEvent("olab:open-cmdk"));
        break;
    }
  };

  return (
    <section
      aria-label={t("onboarding.checklist.title")}
      className="mb-6 overflow-hidden rounded-2xl border border-foreground/10 bg-background/60 shadow-sm backdrop-blur"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yadn-accent-green/10">
          <Rocket size={18} className="text-yadn-accent-green" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="truncate text-sm font-semibold">
              {t("onboarding.checklist.title")}
            </h2>
            <span className="shrink-0 text-xs text-muted-foreground">
              {doneCount}/{total}
            </span>
          </div>
          <div
            className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-yadn-accent-green transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={t(
            collapsed
              ? "onboarding.checklist.expand"
              : "onboarding.checklist.collapse"
          )}
          className="rounded-md p-1 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
        >
          <ChevronDown
            size={16}
            className={cn("transition-transform", collapsed && "-rotate-90")}
          />
        </button>
        <button
          onClick={() => {
            capture("onboarding.checklist_dismissed");
            dismissChecklist();
          }}
          aria-label={t("onboarding.checklist.dismiss")}
          className="rounded-md p-1 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
        >
          <X size={16} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-foreground/5"
          >
            {items.map((item) => {
              const done = completedStepIds.includes(item.id);
              const Icon = ICONS[item.icon] ?? Plus;
              return (
                <li
                  key={item.id}
                  aria-checked={done}
                  role="checkbox"
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                      done
                        ? "border-yadn-accent-green bg-yadn-accent-green text-white"
                        : "border-foreground/20 text-muted-foreground"
                    )}
                  >
                    {done ? <Check size={14} /> : <Icon size={13} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        done && "text-muted-foreground line-through"
                      )}
                    >
                      {t(item.titleKey)}
                    </p>
                    {!done && (
                      <p className="text-xs text-muted-foreground">
                        {t(item.descKey)}
                      </p>
                    )}
                  </div>
                  {!done && item.cta && (
                    <button
                      onClick={() => runCta(item.cta!.kind)}
                      className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-yadn-accent-green hover:bg-yadn-accent-green/10"
                    >
                      {t(item.cta.labelKey)}
                      <ArrowRight size={13} className="rtl:rotate-180" />
                    </button>
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </section>
  );
};

export default GettingStartedChecklist;
