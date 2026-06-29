import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/account/profile — update the signed-in user's own profile. Strictly
 * allow-listed: only the editable profile fields below can be set, so a client can
 * never escalate `role` or forge `id`/timestamps. Email is identity, so a change is
 * routed through Supabase Auth's verification flow (a confirm email) rather than
 * written directly — public.user.email syncs on confirmation, not here.
 */
const PROFILE_FIELDS = [
  "name",
  "company_name",
  "company_email",
  "company_sector",
  "company_size",
  "user_position",
  "username",
  "avatar_url",
] as const;

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  for (const f of PROFILE_FIELDS) {
    if (typeof body[f] === "string") update[f] = (body[f] as string).slice(0, 200);
    else if (body[f] === null) update[f] = null;
  }

  // Email change → Supabase Auth verification (sends a confirm link). Never written
  // straight to the row.
  let emailChangePending = false;
  if (
    typeof body.email === "string" &&
    body.email.trim() &&
    body.email.trim().toLowerCase() !== (user.email ?? "").toLowerCase()
  ) {
    const { error: emailErr } = await supabase.auth.updateUser({
      email: body.email.trim(),
    });
    if (emailErr) {
      return NextResponse.json({ error: emailErr.message }, { status: 400 });
    }
    emailChangePending = true;
  }

  if (Object.keys(update).length > 0) {
    update.updated_at = new Date().toISOString();
    const { error: upErr } = await supabase
      .from("user")
      .update(update)
      .eq("id", user.id);
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }
  }

  const { data: profile } = await supabase
    .from("user")
    .select(
      "id, name, email, username, company_name, company_email, company_sector, company_size, user_position, avatar_url, role"
    )
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({ profile, emailChangePending });
}
