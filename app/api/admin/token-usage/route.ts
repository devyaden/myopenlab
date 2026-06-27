import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  PLAN_LIMITS,
  resolvePlanKey,
  SubscriptionFeatureFlag,
} from "@/lib/subscription-features";

// Per-user token usage report (daily + monthly) for tuning the plan limits.
// Reads the ai_token_usage log via the service-role client, joins emails + each
// user's active plan, and reports today / this-month / last-30-days totals next to
// the user's daily + monthly caps. Dev-only (404 in prod unless AGENT_TRACE=1) and
// still requires a signed-in user — it exposes every user's usage + email.
//
// Because dev and prod share one Supabase DB, you view the REAL numbers by running
// the app locally and opening /protected/dev/token-usage.

const F = SubscriptionFeatureFlag;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** The daily/monthly token caps for a user's active subscription row. */
function limitsFor(sub: { plan_key?: string | null; title?: string | null; duration?: number | null } | undefined) {
  if (!sub) return PLAN_LIMITS.free;
  const key = resolvePlanKey(sub.plan_key, sub.title, sub.duration);
  if (key && PLAN_LIMITS[key]) return PLAN_LIMITS[key];
  // active sub we couldn't map → treat as a paid plan, not free.
  const looksFree = String(sub.title ?? "").toLowerCase().includes("free");
  return looksFree ? PLAN_LIMITS.free : PLAN_LIMITS.pro_monthly;
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production" && process.env.AGENT_TRACE !== "1") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Require a signed-in user (the report itself reads all users via the admin client).
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const today = dayKey(now);
  const monthPrefix = today.slice(0, 7); // YYYY-MM
  const since = dayKey(new Date(now.getTime() - 60 * 86400000)); // 60-day window
  const since30 = dayKey(new Date(now.getTime() - 30 * 86400000));

  try {
    // 1) Usage rows in the window (service role → all users).
    const { data: rows, error: usageErr } = await supabaseAdmin
      .from("ai_token_usage")
      .select("user_id, day, billable_tokens, input_tokens, output_tokens, cache_read_tokens")
      .gte("day", since);
    if (usageErr) throw usageErr;

    const usage = rows ?? [];
    const userIds = Array.from(new Set(usage.map((r: any) => r.user_id)));

    // 2) Emails + active plans for those users.
    const emailById = new Map<string, string | null>();
    const subById = new Map<string, any>();
    if (userIds.length > 0) {
      const [{ data: users }, { data: subs }] = await Promise.all([
        supabaseAdmin.from("user").select("id, email").in("id", userIds),
        supabaseAdmin
          .from("user_subscription")
          .select("user_id, is_active, end_date, subscription:subscription_id(plan_key, title, duration)")
          .in("user_id", userIds)
          .eq("is_active", true)
          .gte("end_date", now.toISOString()),
      ]);
      for (const u of users ?? []) emailById.set(u.id, u.email ?? null);
      for (const s of subs ?? []) subById.set(s.user_id, (s as any).subscription);
    }

    // 3) Aggregate per user.
    const byUser = new Map<string, any>();
    for (const r of usage) {
      let agg = byUser.get(r.user_id);
      if (!agg) {
        const limits = limitsFor(subById.get(r.user_id));
        agg = {
          userId: r.user_id,
          email: emailById.get(r.user_id) ?? null,
          today: 0,
          month: 0,
          last30: 0,
          dailyLimit: limits[F.MAX_AI_TOKENS_PER_DAY],
          monthlyLimit: limits[F.MAX_AI_TOKENS_PER_MONTH],
          days: [] as Array<{ day: string; billable: number }>,
        };
        byUser.set(r.user_id, agg);
      }
      const b = r.billable_tokens ?? 0;
      if (r.day === today) agg.today += b;
      if (typeof r.day === "string" && r.day.startsWith(monthPrefix)) agg.month += b;
      if (r.day >= since30) agg.last30 += b;
      agg.days.push({ day: r.day, billable: b });
    }

    const users = Array.from(byUser.values())
      .map((u) => ({
        ...u,
        dailyPct: u.dailyLimit ? Math.round((u.today / u.dailyLimit) * 100) : null,
        monthlyPct: u.monthlyLimit ? Math.round((u.month / u.monthlyLimit) * 100) : null,
        days: u.days.sort((a: any, b: any) => (a.day < b.day ? 1 : -1)),
      }))
      .sort((a, b) => b.month - a.month);

    const totals = {
      today: users.reduce((s, u) => s + u.today, 0),
      month: users.reduce((s, u) => s + u.month, 0),
      last30: users.reduce((s, u) => s + u.last30, 0),
      activeUsers: users.length,
    };

    return NextResponse.json({ generatedAt: now.toISOString(), today, monthPrefix, totals, users });
  } catch (err: any) {
    console.error("token-usage report failed:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to build report" },
      { status: 500 }
    );
  }
}
