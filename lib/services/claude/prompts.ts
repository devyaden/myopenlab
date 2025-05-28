import {
  DiagramType,
  IndustryType,
  LanguageType,
} from "@/lib/types/diagram-types";

/**
 * Constructs user message for Claude
 */
export function constructUserMessage(
  language: LanguageType,
  diagramType: DiagramType,
  industry: IndustryType,
  prompt: string
): string {
  // Create a directive that clearly emphasizes what we want
  const directive = `Create a professional, enterprise-grade ${language} ${diagramType} diagram for the ${industry} industry: "${prompt}"`;

  // Add diagram-specific guidance based on type
  let typeSpecificGuidance = "";
  switch (diagramType) {
    case DiagramType.WORKFLOW:
      typeSpecificGuidance =
        "Design a comprehensive business workflow with 12-16 professionally labeled nodes positioned horizontally with 250px spacing. Use strategic decision points (diamond), data repositories (cylinder), documents (document), quality gates (hexagon), and processes (rectangle). Create a clean, professional layout with proper visual hierarchy and meaningful business terminology. Include decision branches and exception handling paths.";
      break;
    case DiagramType.WEBSITE_WIREFRAME:
      typeSpecificGuidance =
        "Create a sophisticated, modern website wireframe layout with professional UI/UX principles. Design realistic component hierarchies, proper information architecture, and contemporary web design patterns. Include navigation systems, content zones, interactive elements, and responsive design considerations. Focus on user experience and conversion optimization.";
      break;
    case DiagramType.EVENT_VISITOR_EXPERIENCE:
      typeSpecificGuidance =
        "Design a comprehensive event venue layout with professional space planning and visitor journey optimization. Create multiple detailed visitor personas with distinct, well-planned journey paths through strategically positioned areas. Include registration flows, networking zones, presentation spaces, exhibition areas, catering facilities, and clear wayfinding. Ensure journeys reflect real-world event management best practices.";
      break;
    case DiagramType.HIERARCHY:
      typeSpecificGuidance =
        "Create a sophisticated organizational structure with 4-5 hierarchical levels reflecting modern corporate governance. Include C-suite positions, department heads, team leads, and specialized roles. Use proper business titles and organizational relationships that reflect industry standards and corporate best practices.";
      break;
    case DiagramType.MINDMAP:
      typeSpecificGuidance =
        "Develop a strategic concept map with 4-6 primary business domains and 3-4 detailed sub-concepts per domain. Focus on strategic relationships, business dependencies, and conceptual frameworks that demonstrate deep industry knowledge and professional insight.";
      break;
    default:
      typeSpecificGuidance =
        "Create a comprehensive professional diagram with 12-15 well-connected elements showcasing industry expertise and business acumen.";
  }

  // Include the requirements
  return `${directive}\n\n${typeSpecificGuidance}\n\nCRITICAL REQUIREMENTS:\n- Generate enterprise-quality, professional-grade content\n- Use industry-standard terminology and best practices\n- Ensure all labels are business-appropriate and sophisticated\n- Create realistic, implementable solutions\n- Focus on practical business value and professional utility\n\nGenerate this as a complete JSON structure using the provided tool with all required properties.`;
}

/**
 * Creates a comprehensive system prompt for Claude
 */
export function createSystemPrompt(
  language: LanguageType,
  diagramType: DiagramType,
  industry: IndustryType
): string {
  // Get all prompt components
  const commonRequirements = getCommonRequirements(language);
  const diagramTypeRequirements = getDiagramTypeRequirements(
    diagramType,
    language
  );
  const connectionHandles = getConnectionHandlesRequirements();
  const industryStyles = getIndustryStyleRequirements(industry);

  // Combine into a professional and comprehensive prompt
  return [
    "You are a senior business analyst and professional diagram architect with expertise in creating enterprise-grade visual documentation for Fortune 500 companies.",
    "Your task is to generate sophisticated, business-quality diagram data that meets professional standards and demonstrates deep industry knowledge.",
    "",
    "PROFESSIONAL STANDARDS:",
    commonRequirements,
    "",
    diagramTypeRequirements,
    "",
    // Only include connection handles when the diagram type needs edges
    diagramType !== DiagramType.WEBSITE_WIREFRAME ? connectionHandles : "",
    "",
    industryStyles,
    "",
    "CRITICAL QUALITY REQUIREMENTS:",
    "1. Use the provided tool to return a professionally structured diagram with precise, business-appropriate content",
    "2. All node labels must use sophisticated, industry-standard terminology",
    "3. Demonstrate deep understanding of business processes and industry best practices",
    "4. Create realistic, implementable solutions that add genuine business value",
    "5. Ensure all content reflects enterprise-level thinking and strategic insight",
    "6. Node data objects must contain ONLY 'label' and 'shape' properties - no additional properties",
    "7. Width and height should be set at the node level, not within the data object",
  ]
    .join("\n")
    .replace(/\n\n+/g, "\n\n")
    .trim();
}

