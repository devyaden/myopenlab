"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DirectionProvider } from "@radix-ui/react-direction";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  dirFor,
  normalizeLocale,
  type Locale,
} from "./config";
import { MESSAGES } from "./messages";

type Vars = Record<string, string | number>;
export type TFunc = (key: string, vars?: Vars) => string;

interface LocaleContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: TFunc;
  setLocale: (locale: Locale) => void;
}

function lookup(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, k) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[k]
          : undefined,
      obj
    );
}

function interpolate(s: string, vars?: Vars): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

function translate(locale: Locale, key: string, vars?: Vars): string {
  const fromLocale = lookup(MESSAGES[locale], key);
  if (typeof fromLocale === "string") return interpolate(fromLocale, vars);
  const fromDefault = lookup(MESSAGES[DEFAULT_LOCALE], key);
  if (typeof fromDefault === "string") return interpolate(fromDefault, vars);
  return key; // last-resort: show the key so missing strings are obvious
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(
    normalizeLocale(initialLocale)
  );
  const dir = dirFor(locale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
      localStorage.setItem(LOCALE_COOKIE, next);
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
      document.documentElement.dir = dirFor(next);
    }
  }, []);

  // Keep <html lang/dir> in sync after client navigations / hydration.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const t = useCallback<TFunc>((key, vars) => translate(locale, key, vars), [
    locale,
  ]);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, dir, t, setLocale }),
    [locale, dir, t, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>
      <DirectionProvider dir={dir}>{children}</DirectionProvider>
    </LocaleContext.Provider>
  );
}

// Non-throwing: components rendered outside the provider still get English copy.
const FALLBACK: LocaleContextValue = {
  locale: DEFAULT_LOCALE,
  dir: "ltr",
  t: (key, vars) => translate(DEFAULT_LOCALE, key, vars),
  setLocale: () => {},
};

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext) ?? FALLBACK;
}

export function useT(): TFunc {
  return useLocale().t;
}
