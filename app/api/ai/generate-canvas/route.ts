import { ClaudeService } from "@/lib/services/claude-service";
import {
  DiagramType,
  IndustryType,
  LanguageType,
} from "@/lib/types/diagram-types";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Input validation schema
const generateCanvasSchema = z.object({
  language: z.nativeEnum(LanguageType).default(LanguageType.ENGLISH),
  diagramType: z.nativeEnum(DiagramType),
  industry: z.nativeEnum(IndustryType),
  prompt: z.string().min(10).max(1000),
});

// Type for the parsed input
type GenerateCanvasInput = z.infer<typeof generateCanvasSchema>;

// Configure longer timeout for production environments
export const maxDuration = 60; // For Vercel's Edge and Serverless Functions

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const result = generateCanvasSchema.safeParse(body);

    // Handle validation errors
    if (!result.success) {
      const errors = result.error.format();
      return NextResponse.json(
        { error: "Invalid input", details: errors },
        { status: 400 }
      );
    }

    const input: GenerateCanvasInput = result.data;

    // Get the user session
    // const {
    //   data: { session },
    // } = await supabase.auth.getSession();

    // // Ensure the user is authenticated
    // if (!session) {
    //   return NextResponse.json(
    //     { error: "Unauthorized - You must be logged in" },
    //     { status: 401 }
    //   );
    // }

    // Track diagram generation start with PostHog
    // posthog.capture(PostHogEvents.AI_DIAGRAM_GENERATION_STARTED, {
    //   userId: session.user.id,
    //   diagramType: input.diagramType,
    //   industry: input.industry,
    //   language: input.language,
    //   promptLength: input.prompt.length,
    // });

    // Initialize Claude service
    const claudeService = new ClaudeService();

    // Generate canvas data with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Canvas generation timed out")), 50000);
    });

    const canvasData = await Promise.race([
      claudeService.generateCanvas(
        input.language,
        input.diagramType,
        input.industry,
        input.prompt
      ),
      timeoutPromise,
    ]);

    // Track successful completion
    // posthog.capture(PostHogEvents.AI_DIAGRAM_GENERATION_COMPLETED, {
    //   userId: session.user.id,
    //   diagramType: input.diagramType,
    //   industry: input.industry,
    //   language: input.language,
    //   promptLength: input.prompt.length,
    //   responseSize: JSON.stringify(canvasData).length,
    // });

    // Return the generated data
    return NextResponse.json({ data: canvasData });
  } catch (error: any) {
    // Log the error
    console.error("Error generating canvas:", error);

    // Track error with PostHog
    // posthog.capture(PostHogEvents.AI_DIAGRAM_GENERATION_ERROR, {
    //   errorMessage: error instanceof Error ? error.message : "Unknown error",
    //   errorStack: error instanceof Error ? error.stack : undefined,
    // });

    // Return an appropriate error response
    const errorMessage =
      error instanceof Error
        ? error.message === "Canvas generation timed out"
          ? "The AI diagram generation is taking too long. Please try a simpler request."
          : error.message
        : "Failed to generate canvas";

    return NextResponse.json(
      { error: errorMessage },
      { status: error.message === "Canvas generation timed out" ? 408 : 500 }
    );
  }
}
