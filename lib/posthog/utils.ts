import React from "react";
import { AuthEvent } from "./events";

// Safe PostHog access functions
const safePostHogReset = (): void => {
  if (typeof window === "undefined") return;

  try {
    import("posthog-js")
      .then((posthogModule) => {
        const posthog = posthogModule.default;
        if (posthog && typeof posthog.reset === "function") {
          posthog.reset();
        }
      })
      .catch(() => {
        // Silently fail if PostHog not available
      });
  } catch {
    // Silently fail
  }
};

const safeGetDistinctId = (): Promise<string | null> => {
  if (typeof window === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {
    try {
      import("posthog-js")
        .then((posthogModule) => {
          const posthog = posthogModule.default;
          if (posthog && typeof posthog.get_distinct_id === "function") {
            resolve(posthog.get_distinct_id());
          } else {
            resolve(null);
          }
        })
        .catch(() => {
          resolve(null);
        });
    } catch {
      resolve(null);
    }
  });
};

const safeIsPostHogReady = (): Promise<boolean> => {
  if (typeof window === "undefined") return Promise.resolve(false);

  return new Promise((resolve) => {
    try {
      import("posthog-js")
        .then((posthogModule) => {
          const posthog = posthogModule.default;
          resolve(!!(posthog && typeof posthog.capture === "function"));
        })
        .catch(() => {
          resolve(false);
        });
    } catch {
      resolve(false);
    }
  });
};

const safeGetFeatureFlags = (): Promise<Record<string, any>> => {
  if (typeof window === "undefined") return Promise.resolve({});

  return new Promise((resolve) => {
    try {
      import("posthog-js")
        .then((posthogModule) => {
          const posthog: any = posthogModule.default;
          if (posthog && typeof posthog.getAllFlags === "function") {
            resolve(posthog.getAllFlags() || {});
          } else {
            resolve({});
          }
        })
        .catch(() => {
          resolve({});
        });
    } catch {
      resolve({});
    }
  });
};

const safeTrackAuth = (event: AuthEvent, properties: any = {}): void => {
  if (typeof window === "undefined") return;

  try {
    import("./tracker")
      .then(({ tracker }) => {
        tracker.trackAuth(event, properties);
      })
      .catch(() => {
        // Silently fail if tracker not available
      });
  } catch {
    // Silently fail
  }
};

/**
 * Utility functions for PostHog tracking and session management
 */

/**
 * Manually reset PostHog identity and start a new anonymous session
 * This is useful when you need to ensure a clean slate for tracking
 */
export const resetPostHogIdentity = (): void => {
  if (typeof window === "undefined") return;

  console.log("🔄 Resetting PostHog identity for new anonymous session");
  safePostHogReset();

  // Track that we've started a new anonymous session
  safeTrackAuth(AuthEvent.LOGOUT, {
    auth_method: "manual_reset",
  });
};

/**
 * Check if PostHog is properly initialized and ready to use
 */
export const isPostHogReady = async (): Promise<boolean> => {
  return await safeIsPostHogReady();
};

/**
 * Get current PostHog distinct ID (useful for debugging)
 */
export const getCurrentDistinctId = async (): Promise<string | null> => {
  return await safeGetDistinctId();
};

/**
 * Check if user is currently identified in PostHog
 */
export const isUserIdentified = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;

  try {
    const distinctId = await getCurrentDistinctId();

    // Check if we have a distinct ID and it's not a device ID
    if (!distinctId || distinctId.startsWith("$device:")) {
      return false;
    }

    // For safety, assume identified if we have a non-device ID
    return true;
  } catch {
    return false;
  }
};

/**
 * Force a clean logout that ensures PostHog identity is reset
 * Use this if you're having issues with persistent user identity
 */
export const forceCleanLogout = (): void => {
  if (typeof window === "undefined") return;

  console.log("🧹 Forcing clean logout and PostHog reset");

  // Clear session manager
  import("./session")
    .then(({ sessionManager }) => {
      sessionManager.clearUser();
    })
    .catch(() => {
      // Silently fail
    });

  // Reset PostHog
  resetPostHogIdentity();

  // Clear any other tracking-related storage
  try {
    localStorage.removeItem("yadn_error_tracking");
    sessionStorage.removeItem("yadn_session_data");
    sessionStorage.removeItem("posthog_session_id");
  } catch {
    // Silently fail
  }

  // Track the clean logout
  safeTrackAuth(AuthEvent.LOGOUT, {
    auth_method: "force_clean",
  });
};

