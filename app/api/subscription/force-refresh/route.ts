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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Clear all caches
    clearFeatureLimitsCache(user.id);

    // Also clear localStorage and sessionStorage on client side
    return NextResponse.json({
      success: true,
      message: "Cache cleared. Please refresh the page.",
      userId: user.id,
    });
  } catch (error: any) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
