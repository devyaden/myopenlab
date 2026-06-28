"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * CodeChip — the Atlas "coordinates" token. A code (e.g. HR-01, TMPL01-HR-01) is
 * the canonical identity of an artifact, always rendered in mono and always LTR
 * (even on RTL pages). Optionally clickable (jump to the artifact) and copyable.
 */
export interface CodeChipProps extends React.HTMLAttributes<HTMLElement> {
  code: string;
  onJump?: () => void;
  copyable?: boolean;
  size?: "sm" | "md";
}

export function CodeChip({
  code,
  onJump,
  copyable = true,
  size = "md",
  className,
  ...rest
}: CodeChipProps) {
  const [copied, setCopied] = React.useState(false);

  const base = cn(
    "inline-flex items-center rounded-sm bg-code-bg font-mono font-medium text-code-text tabular-nums select-text align-middle",
    size === "sm" ? "px-1 py-0 text-[11px]" : "px-1.5 py-0.5 text-xs",
    onJump &&
      "cursor-pointer transition-colors hover:bg-signal/15 hover:text-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
    className
  );

  const content = copied ? "Copied" : code;
  const title = copyable ? `${code} — click to copy` : code;

  const handleCopy = (e: React.MouseEvent) => {
    if (!copyable) return;
    e.stopPropagation();
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    });
  };

  // Jump takes precedence as the primary action; copy via modifier/secondary.
  if (onJump) {
    return (
      <button
        type="button"
        dir="ltr"
        className={base}
        title={code}
        onClick={onJump}
        onAuxClick={handleCopy}
        {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {code}
      </button>
    );
  }

  return (
    <span
      dir="ltr"
      role={copyable ? "button" : undefined}
      tabIndex={copyable ? 0 : undefined}
      className={cn(base, copyable && "cursor-pointer hover:bg-signal/15")}
      title={title}
      onClick={handleCopy}
      onKeyDown={(e) => {
        if (copyable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleCopy(e as unknown as React.MouseEvent);
        }
      }}
      {...rest}
    >
      {content}
    </span>
  );
}

export default CodeChip;
