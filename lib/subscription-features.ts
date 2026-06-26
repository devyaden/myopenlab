import { supabase } from "@/lib/supabase/client";
import { log } from "@/lib/log";

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
  // Phase F: token economy. Per-conversation context cap + daily/monthly spend.
  MAX_CONTEXT_TOKENS = "MAX_CONTEXT_TOKENS",
  MAX_AI_TOKENS_PER_DAY = "MAX_AI_TOKENS_PER_DAY",
  MAX_AI_TOKENS_PER_MONTH = "MAX_AI_TOKENS_PER_MONTH",
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
  [SubscriptionFeatureFlag.MAX_CONTEXT_TOKENS]: number;
  [SubscriptionFeatureFlag.MAX_AI_TOKENS_PER_DAY]: number;
  [SubscriptionFeatureFlag.MAX_AI_TOKENS_PER_MONTH]: number;
}

// Default free tier limits
const DEFAULT_FREE_LIMITS: FeatureLimits = {
  [SubscriptionFeatureFlag.MAX_DIAGRAMS]: 1,
  [SubscriptionFeatureFlag.MAX_AI_REQUESTS]: 5, // legacy backstop; tokens are the real limit now
  [SubscriptionFeatureFlag.MAX_COLLABORATORS]: 0,
  [SubscriptionFeatureFlag.ALLOW_EXPORT_PNG]: true,
  [SubscriptionFeatureFlag.ALLOW_EXPORT_SVG]: true,
  [SubscriptionFeatureFlag.ALLOW_EXPORT_PDF]: false,
  [SubscriptionFeatureFlag.ALLOW_ADVANCED_COLLABORATION]: false,
  [SubscriptionFeatureFlag.ALLOW_PRIORITY_SUPPORT]: false,
  // Placeholder numbers — TUNE for pricing. Free gets a small context cap (compacts
  // sooner = cheaper) and modest daily/monthly token budgets.
  [SubscriptionFeatureFlag.MAX_CONTEXT_TOKENS]: 24000,
  [SubscriptionFeatureFlag.MAX_AI_TOKENS_PER_DAY]: 50000,
  [SubscriptionFeatureFlag.MAX_AI_TOKENS_PER_MONTH]: 300000,
};

// Subscription plans with their feature limits
export const SUBSCRIPTION_PLANS = {
  FREE: "free",
  STARTER: "starter",
  PRO: "pro",
  PREMIUM: "premium",
};

// All paid profiles share unlimited diagrams/collaborators/exports; they differ on
// the TOKEN ECONOMY — higher / yearly plans get a larger per-conversation context
// cap and bigger daily/monthly budgets. Placeholder numbers — TUNE for pricing.
const PAID_BASE = {
  [SubscriptionFeatureFlag.MAX_DIAGRAMS]: 999999,
  [SubscriptionFeatureFlag.MAX_AI_REQUESTS]: 999999,
  [SubscriptionFeatureFlag.MAX_COLLABORATORS]: 999999,
  [SubscriptionFeatureFlag.ALLOW_EXPORT_PNG]: true,
  [SubscriptionFeatureFlag.ALLOW_EXPORT_SVG]: true,
  [SubscriptionFeatureFlag.ALLOW_EXPORT_PDF]: true,
  [SubscriptionFeatureFlag.ALLOW_ADVANCED_COLLABORATION]: true,
  [SubscriptionFeatureFlag.ALLOW_PRIORITY_SUPPORT]: true,
};

// The plan-key → limits matrix. Monthly < yearly < higher tiers on the token axis.
export const PLAN_LIMITS: Record<string, FeatureLimits> = {
  free: DEFAULT_FREE_LIMITS,
  pro_monthly: {
    ...PAID_BASE,
    [SubscriptionFeatureFlag.MAX_CONTEXT_TOKENS]: 60000,
    [SubscriptionFeatureFlag.MAX_AI_TOKENS_PER_DAY]: 750000,
    [SubscriptionFeatureFlag.MAX_AI_TOKENS_PER_MONTH]: 8000000,
  },
  pro_yearly: {
    ...PAID_BASE,
    [SubscriptionFeatureFlag.MAX_CONTEXT_TOKENS]: 120000,
    [SubscriptionFeatureFlag.MAX_AI_TOKENS_PER_DAY]: 1500000,
    [SubscriptionFeatureFlag.MAX_AI_TOKENS_PER_MONTH]: 18000000,
  },
  business_yearly: {
    ...PAID_BASE,
    [SubscriptionFeatureFlag.MAX_CONTEXT_TOKENS]: 250000,
    [SubscriptionFeatureFlag.MAX_AI_TOKENS_PER_DAY]: 4000000,
    [SubscriptionFeatureFlag.MAX_AI_TOKENS_PER_MONTH]: 60000000,
  },
};

// A generous default profile for any active paid subscription we can't map to a
// specific plan_key (e.g. legacy rows, promo codes) — equivalent to pro_monthly.
const PAID_FALLBACK = PLAN_LIMITS.pro_monthly;

/**
 * Resolve a normalized plan key. Prefer the explicit `plan_key` column; otherwise
 * derive a best-effort key from the subscription title + duration (days) so monthly
 * and yearly of the same tier still differ. Unknown → null (→ free/fallback).
 */
export function resolvePlanKey(
  planKey?: string | null,
  title?: string | null,
  durationDays?: number | null
): string | null {
  if (planKey && PLAN_LIMITS[planKey]) return planKey;
  const t = String(title ?? "").toLowerCase();
  if (!t || t.includes("free")) return null;
  const period = (durationDays ?? 0) >= 300 ? "yearly" : "monthly";
  if (t.includes("business") || t.includes("premium"))
    return PLAN_LIMITS[`business_${period}`] ? `business_${period}` : "business_yearly";
  if (t.includes("pro") || t.includes("starter"))
    return `pro_${period}`;
  return null;
}

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
      log.debug(`[Cache HIT] User ${userId} - returning cached limits`);
      return cachedData.limits;
    }
    log.debug(`[Cache MISS] User ${userId} - fetching fresh data`);

    // Get the user's active subscription
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("user_subscription")
      .select(
        `
        *,
        subscription:subscription_id (
          id,
          title,
          plan_key,
          duration
        )
      `
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .gte("end_date", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError || !subscriptionData) {
      return DEFAULT_FREE_LIMITS;
    }

    // Active subscription but no subscription relationship (promo-code case): give
    // the generous paid fallback profile.
    if (!subscriptionData.subscription) {
      featureLimitsCache[userId] = {
        limits: PAID_FALLBACK,
        expiresAt: Date.now() + CACHE_DURATION,
      };
      return PAID_FALLBACK;
    }

    // Phase F: resolve the plan-key → limits profile (token caps differ by SKU,
    // incl. monthly vs yearly). plan_key wins; title+duration is the fallback.
    const sub = subscriptionData.subscription;
    const planKey = resolvePlanKey(sub.plan_key, sub.title, sub.duration);
    const limits: FeatureLimits = planKey
      ? PLAN_LIMITS[planKey]
      : // an active sub whose title looks paid but didn't map → generous fallback;
        // otherwise free.
        String(sub.title ?? "").toLowerCase().includes("free")
        ? DEFAULT_FREE_LIMITS
        : PAID_FALLBACK;

    // Update cache with per-user expiration
    featureLimitsCache[userId] = {
      limits,
      expiresAt: Date.now() + CACHE_DURATION,
    };

    log.debug(`[Cache SET] User ${userId} - planKey:`, planKey, 'subscription:', sub?.title);
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
