"use client";

import { useMemo, useState } from "react";
import { Search, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CodeChip } from "@/components/ui/code-chip";
import { cn } from "@/lib/utils";

export interface MapNode {
  id: string;
  label: string;
  code: string | null;
  group: string;
  canvasType: string | null;
}

const TYPE_FILTERS: { key: string; label: string }[] = [
  { key: "hybrid", label: "Playbooks" },
  { key: "table", label: "Tables" },
  { key: "document", label: "Documents" },
  { key: "person", label: "People" },
  { key: "role", label: "Roles" },
];

const KNOWN_GROUPS = new Set([
  "person",
  "role",
  "document",
  "table",
  "hybrid",
  "canvas",
  "code",
]);
const groupToken = (g: string) => (KNOWN_GROUPS.has(g) ? g : "canvas");

/**
 * The Map's left pane — unified find/filter. Live, forgiving search over name +
 * code; AND-stacked type filters; a keyboard-navigable result list that focuses
 * the matching node in the graph (and grounds the Q&A on it).
 */
export function MapSearchPane({
  nodes,
  selectedId,
  onSelect,
  onCollapse,
}: {
  nodes: MapNode[];
  selectedId: string | null;
  onSelect: (node: MapNode) => void;
  onCollapse: () => void;
}) {
  const [q, setQ] = useState("");
  const [types, setTypes] = useState<Set<string>>(new Set());

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return nodes
      .filter((n) => (types.size === 0 ? true : types.has(n.group)))
      .filter(
        (n) =>
          !needle ||
          n.label.toLowerCase().includes(needle) ||
          (n.code ?? "").toLowerCase().includes(needle)
      )
      .slice(0, 200);
  }, [nodes, q, types]);

  const toggleType = (k: string) =>
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-card rtl:border-l rtl:border-r-0">
      <div className="flex items-center gap-2 border-b border-border p-3">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-2.5"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find by name or code…"
            className="h-9 pl-8 rtl:pl-3 rtl:pr-8"
            aria-label="Search the Map"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCollapse}
          className="h-8 w-8 shrink-0"
          aria-label="Hide search"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-border p-3">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => toggleType(f.key)}
            aria-pressed={types.has(f.key)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition-colors",
              types.has(f.key)
                ? "border-signal bg-signal/10 text-signal"
                : "border-border text-muted-foreground hover:bg-accent"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {results.length === 0 ? (
          <div className="px-2 py-8 text-center text-sm text-muted-foreground">
            {nodes.length === 0
              ? "No artifacts yet. Link artifacts in the editor to see them here."
              : "No matches. Try removing filters."}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {results.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => onSelect(n)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                    selectedId === n.id
                      ? "bg-signal/10 text-signal"
                      : "hover:bg-accent"
                  )}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: `hsl(var(--node-${groupToken(n.group)}))`,
                    }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate">{n.label}</span>
                  {n.code && (
                    <CodeChip code={n.code} copyable={false} size="sm" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

export default MapSearchPane;
