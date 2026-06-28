"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Atlas light/dark toggle. Light is the default; this flips the `.dark` class via
 * next-themes. Renders a stable placeholder until mounted to avoid hydration
 * mismatch (next-themes can't know the resolved theme on the server).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Until mounted, the server can't know the resolved theme — render the stable
  // light-state markup (Sun, "Switch to dark mode") so SSR and first client paint
  // match exactly (no hydration mismatch), then correct after mount.
  const isDark = mounted && resolvedTheme === "dark";
  const nextLabel = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={nextLabel}
      title={nextLabel}
      className={cn("h-9 w-9", className)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
}

export default ThemeToggle;
