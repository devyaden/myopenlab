"use client";

import { create } from "zustand";

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

// In-memory only — the open state is intentionally NOT persisted. Persisting it
// made the full-screen Map surface re-cover the whole app on every page load and
// snap in with no animation (there's no click origin / view-transition on a
// persisted load). A hard reload now returns to the normal app; in-app client
// navigation still keeps the Map open because React state survives it.
export const useExplorationStore = create<ExplorationState>()((set, get) => ({
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
}));
