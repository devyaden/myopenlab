import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/admin/users/:id  — fetch a single member (admin-only)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const u = data.user;
  return NextResponse.json({
    user: {
      id: u.id,
      email: u.email,
      role: u.user_metadata?.role || "User",
      application: u.user_metadata?.application || "Human Resource",
      lastActive: u.last_sign_in_at || u.created_at,
      createdAt: u.created_at,
      isActive: !(u as { banned_until?: string }).banned_until,
    },
  });
}

// DELETE /api/admin/users/:id  — delete a user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PATCH /api/admin/users/:id  { isActive }  — ban / unban a user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  let body: { isActive?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.isActive !== "boolean") {
    return NextResponse.json(
      { error: "isActive (boolean) is required" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
    ban_duration: body.isActive ? "none" : "876000h",
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
