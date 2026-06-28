"use client";

import { cn } from "@/lib/utils";

/**
 * Shared editor-toolbar grammar — the foundation for unifying the Flow, Table and
 * Document toolbars on ONE structure: a horizontally-scrolling row of labelled
 * control groups, in the consistent order **Insert · Format · Arrange**, with a
 * trailing overflow ("⋯ More") affordance for advanced controls.
 *
 * Each surface keeps its own controls but composes them from these primitives so
 * sizing, spacing, dividers, the group order, and overflow behaviour read the same
 * everywhere. Group roles + labels also make the toolbars screen-reader navigable
 * (WAI-ARIA toolbar/group).
 *
 * Adoption is incremental and per-surface (the three current toolbars have
 * genuinely different layouts), so this primitive is intentionally unopinionated
 * about which controls go where — that mapping lives in each editor's toolbar.
 */

/** The canonical group order. Surfaces place their controls under these. */
export const TOOLBAR_GROUPS = ["Insert", "Format", "Arrange"] as const;
export type ToolbarGroupName = (typeof TOOLBAR_GROUPS)[number] | (string & {});

export function ToolbarRoot({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="toolbar"
      className={cn(
        "flex items-center gap-1 overflow-x-auto border-b border-border bg-card px-2 py-1.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function ToolbarGroup({
  label,
  className,
  children,
}: {
  /** One of Insert · Format · Arrange (or a sub-label). Surfaces the a11y name. */
  label?: ToolbarGroupName;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex shrink-0 items-center gap-0.5", className)}
    >
      {children}
    </div>
  );
}

export function ToolbarSeparator({ className }: { className?: string }) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className={cn("mx-1.5 h-6 w-px shrink-0 bg-border", className)}
    />
  );
}

/** A right-aligned spacer to push trailing controls (e.g. an overflow menu) to the end. */
export function ToolbarSpacer() {
  return <div className="ml-auto" aria-hidden />;
}
