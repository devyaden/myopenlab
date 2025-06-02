"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { Suspense, useEffect, useState } from "react";

let posthogInstance: any = null;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only initialize PostHog in browser environment
    if (typeof window !== "undefined" && !isInitialized) {
      initializePostHog();
    }
  }, [isInitialized]);

  const initializePostHog = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const posthogModule = await import("posthog-js");
      const posthog = posthogModule.default;

      if (!posthog.__loaded) {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
          api_host: "/ingest",
          ui_host: "https://us.posthog.com",
          capture_pageview: false,
          capture_pageleave: true,
          debug: process.env.NODE_ENV === "development",
          session_recording: {
            recordCrossOriginIframes: true,
            maskAllInputs: false,
            maskInputOptions: {
              password: true,
              email: false,
            },
          },
          loaded: async (posthogInstance) => {
            // Initialize our tracking utilities after PostHog loads
            try {
              const [{ tracker }, { sessionManager }, { errorTracker }] =
                await Promise.all([
                  import("@/lib/posthog/tracker"),
                  import("@/lib/posthog/session"),
                  import("@/lib/posthog/errors"),
                ]);

              // Initialize all tracking components
              tracker.initializeInBrowser();
              sessionManager.initializeInBrowser();
              errorTracker.initializeInBrowser();

              console.log("🚀 PostHog and tracking utilities initialized");
            } catch (error) {
              console.warn(
                "⚠️ Failed to initialize tracking utilities:",
                error
              );
            }
          },
        });
      }

      posthogInstance = posthog;
      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to initialize PostHog:", error);
    }
  };

  // Don't render children until PostHog is initialized to avoid hydration issues
  if (typeof window !== "undefined" && !isInitialized) {
    return <div style={{ display: "none" }}>{children}</div>;
  }

  return (
    <PHProvider client={posthogInstance}>
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  );
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only track in browser environment after PostHog is loaded
    if (typeof window !== "undefined" && pathname && posthogInstance) {
      const trackPageView = async () => {
        try {
          let url = window.origin + pathname;
          const search = searchParams.toString();
          if (search) {
            url += "?" + search;
          }

          // Original PostHog pageview capture
          posthogInstance.capture("$pageview", { $current_url: url });

          // Our enhanced session tracking
          const [{ sessionManager }, { tracker }, { NavigationEvent }] =
            await Promise.all([
              import("@/lib/posthog/session"),
              import("@/lib/posthog/tracker"),
              import("@/lib/posthog/events"),
            ]);

          sessionManager.trackPageView(pathname);

          tracker.trackNavigation(NavigationEvent.PAGE_VISITED, {
            to_page: pathname,
            navigation_type: "user_initiated",
          });
        } catch (error) {
          console.warn("Failed to track page view:", error);
        }
      };

      trackPageView();
    }
  }, [pathname, searchParams]);

  return null;
}

function SuspendedPostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  );
}
