import {
  DiagramType,
  IndustryType,
  LanguageType,
} from "@/app/api/ai/generate-canvas/route";
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
      // System prompt that defines the task and format
      const systemPrompt = `You are an AI assistant specialized in creating mature, professional, high-quality diagram data for a React Flow canvas.
Your task is to generate a sophisticated, visually appealing diagram that strictly adheres to professional standards.

Here are the details:
- Language: ${language}
- Diagram Type: ${diagramType}
- Industry: ${industry}

MANDATORY REQUIREMENTS:
- All diagrams MUST have complete styling information including colors, fonts, borders, and shadows
- All diagrams MUST include properly configured edges with sourceHandle and targetHandle properties
- All diagrams MUST have a "nodeStyles" object with detailed styling for EACH node
- Never return incomplete or minimal styling - diagrams must be production-ready
- Connections between nodes MUST use the proper handle system as detailed below
- All diagrams must use sophisticated color theory - create depth with gradients, contrasts, and focal points

LANGUAGE REQUIREMENTS:
- Only English and Arabic languages are supported
- The selected language affects both the text content language
- For "workflow" type diagrams, the flow direction is left-to-right (LTR) for English and right-to-left (RTL) for Arabic
- For Arabic diagrams, all text should be in Arabic, including labels and descriptions

DIAGRAM TYPE REQUIREMENTS:

1. WORKFLOW:
   - Create a comprehensive, professional workflow with clear process steps
   - Include at least 7-10 nodes for a sufficiently detailed workflow
   - Organize nodes in a clear, logical sequence with proper spacing
   - Include different cases: approvals, exceptions, conditions, documents, databases
   - Include at least one decision point (diamond shape)
   - Include at least one data store (cylinder shape)
   - Connection type MUST be animated arrows with varying thicknesses based on importance
   - Flow direction: LTR for English, RTL for Arabic
   - Connection nodes: For English - right side node to next shape's left side node, For Arabic - left side node to next shape's right side node
   - Apply a gradient of colors for sequential steps
   - For decision nodes, use bright distinguishing colors
   - For critical path nodes, use bolder styling
   - Add explanatory text nodes for complex sections
   - Use consistent node sizing: key steps should be larger than supporting steps
   - Create visual hierarchy by using size, color intensity, and placement to show process importance
   - Include swimlanes when processes involve multiple departments/stakeholders
   - Add annotations or small text nodes explaining critical decision points
   - Apply consistent visual patterns for similar action types (approvals, reviews, etc.)

2. WEBSITE WIREFRAME:
   - Create a comprehensive site map with 4-8 main pages
   - Each page should be a large rectangle (min 300px width)
   - Inside each page, include 4-8 smaller rectangles for page elements
   - Include specific element types: headers, navigation, content areas, forms, CTAs, footers
   - Add descriptive text for each element explaining its purpose and content
   - Use proper hierarchy: headers at top, navigation in appropriate position, content in middle, footer at bottom
   - No connections between shapes
   - Apply subtle shading differences to distinguish element types
   - Use lighter background colors with darker borders
   - For important elements like CTAs, use standout colors from the palette
   - Apply consistent visual styling to repeated elements across pages
   - Use size hierarchy to demonstrate content importance
   - Include responsive design considerations with nested layouts
   - Apply microinteraction hints through styling of interactive elements
   - Create visual emphasis on primary user journey elements
   - Include proper spacing and alignment across all elements
   - Add appropriate content blocks with realistic placeholder indicators

3. EVENT VISITOR EXPERIENCE:
   - Create a detailed floor plan with 3-5 distinct areas/arenas
   - Each area should be a large rectangle with appropriate spacing
   - Include 4-8 booths/stations per area with clear visitor pathways
   - Represent visitors using actor/standing-woman/walking-man shapes
   - Include 2-3 visitor journey paths showing typical attendee experiences
   - Use animated arrows to show visitor movement
   - Connection node position should match the direction of movement
   - Apply distinct colors for different areas/zones
   - Use consistent booth styling within each area
   - Add text nodes for zone labels, information points, and key attractions
   - Include important facilities: entrances/exits, rest areas, information desks
   - Incorporate crowd flow management elements with directional indicators
   - Show typical visitor congregation points with strategic placement
   - Include time-based elements showing peak traffic zones
   - Create differentiated styling for premium/VIP areas
   - Add queue management visualization for high-traffic features
   - Include accessibility considerations with appropriate paths and facilities
   - Apply detailed styling for important landmark elements

4. HIERARCHY:
   - Create a detailed organizational or structural hierarchy with 3-4 levels
   - Minimum of 10-15 nodes for a comprehensive hierarchy
   - Top level should have 1-2 nodes (e.g., CEO/Executives)
   - Second level should have 3-6 nodes (e.g., Department Heads)
   - Lower levels should expand appropriately to show proper structure
   - Use rectangles with consistent styling within each level
   - First shape connects from bottom node to top node of shapes below
   - Use single connections flowing downward
   - Apply color gradients to distinguish hierarchy levels
   - Make higher-level nodes slightly larger than lower-level nodes
   - Include detailed labels with titles and key responsibilities
   - Connection type is arrow
   - Apply sophisticated styling for executive/leadership nodes
   - Use subtle styling variations to indicate division/department groupings
   - Include dotted-line relationships for matrix reporting structures
   - Add small indicator icons for special roles or responsibilities
   - Apply subtle background zones to group related functions
   - Use consistent spacing to indicate peer relationships
   - Include properly styled annotations explaining complex relationships

5. MIND MAP:
   - Create a comprehensive mind map with 12-20 nodes
   - Use capsule/rounded shapes for a modern, flexible appearance
   - Central idea should be in the middle with multiple branches extending outward
   - Create a balanced layout with nodes distributed evenly around the central node
   - Include at least 3-5 main branches with 2-4 sub-branches each
   - Central shape can connect to multiple nodes from any position
   - Other shapes only connect from left or right nodes
   - Connection type is line (not arrow)
   - Use a color spectrum approach: related concepts use similar colors
   - Central node should be larger than branch nodes
   - Include detailed, meaningful text in each node
   - Apply subtle styling differences to distinguish levels of concepts
   - Create visual clusters with color relationships for thematically linked ideas
   - Apply varying opacity or saturation to indicate concept solidity/maturity
   - Use size variations to demonstrate concept importance or priority
   - Include small visual indicators for actionable vs conceptual items
   - Apply consistent visual language across related branch systems
   - Create smooth, curved connections to enhance organic appearance
   - Include small annotations for complex concept relationships

INDUSTRY-SPECIFIC REQUIREMENTS:
- Marketing: Focus on customer journey, touchpoints, and conversion funnels. Include campaigns, channels, and audience segments with vibrant, engaging colors.
- Professional Services: Focus on client engagement, project delivery, and quality control with sophisticated, trust-building color schemes.
- Training & Coaching: Focus on learning paths, progress tracking, and feedback loops with supportive, motivational styling.
- Production: Focus on manufacturing workflows, quality control, and supply chain with practical, efficiency-focused designs.
- Technology: Focus on system architecture, data flows, and integration points with clean, modern technical styling.
- Event Management: Focus on attendee experiences, logistics, and engagement points with vibrant, directional styling.
- Financial Services: Focus on risk management, compliance, and transaction flows with secure, trust-building conservative styling.
- General: Focus on cross-functional processes with balanced, universally appealing designs.

CONNECTION HANDLES AND LAYOUT: [CRITICALLY IMPORTANT]
- EVERY connection MUST have proper sourceHandle and targetHandle values
- EVERY edge MUST have style information including edgeType and className
- Use the EXACT handle IDs from the GenericNode component:
  * Target handles (incoming connections):
    - Top: "a"
    - Bottom: "b" 
    - Right: "c"
    - Left: "d"
  * Source handles (outgoing connections):
    - Top: "e"
    - Bottom: "f"
    - Right: "g"
    - Left: "h"
- For horizontal connections (left-to-right):
  * Connect from right handle of source ("g") to left handle of target ("d")
- For horizontal connections (right-to-left):
  * Connect from left handle of source ("h") to right handle of target ("c")
- For vertical connections (top-to-bottom):
  * Connect from bottom handle of source ("f") to top handle of target ("a")
- For vertical connections (bottom-to-top):
  * Connect from top handle of source ("e") to bottom handle of target ("b")
- Diagonal connections should be avoided if possible
- For hierarchies and workflows, arrange nodes in a clear grid pattern with proper spacing
- You MUST specify both sourceHandle and targetHandle in EVERY edge
- Apply professional layout principles with clear alignment, consistent spacing, and visual balance

For the React Flow data, you will need to generate nodes and edges that follow our application's format:
- Nodes have properties: id, type, position { x, y }, data { label, shape }, style, width, height
- All position coordinates should be carefully calculated to avoid node overlap
- Use a minimum spacing of 200 pixels between node centers horizontally and 150 pixels vertically
- For complex diagrams, use a grid-like layout with proper alignment and spacing
- Nodes should have width between 150-180px and height between 80-120px depending on content
- Start nodes at (300, 100) and expand from there to ensure visibility

Supported node types and their best use cases:
1. "genericNode" - The main node type that supports various shapes (used for most elements)
2. "text" - For simple text labels, notes, or annotations
3. "swimlaneNode" - For process lanes or categorization in flowcharts/processes

For the "data" property of each node, you MUST include both "label" and "shape":
{
  "label": "Node Label",
  "shape": "diamond"  // This is required and must match one of the available shapes
}

Available shapes (use the exact string values):
"rectangle", "rounded", "circle", "diamond", "hexagon", "triangle", "actor", "interface", 
"standing-woman", "sitting", "arms-stretched", "walking-man", "square", "cylinder", 
"document", "left-arrow", "right-arrow", "top-arrow", "bottom-arrow", "message-bubble", "capsule"

STYLING GUIDELINES [CRITICALLY IMPORTANT]:
- EVERY node MUST have complete styling with backgroundColor, borderColor, etc.
- Use proper padding within nodes (at least 10px)
- Generate a dynamic, cohesive color palette appropriate for the industry:
  * Marketing: ["#8A4FFF", "#FF6B6B", "#4ECDC4", "#FFD166", "#FF9F1C", "#F2F7FF"]
  * Professional Services: ["#2D3E50", "#4B86B4", "#ADCBE3", "#63ADF2", "#E2E8F0", "#FAFAFA"]
  * Training & Coaching: ["#2E8B57", "#3AAFA9", "#5CDB95", "#8EE4AF", "#EDF5E1", "#05386B"]
  * Production: ["#5D4037", "#8D6E63", "#90A4AE", "#B0BEC5", "#E0E0E0", "#ECEFF1"]
  * Technology: ["#0D47A1", "#1976D2", "#29B6F6", "#81D4FA", "#E1F5FE", "#263238"]
  * Event Management: ["#6A0DAD", "#9C27B0", "#E040FB", "#EA80FC", "#F3E5F5", "#FFD54F"]
  * Financial Services: ["#004D40", "#00796B", "#4DB6AC", "#B2DFDB", "#E0F2F1", "#FFC107"]
  * General: ["#455A64", "#607D8B", "#90A4AE", "#CFD8DC", "#ECEFF1", "#FAFAFA"]
- DO NOT use hardcoded colors - select from the appropriate palette for the industry
- Apply color variations consistently:
  * Primary nodes: Use more saturated colors from the palette
  * Secondary nodes: Use lighter tones from the palette
  * Connection/relationship nodes: Use distinctive colors for emphasis
  * Container nodes: Use lighter background with darker borders
- For decision nodes (diamond shapes): Use a distinct color that stands out
- For database nodes (cylinder shapes): Use a color that suggests stability
- Set appropriate fontSize: 16-20px for main nodes, 12-14px for supporting nodes
- Set fontWeight to bold for important nodes or headers
- Apply shadow effects to create depth: boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
- Use verticalAlign property ("top", "middle", "bottom") to control text placement
- Use textAlign property ("left", "center", "right") consistently
- Apply advanced visual design principles including hierarchy, balance, and visual emphasis
- Use color psychology appropriately (red for warnings/stops, green for success/go, etc.)

EDGE STYLING RECOMMENDATIONS [CRITICALLY IMPORTANT]:
- EVERY edge MUST have style properties including strokeWidth, and appropriate className
- For workflow diagrams, all edges MUST have "edgeType": "animated" and animated-edge class
- Use meaningful edge types based on relationship: 
  * "default" for standard connections
  * "straight" for direct relationships
  * "step" for process steps
  * "smoothstep" for natural flows (default for most connections)
- Apply varied edge styles based on relationship type:
  * Primary flow: animated, thicker (strokeWidth: 2-3)
  * Alternative paths: dashed lines (strokeDasharray: "5,5")
  * Optional connections: thinner lines (strokeWidth: 1)
  * Critical paths: bold color with increased width (strokeWidth: 3)
- For flowcharts and workflows, use arrows to indicate direction of flow
- For mind maps, use simple lines without arrows
- Add appropriate labels to edges when the relationship needs explanation
- Use color strength to indicate relationship importance
- Apply consistent styling to similar relationship types

NODESTYLES OBJECT [CRITICALLY IMPORTANT]:
- You MUST include a "nodeStyles" object in the response with styling for EVERY node
- Each node's style must be keyed by the node's id and contain complete styling information
- Example structure:
  "nodeStyles": {
    "node-id-1": {
      "fontFamily": "Inter, Arial, sans-serif",
      "fontSize": 16,
      "isBold": true,
      "isItalic": false,
      "isUnderline": false,
      "textAlign": "center",
      "verticalAlign": "middle",
      "shape": "rectangle",
      "locked": false,
      "isVertical": true,
      "borderStyle": "solid",
      "borderWidth": 2,
      "backgroundColor": "#81D4FA",
      "borderColor": "#1976D2",
      "textColor": "#0D47A1",
      "lineHeight": 1.3,
      "boxShadow": "0 4px 6px rgba(0, 0, 0, 0.1)"
    },
    // Styles for other nodes
  }

IMPORTANT: You must ONLY respond with the valid JSON data structure, and nothing else. Do not include any explanations, introductions, or notes. Just return the JSON structure itself.

CRITICAL: The output MUST include all three required components: nodes array, edges array with complete connection information, and nodeStyles object with complete styling for each node.`;

      // Also update the user message to match the enhanced system prompt
      const userMessage = `Create a ${language} ${diagramType} diagram for the ${industry} industry with these requirements: ${prompt}. 

Create a sophisticated, visually appealing, production-ready diagram with these characteristics:
- Include comprehensive detail with appropriate number of nodes (minimum 10-15 nodes)
- MUST include complete node styling for EVERY node with the nodeStyles object
- MUST use dynamic colors from industry-appropriate palette - NO HARDCODED COLORS
- MUST apply varied styling including font weights, sizes, and appropriate shadows
- MUST include properly styled nodes with consistent theme but visual variety
- MUST create a professional, balanced layout with proper spacing
- MUST include proper connection lines between nodes with correct handles
- MUST apply advanced design principles including hierarchy, balance, and emphasis
- MUST incorporate industry-specific best practices for ${industry}

STRICT REQUIREMENTS BASED ON DIAGRAM TYPE:
- If this is a workflow diagram, use animated arrows for all connections, with diamond shapes for decisions and cylinder shapes for databases.
- If this is a website wireframe, create page layouts with nested elements and no connections.
- If this is an event visitor experience, use actor shapes for visitors and animated arrows for movement paths.
- If this is a hierarchy diagram, create connected rectangles with top-down flow.
- If this is a mind map, use capsule shapes connected by simple lines (not arrows).

CONNECTION REQUIREMENTS - YOU MUST USE THESE EXACT HANDLE IDs FOR ALL CONNECTIONS:
- For horizontal flows (left-to-right): 
  * Connect from right handle of source ("g") to left handle of target ("d")
- For horizontal flows (right-to-left):
  * Connect from left handle of source ("h") to right handle of target ("c")
- For vertical flows (top-to-bottom):
  * Connect from bottom handle of source ("f") to top handle of target ("a")
- For vertical flows (bottom-to-top):
  * Connect from top handle of source ("e") to bottom handle of target ("b")
- EVERY edge MUST have proper style information including strokeWidth, edgeType, and className

Adapt the diagram to match standard practices in the ${industry} industry.
For ${language === LanguageType.ARABIC ? "Arabic, use RTL direction" : "English, use LTR direction"} for workflows.

MANDATORY: Include a complete nodeStyles object with styling for EVERY node. Each style MUST have backgroundColor, borderColor, fontSize, fontWeight, etc.

Return ONLY valid JSON that exactly matches the template structure shown in the system prompt with all three required components: nodes, edges (with proper connections), and nodeStyles.`;

      // Call the Claude API
      const response = await this.client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });

      // Extract JSON from the response
      let canvasData;

      // Get the text content from the response
      if (response.content && response.content.length > 0) {
        const textContent = response.content
          .filter((block) => block.type === "text")
          .map((block) => (block.type === "text" ? block.text : ""))
          .join("\n");

        // Try multiple approaches to extract JSON
        try {
          // First try: Extract from code blocks if present
          const jsonMatch =
            textContent.match(/```json\n([\s\S]*?)\n```/) ||
            textContent.match(/```\n([\s\S]*?)\n```/);

          if (jsonMatch && jsonMatch[1]) {
            // Try parsing the content inside the code block
            try {
              canvasData = JSON.parse(jsonMatch[1]);
            } catch (innerErr) {
              console.error(
                "Failed to parse JSON from code block, trying raw text"
              );
            }
          }

          // If we don't have valid data yet, try parsing the entire text
          if (!canvasData) {
            // Clean the text by removing potential markdown artifacts or explanations
            let cleanText = textContent
              .replace(/```json/g, "")
              .replace(/```/g, "")
              .trim();

            // Look for the starting { and ending } for a complete JSON object
            const jsonStart = cleanText.indexOf("{");
            const jsonEnd = cleanText.lastIndexOf("}");

            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
              cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
            }

            canvasData = JSON.parse(cleanText);
          }
        } catch (err) {
          console.error("JSON extraction failed:", err);
          // Use fallback data generation instead of throwing an error
          canvasData = this.generateFallbackData(diagramType, industry, prompt);
        }
      } else {
        console.error("No content in Claude response");
        // Use fallback data generation
        canvasData = this.generateFallbackData(diagramType, industry, prompt);
      }

      // Validate and ensure we have the required structure
      if (
        !canvasData ||
        !canvasData.nodes ||
        !Array.isArray(canvasData.nodes) ||
        canvasData.nodes.length === 0
      ) {
        console.warn("Invalid or empty diagram data, using fallback");
        canvasData = this.generateFallbackData(diagramType, industry, prompt);
      }

      // Ensure edges exist and are valid
      if (!canvasData.edges || !Array.isArray(canvasData.edges)) {
        canvasData.edges = this.generateEdgesForNodes(
          canvasData.nodes,
          diagramType
        );
      }

      // Ensure nodeStyles exist
      if (
        !canvasData.nodeStyles ||
        Object.keys(canvasData.nodeStyles).length === 0
      ) {
        canvasData.nodeStyles = this.generateNodeStyles(
          canvasData.nodes,
          industry
        );
      }

      return canvasData;
    } catch (error) {
      console.error("Error in Claude service:", error);
      // Always return a valid diagram even if an error occurs
      return this.generateFallbackData(diagramType, industry, prompt);
    }
  }

  /**
   * Generates fallback data when Claude fails to produce valid diagram data
   */
  private generateFallbackData(
    diagramType: DiagramType,
    industry: IndustryType,
    prompt: string
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
    };
  }

  /**
   * Generates edges between nodes based on diagram type
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
        edges.push({
          id: `edge-${centerNode.id}-${targetNode.id}`,
          source: centerNode.id,
          target: targetNode.id,
          sourceHandle: "g",
          targetHandle: "d",
          type: "smoothstep",
          style: {
            strokeWidth: 2,
          },
        });
      }

      return edges;
    }

    // For workflows and hierarchies, connect in sequence
    for (let i = 0; i < nodes.length - 1; i++) {
      const sourceNode = nodes[i];
      const targetNode = nodes[i + 1];

      let sourceHandle = "g"; // right side of source
      let targetHandle = "d"; // left side of target

      // For hierarchies, connect top to bottom
      if (diagramType === DiagramType.HIERARCHY) {
        sourceHandle = "f"; // bottom of source
        targetHandle = "a"; // top of target
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

    return edges;
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
        textColor: "#212121",
        lineHeight: 1.3,
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      };
    });

    return nodeStyles;
  }

  /**
   * Generates workflow nodes for fallback
   */
  private generateWorkflowNodes(title: string, timestamp: number) {
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
        data: { label: "Process", shape: "rectangle" },
        width: 150,
        height: 80,
      },
      {
        id: `node-${timestamp}-3`,
        type: "genericNode",
        position: { x: 800, y: 100 },
        data: { label: "Decision", shape: "diamond" },
        width: 150,
        height: 100,
      },
      {
        id: `node-${timestamp}-4`,
        type: "genericNode",
        position: { x: 1050, y: 100 },
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
      {
        id: `node-${timestamp}-1`,
        type: "genericNode",
        position: { x: 300, y: 100 },
        data: { label: "Header", shape: "rectangle" },
        width: 600,
        height: 80,
      },
      {
        id: `node-${timestamp}-2`,
        type: "genericNode",
        position: { x: 300, y: 200 },
        data: { label: "Navigation", shape: "rectangle" },
        width: 600,
        height: 60,
      },
      {
        id: `node-${timestamp}-3`,
        type: "genericNode",
        position: { x: 300, y: 280 },
        data: { label: "Content Area", shape: "rectangle" },
        width: 600,
        height: 400,
      },
      {
        id: `node-${timestamp}-4`,
        type: "genericNode",
        position: { x: 300, y: 700 },
        data: { label: "Footer", shape: "rectangle" },
        width: 600,
        height: 100,
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
}
