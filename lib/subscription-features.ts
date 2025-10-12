import { supabase } from "@/lib/supabase/client";

// Feature flags enum for consistency across codebase
export enum SubscriptionFeatureFlag {
  MAX_DIAGRAMS = "MAX_DIAGRAMS",
  MAX_AI_REQUESTS = "MAX_AI_REQUESTS",
  MAX_COLLABORATORS = "MAX_COLLABORATORS",
  ALLOW_EXPORT_PNG = "ALLOW_EXPORT_PNG",
  ALLOW_EXPORT_SVG = "ALLOW_EXPORT_SVG",
  ALLOW_EXPORT_PDF = "ALLOW_EXPORT_PDF",
  ALLOW_ADVANCED_COLLABORATION = "ALLOW_ADVANCED_COLLABORATION",
  ALLOW_PRIORITY_SUPPORT = "ALLOW_PRIORITY_SUPPORT",
}

// Feature limits interface
interface FeatureLimits {
  [SubscriptionFeatureFlag.MAX_DIAGRAMS]: number;
  [SubscriptionFeatureFlag.MAX_AI_REQUESTS]: number;
  [SubscriptionFeatureFlag.MAX_COLLABORATORS]: number;
  [SubscriptionFeatureFlag.ALLOW_EXPORT_PNG]: boolean;
  [SubscriptionFeatureFlag.ALLOW_EXPORT_SVG]: boolean;
  [SubscriptionFeatureFlag.ALLOW_EXPORT_PDF]: boolean;
  [SubscriptionFeatureFlag.ALLOW_ADVANCED_COLLABORATION]: boolean;
  [SubscriptionFeatureFlag.ALLOW_PRIORITY_SUPPORT]: boolean;
}

// Default free tier limits
const DEFAULT_FREE_LIMITS: FeatureLimits = {
  [SubscriptionFeatureFlag.MAX_DIAGRAMS]: 1,
  [SubscriptionFeatureFlag.MAX_AI_REQUESTS]: 5,
  [SubscriptionFeatureFlag.MAX_COLLABORATORS]: 0,
  [SubscriptionFeatureFlag.ALLOW_EXPORT_PNG]: true,
  [SubscriptionFeatureFlag.ALLOW_EXPORT_SVG]: true,
  [SubscriptionFeatureFlag.ALLOW_EXPORT_PDF]: false,
  [SubscriptionFeatureFlag.ALLOW_ADVANCED_COLLABORATION]: false,
  [SubscriptionFeatureFlag.ALLOW_PRIORITY_SUPPORT]: false,
};

// Subscription plans with their feature limits
export const SUBSCRIPTION_PLANS = {
  FREE: "free",
  STARTER: "starter",
  PRO: "pro",
  PREMIUM: "premium",
};

// Cache for subscription data with per-user expiration
let featureLimitsCache: Record<string, { limits: FeatureLimits; expiresAt: number }> = {};
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
    // Use cache if available and not expired (per-user expiration)
    const cachedData = featureLimitsCache[userId];
    if (cachedData && Date.now() < cachedData.expiresAt) {
      console.log(`[Cache HIT] User ${userId} - returning cached limits`);
      return cachedData.limits;
    }
    console.log(`[Cache MISS] User ${userId} - fetching fresh data`);

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

    if (subscriptionError || !subscriptionData) {
      return DEFAULT_FREE_LIMITS;
    }

    // If user has an active subscription (with or without subscription relationship), give them premium features
    // This handles promo codes that may use stripe_price_id instead of subscription_id
    if (!subscriptionData.subscription) {
      // User has active subscription but no subscription relationship (promo code case)
      return {
        [SubscriptionFeatureFlag.MAX_DIAGRAMS]: 999999, // Unlimited
        [SubscriptionFeatureFlag.MAX_AI_REQUESTS]: 999999, // Unlimited
        [SubscriptionFeatureFlag.MAX_COLLABORATORS]: 999999, // Advanced collaboration
        [SubscriptionFeatureFlag.ALLOW_EXPORT_PNG]: true,
        [SubscriptionFeatureFlag.ALLOW_EXPORT_SVG]: true,
        [SubscriptionFeatureFlag.ALLOW_EXPORT_PDF]: true,
        [SubscriptionFeatureFlag.ALLOW_ADVANCED_COLLABORATION]: true,
        [SubscriptionFeatureFlag.ALLOW_PRIORITY_SUPPORT]: true,
      };
    }

    // Based on the subscription title, return appropriate limits
    const subscriptionTitle = subscriptionData.subscription.title.toLowerCase();
    let limits: FeatureLimits;

    // Check if it's a paid plan (not free)
    // Any active subscription that's not explicitly "free" should get premium features
    const isPaidPlan = !subscriptionTitle.includes("free") &&
                       (subscriptionTitle.includes("pro") ||
                        subscriptionTitle.includes("premium") ||
                        subscriptionTitle.includes("monthly") ||
                        subscriptionTitle.includes("yearly") ||
                        subscriptionTitle.includes("starter"));

    if (isPaidPlan) {
      limits = {
        [SubscriptionFeatureFlag.MAX_DIAGRAMS]: 999999, // Unlimited
        [SubscriptionFeatureFlag.MAX_AI_REQUESTS]: 999999, // Unlimited
        [SubscriptionFeatureFlag.MAX_COLLABORATORS]: 999999, // Advanced collaboration
        [SubscriptionFeatureFlag.ALLOW_EXPORT_PNG]: true,
        [SubscriptionFeatureFlag.ALLOW_EXPORT_SVG]: true,
        [SubscriptionFeatureFlag.ALLOW_EXPORT_PDF]: true,
        [SubscriptionFeatureFlag.ALLOW_ADVANCED_COLLABORATION]: true,
        [SubscriptionFeatureFlag.ALLOW_PRIORITY_SUPPORT]: true,
      };
    } else {
      limits = DEFAULT_FREE_LIMITS;
    }

    // Update cache with per-user expiration
    featureLimitsCache[userId] = {
      limits,
      expiresAt: Date.now() + CACHE_DURATION,
    };

    console.log(`[Cache SET] User ${userId} - isPaidPlan:`, isPaidPlan, 'subscription:', subscriptionData.subscription?.title);
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
    const featureValue = limits[feature] as number;
    return featureValue >= requiredValue;
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
    | SubscriptionFeatureFlag.MAX_AI_REQUESTS
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
