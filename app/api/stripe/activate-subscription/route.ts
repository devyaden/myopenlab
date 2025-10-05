import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clearFeatureLimitsCache } from "@/lib/subscription-features";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planType } = await request.json();

    if (!planType || !["monthly", "yearly"].includes(planType)) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    // Get the subscription plan from database
    const planTitle = planType === "yearly" ? "Yearly Pro" : "Monthly Pro";

    const { data: plan } = await supabase
      .from("subscription")
      .select("id, title")
      .or(`title.ilike.%${planType}%,title.ilike.%pro%`)
      .limit(1)
      .single();

    if (!plan) {
      return NextResponse.json(
        { error: "Subscription plan not found in database" },
        { status: 404 }
      );
    }

    // Delete any existing active subscriptions
    await supabase
      .from("user_subscription")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .eq("is_active", true);

    // Create new subscription record
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (planType === "yearly" ? 12 : 1));

    // Generate UUID for the subscription
    const { data: uuidData } = await supabase.rpc('gen_random_uuid');
    const subscriptionId = uuidData || crypto.randomUUID();

    const { data: newSubscription, error: insertError } = await supabase
      .from("user_subscription")
      .insert({
        id: subscriptionId,
        user_id: user.id,
        subscription_id: plan.id,
        stripe_subscription_id: `local_test_${Date.now()}`,
        stripe_customer_id: `local_cus_${user.id}`,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating subscription:", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // Clear cache for this user
    clearFeatureLimitsCache(user.id);

    return NextResponse.json({
      success: true,
      subscription: newSubscription,
      plan: plan.title,
    });
  } catch (error: any) {
    console.error("Error activating subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to activate subscription" },
      { status: 500 }
    );
  }
}
