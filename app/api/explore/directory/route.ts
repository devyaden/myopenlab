import { NextResponse } from "next/server";
import { requireExploreAccess } from "@/lib/explore/access";
import { listDirectories, listDirectoryRows } from "@/lib/refs/resolver";

// People/role directories with their rows, for the governance browser. Read-only
// and owner-scoped via the resolver helpers.
export async function GET() {
  const access = await requireExploreAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const { supabase, user, scope } = access;

  const directories = await listDirectories(supabase, user.id);
  // Honor the data scope (v1: allowedDirectoryIds is null ⇒ all of them).
  const visible = scope.allowedDirectoryIds
    ? directories.filter((d) => scope.allowedDirectoryIds!.includes(d.id))
    : directories;

  const withRows = await Promise.all(
    visible.map(async (d) => ({
      ...d,
      rows: await listDirectoryRows(supabase, user.id, d.id),
    }))
  );

  return NextResponse.json({ directories: withRows });
}
