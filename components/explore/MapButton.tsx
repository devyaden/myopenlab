"use client";

import { Map as MapIcon } from "lucide-react";
import { useExplorationStore } from "@/lib/store/useExploration";
import { triggerExplore } from "./iris";
import { cn } from "@/lib/utils";

/**
 * MapButton — the Atlas wayfinding entry to "The Map" (the read-only graph of how
 * every playbook, table, document and person connects). Reuses the existing
 * exploration iris-reveal entry, surfaced as a labelled control in the editor
 * header chrome (not just the app-wide floating button). Hidden while the Map is
 * already open (the overlay carries its own exit).
 */
export function MapButton({ className }: { className?: string }) {
  const active = useExplorationStore((s) => s.active);
  if (active) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        triggerExplore({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      title="Open the Map — see how everything connects"
      aria-label="Open the Map"
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        className
      )}
    >
      <MapIcon className="h-4 w-4" />
      <span className="hidden lg:inline">Map</span>
    </button>
  );
}

export default MapButton;
