import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAiTokenLimit } from "@/lib/services/ai-usage";

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

    // Phase F: token budgets (daily/monthly) + the plan's per-conversation context
    // cap, for the in-chat meters.
    const status = await checkAiTokenLimit(user.id);
    return NextResponse.json({
      daily: status.daily,
      monthly: status.monthly,
      dailyLimit: status.dailyLimit,
      monthlyLimit: status.monthlyLimit,
      contextCap: status.contextCap,
      allowed: status.allowed,
      isPaidUser: status.isPaidUser,
    });
  } catch (error: any) {
    console.error("Error fetching AI usage:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