/**
 * Get common requirements for all diagram types
 */
function getCommonRequirements(language: LanguageType): string {
  // Determine text direction based on language
  const isRTL = language === LanguageType.ARABIC;

  // Generate language-specific instructions
  let languageInstructions = "";
  switch (language) {
    case LanguageType.ENGLISH:
      languageInstructions = "English with professional business terminology";
      break;
    case LanguageType.SPANISH:
      languageInstructions =
        "Spanish (Español) using formal business language and proper grammar";
      break;
    case LanguageType.FRENCH:
      languageInstructions =
        "French (Français) with sophisticated business vocabulary and proper grammar";
      break;
    case LanguageType.GERMAN:
      languageInstructions =
        "German (Deutsch) using formal business language and proper grammar";
      break;
    case LanguageType.PORTUGUESE:
      languageInstructions =
        "Portuguese (Português) with professional business terminology and proper grammar";
      break;
    case LanguageType.JAPANESE:
      languageInstructions =
        "Japanese (日本語) using appropriate business honorifics and formal language";
      break;
    case LanguageType.CHINESE:
      languageInstructions =
        "Chinese (中文) with formal business language using simplified characters";
      break;
    case LanguageType.ARABIC:
      languageInstructions =
        "Arabic (العربية) using formal business terminology with proper RTL formatting";
      break;
    default:
      languageInstructions = "English with professional business terminology";
  }

  return `Create an enterprise-grade professional diagram with these critical requirements:
- LANGUAGE: ${languageInstructions}
- All nodes MUST use "genericNode" as the type
- All nodes MUST have "data" object with ONLY "label" and "shape" properties (no additional properties)
- All edges MUST have sourceHandle and targetHandle properties set
- Flow direction: ${isRTL ? "right-to-left (RTL)" : "left-to-right (LTR)"}
- All content MUST be in ${language} using professional, business-appropriate language
- Demonstrate deep industry expertise and strategic thinking
- Use sophisticated terminology that reflects executive-level understanding`;
}

/**
 * Get connection handles requirements
 */
function getConnectionHandlesRequirements(): string {
  return `CONNECTION HANDLES - MANDATORY:
- Every edge MUST have both sourceHandle and targetHandle values from this list:
  * TARGET HANDLES: "a" (top), "b" (bottom), "c" (right), "d" (left)
  * SOURCE HANDLES: "e" (top), "f" (bottom), "g" (right), "h" (left)
- For horizontal flow (L→R): source="g", target="d"
- For horizontal flow (R→L): source="h", target="c"
- For vertical flow (T→B): source="f", target="a"
- For vertical flow (B→T): source="e", target="b"
- Ensure logical flow direction that reflects real business processes`;
}

/**
 * Get industry-specific styling requirements
 */
function getIndustryStyleRequirements(industry: IndustryType): string {
  // Get color palette
  const palette = getColorPalette(industry);

  return `PROFESSIONAL STYLING REQUIREMENTS:
- Use this sophisticated ${industry} industry color palette: ${JSON.stringify(palette)}
- Apply premium design principles that reflect corporate standards
- EVERY node MUST have professional styling with strategic color usage
- Style decision nodes (diamond) and data repositories (cylinder) with business-appropriate differentiation
- The "nodeStyles" object MUST be keyed by node ID with executive-quality aesthetics
- Ensure visual hierarchy reflects business importance and strategic relationships`;
}

/**
 * Gets diagram type specific requirements with professional focus
 */
