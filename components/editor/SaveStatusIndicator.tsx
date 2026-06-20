"use client";

import { Check, Loader2, AlertCircle, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import { ANCHORS } from "@/components/onboarding/onboarding-steps";

/**
 * Unified autosave status used by all three editor surfaces (Canvas / Table /
 * Document). Phase 1 of the Operating Model Engine plan unifies persistence to
 * autosave, so this is the single, quiet indicator that replaces the old
 * "manual Save is the contract" mental model.
 */
export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  /** When the last successful save completed; shown as a hover hint. */
  lastSaved?: Date | null;
  className?: string;
}

function formatRelative(date: Date): string {
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export function SaveStatusIndicator({
  status,
  lastSaved,
  className,
}: SaveStatusIndicatorProps) {
  let icon: React.ReactNode;
  let label: string;
  let tone = "text-muted-foreground";

  switch (status) {
    case "saving":
      icon = <Loader2 className="h-3.5 w-3.5 animate-spin" />;
      label = "Saving…";
      break;
    case "unsaved":
      icon = <CircleDashed className="h-3.5 w-3.5" />;
      label = "Unsaved changes";
      break;
    case "error":
      icon = <AlertCircle className="h-3.5 w-3.5" />;
      label = "Couldn’t save";
      tone = "text-destructive";
      break;
    case "saved":
    default:
      icon = <Check className="h-3.5 w-3.5" />;
      label = "All changes saved";
      break;
  }

  const title =
    status === "saved" && lastSaved
      ? `Saved ${formatRelative(lastSaved)}`
      : status === "error"
        ? "We couldn’t save your latest changes — they’ll retry on your next edit, or click Save."
        : undefined;

  return (
    <div
      data-onboarding={ANCHORS.saveStatus}
      className={cn(
        "flex items-center gap-1.5 text-xs select-none whitespace-nowrap",
        tone,
        className
      )}
      title={title}
      aria-live="polite"
      role="status"
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </div>
  );
}
