import { ClaudeService } from "@/lib/services/claude";
import {
  DiagramType,
  IndustryType,
  LanguageType,
} from "@/lib/types/diagram-types";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Public, unauthenticated demo endpoint powering the /try wedge experience.
// Visitors describe one process and get a generated playbook — no signup.
const tryPlaybookSchema = z.object({
  prompt: z.string().min(10).max(500),
});

export const maxDuration = 60;

// 5 generations per hour per IP.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(`try-playbook:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "rate_limited",
          message:
            "You've reached the demo limit. Create a free account to keep building playbooks.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = tryPlaybookSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }

    const claudeService = new ClaudeService();

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Playbook generation timed out")), 45000);
    });

    const canvasData: any = await Promise.race([
      claudeService.generateCanvas(
        LanguageType.ENGLISH,
        DiagramType.WORKFLOW,
        IndustryType.GENERAL,
        result.data.prompt
      ),
      timeoutPromise,
    ]);

    const { meta, ...canvasPayload } = canvasData ?? {};

    return NextResponse.json({
      data: {
        nodes: canvasPayload.nodes ?? [],
        edges: canvasPayload.edges ?? [],
        // generateCanvas returns nodeStyles; the renderer expects `styles`.
        styles: canvasPayload.nodeStyles ?? {},
      },
      meta: meta ?? null,
      remaining: limit.remaining,
    });
  } catch (error: any) {
    console.error("Error generating demo playbook:", error);
    const timedOut = error?.message === "Playbook generation timed out";
    return NextResponse.json(
      {
        error: timedOut ? "timeout" : "generation_failed",
        message: timedOut
          ? "That took too long — try a shorter, simpler process."
          : "Something went wrong generating your playbook. Please try again.",
      },
      { status: timedOut ? 408 : 500 }
    );
  }
}
