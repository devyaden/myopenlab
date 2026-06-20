"use client";

import React, { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/lib/store/useOnboarding";
import { useT } from "@/lib/i18n/LocaleProvider";
import { FEATURE_HINTS } from "./onboarding-steps";

function capture(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  import("posthog-js")
    .then((m) => m.default?.capture?.(event, props))
    .catch(() => {});
}

// Throttle to a single visible hint across the app at any moment.
let claimedHint: string | null = null;
const RELEASE_EVENT = "olab:hint-released";

interface Props {
  id: string;
  title?: string;
  body?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  /** Tailwind positioning for the dot; parent must be position:relative. */
  className?: string;
}

/**
 * A just-in-time coachmark: a pulsing teal dot + one-line popover that fires once
 * the first time a surface is reached, then never again (keyed by `seenHints`).
 * Only one hint is visible at a time. Honors prefers-reduced-motion.
 */
export const FeatureHint: React.FC<Props> = ({
  id,
  title,
  body,
  side = "bottom",
  align = "start",
  className,
}) => {
  const { isHydrated, isHintSeen, markHintSeen } = useOnboardingStore();
  const t = useT();
  const [open, setOpen] = useState(false);
  const reg = FEATURE_HINTS[id];
  const titleText = reg ? t(reg.titleKey) : title ?? "";
  const bodyText = reg ? t(reg.bodyKey) : body ?? "";
  const seen = isHintSeen(id);

  useEffect(() => {
    if (!isHydrated || seen) return;
    let cancelled = false;

    const tryClaim = () => {
      if (cancelled || claimedHint) return;
      claimedHint = id;
      const t = window.setTimeout(() => {
        if (cancelled) return;
        setOpen(true);
        markHintSeen(id); // fire-once: shown == seen
        capture("onboarding.hint_shown", { id });
      }, 600);
      return () => window.clearTimeout(t);
    };

    const cleanup = tryClaim();
    const onRelease = () => tryClaim();
    if (!claimedHint || claimedHint === id) {
      window.addEventListener(RELEASE_EVENT, onRelease);
    }
    return () => {
      cancelled = true;
      cleanup?.();
      window.removeEventListener(RELEASE_EVENT, onRelease);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, seen, id]);

  const close = () => {
    setOpen(false);
    if (claimedHint === id) {
      claimedHint = null;
      window.dispatchEvent(new CustomEvent(RELEASE_EVENT));
    }
  };

  if (!isHydrated || seen) return null;

  return (
    <Popover open={open} onOpenChange={(o) => !o && close()}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={titleText || "Tip"}
          data-testid={`feature-hint-${id}`}
          onClick={() => setOpen(true)}
          className={cn(
            "absolute z-30 flex h-3.5 w-3.5 items-center justify-center",
            className
          )}
        >
          <span className="absolute inline-flex h-full w-full rounded-full bg-yadn-accent-green/60 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-yadn-accent-green ring-2 ring-background" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className="w-64 rounded-xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {titleText && <p className="text-sm font-semibold">{titleText}</p>}
        <p className="mt-1 text-sm text-muted-foreground">{bodyText}</p>
        <div className="mt-3 flex justify-end">
          <button
            onClick={close}
            className="rounded-lg bg-yadn-accent-green px-3 py-1 text-xs font-medium text-white hover:bg-yadn-accent-green/90"
          >
            {t("onboarding.hints.gotIt")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FeatureHint;
