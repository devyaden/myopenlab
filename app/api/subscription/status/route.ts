import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clearFeatureLimitsCache, getUserFeatureLimits } from "@/lib/subscription-features";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Clear cache for this user to force fresh lookup
    clearFeatureLimitsCache(user.id);

    // Get direct database data
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("user_subscription")
      .select(
        `
        *,
        subscription:subscription_id (
          id,
          title,
          price
        )
      `
      )
      .eq("user_id", user.id)
      .eq("is_active", true)
      .gte("end_date", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Get feature limits (fresh, after cache clear)
    const limits = await getUserFeatureLimits(user.id);

    return NextResponse.json({
      subscription: subscriptionData || null,
      error: subscriptionError?.message || null,
      limits,
      hasPaidPlan: !!subscriptionData,
    });
  } catch (error: any) {
    console.error("Error checking subscription status:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
