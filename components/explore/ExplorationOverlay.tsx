"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useExplorationStore } from "@/lib/store/useExploration";
import { ExplorationApp } from "./ExplorationApp";
import { triggerExplore, supportsViewTransitions } from "./iris";

/**
 * The in-app, full-screen exploration surface for editor users who toggle in. It
 * renders the SAME ExplorationApp the standalone /explore route does — this thin
 * wrapper just adds the iris reveal, scroll-lock, and Escape-to-exit. Mounted at
 * the protected layout level so it covers any route and survives navigation.
 */
export function ExplorationOverlay() {
  const active = useExplorationStore((s) => s.active);
  const origin = useExplorationStore((s) => s.origin);
  const [mounted, setMounted] = useState(false);
  // Detect View Transitions client-side. Assume supported for the very first
  // paint so we never flash the framer fallback in capable browsers.
  const [vt, setVt] = useState(true);

  useEffect(() => {
    setMounted(true);
    setVt(supportsViewTransitions());
  }, []);

  // Scroll-lock + Escape-to-exit while active.
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") triggerExplore(origin);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [active, origin]);

  // Guard hydration: persisted `active` may be true on the client but is false on
  // the server — render nothing until mounted so the markup matches.
  if (!mounted) return null;

  // The close affordance lives in the Map's top strip; the overlay supplies the
  // animated iris exit. Esc also exits (handled above).
  const surface = (
    <ExplorationApp
      variant="overlay"
      onClose={() => triggerExplore(origin)}
    />
  );

  // Fallback (no View Transitions): framer-motion clip-path reveal. AnimatePresence
  // stays mounted so the exit also animates; we only animate a reveal when there's
  // a click origin (a reload that re-enters from persistence just appears).
  if (!vt) {
    const ox = origin?.x ?? (typeof window !== "undefined" ? window.innerWidth / 2 : 0);
    const oy = origin?.y ?? (typeof window !== "undefined" ? window.innerHeight / 2 : 0);
    return (
      <AnimatePresence>
        {active && (
          <motion.div
            key="exploration-surface"
            className="exploration-surface fixed inset-0 z-[60] bg-background"
            initial={
              origin
                ? { clipPath: `circle(0px at ${ox}px ${oy}px)`, opacity: 0.4 }
                : false
            }
            animate={{
              clipPath: `circle(160vmax at ${ox}px ${oy}px)`,
              opacity: 1,
            }}
            exit={{ clipPath: `circle(0px at ${ox}px ${oy}px)`, opacity: 0.4 }}
            transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
          >
            {surface}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // View Transitions path: triggerExplore animates the iris via CSS; render plainly.
  if (!active) return null;
  return (
    <div className="exploration-surface fixed inset-0 z-[60] bg-background">{surface}</div>
  );
}
