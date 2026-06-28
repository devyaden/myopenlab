"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface InspectorProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  /** Small line under the title — a type label, code chip, or hint. */
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  /** Right-aligned extra in the header row (e.g. a CodeChip). */
  headerExtra?: React.ReactNode;
  /** Sticky footer — typically the one primary action. */
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** The shared inspector width across all surfaces. */
  width?: "sm" | "md";
  /** Dim the background and close on outside click (modal-style). */
  backdrop?: boolean;
  /** Distance from the top of the viewport, so the panel sits below the editor
   *  chrome instead of covering it. Defaults to full height. */
  top?: number | string;
  className?: string;
  "aria-label"?: string;
}

const WIDTHS = { sm: "w-80", md: "w-96" } as const;

/**
 * The unified editor Inspector — one right-side panel pattern for every kind of
 * context (a selected step, a column, a block, page setup). Same width, header
 * anatomy, scroll body, footer and close affordance across Flow / Table /
 * Document, so "properties" always looks and behaves like one feature.
 */
export function Inspector({
  open,
  onClose,
  title,
  subtitle,
  icon,
  headerExtra,
  footer,
  children,
  width = "sm",
  backdrop = false,
  top,
  className,
  ...rest
}: InspectorProps) {
  if (!open) return null;

  const style =
    top != null
      ? { top: typeof top === "number" ? `${top}px` : top }
      : undefined;

  return (
    <>
      {backdrop && (
        <div
          className="fixed inset-0 z-40 bg-black/20 transition-opacity"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        role="complementary"
        aria-label={
          rest["aria-label"] ??
          (typeof title === "string" ? title : "Inspector")
        }
        style={style}
        className={cn(
          "fixed bottom-0 right-0 z-50 flex flex-col border-l border-border bg-card shadow-atlas-lg",
          top != null ? "" : "top-0",
          WIDTHS[width],
          "animate-in slide-in-from-right duration-menu",
          className
        )}
      >
        <header className="flex items-start justify-between gap-2 border-b border-border bg-muted/50 p-4">
          <div className="flex min-w-0 items-center gap-2">
            {icon && <span className="mt-0.5 shrink-0 text-signal">{icon}</span>}
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-foreground">
                {title}
              </h2>
              {subtitle && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {headerExtra}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-4">{children}</div>
        </ScrollArea>

        {footer && (
          <div className="border-t border-border bg-muted/50 p-4">{footer}</div>
        )}
      </aside>
    </>
  );
}

export default Inspector;
