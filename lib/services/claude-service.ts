import {
  DiagramType,
  IndustryType,
  LanguageType,
} from "@/lib/types/diagram-types";
import { Anthropic } from "@anthropic-ai/sdk";
import { ALL_SHAPES } from "../types/flow-table.types";

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
  ) {
    try {
      // Create optimized system prompt
      const systemPrompt = this.createSystemPrompt(
        language,
        diagramType,
        industry
      );

      // Create a targeted user message
      const userMessage = this.constructUserMessage(
        language,
        diagramType,
        industry,
        prompt
      );

      // Determine the appropriate model based on diagram complexity
      const model = this.determineAppropriateModel(diagramType, prompt);

      // Call the Claude API with basic retry logic
      const response = await this.callClaudeAPI(
        model,
        systemPrompt,
        userMessage
      );

      // Process and validate the response
      let canvasData = await this.processClaudeResponse(
        response,
        diagramType,
        industry,
        prompt,
        language
      );

      return canvasData;
    } catch (error) {
      console.error("Error in Claude service:", error);
      // Always return a valid diagram even if an error occurs
      return this.generateFallbackData(diagramType, industry, prompt, language);
    }
  }

  /**
   * Determine the appropriate Claude model based on diagram complexity
   */
  private determineAppropriateModel(
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
   * Call Claude API with basic retry logic
   */
  private async callClaudeAPI(
    model: string,
    systemPrompt: string,
    userMessage: string,
    retryCount = 0
  ): Promise<Anthropic.Messages.Message> {
    try {
      // Simple direct API call without timeout restrictions
      const response = await this.client.messages.create({
        model: model,
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      });

      return response;
    } catch (error) {
      // Simple retry logic for network errors
      if (retryCount < 2) {
        console.warn(
          `Claude API call failed, retrying (${retryCount + 1}/2)...`
        );

        // Wait for 3 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 3000));

        return this.callClaudeAPI(
          model,
          systemPrompt,
          userMessage,
          retryCount + 1
        );
      }

      // After all retries fail, throw the error
      throw error;
    }
  }

  /**
   * Process and validate Claude API response
   */
  private async processClaudeResponse(
    response: any,
    diagramType: DiagramType,
    industry: IndustryType,
    prompt: string,
    language: LanguageType = LanguageType.ENGLISH
  ) {
    try {
      // Handle case where the response is already in the expected format
      if (response && response.content && Array.isArray(response.content)) {
        // Extract text content from the response
        const textContent = response.content
          .filter((block: any) => block.type === "text")
          .map((block: any) => block.text)
          .join("")
          .trim();

        if (textContent) {
          try {
            // First, try to parse the entire text content directly
            const canvasData = JSON.parse(textContent);

            // Store diagram metadata in the canvas data for validation and rendering
            canvasData.diagramType = diagramType;
            canvasData.language = language;
            canvasData.industry = industry;

            if (this.isCanvasDataMinimallyValid(canvasData)) {
              // Improve edge handles if needed
              const improvedData = this.improveEdgeHandles(canvasData);
              return improvedData;
            }
          } catch (error) {
            console.log(
              "Failed to parse entire content as JSON, trying to extract JSON blocks..."
            );
            // Continue to JSON extraction approach
          }

          // Extract JSON using regex if direct parsing failed
          const jsonMatch = textContent.match(
            /```(?:json)?\s*([\s\S]*?)```|({[\s\S]*})/
          );

          if (jsonMatch && jsonMatch[1]) {
            try {
              const extractedJson = jsonMatch[1].trim();
              const canvasData = JSON.parse(extractedJson);

              // Store diagram metadata in the canvas data for validation and rendering
              canvasData.diagramType = diagramType;
              canvasData.language = language;
              canvasData.industry = industry;

              if (this.isCanvasDataMinimallyValid(canvasData)) {
                // Improve edge handles if needed
                const improvedData = this.improveEdgeHandles(canvasData);
                return improvedData;
              }
            } catch (error) {
              console.log("Failed to parse extracted JSON block");
            }
          }
        }
      }

      // If we reach here, we couldn't get valid data from Claude
      console.log("Using fallback data for prompt:", prompt);
      return this.generateFallbackData(diagramType, industry, prompt, language);
    } catch (error) {
      console.error("Error processing Claude response:", error);
      return this.generateFallbackData(diagramType, industry, prompt, language);
    }
  }

  /**
   * Check if canvas data has minimal valid structure (just enough to render)
   */
  private isCanvasDataMinimallyValid(canvasData: any): boolean {
    try {
      // Check basic structure
      if (!canvasData || typeof canvasData !== "object") {
        return false;
      }

      // Verify nodes array exists and has at least one node
      if (
        !canvasData.nodes ||
        !Array.isArray(canvasData.nodes) ||
        canvasData.nodes.length === 0
      ) {
        return false;
      }

      // Fix common issues with node structure
      for (const node of canvasData.nodes) {
        if (!node) continue;

        // Ensure node has an ID
        if (!node.id) {
          node.id = `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }

        // Normalize node type to "genericNode" if not already set
        if (!node.type || node.type !== "genericNode") {
          // Store original type as className if not already set
          if (
            !node.className &&
            node.type !== "default" &&
            node.type !== "input" &&
            node.type !== "output"
          ) {
            node.className = `node-${node.type}`;
          }
          node.type = "genericNode";
        }

        // Ensure node has data object with at least a label
        if (!node.data) {
          node.data = { label: node.label || "Node" };
        }

        // If no shape is defined, set a default based on node id or className
        if (!node.data.shape) {
          if (node.className && node.className.includes("diamond")) {
            node.data.shape = "diamond";
          } else if (node.className && node.className.includes("circle")) {
            node.data.shape = "circle";
          } else {
            node.data.shape = "rectangle";
          }
        }

        // Ensure node has position
        if (!node.position) {
          node.position = { x: 0, y: 0 };
        }

        // Ensure node has dimensions
        if (!node.width) node.width = 150;
        if (!node.height) node.height = 80;
      }

      // For wireframes, we don't need to validate edges
      if (canvasData.diagramType === DiagramType.WEBSITE_WIREFRAME) {
        return true;
      }

      // Verify edges array exists
      if (!canvasData.edges) {
        canvasData.edges = [];
      }

      // Ensure edges is an array
      if (!Array.isArray(canvasData.edges)) {
        canvasData.edges = [];
      }

      return true;
    } catch (error) {
      console.error("Error validating canvas data:", error);
      return false;
    }
  }

  /**
   * Create a replacement node when a node is invalid
   */
  private createReplacementNode(id: string) {
    return {
      id,
      type: "genericNode",
      position: { x: 300, y: 100 },
      data: { label: "Node", shape: "rectangle" },
      width: 150,
      height: 80,
    };
  }

  /**
   * Generate style for a specific node
   */
  private generateStyleForNode(
    node: any,
    industry: IndustryType,
    nodeId: string
  ) {
    const palette = this.getColorPalette(industry);
    const nodeIndex =
      parseInt(nodeId.split("-").pop() || "0", 10) % palette.length;

    return {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: node.data.label?.length > 20 ? 14 : 16,
      isBold:
        node.data.label?.includes("Main") || node.data.label?.includes("Key"),
      isItalic: false,
      isUnderline: false,
      textAlign: "center",
      verticalAlign: "middle",
      shape: node.data.shape,
      locked: false,
      isVertical: true,
      borderStyle: "solid",
      borderWidth: 2,
      backgroundColor: palette[nodeIndex],
      borderColor: palette[(nodeIndex + 1) % palette.length],
      textColor: this.getTextColorForBackground(palette[nodeIndex]),
      lineHeight: 1.3,
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    };
  }

  /**
   * Get appropriate text color based on background color
   */
  private getTextColorForBackground(backgroundColor: string): string {
    // Convert hex to RGB
    const r = parseInt(backgroundColor.slice(1, 3), 16);
    const g = parseInt(backgroundColor.slice(3, 5), 16);
    const b = parseInt(backgroundColor.slice(5, 7), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return white for dark backgrounds, dark gray for light backgrounds
    return luminance > 0.5 ? "#212121" : "#FFFFFF";
  }

  /**
   * Get color palette for an industry
   */
  private getColorPalette(industry: IndustryType): string[] {
    const industryPalettes: Record<string, string[]> = {
      [IndustryType.MARKETING]: [
        "#8A4FFF",
        "#FF6B6B",
        "#4ECDC4",
        "#FFD166",
        "#FF9F1C",
        "#F2F7FF",
      ],
      [IndustryType.PROFESSIONAL_SERVICES]: [
        "#2D3E50",
        "#4B86B4",
        "#ADCBE3",
        "#63ADF2",
        "#E2E8F0",
        "#FAFAFA",
      ],
      [IndustryType.TRAINING_COACHING]: [
        "#2E8B57",
        "#3AAFA9",
        "#5CDB95",
        "#8EE4AF",
        "#EDF5E1",
        "#05386B",
      ],
      [IndustryType.PRODUCTION]: [
        "#5D4037",
        "#8D6E63",
        "#90A4AE",
        "#B0BEC5",
        "#E0E0E0",
        "#ECEFF1",
      ],
      [IndustryType.TECHNOLOGY]: [
        "#0D47A1",
        "#1976D2",
        "#29B6F6",
        "#81D4FA",
        "#E1F5FE",
        "#263238",
      ],
      [IndustryType.EVENT_MANAGEMENT]: [
        "#6A0DAD",
        "#9C27B0",
        "#E040FB",
        "#EA80FC",
        "#F3E5F5",
        "#FFD54F",
      ],
      [IndustryType.FINANCIAL_SERVICES]: [
        "#004D40",
        "#00796B",
        "#4DB6AC",
        "#B2DFDB",
        "#E0F2F1",
        "#FFC107",
      ],
      [IndustryType.GENERAL]: [
        "#455A64",
        "#607D8B",
        "#90A4AE",
        "#CFD8DC",
        "#ECEFF1",
        "#FAFAFA",
      ],
    };

    return industryPalettes[industry] || industryPalettes[IndustryType.GENERAL];
  }

  /**
   * Construct user message for Claude
   */
  private constructUserMessage(
    language: LanguageType,
    diagramType: DiagramType,
    industry: IndustryType,
    prompt: string
  ): string {
    // Create a directive that clearly emphasizes what we want
    const directive = `Design a professional ${language} ${diagramType} diagram for ${industry} industry: "${prompt}"`;

    // Add diagram-specific guidance based on type
    let typeSpecificGuidance = "";
    switch (diagramType) {
      case DiagramType.WORKFLOW:
        typeSpecificGuidance =
          "The workflow must include at least 10 connected nodes with proper decision points and data stores.";
        break;
      case DiagramType.WEBSITE_WIREFRAME:
        typeSpecificGuidance =
          "This should be a detailed wireframe layout showing ACTUAL UI COMPONENTS (not a sitemap). Position UI elements as they would appear on a real webpage, with proper sizing and positioning. Include typical elements like header, navigation, content sections, forms, buttons, etc. DO NOT create a site structure diagram or sitemap.";
        break;
      case DiagramType.EVENT_VISITOR_EXPERIENCE:
        typeSpecificGuidance =
          "Show detailed physical layout with visitor paths, attractions, and 2-3 typical visitor journeys.";
        break;
      case DiagramType.HIERARCHY:
        typeSpecificGuidance =
          "Create an organizational chart with 3-4 levels and proper organizational relationships.";
        break;
      case DiagramType.MINDMAP:
        typeSpecificGuidance =
          "Create a concept map with 3-5 main branches and 2-4 sub-branches per main branch.";
        break;
      default:
        typeSpecificGuidance =
          "Include at least 10 well-connected elements with appropriate relationships.";
    }

    // Include the JSON format requirements
    return `${directive}\n\n${typeSpecificGuidance}\n\nIMPORTANT: Return ONLY valid JSON with nodes, edges, and nodeStyles as specified. Each node MUST use "genericNode" type and appropriate "data.shape" value. All edges MUST have proper sourceHandle and targetHandle values.`;
  }

  /**
   * Get common requirements for all diagram types
   */
  private getCommonRequirements(language: LanguageType): string {
    return `Create a professional diagram for React Flow that follows these critical requirements:
- LANGUAGE: ${language === LanguageType.ENGLISH ? "English, clear and concise" : "Arabic, use proper RTL formatting"}
- All nodes MUST use "genericNode" as the type
- All nodes MUST have "data.shape" property set to one of the available shapes
- All edges MUST have sourceHandle and targetHandle properties set
- Flow direction: ${language === LanguageType.ENGLISH ? "left-to-right (LTR)" : "right-to-left (RTL)"}`;
  }

  /**
   * Get connection handles requirements
   */
  private getConnectionHandlesRequirements(): string {
    return `CONNECTION HANDLES - CRITICAL:
- Every edge MUST have both sourceHandle and targetHandle values from this list:
  * TARGET HANDLES: "a" (top), "b" (bottom), "c" (right), "d" (left)
  * SOURCE HANDLES: "e" (top), "f" (bottom), "g" (right), "h" (left)
- For horizontal flow (L→R): source="g", target="d"
- For horizontal flow (R→L): source="h", target="c"
- For vertical flow (T→B): source="f", target="a"
- For vertical flow (B→T): source="e", target="b"`;
  }

  /**
   * Get industry-specific styling requirements
   */
  private getIndustryStyleRequirements(industry: IndustryType): string {
    // Get color palette
    const palette = this.getColorPalette(industry);

    return `STYLING REQUIREMENTS:
- Use this industry-specific color palette: ${JSON.stringify(palette)}
- Apply professional design principles for ${industry} industry
- EVERY node MUST have styling with proper colors and formatting
- Style decision nodes (diamond) and data stores (cylinder) distinctively
- The "nodeStyles" object MUST be keyed by node ID (not class name)`;
  }

  /**
   * Get output format requirements
   */
  private getOutputFormatRequirements(): string {
    return `OUTPUT FORMAT - FOLLOW EXACTLY:
1. Node format:
   "id": "unique-id",
   "type": "genericNode",
   "position": {"x": number, "y": number},
   "data": {"label": "Text", "shape": "shape-name"},
   "width": 150-180,
   "height": 80-120

2. Available shapes: "rectangle", "rounded", "circle", "diamond", "hexagon", "triangle", 
   "actor", "interface", "cylinder", "document", "message-bubble", "capsule"

3. Edge format:
   "id": "edge-id",
   "source": "source-node-id",
   "target": "target-node-id",
   "sourceHandle": "source-handle-id", // REQUIRED
   "targetHandle": "target-handle-id", // REQUIRED
   "type": "smoothstep",
   "animated": true,
   "style": {"stroke": "#color", "strokeWidth": 2}

4. NodeStyles format:
   "nodeStyles": {
     "node-id-1": {  // MUST use node ID, not class name
       "fontFamily": "Inter, Arial, sans-serif",
       "fontSize": 16,
       "textAlign": "center", 
       "backgroundColor": "#color", 
       "borderColor": "#color",
       "textColor": "#color",
       "shape": "shape-name",
       "borderWidth": 2
     }
   }

RESPOND ONLY WITH VALID JSON INCLUDING: nodes array, edges array with handles, and nodeStyles object.`;
  }

  /**
   * Gets industry-specific requirements
   */
  private getIndustryRequirements(industry: IndustryType) {
    // Define specific guidance for each industry with more professional advice
    const industryGuidance = {
      [IndustryType.MARKETING]:
        "Develop a customer-centric visualization that highlights journey touchpoints, conversion funnels, and campaign integration. Apply vibrant, engaging colors that reflect brand energy while maintaining professional clarity.",
      [IndustryType.PROFESSIONAL_SERVICES]:
        "Create a sophisticated representation of client engagement workflows, project delivery methodologies, and quality assurance processes. Utilize refined, trust-building color schemes that convey expertise and reliability.",
      [IndustryType.TRAINING_COACHING]:
        "Design a progressive learning pathway that illustrates knowledge acquisition, skill development, and feedback integration. Implement supportive, motivational styling with colors that encourage growth and achievement.",
      [IndustryType.PRODUCTION]:
        "Establish a comprehensive visualization of manufacturing processes, quality control checkpoints, and supply chain integration. Apply practical, efficiency-focused design elements that emphasize operational excellence.",
      [IndustryType.TECHNOLOGY]:
        "Architect a technical representation of system components, data flows, and integration points. Utilize clean, modern styling with a color palette that balances innovation with enterprise-grade reliability.",
      [IndustryType.EVENT_MANAGEMENT]:
        "Craft an attendee-focused experience map that highlights engagement opportunities, logistical touchpoints, and satisfaction drivers. Implement vibrant, directional styling that guides understanding of event dynamics.",
      [IndustryType.FINANCIAL_SERVICES]:
        "Develop a robust visualization of risk management protocols, compliance frameworks, and transaction security. Apply conservative, trust-building styling that conveys stability, security, and financial expertise.",
      [IndustryType.GENERAL]:
        "Create a versatile representation of cross-functional processes that emphasizes clarity, efficiency, and stakeholder value. Utilize balanced, universally appealing design elements that support broad organizational objectives.",
    };

    // Get color palette
    const palette = this.getColorPalette(industry);

    // Return industry requirements with appropriate palette
    return `- ${industryGuidance[industry]}
- Utilize this industry-optimized color palette: ${JSON.stringify(palette)}
- Apply design principles that align with ${industry} industry best practices and stakeholder expectations`;
  }

  /**
   * Gets diagram type specific requirements
   */
  private getDiagramTypeRequirements(diagramType: DiagramType): string {
    switch (diagramType) {
      case DiagramType.WORKFLOW:
        return `WORKFLOW DIAGRAM REQUIREMENTS:
- Create a comprehensive workflow with MINIMUM 10 nodes
- The workflow should show all steps to achieve the goal of the process
- Include DECISION POINTS with multiple outcomes/paths (diamond shape)
- Include DATA STORES for important information (cylinder shape)
- Include DOCUMENTS where relevant (document shape)
- Show EXCEPTION PATHS and ALTERNATIVE FLOWS for approvals/rejections
- ALL edges MUST have "animated": true and be ARROWS (not just lines)
- CONNECTIONS: For English (LTR) connect right side of source to left side of target
- CONNECTIONS: For Arabic (RTL) connect left side of source to right side of target
- Organize in logical sequence with clear flow direction`;

      case DiagramType.WEBSITE_WIREFRAME:
        return `WEBSITE WIREFRAME REQUIREMENTS:
- Create a PROPER wireframe layout showing the UI elements, NOT a sitemap
- Create large rectangles representing website pages/sections
- Within each large section, include smaller rectangles showing specific UI elements
- Include appropriate content placeholders and labels for each section
- Each page rectangle should contain 4-8 UI elements with proposed content
- Design with proper UI hierarchy, whitespace, and component relationships
- Use "rectangle" shape for containers and sections
- NO connections/edges between elements (this is a wireframe, not a flow)
- Realistic layout with proper sizing and positioning of UI components`;

      case DiagramType.EVENT_VISITOR_EXPERIENCE:
        return `EVENT VISITOR EXPERIENCE REQUIREMENTS:
- Create large rectangles for each area/arena of the event
- Inside each area, place smaller rectangles representing booths
- Maintain proper spacing between booths to create visitor walkways
- Use actor/standing-woman/walking-man shapes to represent visitors
- Show 2-3 typical visitor journeys with ANIMATED paths
- CONNECTION RULE: Connect from the direction of movement (e.g., bottom→top for downward movement)
- All visitor paths must be ANIMATED arrows showing movement direction
- The only connections should be those mapping visitor journeys
- Layout should realistically represent event space and flow`;

      case DiagramType.HIERARCHY:
        return `HIERARCHY REQUIREMENTS:
- Create clear organizational/hierarchical structure with 3-4 levels
- Each node should be a rectangle containing appropriate text/label
- Top level: 1-2 nodes (executives/main concepts)
- Lower levels: expand appropriately based on hierarchy
- CONNECTIONS: Always connect from BOTTOM of parent to TOP of child
- Each higher-level shape should connect to all direct subordinates
- All connections must be ARROWS (not lines)
- Use consistent vertical spacing between levels
- Create a clean, professionally spaced hierarchy`;

      case DiagramType.MINDMAP:
        return `MINDMAP REQUIREMENTS:
- Create a network-like diagram with a central concept and connected ideas
- Use pill/capsule shapes for all concepts
- The CENTRAL node is the only one that can have connections from ANY of its nodes
- ALL OTHER nodes can only connect from their LEFT or RIGHT sides
- All connections must be LINES (not arrows)
- Central node should be larger and clearly distinguished
- 3-5 main branches with 2-4 sub-branches each
- Balanced layout around central node
- Connections represent relationships between ideas/concepts`;

      default:
        return `GENERAL DIAGRAM REQUIREMENTS:
- Create diagram with at least 10 nodes
- Use appropriate shapes for different elements
- Include proper connections between related elements
- Balanced layout with proper spacing
- Clear labels on all elements
- Ensure professional appearance with consistent styling`;
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
  ) {
    console.log("Generating fallback data for prompt:", prompt);

    const title =
      prompt && prompt.length > 3
        ? prompt.slice(0, 30)
        : `Default ${diagramType} Diagram`;

    // Create a timestamp-based unique ID
    const timestamp = Date.now();

    // Industry-specific color palette
    const industryPalettes: Record<string, string[]> = {
      [IndustryType.MARKETING]: [
        "#8A4FFF",
        "#FF6B6B",
        "#4ECDC4",
        "#FFD166",
        "#FF9F1C",
        "#F2F7FF",
      ],
      [IndustryType.PROFESSIONAL_SERVICES]: [
        "#2D3E50",
        "#4B86B4",
        "#ADCBE3",
        "#63ADF2",
        "#E2E8F0",
        "#FAFAFA",
      ],
      [IndustryType.TRAINING_COACHING]: [
        "#2E8B57",
        "#3AAFA9",
        "#5CDB95",
        "#8EE4AF",
        "#EDF5E1",
        "#05386B",
      ],
      [IndustryType.PRODUCTION]: [
        "#5D4037",
        "#8D6E63",
        "#90A4AE",
        "#B0BEC5",
        "#E0E0E0",
        "#ECEFF1",
      ],
      [IndustryType.TECHNOLOGY]: [
        "#0D47A1",
        "#1976D2",
        "#29B6F6",
        "#81D4FA",
        "#E1F5FE",
        "#263238",
      ],
      [IndustryType.EVENT_MANAGEMENT]: [
        "#6A0DAD",
        "#9C27B0",
        "#E040FB",
        "#EA80FC",
        "#F3E5F5",
        "#FFD54F",
      ],
      [IndustryType.FINANCIAL_SERVICES]: [
        "#004D40",
        "#00796B",
        "#4DB6AC",
        "#B2DFDB",
        "#E0F2F1",
        "#FFC107",
      ],
      [IndustryType.GENERAL]: [
        "#455A64",
        "#607D8B",
        "#90A4AE",
        "#CFD8DC",
        "#ECEFF1",
        "#FAFAFA",
      ],
    };

    const palette =
      industryPalettes[industry] || industryPalettes[IndustryType.GENERAL];

    // Base fallback nodes and edges based on diagram type
    let nodes: any[] = [];
    let edges: any[] = [];
    let nodeStyles: Record<string, any> = {};

    switch (diagramType) {
      case DiagramType.WORKFLOW:
        nodes = this.generateWorkflowNodes(title, timestamp);
        break;
      case DiagramType.WEBSITE_WIREFRAME:
        nodes = this.generateWireframeNodes(title, timestamp);
        break;
      case DiagramType.EVENT_VISITOR_EXPERIENCE:
        nodes = this.generateEventExperienceNodes(title, timestamp);
        break;
      case DiagramType.HIERARCHY:
        nodes = this.generateHierarchyNodes(title, timestamp);
        break;
      case DiagramType.MINDMAP:
        nodes = this.generateMindMapNodes(title, timestamp);
        break;
      default:
        nodes = this.generateWorkflowNodes(title, timestamp);
    }

    // Generate edges between nodes
    edges = this.generateEdgesForNodes(nodes, diagramType);

    // Generate node styles
    nodeStyles = this.generateNodeStyles(nodes, industry);

    return {
      nodes,
      edges,
      nodeStyles,
      diagramType,
      industry,
      language,
    };
  }

  /**
   * Generates edges between nodes based on diagram type and relative node positions
   */
  private generateEdgesForNodes(nodes: any[], diagramType: DiagramType) {
    const edges: any[] = [];

    // Skip edge generation for wireframes
    if (diagramType === DiagramType.WEBSITE_WIREFRAME) {
      return edges;
    }

    // For mind maps, connect from center to other nodes
    if (diagramType === DiagramType.MINDMAP && nodes.length > 1) {
      const centerNode = nodes[0];

      for (let i = 1; i < nodes.length; i++) {
        const targetNode = nodes[i];

        // Determine appropriate handles based on relative positions
        let sourceHandle = "g"; // Default right side
        let targetHandle = "d"; // Default left side

        // Check if target is to the left of center
        if (targetNode.position.x < centerNode.position.x) {
          sourceHandle = "h"; // Left side of source
          targetHandle = "c"; // Right side of target
        }

        edges.push({
          id: `edge-${centerNode.id}-${targetNode.id}`,
          source: centerNode.id,
          target: targetNode.id,
          sourceHandle,
          targetHandle,
          type: "smoothstep",
          style: {
            strokeWidth: 2,
          },
        });
      }

      return edges;
    }

    // For hierarchies, connect top to bottom with correct handle positions
    if (diagramType === DiagramType.HIERARCHY) {
      for (let i = 0; i < nodes.length - 1; i++) {
        // For hierarchical diagrams, we need to find parent-child relationships
        // based on vertical positioning
        const sourceNode = nodes[i];

        // Find all children (nodes that are below this node)
        const childNodes = nodes.filter(
          (node) =>
            node.position.y > sourceNode.position.y + sourceNode.height &&
            Math.abs(node.position.x - sourceNode.position.x) < 300 // Within reasonable horizontal distance
        );

        for (const childNode of childNodes) {
          edges.push({
            id: `edge-${sourceNode.id}-${childNode.id}`,
            source: sourceNode.id,
            target: childNode.id,
            sourceHandle: "f", // Bottom of source
            targetHandle: "a", // Top of target
            type: "smoothstep",
            style: {
              strokeWidth: 2,
            },
            markerEnd: {
              type: "arrowclosed",
            },
          });
        }
      }

      // If no edges were created, fall back to sequential connections
      if (edges.length === 0) {
        for (let i = 0; i < nodes.length - 1; i++) {
          const sourceNode = nodes[i];
          const targetNode = nodes[i + 1];

          edges.push({
            id: `edge-${sourceNode.id}-${targetNode.id}`,
            source: sourceNode.id,
            target: targetNode.id,
            sourceHandle: "f", // bottom of source
            targetHandle: "a", // top of target
            type: "smoothstep",
            style: {
              strokeWidth: 2,
            },
            markerEnd: {
              type: "arrowclosed",
            },
          });
        }
      }

      return edges;
    }

    // For workflows and other diagram types, connect based on relative positions
    for (let i = 0; i < nodes.length - 1; i++) {
      const sourceNode = nodes[i];
      const targetNode = nodes[i + 1];

      // Determine the appropriate source and target handles based on relative positions
      let sourceHandle, targetHandle;

      // Horizontal flow (left to right)
      if (
        targetNode.position.x >
        sourceNode.position.x + sourceNode.width / 2
      ) {
        sourceHandle = "g"; // right side of source
        targetHandle = "d"; // left side of target
      }
      // Horizontal flow (right to left)
      else if (
        targetNode.position.x + targetNode.width / 2 <
        sourceNode.position.x
      ) {
        sourceHandle = "h"; // left side of source
        targetHandle = "c"; // right side of target
      }
      // Vertical flow (top to bottom)
      else if (targetNode.position.y > sourceNode.position.y) {
        sourceHandle = "f"; // bottom of source
        targetHandle = "a"; // top of target
      }
      // Vertical flow (bottom to top)
      else {
        sourceHandle = "e"; // top of source
        targetHandle = "b"; // bottom of target
      }

      edges.push({
        id: `edge-${sourceNode.id}-${targetNode.id}`,
        source: sourceNode.id,
        target: targetNode.id,
        sourceHandle,
        targetHandle,
        type: "smoothstep",
        style: {
          strokeWidth: 2,
          edgeType:
            diagramType === DiagramType.WORKFLOW ? "animated" : "default",
          className:
            diagramType === DiagramType.WORKFLOW ? "animated-edge" : "",
        },
        markerEnd: {
          type: "arrowclosed",
        },
      });
    }

    // For workflow diagrams, add additional connections for decision points
    if (diagramType === DiagramType.WORKFLOW && nodes.length > 4) {
      // Find all diamond nodes (decision points)
      const decisionNodes = nodes.filter(
        (node) => node.data.shape === "diamond"
      );

      for (const decisionNode of decisionNodes) {
        // Find a node to connect as alternative path (usually 2-3 nodes ahead)
        const currentIndex = nodes.findIndex(
          (node) => node.id === decisionNode.id
        );
        if (currentIndex >= 0 && currentIndex + 2 < nodes.length) {
          const targetIndex = Math.min(currentIndex + 2, nodes.length - 1);
          const targetNode = nodes[targetIndex];

          // Choose appropriate handles based on relative positions
          let sourceHandle, targetHandle;

          // If target is below decision node
          if (
            targetNode.position.y >
            decisionNode.position.y + decisionNode.height / 2
          ) {
            sourceHandle = "f"; // bottom of decision
            targetHandle = "a"; // top of target
          }
          // If target is to the right
          else if (targetNode.position.x > decisionNode.position.x) {
            sourceHandle = "g"; // right of decision
            targetHandle = "d"; // left of target
          }
          // If target is to the left
          else {
            sourceHandle = "h"; // left of decision
            targetHandle = "c"; // right of target
          }

          // Add the alternative path
          edges.push({
            id: `edge-decision-${decisionNode.id}-${targetNode.id}`,
            source: decisionNode.id,
            target: targetNode.id,
            sourceHandle,
            targetHandle,
            type: "smoothstep",
            style: {
              strokeWidth: 2,
              strokeDasharray: "5,5", // Dashed line for alternative path
              edgeType: "default",
              className: "",
            },
            markerEnd: {
              type: "arrowclosed",
            },
          });
        }
      }
    }

    return edges;
  }

  /**
   * Improves Claude's edge handles to ensure professional diagram appearance
   * This is used when validating the returned canvas data
   */
  private improveEdgeHandles(canvasData: any): any {
    if (
      !canvasData ||
      !canvasData.edges ||
      !Array.isArray(canvasData.edges) ||
      !canvasData.nodes ||
      !Array.isArray(canvasData.nodes)
    ) {
      return canvasData;
    }

    // Skip for website wireframes since they shouldn't have edges
    if (canvasData.diagramType === DiagramType.WEBSITE_WIREFRAME) {
      return canvasData;
    }

    // Get language type for direction-specific handling (default to English/LTR)
    const isRTL = canvasData.language === LanguageType.ARABIC;

    // Build a node lookup map for faster access
    const nodeMap = new Map();
    canvasData.nodes.forEach((node: any) => {
      nodeMap.set(node.id, node);
    });

    // Process each edge
    canvasData.edges = canvasData.edges.map((edge: any) => {
      // If edge already has valid handles defined, keep them
      if (
        edge.sourceHandle &&
        edge.targetHandle &&
        edge.sourceHandle !== edge.targetHandle
      ) {
        return edge;
      }

      // Get source and target nodes
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);

      // Skip if we can't find the nodes
      if (!sourceNode || !targetNode) {
        return edge;
      }

      // Calculate node centers
      const sourceCenter = {
        x: sourceNode.position.x + sourceNode.width / 2,
        y: sourceNode.position.y + sourceNode.height / 2,
      };
      const targetCenter = {
        x: targetNode.position.x + targetNode.width / 2,
        y: targetNode.position.y + targetNode.height / 2,
      };

      // Set default edge properties based on diagram type
      let edgeProps: any = {
        sourceHandle: "",
        targetHandle: "",
        type: "smoothstep",
        animated: false,
        style: edge.style || { stroke: "#4B86B4", strokeWidth: 2 },
      };

      // Apply type-specific edge configurations
      switch (canvasData.diagramType) {
        case DiagramType.WORKFLOW:
          // Workflows always use animated arrows for all connections
          edgeProps.animated = true;
          edgeProps.markerEnd = { type: "arrowclosed" };

          // For LTR (English) connect right→left
          // For RTL (Arabic) connect left→right
          if (isRTL) {
            edgeProps.sourceHandle = "left";
            edgeProps.targetHandle = "right";
          } else {
            edgeProps.sourceHandle = "right";
            edgeProps.targetHandle = "left";
          }
          break;

        case DiagramType.EVENT_VISITOR_EXPERIENCE:
          // Event experience uses animated arrows for visitor journeys
          edgeProps.animated = true;
          edgeProps.markerEnd = { type: "arrowclosed" };

          // Connection based on movement direction
          const dx = targetCenter.x - sourceCenter.x;
          const dy = targetCenter.y - sourceCenter.y;

          if (Math.abs(dy) > Math.abs(dx)) {
            // Vertical movement is predominant
            if (dy > 0) {
              // Moving down
              edgeProps.sourceHandle = "bottom";
              edgeProps.targetHandle = "top";
            } else {
              // Moving up
              edgeProps.sourceHandle = "top";
              edgeProps.targetHandle = "bottom";
            }
          } else {
            // Horizontal movement is predominant
            if (dx > 0) {
              // Moving right
              edgeProps.sourceHandle = "right";
              edgeProps.targetHandle = "left";
            } else {
              // Moving left
              edgeProps.sourceHandle = "left";
              edgeProps.targetHandle = "right";
            }
          }
          break;

        case DiagramType.HIERARCHY:
          // Hierarchies always connect bottom to top with arrows
          edgeProps.sourceHandle = "bottom";
          edgeProps.targetHandle = "top";
          edgeProps.markerEnd = { type: "arrowclosed" };
          break;

        case DiagramType.MINDMAP:
          // Mind maps use lines (not arrows) and connect based on relative position
          // Central node can connect from any handle, others only from left/right

          const isCentralNode = edge.source === canvasData.nodes[0]?.id;

          if (
            Math.abs(targetCenter.x - sourceCenter.x) >
            Math.abs(targetCenter.y - sourceCenter.y)
          ) {
            // Horizontal connection
            if (sourceCenter.x < targetCenter.x) {
              edgeProps.sourceHandle = "right";
              edgeProps.targetHandle = "left";
            } else {
              edgeProps.sourceHandle = "left";
              edgeProps.targetHandle = "right";
            }
          } else if (isCentralNode) {
            // Vertical connection for central node
            if (sourceCenter.y < targetCenter.y) {
              edgeProps.sourceHandle = "bottom";
              edgeProps.targetHandle = "top";
            } else {
              edgeProps.sourceHandle = "top";
              edgeProps.targetHandle = "bottom";
            }
          } else {
            // Force left/right connection for non-central nodes
            if (sourceCenter.x < targetCenter.x) {
              edgeProps.sourceHandle = "right";
              edgeProps.targetHandle = "left";
            } else {
              edgeProps.sourceHandle = "left";
              edgeProps.targetHandle = "right";
            }
          }
          break;

        default:
          // For any other diagram type, use relative positions to determine best connections
          if (
            Math.abs(targetCenter.x - sourceCenter.x) >
            Math.abs(targetCenter.y - sourceCenter.y)
          ) {
            // Horizontal connection
            if (sourceCenter.x < targetCenter.x) {
              edgeProps.sourceHandle = "right";
              edgeProps.targetHandle = "left";
            } else {
              edgeProps.sourceHandle = "left";
              edgeProps.targetHandle = "right";
            }
          } else {
            // Vertical connection
            if (sourceCenter.y < targetCenter.y) {
              edgeProps.sourceHandle = "bottom";
              edgeProps.targetHandle = "top";
            } else {
              edgeProps.sourceHandle = "top";
              edgeProps.targetHandle = "bottom";
            }
          }
          edgeProps.markerEnd = { type: "arrowclosed" };
      }

      // Return enhanced edge with appropriate properties
      return {
        ...edge,
        ...edgeProps,
      };
    });

    return canvasData;
  }

  /**
   * Generates workflow nodes for fallback
   */
  private generateWorkflowNodes(title: string, timestamp: number) {
    // Create a more comprehensive workflow with 15-20 nodes
    return [
      {
        id: `node-${timestamp}-1`,
        type: "genericNode",
        position: { x: 300, y: 100 },
        data: { label: "Start", shape: "rounded" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-2`,
        type: "genericNode",
        position: { x: 550, y: 100 },
        data: { label: "Receive Request", shape: "rectangle" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-3`,
        type: "genericNode",
        position: { x: 800, y: 100 },
        data: { label: "Validate Input", shape: "rectangle" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-4`,
        type: "genericNode",
        position: { x: 1050, y: 100 },
        data: { label: "Input Valid?", shape: "diamond" },
        width: 150,
        height: 100,
      },
      {
        id: `node-${timestamp}-5`,
        type: "genericNode",
        position: { x: 1050, y: 250 },
        data: { label: "Request Correction", shape: "rectangle" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-6`,
        type: "genericNode",
        position: { x: 800, y: 250 },
        data: { label: "Send Notification", shape: "rectangle" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-7`,
        type: "genericNode",
        position: { x: 550, y: 250 },
        data: { label: "Wait for Response", shape: "rectangle" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-8`,
        type: "genericNode",
        position: { x: 300, y: 250 },
        data: { label: "Response Received?", shape: "diamond" },
        width: 150,
        height: 100,
      },
      {
        id: `node-${timestamp}-9`,
        type: "genericNode",
        position: { x: 300, y: 400 },
        data: { label: "Process Data", shape: "rectangle" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-10`,
        type: "genericNode",
        position: { x: 550, y: 400 },
        data: { label: "Retrieve Records", shape: "rectangle" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-11`,
        type: "genericNode",
        position: { x: 800, y: 400 },
        data: { label: "Customer DB", shape: "cylinder" },
        width: 150,
        height: 100,
      },
      {
        id: `node-${timestamp}-12`,
        type: "genericNode",
        position: { x: 1050, y: 400 },
        data: { label: "Records Found?", shape: "diamond" },
        width: 150,
        height: 100,
      },
      {
        id: `node-${timestamp}-13`,
        type: "genericNode",
        position: { x: 1050, y: 550 },
        data: { label: "Create New Record", shape: "rectangle" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-14`,
        type: "genericNode",
        position: { x: 800, y: 550 },
        data: { label: "Update Record", shape: "rectangle" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-15`,
        type: "genericNode",
        position: { x: 550, y: 550 },
        data: { label: "Submit for Approval", shape: "rectangle" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-16`,
        type: "genericNode",
        position: { x: 300, y: 550 },
        data: { label: "Approved?", shape: "diamond" },
        width: 150,
        height: 100,
      },
      {
        id: `node-${timestamp}-17`,
        type: "genericNode",
        position: { x: 300, y: 700 },
        data: { label: "Generate Report", shape: "document" },
        width: 150,
        height: 100,
      },
      {
        id: `node-${timestamp}-18`,
        type: "genericNode",
        position: { x: 550, y: 700 },
        data: { label: "Send Confirmation", shape: "rectangle" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-19`,
        type: "genericNode",
        position: { x: 800, y: 700 },
        data: { label: "Log Activity", shape: "rectangle" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-20`,
        type: "genericNode",
        position: { x: 1050, y: 700 },
        data: { label: "End", shape: "rounded" },
        width: 150,
        height: 80,
      },
    ];
  }

  /**
   * Generates website wireframe nodes for fallback
   */
  private generateWireframeNodes(title: string, timestamp: number) {
    return [
      // Page container
      {
        id: `node-${timestamp}-page`,
        type: "genericNode",
        position: { x: 250, y: 50 },
        data: { label: "", shape: "rectangle" },
        width: 800,
        height: 900,
        style: { backgroundColor: "#FFFFFF", borderColor: "#E2E2E2" },
      },
      // Header
      {
        id: `node-${timestamp}-header`,
        type: "genericNode",
        position: { x: 250, y: 50 },
        data: { label: "Website Header", shape: "rectangle" },
        width: 800,
        height: 80,
      },
      // Logo
      {
        id: `node-${timestamp}-logo`,
        type: "genericNode",
        position: { x: 280, y: 65 },
        data: { label: "Logo", shape: "rectangle" },
        width: 120,
        height: 50,
      },
      // Navigation
      {
        id: `node-${timestamp}-nav`,
        type: "genericNode",
        position: { x: 430, y: 65 },
        data: { label: "Main Navigation", shape: "rectangle" },
        width: 450,
        height: 50,
      },
      // Hero section
      {
        id: `node-${timestamp}-hero`,
        type: "genericNode",
        position: { x: 250, y: 150 },
        data: { label: "Hero Banner / Slider", shape: "rectangle" },
        width: 800,
        height: 200,
      },
      // Main content section
      {
        id: `node-${timestamp}-content`,
        type: "genericNode",
        position: { x: 250, y: 370 },
        data: { label: "Main Content Area", shape: "rectangle" },
        width: 800,
        height: 400,
      },
      // Content left column
      {
        id: `node-${timestamp}-content-left`,
        type: "genericNode",
        position: { x: 270, y: 400 },
        data: { label: "Content Section 1", shape: "rectangle" },
        width: 360,
        height: 150,
      },
      // Content right column
      {
        id: `node-${timestamp}-content-right`,
        type: "genericNode",
        position: { x: 650, y: 400 },
        data: { label: "Content Section 2", shape: "rectangle" },
        width: 380,
        height: 150,
      },
      // Call to action
      {
        id: `node-${timestamp}-cta`,
        type: "genericNode",
        position: { x: 270, y: 570 },
        data: { label: "Call to Action", shape: "rectangle" },
        width: 760,
        height: 100,
      },
      // CTA Button
      {
        id: `node-${timestamp}-cta-button`,
        type: "genericNode",
        position: { x: 550, y: 605 },
        data: { label: "Button", shape: "capsule" },
        width: 200,
        height: 40,
      },
      // Footer
      {
        id: `node-${timestamp}-footer`,
        type: "genericNode",
        position: { x: 250, y: 790 },
        data: { label: "Footer", shape: "rectangle" },
        width: 800,
        height: 150,
      },
      // Footer columns
      {
        id: `node-${timestamp}-footer-1`,
        type: "genericNode",
        position: { x: 280, y: 820 },
        data: { label: "Footer Column 1", shape: "rectangle" },
        width: 180,
        height: 100,
      },
      {
        id: `node-${timestamp}-footer-2`,
        type: "genericNode",
        position: { x: 480, y: 820 },
        data: { label: "Footer Column 2", shape: "rectangle" },
        width: 180,
        height: 100,
      },
      {
        id: `node-${timestamp}-footer-3`,
        type: "genericNode",
        position: { x: 680, y: 820 },
        data: { label: "Footer Column 3", shape: "rectangle" },
        width: 180,
        height: 100,
      },
      // Search box
      {
        id: `node-${timestamp}-search`,
        type: "genericNode",
        position: { x: 750, y: 118 },
        data: { label: "Search", shape: "rectangle" },
        width: 250,
        height: 40,
      },
    ];
  }

  /**
   * Generates event experience nodes for fallback
   */
  private generateEventExperienceNodes(title: string, timestamp: number) {
    return [
      {
        id: `node-${timestamp}-1`,
        type: "genericNode",
        position: { x: 300, y: 100 },
        data: { label: "Main Entrance", shape: "rectangle" },
        width: 150,
        height: 100,
      },
      {
        id: `node-${timestamp}-2`,
        type: "genericNode",
        position: { x: 500, y: 100 },
        data: { label: "Information Desk", shape: "rectangle" },
        width: 150,
        height: 100,
      },
      {
        id: `node-${timestamp}-3`,
        type: "genericNode",
        position: { x: 300, y: 250 },
        data: { label: "Registration", shape: "rectangle" },
        width: 150,
        height: 100,
      },
      {
        id: `node-${timestamp}-4`,
        type: "genericNode",
        position: { x: 300, y: 400 },
        data: { label: "Main Hall", shape: "hexagon" },
        width: 150,
        height: 100,
      },
      {
        id: `node-${timestamp}-5`,
        type: "genericNode",
        position: { x: 500, y: 400 },
        data: { label: "Conference Attendee", shape: "standing-woman" },
        width: 80,
        height: 120,
      },
      {
        id: `node-${timestamp}-6`,
        type: "genericNode",
        position: { x: 500, y: 250 },
        data: { label: "Breakout Room", shape: "rectangle" },
        width: 150,
        height: 100,
      },
      {
        id: `node-${timestamp}-7`,
        type: "genericNode",
        position: { x: 700, y: 250 },
        data: { label: "Breakout Room", shape: "rectangle" },
        width: 150,
        height: 100,
      },
      {
        id: `node-${timestamp}-8`,
        type: "genericNode",
        position: { x: 300, y: 550 },
        data: { label: "Networking", shape: "circle" },
        width: 150,
        height: 100,
      },
      {
        id: `node-${timestamp}-9`,
        type: "genericNode",
        position: { x: 500, y: 550 },
        data: { label: "Networking Attendee", shape: "walking-man" },
        width: 80,
        height: 120,
      },
      {
        id: `node-${timestamp}-10`,
        type: "genericNode",
        position: { x: 700, y: 550 },
        data: { label: "Exhibition Area", shape: "rectangle" },
        width: 150,
        height: 100,
      },
      {
        id: `node-${timestamp}-11`,
        type: "genericNode",
        position: { x: 900, y: 550 },
        data: { label: "Refreshments", shape: "circle" },
        width: 150,
        height: 100,
      },
    ];
  }

  /**
   * Generates hierarchy nodes for fallback
   */
  private generateHierarchyNodes(title: string, timestamp: number) {
    return [
      {
        id: `node-${timestamp}-1`,
        type: "genericNode",
        position: { x: 600, y: 100 },
        data: { label: "CEO", shape: "rectangle" },
        width: 180,
        height: 80,
      },
      {
        id: `node-${timestamp}-2`,
        type: "genericNode",
        position: { x: 400, y: 250 },
        data: { label: "CTO", shape: "rectangle" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-3`,
        type: "genericNode",
        position: { x: 600, y: 250 },
        data: { label: "CFO", shape: "rectangle" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-4`,
        type: "genericNode",
        position: { x: 800, y: 250 },
        data: { label: "COO", shape: "rectangle" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-5`,
        type: "genericNode",
        position: { x: 300, y: 400 },
        data: { label: "Engineering Lead", shape: "rectangle" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-6`,
        type: "genericNode",
        position: { x: 500, y: 400 },
        data: { label: "Product Lead", shape: "rectangle" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-7`,
        type: "genericNode",
        position: { x: 700, y: 400 },
        data: { label: "Finance Manager", shape: "rectangle" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-8`,
        type: "genericNode",
        position: { x: 900, y: 400 },
        data: { label: "Operations Manager", shape: "rectangle" },
        width: 150,
        height: 80,
      },
    ];
  }

  /**
   * Generates mind map nodes for fallback
   */
  private generateMindMapNodes(title: string, timestamp: number) {
    return [
      {
        id: `node-${timestamp}-1`,
        type: "genericNode",
        position: { x: 600, y: 300 },
        data: { label: title || "Central Idea", shape: "capsule" },
        width: 180,
        height: 100,
      },
      {
        id: `node-${timestamp}-2`,
        type: "genericNode",
        position: { x: 400, y: 150 },
        data: { label: "Topic 1", shape: "capsule" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-3`,
        type: "genericNode",
        position: { x: 800, y: 150 },
        data: { label: "Topic 2", shape: "capsule" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-4`,
        type: "genericNode",
        position: { x: 400, y: 450 },
        data: { label: "Topic 3", shape: "capsule" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-5`,
        type: "genericNode",
        position: { x: 800, y: 450 },
        data: { label: "Topic 4", shape: "capsule" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-6`,
        type: "genericNode",
        position: { x: 200, y: 150 },
        data: { label: "Subtopic 1.1", shape: "capsule" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-7`,
        type: "genericNode",
        position: { x: 1000, y: 150 },
        data: { label: "Subtopic 2.1", shape: "capsule" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-8`,
        type: "genericNode",
        position: { x: 200, y: 450 },
        data: { label: "Subtopic 3.1", shape: "capsule" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-9`,
        type: "genericNode",
        position: { x: 1000, y: 450 },
        data: { label: "Subtopic 4.1", shape: "capsule" },
        width: 150,
        height: 80,
      },
    ];
  }

  /**
   * Generates node styles based on industry
   */
  private generateNodeStyles(nodes: any[], industry: IndustryType) {
    const nodeStyles: Record<string, any> = {};

    // Industry-specific color palette
    const industryPalettes: Record<string, string[]> = {
      [IndustryType.MARKETING]: [
        "#8A4FFF",
        "#FF6B6B",
        "#4ECDC4",
        "#FFD166",
        "#FF9F1C",
        "#F2F7FF",
      ],
      [IndustryType.PROFESSIONAL_SERVICES]: [
        "#2D3E50",
        "#4B86B4",
        "#ADCBE3",
        "#63ADF2",
        "#E2E8F0",
        "#FAFAFA",
      ],
      [IndustryType.TRAINING_COACHING]: [
        "#2E8B57",
        "#3AAFA9",
        "#5CDB95",
        "#8EE4AF",
        "#EDF5E1",
        "#05386B",
      ],
      [IndustryType.PRODUCTION]: [
        "#5D4037",
        "#8D6E63",
        "#90A4AE",
        "#B0BEC5",
        "#E0E0E0",
        "#ECEFF1",
      ],
      [IndustryType.TECHNOLOGY]: [
        "#0D47A1",
        "#1976D2",
        "#29B6F6",
        "#81D4FA",
        "#E1F5FE",
        "#263238",
      ],
      [IndustryType.EVENT_MANAGEMENT]: [
        "#6A0DAD",
        "#9C27B0",
        "#E040FB",
        "#EA80FC",
        "#F3E5F5",
        "#FFD54F",
      ],
      [IndustryType.FINANCIAL_SERVICES]: [
        "#004D40",
        "#00796B",
        "#4DB6AC",
        "#B2DFDB",
        "#E0F2F1",
        "#FFC107",
      ],
      [IndustryType.GENERAL]: [
        "#455A64",
        "#607D8B",
        "#90A4AE",
        "#CFD8DC",
        "#ECEFF1",
        "#FAFAFA",
      ],
    };

    const palette =
      industryPalettes[industry] || industryPalettes[IndustryType.GENERAL];

    nodes.forEach((node: any, index: number) => {
      const colorIndex = index % palette.length;

      nodeStyles[node.id] = {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: node.data.label?.length > 20 ? 14 : 16,
        isBold: index === 0, // First node is bold
        isItalic: false,
        isUnderline: false,
        textAlign: "center",
        verticalAlign: "middle",
        shape: node.data.shape,
        locked: false,
        isVertical: true,
        borderStyle: "solid",
        borderWidth: 2,
        backgroundColor: palette[colorIndex],
        borderColor: palette[(colorIndex + 1) % palette.length],
        textColor: this.getTextColorForBackground(palette[colorIndex]),
        lineHeight: 1.3,
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      };
    });

    return nodeStyles;
  }

  /**
   * Combines all prompt components into a complete system prompt
   */
  private createSystemPrompt(
    language: LanguageType,
    diagramType: DiagramType,
    industry: IndustryType
  ): string {
    // Get all prompt components
    const commonRequirements = this.getCommonRequirements(language);
    const diagramTypeRequirements =
      this.getDiagramTypeRequirements(diagramType);
    const connectionHandles = this.getConnectionHandlesRequirements();
    const industryStyles = this.getIndustryStyleRequirements(industry);
    const outputRequirements = this.getOutputFormatRequirements();

    // Combine into a concise and well-formatted prompt
    return [
      "You are an AI assistant specialized in creating mature, professional, high-quality diagram data for a React Flow canvas.",
      "Your task is to generate data for a sophisticated, visually appealing diagram that strictly adheres to professional standards.",
      "",
      "MANDATORY REQUIREMENTS:",
      commonRequirements,
      "",
      diagramTypeRequirements,
      "",
      // Only include connection handles when the diagram type needs edges
      diagramType !== DiagramType.WEBSITE_WIREFRAME ? connectionHandles : "",
      "",
      industryStyles,
      "",
      outputRequirements,
    ]
      .join("\n")
      .replace(/\n\n+/g, "\n\n")
      .trim();
  }
}
