"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * InlineHelp — a quiet "what's this?" affordance. A small, unobtrusive help icon
 * that reveals a plain-language explanation in a popover. Foolproof law: help is
 * always one click away, never nagging.
 */
export interface InlineHelpProps {
  /** Plain-language explanation. */
  children: React.ReactNode;
  title?: string;
  label?: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export function InlineHelp({
  children,
  title,
  label = "What's this?",
  side = "top",
  className,
}: InlineHelpProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
            className
          )}
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align="start"
        className="w-72 text-sm leading-relaxed"
      >
        {title && (
          <p className="mb-1 font-display font-semibold text-foreground">
            {title}
          </p>
        )}
        <div className="text-muted-foreground">{children}</div>
      </PopoverContent>
    </Popover>
  );
}

export default InlineHelp;
