import { NextResponse } from "next/server";

import { requireExploreAccess } from "@/lib/explore/access";
import { findDanglingReferences } from "@/lib/refs/resolver";

/**
 * GET /api/explore/drift — the owner's broken cross-references ("drift"). Exposes
 * the already-built integrity check so The Map / governance can surface "your map
 * has broken links — fix". Owner-scoped through requireExploreAccess (the single
 * explore gate); findDanglingReferences enforces `.eq(user_id)` internally, so a
 * user only ever sees their own dangling references.
 */
export async function GET() {
  const access = await requireExploreAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const { supabase, user } = access;

  try {
    const dangling = await findDanglingReferences(supabase, user.id);
    return NextResponse.json({ dangling, count: dangling.length });
  } catch (error) {
    console.error("Error computing drift:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
