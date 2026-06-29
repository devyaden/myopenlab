import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { REFERENCE_TYPES } from "@/lib/refs/resolver";

/** "process-step" → "Process step", "depends-on" → "Depends on". */
function humanize(type: string): string {
  const spaced = type.replace(/-/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * GET /api/refs/types — the reference legend: the fixed set of typed-reference
 * kinds for the @-mention picker and The Map legend. Static (over an exported
 * constant), but gated to signed-in users so it isn't a public enumeration of the
 * product's reference vocabulary.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    types: REFERENCE_TYPES.map((id) => ({ id, label: humanize(id) })),
  });
}