/**
 * Debug function to log current tracking state
 */
export const debugTrackingState = async (): Promise<void> => {
  if (process.env.NODE_ENV !== "development") return;

  console.group("🐛 PostHog Tracking Debug Info");
  console.log("PostHog Ready:", await isPostHogReady());
  console.log("Distinct ID:", await getCurrentDistinctId());
  console.log("User Identified:", await isUserIdentified());

  try {
    const [{ sessionManager }] = await Promise.all([import("./session")]);
    console.log("Session Data:", sessionManager.getSessionData());
    console.log("Session Summary:", sessionManager.getSessionSummary());
  } catch {
    console.log("Session Data: Not available");
  }

  console.groupEnd();
};

/**
 * Manually identify a user (useful for testing)
 */
export const manuallyIdentifyUser = (
  userId: string,
  userProperties?: Record<string, any>
): void => {
  if (typeof window === "undefined") return;

  console.log(`🔍 Manually identifying user: ${userId}`);

  import("./session")
    .then(({ sessionManager }) => {
      sessionManager.setUser(userId, userProperties?.email);
    })
    .catch(() => {
      // Silently fail
    });
};

/**
 * Get PostHog feature flags (if you're using them)
 */
export const getFeatureFlags = async (): Promise<Record<string, any>> => {
  return await safeGetFeatureFlags();
};

/**
 * Check if a specific feature flag is enabled
 */
export const isFeatureFlagEnabled = async (
  flagKey: string
): Promise<boolean> => {
  if (typeof window === "undefined") return false;

  try {
    const posthogModule = await import("posthog-js");
    const posthog = posthogModule.default;

    if (typeof posthog.isFeatureEnabled === "function") {
      return posthog.isFeatureEnabled(flagKey) || false;
    }

    if (typeof posthog.getFeatureFlag === "function") {
      return !!posthog.getFeatureFlag(flagKey);
    }

    return false;
  } catch {
    return false;
  }
};

/**
 * Safely capture a custom event with error handling
 */
export const safeCaptureEvent = (
  eventName: string,
  properties?: Record<string, any>
): void => {
  if (typeof window === "undefined") return;

  try {
    import("posthog-js")
      .then((posthogModule) => {
        const posthog = posthogModule.default;
        if (posthog && typeof posthog.capture === "function") {
          posthog.capture(eventName, properties);
        }
      })
      .catch(() => {
        // Silently fail
      });
  } catch {
    // Silently fail
  }
};

/**
 * Validate that tracking is working correctly
 * Returns true if everything is set up properly
 */
export const validateTrackingSetup = async (): Promise<boolean> => {
  const checks: any = {
    postHogReady: await isPostHogReady(),
    distinctIdExists: !!(await getCurrentDistinctId()),
  };

  try {
    const { sessionManager } = await import("./session");
    checks.sessionManagerWorking = !!sessionManager.getSessionData();
  } catch {
    checks.sessionManagerWorking = false;
  }

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
export const initializeTracking = (): void => {
  if (typeof window === "undefined") return;

  // Wait for PostHog to be ready
  const checkReady = async () => {
    if (await isPostHogReady()) {
      console.log("🚀 PostHog tracking initialized");
      await validateTrackingSetup();
    } else {
      setTimeout(checkReady, 100);
    }
  };

  checkReady();
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
      if (typeof window === "undefined") return;

      import("./tracker")
        .then(({ tracker }) => {
          tracker.trackInteraction("component_mounted" as any, {
            element_type: "component",
            element_text: componentName,
            interaction_context: "component_lifecycle",
          });
        })
        .catch(() => {
          // Silently fail
        });

      return () => {
        import("./tracker")
          .then(({ tracker }) => {
            tracker.trackInteraction("component_unmounted" as any, {
              element_type: "component",
              element_text: componentName,
              interaction_context: "component_lifecycle",
            });
          })
          .catch(() => {
            // Silently fail
          });
      };
    }, []);

    return React.createElement(Component, props);
  };
};
