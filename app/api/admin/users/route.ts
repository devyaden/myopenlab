import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Admin user management. Runs server-side ONLY so the Supabase service-role key
// is never shipped to the browser (see lib/supabase/admin.ts). Every handler is
// gated by requireAdmin().

// GET /api/admin/users?page=1&perPage=10  — list users (paginated)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const perPage = Math.min(
    100,
    Math.max(1, Number(searchParams.get("perPage")) || 10)
  );

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page,
    perPage,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = (data.users || []).map((user) => ({
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role || "User",
    application: user.user_metadata?.application || "Human Resource",
    lastActive: user.last_sign_in_at || user.created_at,
    isActive: !(user as { banned_until?: string }).banned_until,
  }));

  return NextResponse.json({
    users,
    totalUsers: data.total,
    hasNextPage: data.nextPage !== null && data.nextPage !== undefined,
    hasPreviousPage: page > 1,
  });
}

// POST /api/admin/users  { email, role }  — invite a user
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { email?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, role } = body;
  if (!email || !role) {
    return NextResponse.json(
      { error: "email and role are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    { data: { role, application: "Human Resource" } }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      role,
      application: "Human Resource",
      lastActive: data.user.created_at,
      isActive: true,
    },
  });
}
