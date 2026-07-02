"use client";

import { useExplorationStore } from "@/lib/store/useExploration";

/**
 * Toggle exploration mode with a circular "iris" reveal originating at `origin`.
 * The reveal is animated by ExplorationOverlay's framer-motion clip-path over the
 * LIVE page. We deliberately do NOT use the View Transitions API: it snapshots the
 * whole page, so closing showed the old snapshot (captured while the floating
 * launcher buttons were hidden) and then swapped to the live DOM at teardown — a
 * visible flash/pop that appeared *after* the animation finished.
 */
export function triggerExplore(origin?: { x: number; y: number } | null) {
  useExplorationStore.getState().toggle(origin ?? null);
}
