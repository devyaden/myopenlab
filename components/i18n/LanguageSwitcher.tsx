"use client";

import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

function capture(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  import("posthog-js")
    .then((m) => m.default?.capture?.(event, props))
    .catch(() => {});
}

/** Compact EN/AR language switcher. Toggling sets the locale instantly (no reload). */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={LOCALE_LABELS[locale]}
          className={cn(
            "text-white hover:bg-white/10 flex items-center gap-2",
            className
          )}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{LOCALE_LABELS[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l}
            className="flex items-center justify-between gap-2 cursor-pointer"
            onClick={() => {
              if (l !== locale) {
                capture("i18n.locale_changed", { from: locale, to: l });
                setLocale(l);
              }
            }}
          >
            <span>{LOCALE_LABELS[l]}</span>
            {l === locale && <Check className="h-4 w-4 text-yadn-accent-green" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;
