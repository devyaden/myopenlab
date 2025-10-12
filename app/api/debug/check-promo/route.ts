import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // Get all promo codes
    const { data: promoCodes, error: promoError } = await supabase
      .from("promo_code")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (promoError) {
      console.error("Error fetching promo codes:", promoError);
      return NextResponse.json({ error: promoError.message }, { status: 500 });
    }

    // Get recent user subscriptions
    const { data: userSubs, error: subError } = await supabase
      .from("user_subscription")
      .select("*, promo_code:promo_code_id(*)")
      .order("created_at", { ascending: false })
      .limit(5);

    if (subError) {
      console.error("Error fetching user subscriptions:", subError);
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    // Calculate duration for each subscription
    const subsWithDuration = userSubs.map(sub => {
      const start = new Date(sub.start_date);
      const end = new Date(sub.end_date);
      const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 +
                         (end.getMonth() - start.getMonth());

      return {
        ...sub,
        calculated_duration_months: monthsDiff,
      };
    });

    return NextResponse.json({
      promoCodes: promoCodes.map(p => ({
        code: p.code,
        name: p.name,
        duration_months: p.duration_months,
        expiry_date: p.expiry_date,
        active: p.active,
        stripe_price_id: p.stripe_price_id,
      })),
      userSubscriptions: subsWithDuration,
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
