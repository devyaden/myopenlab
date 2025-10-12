import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
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

    // Get all active subscriptions with promo codes
    const { data: subscriptions, error: subsError } = await supabase
      .from("user_subscription")
      .select("*, promo_code:promo_code_id(*)")
      .eq("is_active", true)
      .not("promo_code_id", "is", null);

    if (subsError) {
      console.error("Error fetching subscriptions:", subsError);
      return NextResponse.json({ error: subsError.message }, { status: 500 });
    }

    const updates = [];
    const errors = [];

    for (const sub of subscriptions) {
      if (!sub.promo_code || !sub.promo_code.duration_months) {
        continue;
      }

      const startDate = new Date(sub.start_date);
      const currentEndDate = new Date(sub.end_date);
      const newEndDate = new Date(sub.start_date);

      const durationInMonths = sub.promo_code.duration_months;

      // Calculate correct end date
      if (durationInMonths >= 12) {
        // For 12 months or more, use full years
        newEndDate.setFullYear(newEndDate.getFullYear() + Math.floor(durationInMonths / 12));
        // Add remaining months
        const remainingMonths = durationInMonths % 12;
        if (remainingMonths > 0) {
          newEndDate.setMonth(newEndDate.getMonth() + remainingMonths);
        }
      } else {
        // For less than 12 months, use months
        newEndDate.setMonth(newEndDate.getMonth() + durationInMonths);
      }

      // Calculate current duration
      const currentMonthsDiff = (currentEndDate.getFullYear() - startDate.getFullYear()) * 12 +
                                 (currentEndDate.getMonth() - startDate.getMonth());

      // Only update if duration doesn't match
      if (currentMonthsDiff !== durationInMonths) {
        const { error: updateError } = await supabase
          .from("user_subscription")
          .update({
            end_date: newEndDate.toISOString(),
          })
          .eq("id", sub.id);

        if (updateError) {
          errors.push({
            subscription_id: sub.id,
            user_id: sub.user_id,
            error: updateError.message,
          });
        } else {
          updates.push({
            subscription_id: sub.id,
            user_id: sub.user_id,
            promo_code: sub.promo_code.code,
            old_duration_months: currentMonthsDiff,
            new_duration_months: durationInMonths,
            old_end_date: currentEndDate.toISOString(),
            new_end_date: newEndDate.toISOString(),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${updates.length} subscriptions`,
      updates,
      errors,
      total_checked: subscriptions.length,
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
