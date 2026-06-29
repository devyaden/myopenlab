import "server-only";

import { createClient } from "@/lib/supabase/server";
import { checkAiUsageLimit, checkAiTokenLimit } from "@/lib/services/ai-usage";
import {
  getUserFeatureLimits,
  SubscriptionFeatureFlag,
} from "@/lib/subscription-features";

/**
 * Centralized quota inspection — one shape for "how much of X is left" across
 * diagrams, AI requests, and AI tokens, plus a uniform over-limit response body.
 *
 * This is an ADDITIVE service. The live AI routes still enforce their own inline
 * gates (returning 429) for now; migrating them onto checkQuota()/buildOverLimitBody()
 * — and the 429→402 decision — is a deliberate follow-up, so nothing here changes
 * existing route behavior. Token checks fail OPEN (mirroring checkAiTokenLimit),
 * preserving the agent's "never hard-block on a metering hiccup" semantics.
 */

export type QuotaKind = "diagrams" | "ai_requests" | "ai_tokens";

export type QuotaReason =
  | "diagram_limit"
  | "ai_request_limit"
  | "ai_token_daily_limit"
  | "ai_token_monthly_limit";

export interface QuotaStatus {
  kind: QuotaKind;
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  /** When the window resets (ISO), or null for non-resetting quotas (diagrams). */
  resetDate: string | null;
  reason: QuotaReason | null;
}

/** Next UTC midnight — when daily token budgets reset. */
export function nextUtcMidnight(now: Date = new Date()): string {
  const d = new Date(now);
  d.setUTCHours(24, 0, 0, 0);
  return d.toISOString();
}

/** First instant of next UTC month — when monthly budgets reset. */
export function firstOfNextUtcMonth(now: Date = new Date()): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  ).toISOString();
}

/** How many diagrams (hybrid playbooks) the user has — the MAX_DIAGRAMS quota. */
async function countDiagrams(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("canvas")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .or("canvas_type.eq.hybrid,canvas_type.is.null");
  return count ?? 0;
}

/**
 * Inspect a single quota for a user. Read-only; never mutates usage. Returns a
 * uniform {used, limit, remaining, resetDate, reason} regardless of the kind.
 */
export async function checkQuota(
  userId: string,
  kind: QuotaKind
): Promise<QuotaStatus> {
  if (kind === "ai_requests") {
    const { allowed, remaining, limit } = await checkAiUsageLimit(userId);
    return {
      kind,
      allowed,
      used: Math.max(0, limit - remaining),
      limit,
      remaining,
      resetDate: firstOfNextUtcMonth(),
      reason: allowed ? null : "ai_request_limit",
    };
  }

  if (kind === "ai_tokens") {
    const t = await checkAiTokenLimit(userId);
    const overDaily = t.daily >= t.dailyLimit;
    const reason: QuotaReason | null = t.allowed
      ? null
      : overDaily
        ? "ai_token_daily_limit"
        : "ai_token_monthly_limit";
    // Report the daily window as the primary used/limit (the in-chat meter's
    // denominator is the separate per-conversation contextCap).
    return {
      kind,
      allowed: t.allowed,
      used: t.daily,
      limit: t.dailyLimit,
      remaining: Math.max(0, t.dailyLimit - t.daily),
      resetDate: nextUtcMidnight(),
      reason,
    };
  }

  // diagrams
  const limits = await getUserFeatureLimits(userId);
  const limit = limits[SubscriptionFeatureFlag.MAX_DIAGRAMS];
  const used = await countDiagrams(userId);
  return {
    kind,
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetDate: null,
    reason: used < limit ? null : "diagram_limit",
  };
}

/**
 * The uniform over-limit response body. Callers that choose to gate on a quota can
 * return this with their chosen status code (the 429→402 standardization is a
 * separate, deferred decision — this helper is status-code agnostic).
 */
export function buildOverLimitBody(status: QuotaStatus) {
  return {
    error: "Quota exceeded",
    reason: status.reason,
    usage: {
      used: status.used,
      limit: status.limit,
      remaining: status.remaining,
      resetDate: status.resetDate,
    },
  };
}
