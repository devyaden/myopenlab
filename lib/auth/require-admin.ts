import { createClient } from "@/lib/supabase/server";

const ADMIN_ROLES = ["Admin", "Super Admin"];

type RequireAdminResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

// Gate for admin-only API routes. Verifies the request carries a valid session
// AND that the user's role is an admin role. Returns a discriminated result the
// route handler can turn into a NextResponse.
export async function requireAdmin(): Promise<RequireAdminResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const role = (user.user_metadata as { role?: string } | null)?.role;
  if (!role || !ADMIN_ROLES.includes(role)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, userId: user.id };
}
