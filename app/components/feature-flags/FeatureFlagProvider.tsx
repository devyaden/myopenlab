import React, { createContext, useContext, useEffect, useState } from "react";
import { posthog, PostHogFlags } from "@/lib/posthog";

// Type definition for feature flags
type FeatureFlags = {
  [key in PostHogFlags]: boolean;
};

// Default state with all flags disabled
const defaultFeatureFlags: FeatureFlags = {
  [PostHogFlags.ENABLE_NEW_EDITOR]: false,
  [PostHogFlags.ENABLE_AI_FEATURES]: false,
  [PostHogFlags.ENABLE_SHARING]: false,
};

// Create context
const FeatureFlagContext = createContext<{
  flags: FeatureFlags;
  isLoading: boolean;
  reload: () => void;
}>({
  flags: defaultFeatureFlags,
  isLoading: true,
  reload: () => {},
});

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}

export function useFeatureFlag(flag: PostHogFlags): boolean {
  const { flags } = useFeatureFlags();
  return flags[flag] || false;
}

interface FeatureFlagProviderProps {
  children: React.ReactNode;
}

export function FeatureFlagProvider({ children }: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<FeatureFlags>(defaultFeatureFlags);
  const [isLoading, setIsLoading] = useState(true);

  const loadFeatureFlags = async () => {
    setIsLoading(true);

    // Initialize flags with default values
    const newFlags = { ...defaultFeatureFlags };

    try {
      // Only run on client-side where PostHog is available
      if (typeof window !== "undefined") {
        // Check each flag individually using isFeatureEnabled
        Object.values(PostHogFlags).forEach((flagName) => {
          const isEnabled = posthog.isFeatureEnabled(flagName);
          newFlags[flagName as PostHogFlags] = Boolean(isEnabled);
        });
      }
    } catch (error) {
      console.error("Error loading feature flags:", error);
    } finally {
      setFlags(newFlags);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeatureFlags();

    // Set up listener for feature flag changes
    const handleFlagsChanged = () => {
      loadFeatureFlags();
    };

    // Add event listener for flag changes
    if (typeof window !== "undefined") {
      posthog.onFeatureFlags(handleFlagsChanged);
    }

    // Clean up event listener
    return () => {
      if (typeof window !== "undefined") {
        posthog.onFeatureFlags(() => {}); // Replace the handler with a no-op
      }
    };
  }, []);

  return (
    <FeatureFlagContext.Provider
      value={{ flags, isLoading, reload: loadFeatureFlags }}
    >
      {children}
    </FeatureFlagContext.Provider>
  );
}
