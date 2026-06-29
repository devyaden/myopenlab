import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/account/preferences — the user's cross-device theme + language. Stored
 * under onboarding_data.preferences (JSONB) so there's no schema change; the client
 * still owns the immediate UX (next-themes / NEXT_LOCALE cookie), this just persists
 * the choice for sync. Read-merge-write so other onboarding_data keys are preserved.
 */
const THEMES = ["light", "dark", "system"];
const LANGUAGES = ["en", "ar"];

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { theme?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.theme && !THEMES.includes(body.theme)) {
    return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
  }
  if (body.language && !LANGUAGES.includes(body.language)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }
  if (!body.theme && !body.language) {
    return NextResponse.json(
      { error: "Nothing to update (theme or language required)" },
      { status: 400 }
    );
  }

  const { data: row } = await supabase
    .from("user")
    .select("onboarding_data")
    .eq("id", user.id)
    .maybeSingle();

  const onboarding =
    row?.onboarding_data && typeof row.onboarding_data === "object"
      ? (row.onboarding_data as Record<string, unknown>)
      : {};
  const prefs = {
    ...((onboarding.preferences as Record<string, unknown>) ?? {}),
  };
  if (body.theme) prefs.theme = body.theme;
  if (body.language) prefs.language = body.language;

  const { error: upErr } = await supabase
    .from("user")
    .update({
      onboarding_data: { ...onboarding, preferences: prefs },
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  return NextResponse.json({ preferences: prefs });
}
