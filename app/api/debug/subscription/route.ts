import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    // Get raw subscription data
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

    // Get all subscriptions for this user (active or not)
    const { data: allSubscriptions } = await supabase
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
      .order("created_at", { ascending: false });

    // Get all available plans
    const { data: allPlans } = await supabase
      .from("subscription")
      .select("*");

    return NextResponse.json({
      userId: user.id,
      activeSubscription: subscriptionData,
      subscriptionError: subscriptionError?.message || null,
      allUserSubscriptions: allSubscriptions,
      allAvailablePlans: allPlans,
      currentDate: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
