"use client";

import { useEffect } from "react";
import { UserProvider } from "@/lib/contexts/userContext";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";
import posthog from "posthog-js";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

export default function ClientLayout({
  children,
  locale = DEFAULT_LOCALE,
}: {
  children: React.ReactNode;
  locale?: Locale;
}) {
  useEffect(() => {
    // Capture uncaught JavaScript errors
    const handleError = (
      message: string | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ) => {
      posthog.capture("window_error", {
        message: typeof message === "string" ? message : "",
        source,
        lineno,
        colno,
        stack: error?.stack || "",
      });
    };

    // Capture unhandled Promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      posthog.capture("unhandled_promise_rejection", {
        reason: event.reason?.message || String(event.reason),
        stack: event.reason?.stack || "",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      forcedTheme="light"
      disableTransitionOnChange
    >
      <LocaleProvider initialLocale={locale}>
        <UserProvider>
          <main className="min-h-screen min-w-screen">{children}</main>
          <Toaster />
        </UserProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
