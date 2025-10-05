import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAiUsageLimit } from "@/lib/services/ai-usage";

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

    const usage = await checkAiUsageLimit(user.id);

    return NextResponse.json({
      used: usage.limit - usage.remaining,
      limit: usage.limit,
      remaining: usage.remaining,
      allowed: usage.allowed,
    });
  } catch (error: any) {
    console.error("Error fetching AI usage:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
