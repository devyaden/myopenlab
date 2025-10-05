import { Anthropic } from "@anthropic-ai/sdk";
import {
  DiagramType,
  IndustryType,
  LanguageType,
} from "@/lib/types/diagram-types";
import { createDiagramToolSchema } from "./tool-schemas";

/**
 * Determine the appropriate Claude model based on diagram complexity
 */
export function determineAppropriateModel(
  diagramType: DiagramType,
  prompt: string
): string {
  // Use Sonnet for most cases but use Opus for complex diagrams
  const complexityIndicators = [
    "complex",
    "detailed",
    "comprehensive",
    "extensive",
    "intricate",
    "sophisticated",
    "enterprise",
    "multi-level",
  ];

  const isComplex =
    complexityIndicators.some((indicator) =>
      prompt.toLowerCase().includes(indicator)
    ) ||
    diagramType === DiagramType.HIERARCHY ||
    diagramType === DiagramType.MINDMAP ||
    prompt.length > 100;

  return isComplex
    ? "claude-3-5-sonnet-20241022"
    : "claude-3-5-sonnet-20241022";
}

/**
 * Adds diagram type specific instructions to the system prompt
 */
export function addDiagramTypeSpecificInstructions(
  systemPrompt: string,
  diagramType: DiagramType
): string {
  // Add specific instructions for event visitor experience diagrams
  if (diagramType === DiagramType.EVENT_VISITOR_EXPERIENCE) {
    return (
      systemPrompt +
      `

CRITICAL EVENT VISITOR EXPERIENCE INSTRUCTIONS:
1. Create a VISUALLY CLEAR layout with event areas properly spaced and organized
2. Position visitor actors (people shapes) in a VISIBLE location close to areas they will visit
3. EVERY visitor actor MUST have CONNECTED PATHS showing their journey through the event
4. Create at least 2 different visitor journey paths with DISTINCT colors for each visitor type
5. Each visitor journey MUST follow a logical sequence: entrance → event areas → exit
6. ENSURE all edges are properly connected with NO OVERLAPPING or CROSSING paths when possible
7. Every edge MUST be animated with proper directional arrows showing movement direction
8. Use PROPER HANDLE CONNECTIONS: match connection points to the logical direction of movement
9. NEVER create disconnected actors - all visitors must be part of the event journey
10. Each journey must tell a COMPLETE STORY of how that visitor type experiences the event
11. Use UNIQUE EDGE IDs for all connections to avoid duplicate ID errors in rendering

CRITICAL DATA STRUCTURE REQUIREMENTS:
- Node data objects must contain ONLY 'label' and 'shape' properties
- DO NOT include 'incoming', 'outgoing', 'width', 'height', 'from', 'to' in node data
- Width and height belong at the node level, not in the data object`
    );
  }

  // Add general data structure requirements for all diagram types
  return (
    systemPrompt +
    `

CRITICAL DATA STRUCTURE REQUIREMENTS:
- Node data objects must contain ONLY 'label' and 'shape' properties
- DO NOT include 'incoming', 'outgoing', 'width', 'height', 'from', 'to' in node data
- Width and height belong at the node level, not in the data object
- Keep the data structure clean and professional`
  );
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

    // Enhanced user message with explicit data structure requirements
    const enhancedUserMessage = `${userMessage}

CRITICAL: Ensure the generated diagram follows these data structure requirements:
- Node data objects must contain ONLY 'label' and 'shape' properties
- DO NOT add 'incoming', 'outgoing', 'width', 'height', 'from', 'to' properties to node data
- Width and height should be set at the node level (outside of data object)
- Create professional, sophisticated content worthy of executive presentation
- Use business-appropriate terminology and strategic thinking`;

    // API call with timeout control and tools
    const response = await client.messages.create(
      {
        model: model,
        max_tokens: 16384, // Increased to maximum viable limit for more complex diagrams
        temperature: 0.7, // Reduced temperature for more consistent, professional output
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: enhancedUserMessage,
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

      // For timeouts or server errors, fallback to a simpler model and reduce complexity
      if (isServerError || isTimeoutError) {
        retryModel = "claude-3-haiku-20240307";
        console.log(
          `Falling back to ${retryModel} for retry due to timeout/server error`
        );

        // Simplify system prompt and user message for retry
        systemPrompt =
          systemPrompt.split("\n\n").slice(0, 2).join("\n\n") +
          "\nCRITICAL: Generate a SIMPLIFIED professional diagram with fewer nodes and connections. Node data must contain ONLY 'label' and 'shape' properties.";

        userMessage =
          userMessage.split("\n")[0] +
          "\n" +
          "Create a SIMPLIFIED professional version with 5-7 nodes maximum. Focus on quality over quantity. Ensure clean data structure.";
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
