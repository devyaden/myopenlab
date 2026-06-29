"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CommandBarTrigger — the visible, persistent front door to the command palette
 * (⌘K). The Atlas wayfinding law says the way to find or create anything must be
 * obvious, not a hidden shortcut. Clicking it (or pressing ⌘K) opens the palette
 * via the shared `olab:open-cmdk` event the CommandPalette already listens for.
 *
 * Styled for the dark top bar by default; pass `className` to restyle elsewhere.
 */
export function CommandBarTrigger({ className }: { className?: string }) {
  const [isMac, setIsMac] = React.useState(true);
  React.useEffect(() => {
    setIsMac(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent));
  }, []);

  const open = () => window.dispatchEvent(new CustomEvent("olab:open-cmdk"));

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Find or create anything"
      aria-keyshortcuts="Meta+K Control+K"
      className={cn(
        "group flex h-9 w-full max-w-md items-center gap-2 rounded-md border border-border bg-muted/60 px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate text-start">Find or create anything…</span>
      <kbd
        dir="ltr"
        className="hidden shrink-0 items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex"
      >
        {isMac ? "⌘" : "Ctrl"} K
      </kbd>
    </button>
  );
}

export default CommandBarTrigger;
