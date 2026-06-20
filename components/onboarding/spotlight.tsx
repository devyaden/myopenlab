"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/lib/store/useOnboarding";
import { useT } from "@/lib/i18n/LocaleProvider";
import { SPOTLIGHT_STEPS, type SpotlightSide } from "./onboarding-steps";

function capture(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  import("posthog-js")
    .then((m) => m.default?.capture?.(event, props))
    .catch(() => {});
}

const GAP = 12;
const PAD = 6;
const CARD_W = 320;
const FIND_TIMEOUT_MS = 2500;

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Position the card relative to the anchor rect, mirroring sides in RTL. */
function cardStyle(rect: DOMRect | null, side: SpotlightSide): React.CSSProperties {
  if (typeof window === "undefined" || !rect) {
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }
  const isRtl = document?.dir === "rtl";
  let s: SpotlightSide = side;
  if (isRtl && side === "left") s = "right";
  else if (isRtl && side === "right") s = "left";

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const minX = CARD_W / 2 + 8;
  const maxX = window.innerWidth - CARD_W / 2 - 8;
  const clampX = (x: number) => Math.max(minX, Math.min(maxX, x));

  switch (s) {
    case "top":
      return { top: rect.top - GAP, left: clampX(cx), transform: "translate(-50%, -100%)" };
    case "left":
      return { top: cy, left: rect.left - GAP, transform: "translate(-100%, -50%)" };
    case "right":
      return { top: cy, left: rect.right + GAP, transform: "translate(0, -50%)" };
    case "bottom":
    default:
      return { top: rect.bottom + GAP, left: clampX(cx), transform: "translate(-50%, 0)" };
  }
}

/**
 * Lightweight, brand-native replacement for the react-joyride tour.
 * - Dims the page with a box-shadow cutout around a real `data-onboarding` anchor.
 * - Advances ONLY on the user's real click of the anchor (or the Next button) —
 *   never auto-clicks. Gracefully skips any anchor that isn't present.
 * - Keyboard: Esc closes, Enter / ArrowRight advances. aria-live announces steps.
 */
export const Spotlight: React.FC = () => {
  const { spotlightActive, spotlightStep, setSpotlightStep, stopSpotlight } =
    useOnboardingStore();
  const t = useT();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  const step = spotlightActive ? SPOTLIGHT_STEPS[spotlightStep] : undefined;
  const total = SPOTLIGHT_STEPS.length;

  const advance = useCallback(() => {
    capture("onboarding.spotlight_advanced", { step: spotlightStep });
    if (spotlightStep < total - 1) setSpotlightStep(spotlightStep + 1);
    else stopSpotlight();
  }, [spotlightStep, total, setSpotlightStep, stopSpotlight]);

  const skip = useCallback(() => {
    capture("onboarding.spotlight_skipped", { step: spotlightStep });
    stopSpotlight();
  }, [spotlightStep, stopSpotlight]);

  // Acquire the anchor for the current step (with retry + graceful skip),
  // then keep its rect in sync and advance on the user's real click.
  useEffect(() => {
    if (!spotlightActive || !step) return;
    setRect(null);
    let el: HTMLElement | null = null;
    let raf = 0;
    let elapsed = 0;
    const selector = `[data-onboarding="${step.anchor}"]`;

    const measure = () => {
      if (!el) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setRect(el!.getBoundingClientRect()));
    };

    const onClick = () => window.setTimeout(advance, 60);

    const attach = (found: HTMLElement) => {
      el = found;
      measure();
      found.addEventListener("click", onClick, { once: true });
      window.addEventListener("scroll", measure, true);
      window.addEventListener("resize", measure);
      ro = new ResizeObserver(measure);
      ro.observe(found);
      capture("onboarding.spotlight_step_shown", { step: spotlightStep, id: step.id });
    };

    let ro: ResizeObserver | undefined;
    const poll = window.setInterval(() => {
      const found = document.querySelector<HTMLElement>(selector);
      if (found) {
        window.clearInterval(poll);
        attach(found);
        return;
      }
      elapsed += 120;
      if (elapsed >= FIND_TIMEOUT_MS) {
        window.clearInterval(poll);
        // Anchor not present (e.g. wrong route / non-hybrid artifact) — skip on.
        if (spotlightStep < total - 1) setSpotlightStep(spotlightStep + 1);
        else stopSpotlight();
      }
    }, 120);

    return () => {
      window.clearInterval(poll);
      cancelAnimationFrame(raf);
      el?.removeEventListener("click", onClick);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, [spotlightActive, spotlightStep, step, advance, setSpotlightStep, stopSpotlight, total]);

  // Keyboard controls + initial focus.
  useEffect(() => {
    if (!spotlightActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        skip();
      } else if (e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => cardRef.current?.focus(), 80);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [spotlightActive, advance, skip]);

  if (!mounted || !spotlightActive || !step) return null;

  const reduce = prefersReducedMotion();
  const isLast = spotlightStep >= total - 1;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[10000]"
      data-testid="onboarding-spotlight"
      role="dialog"
      aria-modal="false"
      aria-label={t(step.titleKey)}
    >
      {/* Dim + cutout */}
      {rect ? (
        <div
          data-testid="onboarding-spotlight-mask"
          className={cn("absolute rounded-xl", !reduce && "transition-all duration-200")}
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.55)",
            outline: "2px solid #09BC8A",
            outlineOffset: 2,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[rgba(2,6,23,0.55)]" />
      )}

      {/* aria-live announcement */}
      <div aria-live="polite" className="sr-only">
        {`${t("onboarding.spotlight.stepOf", {
          current: spotlightStep + 1,
          total,
        })}: ${t(step.titleKey)}`}
      </div>

      {/* Info card */}
      <div
        ref={cardRef}
        tabIndex={-1}
        data-testid={`spotlight-step-${spotlightStep + 1}`}
        className={cn(
          "pointer-events-auto fixed w-[320px] max-w-[calc(100vw-24px)] rounded-2xl border bg-background p-4 shadow-xl outline-none",
          !reduce && "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
        style={cardStyle(rect, step.side)}
      >
        <div className="mb-1 flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-yadn-accent-green">
            {t("onboarding.spotlight.stepOf", {
              current: spotlightStep + 1,
              total,
            })}
          </span>
          <button
            onClick={skip}
            aria-label={t("onboarding.spotlight.close")}
            className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          >
            <X size={15} />
          </button>
        </div>
        <h3 className="text-sm font-semibold">{t(step.titleKey)}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t(step.bodyKey)}</p>
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={skip}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t("onboarding.spotlight.skip")}
          </button>
          <button
            onClick={advance}
            className="rounded-lg bg-yadn-accent-green px-3 py-1.5 text-xs font-medium text-white hover:bg-yadn-accent-green/90"
          >
            {t(isLast ? "onboarding.spotlight.done" : "onboarding.spotlight.next")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Spotlight;
