import { Anthropic } from "@anthropic-ai/sdk";
import {
  DiagramType,
  IndustryType,
  LanguageType,
} from "@/lib/types/diagram-types";
import { CanvasData } from "./types";
import { constructUserMessage, createSystemPrompt } from "./prompts";
import {
  determineAppropriateModel,
  callClaudeAPIWithTools,
} from "./api-client";
import { processClaudeToolResponse } from "./response-processor";
import { generateFallbackData } from "./fallback-generators";

/**
 * Service for handling Claude AI API interactions
 */
export class ClaudeService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY!,
    });
  }

  /**
   * Generates a canvas diagram based on the specified parameters
   *
   * @param language The language for the diagram
   * @param diagramType The type of diagram to generate
   * @param industry The industry context for the diagram
   * @param prompt User-provided requirements for the diagram
   * @returns Canvas data for React Flow
   */
  async generateCanvas(
    language: LanguageType,
    diagramType: DiagramType,
    industry: IndustryType,
    prompt: string
  ): Promise<CanvasData> {
    try {
      // Create optimized system prompt
      const systemPrompt = createSystemPrompt(language, diagramType, industry);

      // Create a targeted user message
      const userMessage = constructUserMessage(
        language,
        diagramType,
        industry,
        prompt
      );

      // Determine the appropriate model based on diagram complexity
      const model = determineAppropriateModel(diagramType, prompt);

      // Call the Claude API with robust error handling and retry logic
      const response = await callClaudeAPIWithTools(
        this.client,
        model,
        systemPrompt,
        userMessage,
        diagramType,
        industry,
        language
      );

      // Process and validate the response
      let canvasData = processClaudeToolResponse(
        response,
        diagramType,
        industry,
        language,
        this.generateFallbackData.bind(this)
      );

      return canvasData;
    } catch (error) {
      console.error("Error in Claude service:", error);
      // Always return a valid diagram even if an error occurs
      return this.generateFallbackData(diagramType, industry, prompt, language);
    }
  }

  /**
   * Generates fallback data when Claude fails to produce valid diagram data
   */
  private generateFallbackData(
    diagramType: DiagramType,
    industry: IndustryType,
    prompt: string,
    language: LanguageType = LanguageType.ENGLISH
  ): CanvasData {
    return generateFallbackData(diagramType, industry, prompt, language);
  }
}
