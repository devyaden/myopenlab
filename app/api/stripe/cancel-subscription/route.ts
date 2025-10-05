import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cancelSubscription } from "@/lib/services/stripe-validation";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - You must be logged in" },
        { status: 401 }
      );
    }

    // Get user's active subscription
    const { data: userSubscription, error: subError } = await supabase
      .from("user_subscription")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (subError || !userSubscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Check if this is a local test subscription
    const isLocalSubscription = userSubscription.stripe_subscription_id?.startsWith('local_');

    if (!isLocalSubscription) {
      // Real Stripe subscription - cancel in Stripe
      if (!userSubscription.stripe_subscription_id) {
        return NextResponse.json(
          { error: "No Stripe subscription ID found" },
          { status: 400 }
        );
      }

      const result = await cancelSubscription(
        userSubscription.stripe_subscription_id
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to cancel subscription" },
          { status: 500 }
        );
      }
    }

    // Mark subscription as inactive in database
    const { error: updateError } = await supabase
      .from("user_subscription")
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq("id", userSubscription.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update subscription status" },
        { status: 500 }
      );
    }

    // Clear cache
    const { clearFeatureLimitsCache } = await import("@/lib/subscription-features");
    clearFeatureLimitsCache(user.id);

    return NextResponse.json({
      success: true,
      message: "Subscription canceled successfully",
      canceledAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
