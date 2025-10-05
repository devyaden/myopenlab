import { createClient } from "@/lib/supabase/server";
import { getUserFeatureLimits, SubscriptionFeatureFlag } from "@/lib/subscription-features";

/**
 * Check if user has AI requests remaining for the current month
 */
export async function checkAiUsageLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  isPaidUser: boolean;
}> {
  const supabase = await createClient();
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  // Get user's feature limits based on subscription
  const limits = await getUserFeatureLimits(userId);
  const maxAiRequests = limits[SubscriptionFeatureFlag.MAX_AI_REQUESTS];
  const isPaidUser = maxAiRequests >= 999999;

  // If unlimited (999999), allow immediately
  if (isPaidUser) {
    return {
      allowed: true,
      remaining: 999999,
      limit: 999999,
      isPaidUser: true,
    };
  }

  // Get or create usage record for current month
  const { data: usage, error } = await supabase
    .from("ai_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .eq("year", currentYear)
    .single();

  const currentCount = usage?.count || 0;
  const remaining = Math.max(0, maxAiRequests - currentCount);

  return {
    allowed: currentCount < maxAiRequests,
    remaining,
    limit: maxAiRequests,
    isPaidUser: false,
  };
}

/**
 * Increment AI usage count for the current month
 */
export async function incrementAiUsage(userId: string): Promise<void> {
  const supabase = await createClient();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Try to get existing record
  const { data: existing } = await supabase
    .from("ai_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .eq("year", currentYear)
    .single();

  if (existing) {
    // Update existing record
    await supabase
      .from("ai_usage")
      .update({ count: existing.count + 1, updated_at: now.toISOString() })
      .eq("id", existing.id);
  } else {
    // Create new record
    await supabase.from("ai_usage").insert({
      user_id: userId,
      month: currentMonth,
      year: currentYear,
      count: 1,
    });
  }
}

/**
 * Get AI usage statistics for a user
 */
export async function getAiUsageStats(userId: string): Promise<{
  currentMonth: number;
  limit: number;
  isPaidUser: boolean;
}> {
  const { remaining, limit, isPaidUser } = await checkAiUsageLimit(userId);
  return {
    currentMonth: limit - remaining,
    limit,
    isPaidUser,
  };
}
