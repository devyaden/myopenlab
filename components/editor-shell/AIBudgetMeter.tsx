"use client";

import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Usage = {
  daily: number;
  dailyLimit: number;
};

/**
 * A compact AI-budget meter for the editor StatusChrome. Shows how much of the
 * day's AI budget is left as a thin bar, with a plain-language tooltip. Renders
 * nothing for unlimited plans (no daily limit) or while data is unavailable, so
 * it never adds noise when there's nothing to say.
 */
export function AIBudgetMeter({ className }: { className?: string }) {
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        // No daily limit configured => unlimited => nothing meaningful to show.
        if (cancelled || !j || !(j.dailyLimit > 0)) return;
        setUsage({ daily: j.daily ?? 0, dailyLimit: j.dailyLimit });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!usage) return null;

  const pct = Math.min(100, Math.round((usage.daily / usage.dailyLimit) * 100));
  const remaining = Math.max(0, 100 - pct);
  const near = pct >= 80;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn("flex items-center gap-1.5", className)}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`AI budget: ${remaining}% remaining today`}
          >
            {near && (
              <AlertTriangle
                className="h-3.5 w-3.5 text-attention-text"
                aria-hidden
              />
            )}
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-menu",
                  near ? "bg-attention" : "bg-signal"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {near
              ? "You're close to today's AI limit."
              : `${remaining}% of today's AI budget remaining.`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default AIBudgetMeter;
