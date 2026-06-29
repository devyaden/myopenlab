"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Table2, Workflow } from "lucide-react";
import { playbookHref } from "@/lib/playbook-href";

interface Recent {
  id: string;
  title: string;
  date?: string;
  type?: string | null;
}

const META: Record<string, { icon: typeof Workflow; token: string }> = {
  hybrid: { icon: Workflow, token: "--node-hybrid" },
  table: { icon: Table2, token: "--node-table" },
  document: { icon: FileText, token: "--node-document" },
};
const metaFor = (t?: string | null) =>
  META[(t ?? "hybrid").toLowerCase()] ?? META.hybrid;

/**
 * "Jump back in" — the most recently opened artifacts, written to
 * localStorage["recentDocuments"] by the editors. Hidden when empty (the Library
 * empty state covers the cold start).
 */
export function RecentsRow() {
  const [recents, setRecents] = useState<Recent[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("recentDocuments");
      if (raw) setRecents((JSON.parse(raw) as Recent[]).slice(0, 6));
    } catch {
      /* ignore */
    }
  }, []);

  if (recents.length === 0) return null;

  return (
    <section className="mb-2">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Jump back in
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {recents.map((r) => {
          const meta = metaFor(r.type);
          const Icon = meta.icon;
          return (
            <Link
              key={r.id}
              href={playbookHref(r.id, r.type)}
              className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 transition-all hover:border-signal/40 hover:shadow-atlas-sm"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                style={{
                  background: `hsl(var(${meta.token}) / 0.14)`,
                  color: `hsl(var(${meta.token}))`,
                }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="truncate text-sm text-foreground">
                {r.title || "Untitled"}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default RecentsRow;
