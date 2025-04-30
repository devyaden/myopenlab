import posthog from "posthog-js";

// PostHog feature flag enum names
export enum PostHogFlags {
  ENABLE_NEW_EDITOR = "enable-new-editor",
  ENABLE_AI_FEATURES = "enable-ai-features",
  ENABLE_SHARING = "enable-sharing",
}

// PostHog event names
export enum PostHogEvents {
  AI_DIAGRAM_GENERATION_STARTED = "ai_diagram_generation_started",
  AI_DIAGRAM_GENERATION_COMPLETED = "ai_diagram_generation_completed",
  AI_DIAGRAM_GENERATION_ERROR = "ai_diagram_generation_error",
}

// Initialize PostHog if we're in the browser
if (typeof window !== "undefined") {
  // Only initialize if we have a valid API key
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",

      // Enable debug mode in development
      debug: process.env.NODE_ENV !== "production",

      // Disable autocapture in development
      autocapture: process.env.NODE_ENV === "production",

      // Capture pageviews
      capture_pageview: true,

      // In most cases you want to persist the PostHog identity
      persistence: "localStorage",

      // Disable in development
      loaded: (posthog) => {
        if (process.env.NODE_ENV !== "production") {
          // You can optionally disable any capturing in development
          // posthog.opt_out_capturing();
        }
      },
    });
  }
}

export { posthog };
