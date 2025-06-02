// Safe lazy loading of tracking modules to avoid SSR issues

// Type-only imports that are safe for SSR
export type {
  BaseEventProperties,
  AuthEventProperties,
  FormEventProperties,
  SessionEventProperties,
  ErrorEventProperties,
  InteractionEventProperties,
  NavigationEventProperties,
  EventProperties,
} from "./events";

export type { SessionData } from "./session";
export type { ErrorContext, RecurrentError } from "./errors";

// Export enums (these are safe for SSR as they compile to objects)
export {
  EventCategory,
  AuthEvent,
  FormEvent,
  SessionEvent,
  ErrorEvent,
  InteractionEvent,
  NavigationEvent,
} from "./events";

// Safe lazy loaders for browser-only functionality
export const getTracker = async () => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const { tracker } = await import("./tracker");
    return tracker;
  } catch {
    return null;
  }
};

export const getSessionManager = async () => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const { sessionManager } = await import("./session");
    return sessionManager;
  } catch {
    return null;
  }
};

export const getErrorTracker = async () => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const { errorTracker } = await import("./errors");
    return errorTracker;
  } catch {
    return null;
  }
};

// Safe utility functions
export const safeTrackEvent = async (
  eventName: string,
  properties?: Record<string, any>
) => {
  if (typeof window === "undefined") return;

  try {
    const tracker = await getTracker();
    if (tracker) {
      // This would need to be implemented based on the specific event type
      console.log("Event tracked:", eventName, properties);
    }
  } catch {
    // Silently fail
  }
};

export const safeGetSessionInfo = async () => {
  if (typeof window === "undefined") return null;

  try {
    const sessionManager = await getSessionManager();
    return sessionManager ? sessionManager.getSessionSummary() : null;
  } catch {
    return null;
  }
};

export const safeGetErrorSummary = async () => {
  if (typeof window === "undefined") return null;

  try {
    const errorTracker = await getErrorTracker();
    return errorTracker ? errorTracker.exportErrorData() : null;
  } catch {
    return null;
  }
};

// Re-export hooks (these handle their own SSR safety)
export { useTracking } from "./hooks";
export { useErrorTracking } from "./hooks";
export { useSessionTracking } from "./hooks";
export { useComponentTracking } from "./hooks";
export { useFormTracking } from "./hooks";

// Re-export utilities (these handle their own SSR safety)
export {
  resetPostHogIdentity,
  isPostHogReady,
  getCurrentDistinctId,
  isUserIdentified,
  forceCleanLogout,
  debugTrackingState,
  manuallyIdentifyUser,
  getFeatureFlags,
  isFeatureFlagEnabled,
  safeCaptureEvent,
  validateTrackingSetup,
  initializeTracking,
  withTracking,
} from "./utils";

// Utility functions for common tracking scenarios (SSR safe)
export const trackFormError = async (
  formName: string,
  fieldName: string,
  errorMessage: string,
  userId?: string
) => {
  if (typeof window === "undefined") return;

  try {
    const { trackFormError } = await import("./errors");
    trackFormError(formName, fieldName, errorMessage, userId);
  } catch {
    // Silently fail
  }
};

export const trackAPIError = async (
  endpoint: string,
  errorMessage: string,
  statusCode?: number,
  userId?: string
) => {
  if (typeof window === "undefined") return;

  try {
    const { trackAPIError } = await import("./errors");
    trackAPIError(endpoint, errorMessage, statusCode, userId);
  } catch {
    // Silently fail
  }
};

export const trackAuthError = async (
  method: string,
  errorMessage: string,
  userId?: string
) => {
  if (typeof window === "undefined") return;

  try {
    const { trackAuthError } = await import("./errors");
    trackAuthError(method, errorMessage, userId);
  } catch {
    // Silently fail
  }
};

// Initialize tracking system (call this in your app root)
export const initializePostHogTracking = async () => {
  if (typeof window === "undefined") return false;

  try {
    console.log("🚀 Initializing PostHog tracking system...");

    // Initialize all components
    const [tracker, sessionManager, errorTracker] = await Promise.all([
      getTracker(),
      getSessionManager(),
      getErrorTracker(),
    ]);

    if (tracker) {
      tracker.initializeInBrowser();
    }

    if (sessionManager) {
      sessionManager.initializeInBrowser();
    }

    if (errorTracker) {
      errorTracker.initializeInBrowser();
    }

    console.log("✅ PostHog tracking system initialized successfully");
    return true;
  } catch (error) {
    console.warn("⚠️ Failed to initialize PostHog tracking:", error);
    return false;
  }
};
