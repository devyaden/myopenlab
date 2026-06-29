import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/admin/home — headline counts for the admin dashboard (total users, active
 * subscriptions, active promo codes). Read-only, behind the existing requireAdmin()
 * gate. Replaces ad-hoc client-side counting once the admin panel is routed.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const nowIso = new Date().toISOString();
    const [usersRes, activeSubsRes, promoCodesRes] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 }),
      supabaseAdmin
        .from("user_subscription")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .gte("end_date", nowIso),
      supabaseAdmin
        .from("promo_code")
        .select("*", { count: "exact", head: true })
        .eq("active", true),
    ]);

    // listUsers returns a discriminated union; `total` only exists on the success
    // member, so narrow on `error` before reading it.
    const totalUsers = usersRes.error ? 0 : usersRes.data.total;

    return NextResponse.json({
      totalUsers,
      activeSubscriptions: activeSubsRes.count ?? 0,
      activePromoCodes: promoCodesRes.count ?? 0,
    });
  } catch (error) {
    console.error("Error fetching admin home stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