function getDiagramTypeRequirements(
  diagramType: DiagramType,
  language: LanguageType
): string {
  // Determine if the language is RTL for connection instructions
  const isRTL = language === LanguageType.ARABIC;

  switch (diagramType) {
    case DiagramType.WORKFLOW:
      return `ENTERPRISE WORKFLOW REQUIREMENTS:
- Create a comprehensive business process with 12-16 strategically important nodes
- Use horizontal layout with consistent 250px spacing between nodes for professional appearance
- Include executive-level decision points with multiple strategic outcomes (diamond shape)
- Incorporate data repositories and knowledge management systems (cylinder shape)
- Add compliance checkpoints, approval workflows, and governance processes (document shape)
- Show exception handling, escalation paths, and risk management procedures
- ALL edges MUST have "animated": true with professional arrow styling
- Node dimensions: width=180px, height=90px (120px for diamonds and cylinders)
- CONNECTIONS: ${isRTL ? "For RTL languages, connect left side of source to right side of target" : "For LTR languages, connect right side of source to left side of target"}
- Organize in logical business sequence with clear strategic flow
- Position nodes in a single row with decision branches below main flow
- ALL LABELS must use sophisticated ${language} business terminology that executives would recognize
- Focus on measurable business outcomes and strategic value creation
- Use professional color coding: Start/End (rounded), Processes (rectangle), Decisions (diamond), Data (cylinder), Documents (document), Quality Gates (hexagon)`;

    case DiagramType.WEBSITE_WIREFRAME:
      return `PROFESSIONAL WEBSITE WIREFRAME REQUIREMENTS:
- Create a sophisticated, modern web application interface design
- Design enterprise-grade user experience with conversion optimization focus
- Include advanced navigation systems, search functionality, and user account management
- Incorporate modern UI patterns: hero sections, call-to-action areas, testimonials, feature showcases
- Add professional elements: pricing tables, contact forms, resource libraries, dashboard interfaces
- Use "rectangle" shape for all UI containers and components
- NO connections/edges between elements (this is a wireframe layout)
- Implement responsive design principles with mobile-first thinking
- ALL UI LABELS must be in sophisticated ${language} using professional web terminology
- For ${isRTL ? "RTL languages, align content right-to-left with proper localization" : "LTR languages, use left-to-right alignment with professional typography"}
- Focus on business goals: lead generation, user engagement, and conversion optimization`;

    case DiagramType.EVENT_VISITOR_EXPERIENCE:
      return `PROFESSIONAL EVENT MANAGEMENT REQUIREMENTS:
- Design a comprehensive conference/exhibition venue with 10-12 strategically planned zones
- Include executive areas: VIP lounges, speaker green rooms, media centers, sponsor pavilions
- Create professional spaces: registration/check-in, main auditorium, breakout rooms, exhibition halls
- Add business networking areas: cocktail zones, business lounges, one-on-one meeting spaces
- Use ACTOR shape for different attendee personas (3-4 professional visitor types)
- Design 3-4 distinct visitor journey paths with strategic touchpoints:
  * C-Suite Executive path (VIP experiences, strategic sessions)
  * Technical Professional path (product demos, technical workshops)  
  * Business Development path (networking events, partnership opportunities)
  * Industry Analyst path (briefing centers, research sessions)
- Each visitor journey MUST show STRATEGIC MOVEMENT with ANIMATED ARROWS
- CONNECTION STRATEGY: Arrows indicate purposeful business interactions and value-driven movement
- Layout should reflect professional event management and corporate hospitality standards
- ALL LABELS must use sophisticated ${language} event management terminology
- Focus on business objectives: relationship building, knowledge transfer, and strategic partnerships`;

    case DiagramType.HIERARCHY:
      return `CORPORATE ORGANIZATIONAL REQUIREMENTS:
- Create a sophisticated corporate structure with 4-5 executive levels
- Top tier: C-Suite positions (CEO, COO, CTO, CFO, CMO, CHRO)
- Second tier: Senior Vice Presidents and Division Heads
- Third tier: Vice Presidents and Department Directors  
- Fourth tier: Senior Managers and Practice Leaders
- Fifth tier: Team Leads and Principal Contributors
- CONNECTIONS: Always connect from executive level downward using proper corporate reporting lines
- Use proper business titles that reflect modern corporate governance
- Include cross-functional relationships and matrix reporting where appropriate
- ALL TITLES must be in professional ${language} using standard corporate terminology
- Layout should reflect organizational power structure and strategic decision-making flow
- Focus on executive accountability, strategic oversight, and operational excellence`;

    case DiagramType.MINDMAP:
      return `STRATEGIC BUSINESS CONCEPT MAP REQUIREMENTS:
- Create a comprehensive business strategy framework with central strategic theme
- Use pill/capsule shapes for all strategic concepts and business domains
- Central concept: Primary business objective or strategic initiative
- 4-6 primary strategic pillars with 3-4 tactical elements each:
  * Market Strategy & Competitive Positioning
  * Operational Excellence & Process Innovation
  * Financial Performance & Value Creation
  * Technology Innovation & Digital Transformation
  * Human Capital & Organizational Development
  * Customer Experience & Market Expansion
- ALL connections represent strategic relationships and business dependencies
- Use sophisticated ${language} strategic planning and business development terminology
- For ${isRTL ? "RTL languages, expand strategically from right to left" : "LTR languages, expand strategically from left to right"}
- Focus on executive-level strategic thinking and business transformation initiatives`;

    default:
      return `PROFESSIONAL BUSINESS DIAGRAM REQUIREMENTS:
- Create sophisticated business documentation with 12-15 strategic elements
- Use industry-appropriate shapes and professional visual hierarchy
- Include strategic relationships and business value connections
- Maintain executive-quality presentation standards
- Ensure all content demonstrates deep industry expertise
- ALL TEXT must be in professional ${language} business terminology
- Focus on measurable business outcomes and strategic value creation`;
  }
}

