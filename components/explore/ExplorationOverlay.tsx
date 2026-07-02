"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useExplorationStore } from "@/lib/store/useExploration";
import { ExplorationApp } from "./ExplorationApp";
import { triggerExplore } from "./iris";

/**
 * The in-app, full-screen exploration surface for editor users who toggle in. It
 * renders the SAME ExplorationApp the standalone /explore route does — this thin
 * wrapper adds the iris reveal, scroll-lock, and Escape-to-exit. Mounted at the
 * protected layout level so it covers any route.
 *
 * The reveal is a framer-motion clip-path animated over the LIVE page (not the
 * View Transitions API — that snapshots the whole page and flashed the live DOM
 * back in at teardown, a glitch that showed up right after the close animation).
 */
export function ExplorationOverlay() {
  const active = useExplorationStore((s) => s.active);
  const origin = useExplorationStore((s) => s.origin);
  const [mounted, setMounted] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setMounted(true);
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
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

  // Guard hydration: render nothing until mounted (window-based geometry below).
  if (!mounted) return null;

  const w = window.innerWidth;
  const h = window.innerHeight;
  const ox = origin?.x ?? w / 2;
  const oy = origin?.y ?? h / 2;
  // Exact radius from the origin to its farthest corner, so the whole duration is
  // a visible reveal (a fixed 160vmax spends most of the animation off-screen and
  // reads as an abrupt flash at the end).
  const cover = Math.ceil(Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy))) + 4;
  const collapsed = `circle(0px at ${ox}px ${oy}px)`;
  const revealed = `circle(${cover}px at ${ox}px ${oy}px)`;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="exploration-surface"
          className="exploration-surface fixed inset-0 z-[60] bg-background"
          initial={{ clipPath: collapsed, opacity: 0.6 }}
          animate={{ clipPath: revealed, opacity: 1 }}
          exit={{ clipPath: collapsed, opacity: 0.6 }}
          transition={{ duration: reduce ? 0 : 0.9, ease: [0.65, 0, 0.35, 1] }}
        >
          <ExplorationApp variant="overlay" onClose={() => triggerExplore(origin)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
