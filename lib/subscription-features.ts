import { supabase } from "@/lib/supabase";

// Feature flags enum for consistency across codebase
export enum SubscriptionFeatureFlag {
  MAX_DIAGRAMS = "MAX_DIAGRAMS",
  MAX_COLLABORATORS = "MAX_COLLABORATORS",
  ALLOW_EXPORT = "ALLOW_EXPORT",
  ALLOW_AI_FEATURES = "ALLOW_AI_FEATURES",
  ALLOW_CUSTOM_THEMES = "ALLOW_CUSTOM_THEMES",
  ALLOW_PRIVATE_SHARING = "ALLOW_PRIVATE_SHARING",
  ALLOW_PUBLIC_SHARING = "ALLOW_PUBLIC_SHARING",
}

// Feature limits interface
interface FeatureLimits {
  [SubscriptionFeatureFlag.MAX_DIAGRAMS]: number;
  [SubscriptionFeatureFlag.MAX_COLLABORATORS]: number;
  [SubscriptionFeatureFlag.ALLOW_EXPORT]: boolean;
  [SubscriptionFeatureFlag.ALLOW_AI_FEATURES]: boolean;
  [SubscriptionFeatureFlag.ALLOW_CUSTOM_THEMES]: boolean;
  [SubscriptionFeatureFlag.ALLOW_PRIVATE_SHARING]: boolean;
  [SubscriptionFeatureFlag.ALLOW_PUBLIC_SHARING]: boolean;
}

// Default free tier limits
const DEFAULT_FREE_LIMITS: FeatureLimits = {
  [SubscriptionFeatureFlag.MAX_DIAGRAMS]: 3,
  [SubscriptionFeatureFlag.MAX_COLLABORATORS]: 0,
  [SubscriptionFeatureFlag.ALLOW_EXPORT]: false,
  [SubscriptionFeatureFlag.ALLOW_AI_FEATURES]: false,
  [SubscriptionFeatureFlag.ALLOW_CUSTOM_THEMES]: false,
  [SubscriptionFeatureFlag.ALLOW_PRIVATE_SHARING]: false,
  [SubscriptionFeatureFlag.ALLOW_PUBLIC_SHARING]: false,
};

// Subscription plans with their feature limits
export const SUBSCRIPTION_PLANS = {
  FREE: "free",
  STARTER: "starter",
  PRO: "pro",
  PREMIUM: "premium",
};

// Cache for subscription data
let featureLimitsCache: Record<string, FeatureLimits> = {};
let cacheExpirationTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Get feature limits for a user based on their subscription
 */
export async function getUserFeatureLimits(
  userId: string
): Promise<FeatureLimits> {
  if (!userId) {
    return DEFAULT_FREE_LIMITS;
  }

  try {
    // Use cache if available and not expired
    if (featureLimitsCache[userId] && Date.now() < cacheExpirationTime) {
      return featureLimitsCache[userId];
    }

    // Get the user's active subscription
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("user_subscription")
      .select(
        `
        *,
        subscription:subscription_id (
          id,
          title
        )
      `
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .gte("end_date", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (
      subscriptionError ||
      !subscriptionData ||
      !subscriptionData.subscription
    ) {
      return DEFAULT_FREE_LIMITS;
    }

    // Based on the subscription title, return appropriate limits
    const subscriptionTitle = subscriptionData.subscription.title.toLowerCase();
    let limits: FeatureLimits;

    if (subscriptionTitle.includes("starter")) {
      limits = {
        [SubscriptionFeatureFlag.MAX_DIAGRAMS]: 10,
        [SubscriptionFeatureFlag.MAX_COLLABORATORS]: 3,
        [SubscriptionFeatureFlag.ALLOW_EXPORT]: true,
        [SubscriptionFeatureFlag.ALLOW_AI_FEATURES]: false,
        [SubscriptionFeatureFlag.ALLOW_CUSTOM_THEMES]: false,
        [SubscriptionFeatureFlag.ALLOW_PRIVATE_SHARING]: true,
        [SubscriptionFeatureFlag.ALLOW_PUBLIC_SHARING]: false,
      };
    } else if (subscriptionTitle.includes("pro")) {
      limits = {
        [SubscriptionFeatureFlag.MAX_DIAGRAMS]: 50,
        [SubscriptionFeatureFlag.MAX_COLLABORATORS]: 10,
        [SubscriptionFeatureFlag.ALLOW_EXPORT]: true,
        [SubscriptionFeatureFlag.ALLOW_AI_FEATURES]: true,
        [SubscriptionFeatureFlag.ALLOW_CUSTOM_THEMES]: true,
        [SubscriptionFeatureFlag.ALLOW_PRIVATE_SHARING]: true,
        [SubscriptionFeatureFlag.ALLOW_PUBLIC_SHARING]: true,
      };
    } else if (subscriptionTitle.includes("premium")) {
      limits = {
        [SubscriptionFeatureFlag.MAX_DIAGRAMS]: 1000,
        [SubscriptionFeatureFlag.MAX_COLLABORATORS]: 100,
        [SubscriptionFeatureFlag.ALLOW_EXPORT]: true,
        [SubscriptionFeatureFlag.ALLOW_AI_FEATURES]: true,
        [SubscriptionFeatureFlag.ALLOW_CUSTOM_THEMES]: true,
        [SubscriptionFeatureFlag.ALLOW_PRIVATE_SHARING]: true,
        [SubscriptionFeatureFlag.ALLOW_PUBLIC_SHARING]: true,
      };
    } else {
      limits = DEFAULT_FREE_LIMITS;
    }

    // Update cache
    featureLimitsCache[userId] = limits;
    cacheExpirationTime = Date.now() + CACHE_DURATION;

    return limits;
  } catch (error) {
    console.error("Error getting user feature limits:", error);
    return DEFAULT_FREE_LIMITS;
  }
}

/**
 * Check if a user has access to a specific feature
 */
export async function hasFeatureAccess(
  userId: string,
  feature: SubscriptionFeatureFlag,
  requiredValue?: number | boolean
): Promise<boolean> {
  const limits = await getUserFeatureLimits(userId);

  if (typeof limits[feature] === "boolean") {
    return limits[feature] === true;
  }

  if (
    typeof requiredValue === "number" &&
    typeof limits[feature] === "number"
  ) {
    return limits[feature] >= requiredValue;
  }

  return false;
}

/**
 * Get the maximum value for a numeric feature
 */
export async function getFeatureLimit(
  userId: string,
  feature:
    | SubscriptionFeatureFlag.MAX_DIAGRAMS
    | SubscriptionFeatureFlag.MAX_COLLABORATORS
): Promise<number> {
  const limits = await getUserFeatureLimits(userId);
  return limits[feature] as number;
}

/**
 * Clear feature limits cache for all users or a specific user
 */
export function clearFeatureLimitsCache(userId?: string): void {
  if (userId) {
    delete featureLimitsCache[userId];
  } else {
    featureLimitsCache = {};
  }
}
