"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * TeachingEmptyState — the Atlas foolproof empty/zero state. Never a blank screen:
 * it says what this is, why it matters, and gives ONE obvious way to begin.
 */
export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
}

export interface TeachingEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  /** Compact variant for in-panel empties (e.g. an empty table body). */
  compact?: boolean;
}

function ActionButton({
  action,
  variant,
}: {
  action: EmptyStateAction;
  variant: "default" | "outline";
}) {
  const content = (
    <>
      {action.icon}
      {action.label}
    </>
  );
  if (action.href) {
    return (
      <Button asChild variant={variant}>
        <a href={action.href}>{content}</a>
      </Button>
    );
  }
  return (
    <Button variant={variant} onClick={action.onClick}>
      {content}
    </Button>
  );
}

export function TeachingEmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: TeachingEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 py-8 px-4" : "gap-3 py-16 px-6",
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-signal-tint text-signal",
            compact ? "h-10 w-10" : "h-14 w-14"
          )}
          aria-hidden
        >
          {icon}
        </div>
      )}
      <h3
        className={cn(
          "font-display font-semibold text-foreground",
          compact ? "text-base" : "text-lg"
        )}
      >
        {title}
      </h3>
      {description && (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {action && <ActionButton action={action} variant="default" />}
          {secondaryAction && (
            <ActionButton action={secondaryAction} variant="outline" />
          )}
        </div>
      )}
    </div>
  );
}

export default TeachingEmptyState;
