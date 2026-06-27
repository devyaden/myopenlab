import { NextRequest, NextResponse } from "next/server";
import { requireExploreAccess } from "@/lib/explore/access";
import { resolveCode } from "@/lib/refs/resolver";
import { playbookHref } from "@/lib/playbook-href";

// Resolve a human code (e.g. "HR-01") to its artifact — used when the user clicks
// a {CODE} source chip in an answer. Returns the entity + the route to open it.
export async function GET(request: NextRequest) {
  const access = await requireExploreAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const { supabase, user } = access;

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const entity = await resolveCode(supabase, user.id, code);
  if (!entity) {
    return NextResponse.json({ entity: null });
  }
  return NextResponse.json({
    entity: { ...entity, href: playbookHref(entity.id, entity.canvas_type) },
  });
}
