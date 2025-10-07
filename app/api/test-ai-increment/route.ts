import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { incrementAiUsage, checkAiUsageLimit } from "@/lib/services/ai-usage";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check current usage
    const before = await checkAiUsageLimit(user.id);
    console.log("Before increment:", before);

    // Increment
    await incrementAiUsage(user.id);
    console.log("Increment called successfully");

    // Check after
    const after = await checkAiUsageLimit(user.id);
    console.log("After increment:", after);

    return NextResponse.json({
      success: true,
      before: {
        used: before.limit - before.remaining,
        limit: before.limit,
      },
      after: {
        used: after.limit - after.remaining,
        limit: after.limit,
      },
    });
  } catch (error: any) {
    console.error("Test failed:", error);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
