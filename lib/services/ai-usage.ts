import { createClient } from "@/lib/supabase/server";
import { getUserFeatureLimits, SubscriptionFeatureFlag } from "@/lib/subscription-features";
import { log } from "@/lib/log";

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
    .maybeSingle(); // Use maybeSingle instead of single to handle no records

  // If no record exists, count is 0
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
    .maybeSingle(); // Use maybeSingle instead of single

  if (existing) {
    // Update existing record
    const { error: updateError } = await supabase
      .from("ai_usage")
      .update({ count: existing.count + 1, updated_at: now.toISOString() })
      .eq("id", existing.id);

    if (updateError) {
      console.error("Error updating AI usage:", updateError);
    } else {
      log.debug("AI usage incremented to:", existing.count + 1);
    }
  } else {
    // Create new record with generated ID
    const { error: insertError } = await supabase.from("ai_usage").insert({
      id: crypto.randomUUID(),
      user_id: userId,
      month: currentMonth,
      year: currentYear,
      count: 1,
    });

    if (insertError) {
      console.error("Error creating AI usage record:", insertError);
    } else {
      log.debug("AI usage record created with count: 1");
    }
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

// ─────────────────────────────────────────────────────────────────────────────
// Phase F: TOKEN economy. The agent is metered in (weighted billable) tokens
// against plan-keyed daily + monthly budgets, with a per-conversation context cap.
// All reads/writes fail OPEN (never block the agent) if the ai_token_usage table
// isn't present yet — so this is safe to ship before the migration is applied.
// ─────────────────────────────────────────────────────────────────────────────

export interface TokenLimitStatus {
  allowed: boolean;
  daily: number;
  monthly: number;
  dailyLimit: number;
  monthlyLimit: number;
  /** Per-conversation live-context cap (the in-chat meter's denominator). */
  contextCap: number;
  isPaidUser: boolean;
}

function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}
function utcMonthPrefix(now: Date): string {
  return now.toISOString().slice(0, 7); // YYYY-MM
}

/** Check the user's daily + monthly token budgets (block the NEXT turn if over). */
export async function checkAiTokenLimit(
  userId: string
): Promise<TokenLimitStatus> {
  const limits = await getUserFeatureLimits(userId);
  const dailyLimit = limits[SubscriptionFeatureFlag.MAX_AI_TOKENS_PER_DAY];
  const monthlyLimit = limits[SubscriptionFeatureFlag.MAX_AI_TOKENS_PER_MONTH];
  const contextCap = limits[SubscriptionFeatureFlag.MAX_CONTEXT_TOKENS];
  const isPaidUser =
    limits[SubscriptionFeatureFlag.MAX_AI_REQUESTS] >= 999999;
  const base = { dailyLimit, monthlyLimit, contextCap, isPaidUser };

  try {
    const supabase = await createClient();
    const now = new Date();
    const { data: rows, error } = await supabase
      .from("ai_token_usage")
      .select("day, billable_tokens")
      .eq("user_id", userId)
      .like("day", `${utcMonthPrefix(now)}%`);
    if (error) return { allowed: true, daily: 0, monthly: 0, ...base };
    const today = utcDay(now);
    const monthly = (rows ?? []).reduce(
      (s: number, r: any) => s + (r.billable_tokens ?? 0),
      0
    );
    const daily = (rows ?? [])
      .filter((r: any) => r.day === today)
      .reduce((s: number, r: any) => s + (r.billable_tokens ?? 0), 0);
    return {
      allowed: daily < dailyLimit && monthly < monthlyLimit,
      daily,
      monthly,
      ...base,
    };
  } catch {
    return { allowed: true, daily: 0, monthly: 0, ...base };
  }
}

/** Add a turn's token usage to today's row (read-modify-write; best-effort). */
export async function recordTokenUsage(
  userId: string,
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    billableTokens: number;
  }
): Promise<void> {
  try {
    const supabase = await createClient();
    const now = new Date();
    const day = utcDay(now);
    const { data: existing } = await supabase
      .from("ai_token_usage")
      .select("id, input_tokens, output_tokens, cache_read_tokens, billable_tokens")
      .eq("user_id", userId)
      .eq("day", day)
      .maybeSingle();
    if (existing) {
      await supabase
        .from("ai_token_usage")
        .update({
          input_tokens: (existing.input_tokens ?? 0) + usage.inputTokens,
          output_tokens: (existing.output_tokens ?? 0) + usage.outputTokens,
          cache_read_tokens:
            (existing.cache_read_tokens ?? 0) + usage.cacheReadTokens,
          billable_tokens: (existing.billable_tokens ?? 0) + usage.billableTokens,
          updated_at: now.toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("ai_token_usage").insert({
        id: crypto.randomUUID(),
        user_id: userId,
        day,
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens,
        cache_read_tokens: usage.cacheReadTokens,
        billable_tokens: usage.billableTokens,
      });
    }
  } catch (err) {
    console.error("recordTokenUsage failed:", err);
  }
}
