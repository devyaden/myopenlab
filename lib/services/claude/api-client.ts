import { Anthropic } from "@anthropic-ai/sdk";
import {
  DiagramType,
  IndustryType,
  LanguageType,
} from "@/lib/types/diagram-types";
import { createDiagramToolSchema } from "./tool-schemas";

export const PRIMARY_MODEL = "claude-sonnet-4-6";
export const FALLBACK_MODEL = "claude-haiku-4-5-20251001";

/**
 * Adds diagram type specific instructions to the system prompt. Kept minimal —
 * the tool schema enforces the data shape, and the main system prompt already
 * covers structure.
 */
export function addDiagramTypeSpecificInstructions(
  systemPrompt: string,
  diagramType: DiagramType
): string {
  if (diagramType === DiagramType.EVENT_VISITOR_EXPERIENCE) {
    return (
      systemPrompt +
      `

EVENT NOTES:
- Every visitor actor must have at least one edge to an area.
- Each edge id must be unique.`
    );
  }
  return systemPrompt;
}

/**
 * Call Claude API with Tools (function calling) - more reliable structured output
 */
export async function callClaudeAPIWithTools(
  client: Anthropic,
  model: string,
  systemPrompt: string,
  userMessage: string,
  diagramType: DiagramType,
  industry: IndustryType,
  language: LanguageType,
  retryCount = 0
): Promise<any> {
  try {
    // Add diagram-specific instructions
    systemPrompt = addDiagramTypeSpecificInstructions(
      systemPrompt,
      diagramType
    );

    // Add request timeout to prevent hanging in production environments
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 125000); // 25 second timeout

    // Create tools schema based on diagram type
    const tools = createDiagramToolSchema(diagramType);

    // API call with timeout control and tools
    const response = await client.messages.create(
      {
        model: model,
        max_tokens: 8192,
        temperature: 0.5,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
        tools: tools,
        tool_choice: { type: "any" },
      },
      {
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    // Basic validation to ensure the response is meaningful
    if (!response || !response.content || response.content.length === 0) {
      throw new Error("Empty response from Claude API");
    }

    return response;
  } catch (error: any) {
    // Log the detailed error information
    console.error("Claude API Error:", {
      message: error.message,
      type: error.type,
      status: error.status,
      model: model,
      retryCount: retryCount,
    });

    // Check for rate limit errors (typically 429) or server errors (5xx)
    const isRateLimitError = error.status === 429;
    const isServerError = error.status >= 500 && error.status < 600;
    const isNetworkError = !error.status && error.message?.includes("network");
    const isTimeoutError =
      error.name === "AbortError" || error.message?.includes("timeout");
    const isRetryableError =
      isRateLimitError || isServerError || isNetworkError || isTimeoutError;

    // Determine if we should retry
    if (isRetryableError && retryCount < 2) {
      // Calculate backoff time: 3 seconds for first retry, 6 for second
      const backoffTime = (retryCount + 1) * 3000;

      console.warn(
        `Claude API call failed with ${error.status || "network/timeout error"}, retrying in ${backoffTime / 1000}s (${retryCount + 1}/2)...`
      );

      // Wait with exponential backoff before retrying
      await new Promise((resolve) => setTimeout(resolve, backoffTime));

      // Retry with an alternative model if the error might be model-specific
      let retryModel = model;

      // For timeouts or server errors, fall back to a faster model.
      if (isServerError || isTimeoutError) {
        retryModel = FALLBACK_MODEL;
        console.log(
          `Falling back to ${retryModel} for retry due to timeout/server error`
        );
      }

      return callClaudeAPIWithTools(
        client,
        retryModel,
        systemPrompt,
        userMessage,
        diagramType,
        industry,
        language,
        retryCount + 1
      );
    }

    // After all retries fail, throw the error with more context
    throw new Error(
      `Claude API failed after retries: ${error.message || "Unknown error"}`
    );
  }
}
