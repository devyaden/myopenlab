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
      .maybeSingle();

    // Get feature limits (fresh, after cache clear)
    const limits = await getUserFeatureLimits(user.id);

    // Convenience payment summary from the additive invoice columns (these already
    // flow through `select *` above; surfaced here so the billing UI doesn't reach
    // into raw column names). Additive — existing consumers ignore the new key.
    const sd = subscriptionData as Record<string, any> | null;
    const payment = sd
      ? {
          lastInvoiceStatus: sd.last_invoice_status ?? null,
          lastInvoiceAt: sd.last_invoice_at ?? null,
          paymentState: sd.payment_state ?? null,
          currentPeriodEnd: sd.current_period_end ?? sd.end_date ?? null,
        }
      : null;

    return NextResponse.json({
      subscription: subscriptionData || null,
      payment,
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
