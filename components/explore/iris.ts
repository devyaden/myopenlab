"use client";

import { flushSync } from "react-dom";
import { useExplorationStore } from "@/lib/store/useExploration";

/** Whether the browser supports the native View Transitions API. */
export function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

/**
 * Toggle exploration mode with a circular "iris" reveal originating at `origin`.
 * Uses the View Transitions API where available (the CSS in globals.css animates
 * the ::view-transition pseudo-elements); otherwise toggles immediately and lets
 * ExplorationOverlay's framer-motion fallback animate the clip-path.
 */
export function triggerExplore(origin?: { x: number; y: number } | null) {
  const store = useExplorationStore.getState();
  const willEnter = !store.active;
  const run = () => store.toggle(origin ?? null);

  if (!supportsViewTransitions()) {
    run();
    return;
  }

  const root = document.documentElement;
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  root.style.setProperty("--explore-x", `${x}px`);
  root.style.setProperty("--explore-y", `${y}px`);
  root.dataset.explodeTransition = willEnter ? "enter" : "exit";

  const vt = (document as any).startViewTransition(() => flushSync(run));
  vt.finished.finally(() => {
    delete root.dataset.explodeTransition;
  });
}
