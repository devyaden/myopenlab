"use client";

import { NavigationEvent } from "@/lib/posthog/events";
import { sessionManager } from "@/lib/posthog/session";
import { tracker } from "@/lib/posthog/tracker";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { Suspense, useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
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
      // Enhanced session tracking
      loaded: (posthog) => {
        // Initialize our custom session manager
        if (typeof window !== "undefined") {
          sessionManager; // This will initialize the session manager
        }
      },
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  );
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      const search = searchParams.toString();
      if (search) {
        url += "?" + search;
      }

      // Original PostHog pageview capture
      posthog.capture("$pageview", { $current_url: url });

      // Our enhanced session tracking
      sessionManager.trackPageView(pathname);

      // Track navigation event
      tracker.trackNavigation(NavigationEvent.PAGE_VISITED, {
        to_page: pathname,
        navigation_type: "user_initiated",
      });
    }
  }, [pathname, searchParams, posthog]);

  return null;
}

function SuspendedPostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  );
}
