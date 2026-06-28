"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Node-type → Atlas categorical token + plain label. Mirrors GROUP_STYLE. */
const NODE_TYPES: { key: string; label: string; token: string }[] = [
  { key: "hybrid", label: "Playbook (flow)", token: "--node-hybrid" },
  { key: "table", label: "Table", token: "--node-table" },
  { key: "document", label: "Document", token: "--node-document" },
  { key: "person", label: "Person", token: "--node-person" },
  { key: "role", label: "Role", token: "--node-role" },
  { key: "canvas", label: "Canvas", token: "--node-canvas" },
  { key: "code", label: "Reference code", token: "--node-code" },
];

const EDGE_TYPES: string[] = [
  "References",
  "Reports to",
  "Approves",
  "Belongs to",
];

/**
 * The Map Legend — answers "what do these colors and links mean?" at a glance.
 * A dismissible card in the top-right of the graph; auto-opens once per session
 * (handled by the caller) then honors the dismiss.
 */
export function MapLegend({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute right-4 top-4 z-20 w-64 rounded-lg border border-border bg-card/95 p-3 shadow-atlas-lg backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Legend
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6"
          aria-label="Hide legend"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mb-1 text-[11px] font-medium text-faint-ink">Node types</div>
      <ul className="mb-3 grid grid-cols-2 gap-x-2 gap-y-1.5">
        {NODE_TYPES.map((n) => (
          <li key={n.key} className="flex items-center gap-1.5 text-xs">
            <span
              className="h-3.5 w-3.5 shrink-0 rounded border-2"
              style={{
                background: `hsl(var(${n.token}) / 0.16)`,
                borderColor: `hsl(var(${n.token}))`,
              }}
              aria-hidden
            />
            <span className="truncate text-foreground">{n.label}</span>
          </li>
        ))}
      </ul>

      <div className="mb-1 text-[11px] font-medium text-faint-ink">Links</div>
      <ul className="space-y-1">
        {EDGE_TYPES.map((e) => (
          <li key={e} className="flex items-center gap-2 text-xs text-foreground">
            <span className="h-px w-5 shrink-0 bg-muted-foreground" aria-hidden />
            <span>{e}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MapLegend;
