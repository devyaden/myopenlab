import { ClaudeService } from "@/lib/services/claude";
import {
  DiagramType,
  IndustryType,
  LanguageType,
} from "@/lib/types/diagram-types";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Generates the user's first playbook from the onboarding wizard answers and
// marks onboarding complete. Always succeeds (does not hard-block on AI quota)
// so every new user reaches an aha moment.
const schema = z.object({
  companyDescription: z.string().min(2).max(500),
  teamSize: z.string().max(40).optional(),
  firstProcess: z.string().min(2).max(120),
});

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.format() },
        { status: 400 }
      );
    }
    const { companyDescription, teamSize, firstProcess } = parsed.data;

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const claudeService = new ClaudeService();
    const prompt = `Create a clear process playbook titled "${firstProcess}" for this company: ${companyDescription}. Lay out the typical end-to-end steps.`;

    const canvasData: any = await claudeService.generateCanvas(
      LanguageType.ENGLISH,
      DiagramType.WORKFLOW,
      IndustryType.GENERAL,
      prompt
    );

    const canvasId = crypto.randomUUID();
    await supabase.from("canvas").insert({
      id: canvasId,
      name: firstProcess,
      user_id: user.id,
      canvas_type: "hybrid",
      visibility: "private",
    });
    await supabase.from("canvas_data").insert({
      canvas_id: canvasId,
      nodes: canvasData?.nodes ?? [],
      edges: canvasData?.edges ?? [],
      styles: canvasData?.nodeStyles ?? {},
      version: 1,
      updated_at: new Date().toISOString(),
    });

    await supabase
      .from("user")
      .update({
        onboarding_completed: true,
        has_seen_onboarding: true,
        onboarding_data: { companyDescription, teamSize, firstProcess },
      })
      .eq("id", user.id);

    return NextResponse.json({ canvasId });
  } catch (error: any) {
    console.error("Onboarding starter generation failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate starter playbook" },
      { status: 500 }
    );
  }
}
