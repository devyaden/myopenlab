import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getAiUsageStats, checkAiTokenLimit } from "@/lib/services/ai-usage";
import {
  getUserFeatureLimits,
  SubscriptionFeatureFlag,
} from "@/lib/subscription-features";
import { nextUtcMidnight, firstOfNextUtcMonth } from "@/lib/services/quota-check";

/**
 * GET /api/billing/usage — one consolidated "where am I against my plan" payload:
 * diagrams, AI requests, and AI tokens (daily + monthly), each as used/limit with a
 * reset date. Powers the Settings → Plan & Billing usage meters. Read-only and
 * owner-scoped; reuses the existing usage helpers (no new index — the token query is
 * already backed by ai_token_usage's unique (user_id, day)).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [limits, ai, tokens, diagramCount] = await Promise.all([
      getUserFeatureLimits(user.id),
      getAiUsageStats(user.id),
      checkAiTokenLimit(user.id),
      supabase
        .from("canvas")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .or("canvas_type.eq.hybrid,canvas_type.is.null"),
    ]);

    const diagramsUsed = diagramCount.count ?? 0;
    const diagramLimit = limits[SubscriptionFeatureFlag.MAX_DIAGRAMS];
    const monthlyReset = firstOfNextUtcMonth();

    return NextResponse.json({
      diagrams: {
        used: diagramsUsed,
        limit: diagramLimit,
        remaining: Math.max(0, diagramLimit - diagramsUsed),
        resetDate: null,
      },
      ai: {
        used: ai.currentMonth,
        limit: ai.limit,
        remaining: Math.max(0, ai.limit - ai.currentMonth),
        resetDate: monthlyReset,
        isPaidUser: ai.isPaidUser,
      },
      tokens: {
        daily: tokens.daily,
        dailyLimit: tokens.dailyLimit,
        monthly: tokens.monthly,
        monthlyLimit: tokens.monthlyLimit,
        contextCap: tokens.contextCap,
        dailyResetDate: nextUtcMidnight(),
        monthlyResetDate: monthlyReset,
        isPaidUser: tokens.isPaidUser,
      },
    });
  } catch (error) {
    console.error("Error fetching billing usage:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
