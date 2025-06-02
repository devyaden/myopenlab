import React from "react";
import posthog from "posthog-js";
import { sessionManager } from "./session";
import { tracker } from "./tracker";
import { AuthEvent } from "./events";

/**
 * Utility functions for PostHog tracking and session management
 */

/**
 * Manually reset PostHog identity and start a new anonymous session
 * This is useful when you need to ensure a clean slate for tracking
 */
export const resetPostHogIdentity = () => {
  if (typeof window !== "undefined" && posthog) {
    console.log("🔄 Resetting PostHog identity for new anonymous session");
    posthog.reset();

    // Track that we've started a new anonymous session
    tracker.trackAuth(AuthEvent.LOGOUT, {
      auth_method: "manual_reset",
    });
  }
};

/**
 * Check if PostHog is properly initialized and ready to use
 */
export const isPostHogReady = (): boolean => {
  return (
    typeof window !== "undefined" &&
    typeof posthog !== "undefined" &&
    posthog &&
    (posthog.__loaded === true || typeof posthog.capture === "function")
  );
};

/**
 * Get current PostHog distinct ID (useful for debugging)
 */
export const getCurrentDistinctId = (): string | null => {
  if (!isPostHogReady()) return null;

  try {
    return posthog.get_distinct_id() || null;
  } catch (error) {
    console.warn("Error getting PostHog distinct ID:", error);
    return null;
  }
};

/**
 * Check if user is currently identified in PostHog
 */
export const isUserIdentified = (): boolean => {
  if (!isPostHogReady()) return false;

  try {
    const distinctId = posthog.get_distinct_id();

    // Check if we have a distinct ID and it's not a device ID
    if (!distinctId || distinctId.startsWith("$device:")) {
      return false;
    }

    // Try to get the identified property if available
    const isIdentifiedProp =
      posthog.get_property && posthog.get_property("$is_identified");

    // If the property exists, use it; otherwise, assume identified if we have a non-device ID
    return isIdentifiedProp !== false;
  } catch (error) {
    console.warn("Error checking PostHog identification status:", error);
    return false;
  }
};

/**
 * Force a clean logout that ensures PostHog identity is reset
 * Use this if you're having issues with persistent user identity
 */
export const forceCleanLogout = () => {
  console.log("🧹 Forcing clean logout and PostHog reset");

  // Clear session manager
  sessionManager.clearUser();

  // Reset PostHog
  resetPostHogIdentity();

  // Clear any other tracking-related storage
  localStorage.removeItem("yadn_error_tracking");
  sessionStorage.removeItem("yadn_session_data");
  sessionStorage.removeItem("posthog_session_id");

  // Track the clean logout
  tracker.trackAuth(AuthEvent.LOGOUT, {
    auth_method: "force_clean",
  });
};

/**
 * Debug function to log current tracking state
 */
export const debugTrackingState = () => {
  if (process.env.NODE_ENV !== "development") return;

  console.group("🐛 PostHog Tracking Debug Info");
  console.log("PostHog Ready:", isPostHogReady());
  console.log("Distinct ID:", getCurrentDistinctId());
  console.log("User Identified:", isUserIdentified());
  console.log("Session Data:", sessionManager.getSessionData());
  console.log("Session Summary:", sessionManager.getSessionSummary());
  console.groupEnd();
};

/**
 * Manually identify a user (useful for testing)
 */
export const manuallyIdentifyUser = (
  userId: string,
  userProperties?: Record<string, any>
) => {
  if (!isPostHogReady()) {
    console.warn("PostHog not ready, cannot identify user");
    return;
  }

  console.log(`🔍 Manually identifying user: ${userId}`);
  sessionManager.setUser(userId, userProperties?.email);
};

/**
 * Get PostHog feature flags (if you're using them)
 */
export const getFeatureFlags = (): Record<string, any> => {
  if (!isPostHogReady()) return {};

  // Note: getAllFlags() might not be available in all PostHog versions
  // Check if the method exists before calling it
  //   if (typeof posthog.getAllFlags === "function") {
  //     return posthog.getAllFlags() || {};
  //   }

  // Fallback: return empty object if method doesn't exist
  console.warn("getAllFlags method not available in this PostHog version");
  return {};
};

/**
 * Check if a specific feature flag is enabled
 */
export const isFeatureFlagEnabled = (flagKey: string): boolean => {
  if (!isPostHogReady()) return false;

  // Check if the method exists before calling it
  if (typeof posthog.isFeatureEnabled === "function") {
    return posthog.isFeatureEnabled(flagKey) || false;
  }

  // Fallback: try the alternative method name
  if (typeof posthog.getFeatureFlag === "function") {
    return !!posthog.getFeatureFlag(flagKey);
  }

  console.warn("Feature flag methods not available in this PostHog version");
  return false;
};

/**
 * Safely capture a custom event with error handling
 */
export const safeCaptureEvent = (
  eventName: string,
  properties?: Record<string, any>
) => {
  try {
    if (isPostHogReady()) {
      posthog.capture(eventName, properties);
    } else {
      console.warn("PostHog not ready, event not captured:", eventName);
    }
  } catch (error) {
    console.error("Error capturing PostHog event:", error);
  }
};

/**
 * Validate that tracking is working correctly
 * Returns true if everything is set up properly
 */
export const validateTrackingSetup = (): boolean => {
  const checks = {
    postHogReady: isPostHogReady(),
    sessionManagerWorking: !!sessionManager.getSessionData(),
    distinctIdExists: !!getCurrentDistinctId(),
  };

  const allChecksPass = Object.values(checks).every(Boolean);

  if (process.env.NODE_ENV === "development") {
    console.log("🔍 Tracking Setup Validation:", checks);
    if (!allChecksPass) {
      console.warn("⚠️ Some tracking validation checks failed");
    } else {
      console.log("✅ All tracking validation checks passed");
    }
  }

  return allChecksPass;
};

/**
 * Initialize tracking after a page load
 * Call this in your main app component if you're having initialization issues
 */
export const initializeTracking = () => {
  // Wait for PostHog to be ready
  if (typeof window !== "undefined") {
    const checkReady = () => {
      if (isPostHogReady()) {
        console.log("🚀 PostHog tracking initialized");
        validateTrackingSetup();
      } else {
        setTimeout(checkReady, 100);
      }
    };

    checkReady();
  }
};

/**
 * Create a tracking context wrapper for components
 */
export const withTracking = <T extends {}>(
  Component: React.ComponentType<T>,
  componentName: string
): React.ComponentType<T> => {
  return (props: T) => {
    React.useEffect(() => {
      tracker.trackInteraction("component_mounted" as any, {
        element_type: "component",
        element_text: componentName,
        interaction_context: "component_lifecycle",
      });

      return () => {
        tracker.trackInteraction("component_unmounted" as any, {
          element_type: "component",
          element_text: componentName,
          interaction_context: "component_lifecycle",
        });
      };
    }, []);

    return React.createElement(Component, props);
  };
};