/**
 * Get color palette for an industry
 */
export function getColorPalette(industry: IndustryType): string[] {
  const industryPalettes: Record<string, string[]> = {
    [IndustryType.MARKETING]: [
      "#4F46E5", // Professional indigo
      "#7C3AED", // Premium purple
      "#0891B2", // Corporate cyan
      "#059669", // Success green
      "#DC2626", // Strategic red
      "#EA580C", // Professional orange
    ],
    [IndustryType.PROFESSIONAL_SERVICES]: [
      "#1E40AF", // Executive blue
      "#1F2937", // Professional dark
      "#059669", // Success green
      "#DC2626", // Important red
      "#7C3AED", // Premium purple
      "#0891B2", // Corporate cyan
    ],
    [IndustryType.TRAINING_COACHING]: [
      "#059669", // Growth green
      "#0891B2", // Knowledge blue
      "#7C3AED", // Insight purple
      "#DC2626", // Action red
      "#EA580C", // Energy orange
      "#1E40AF", // Learning blue
    ],
    [IndustryType.PRODUCTION]: [
      "#1F2937", // Industrial dark
      "#374151", // Equipment gray
      "#059669", // Success green
      "#DC2626", // Alert red
      "#EA580C", // Warning orange
      "#0891B2", // Process blue
    ],
    [IndustryType.TECHNOLOGY]: [
      "#1E40AF", // Tech blue
      "#7C3AED", // Innovation purple
      "#059669", // Success green
      "#DC2626", // Critical red
      "#EA580C", // Alert orange
      "#0891B2", // Digital cyan
    ],
    [IndustryType.EVENT_MANAGEMENT]: [
      "#7C3AED", // Premium purple
      "#1E40AF", // Event blue
      "#DC2626", // Important red
      "#059669", // Success green
      "#EA580C", // Energy orange
      "#0891B2", // Professional cyan
    ],
    [IndustryType.FINANCIAL_SERVICES]: [
      "#1E40AF", // Financial blue
      "#1F2937", // Banking dark
      "#059669", // Growth green
      "#DC2626", // Risk red
      "#EA580C", // Opportunity orange
      "#7C3AED", // Premium purple
    ],
    [IndustryType.GENERAL]: [
      "#1E40AF", // Professional blue
      "#1F2937", // Business dark
      "#059669", // Success green
      "#DC2626", // Important red
      "#7C3AED", // Premium purple
      "#EA580C", // Professional orange
    ],
  };

  return industryPalettes[industry] || industryPalettes[IndustryType.GENERAL];
}

/**
 * Get appropriate text color based on background color
 */
export function getTextColorForBackground(backgroundColor: string): string {
  // Convert hex to RGB
  const r = parseInt(backgroundColor.slice(1, 3), 16);
  const g = parseInt(backgroundColor.slice(3, 5), 16);
  const b = parseInt(backgroundColor.slice(5, 7), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark backgrounds, dark gray for light backgrounds
  return luminance > 0.5 ? "#1F2937" : "#FFFFFF";
}
