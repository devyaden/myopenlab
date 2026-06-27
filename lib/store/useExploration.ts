"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** An entity the user is focusing the governance chat on (clicked in the browser
 *  or a source chip). The single channel that pivots the chat's grounding. */
export interface ExploreContext {
  kind: "canvas" | "person" | "role" | "code";
  id: string;
  label: string;
  code?: string | null;
}

interface ExplorationState {
  /** Whether the in-app exploration overlay is open (the standalone /explore
   *  route renders ExplorationApp directly and ignores this). */
  active: boolean;
  /** The click coordinates the iris reveal animates out from. */
  origin: { x: number; y: number } | null;
  context: ExploreContext | null;
  enter: (origin?: { x: number; y: number } | null) => void;
  exit: () => void;
  toggle: (origin?: { x: number; y: number } | null) => void;
  setContext: (ctx: ExploreContext | null) => void;
}

export const useExplorationStore = create<ExplorationState>()(
  persist(
    (set, get) => ({
      active: false,
      origin: null,
      context: null,
      enter: (origin = null) => set({ active: true, origin }),
      exit: () => set({ active: false, context: null }),
      toggle: (origin = null) =>
        get().active
          ? set({ active: false, context: null })
          : set({ active: true, origin }),
      setContext: (context) => set({ context }),
    }),
    {
      name: "exploration-mode",
      storage: createJSONStorage(() => localStorage),
      // Persist only the on/off intent (like dark mode) — not the transient
      // origin/context. Reopening reloads in exploration mode until the user exits.
      partialize: (s) => ({ active: s.active }),
    }
  )
);
