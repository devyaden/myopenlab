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
        "Design a detailed physical event layout with clearly defined areas, booths, and spaces. MOST IMPORTANTLY, create 2-3 complete visitor journeys that show how visitors navigate through the space. Each journey must have properly connected animated paths between entry points, attractions, and exit points. Position visitor actors in a way that clearly shows their journey through the space. Make all connections logically represent movement direction.";
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

  // Include the requirements
  return `${directive}\n\n${typeSpecificGuidance}\n\nIMPORTANT: Generate this diagram as a complete JSON structure using the provided tool. Include all required node information, edge connections with proper handles, and detailed styling for all nodes.`;
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
    "FINAL INSTRUCTIONS:",
    "1. Use the provided tool to return a properly structured diagram with all required properties",
    "2. If you encounter any issues, generate a simpler valid diagram rather than returning an error",
    "3. Always ensure each node has appropriate styling and positioning",
    "4. All connections must use the correct handle IDs for professional appearance",
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
      languageInstructions = "English, clear and concise";
      break;
    case LanguageType.SPANISH:
      languageInstructions =
        "Spanish (Español), use proper grammar and vocabulary";
      break;
    case LanguageType.FRENCH:
      languageInstructions =
        "French (Français), use proper grammar and vocabulary";
      break;
    case LanguageType.GERMAN:
      languageInstructions =
        "German (Deutsch), use proper grammar and vocabulary";
      break;
    case LanguageType.PORTUGUESE:
      languageInstructions =
        "Portuguese (Português), use proper grammar and vocabulary";
      break;
    case LanguageType.JAPANESE:
      languageInstructions =
        "Japanese (日本語), use proper characters and grammar";
      break;
    case LanguageType.CHINESE:
      languageInstructions =
        "Chinese (中文), use simplified characters and proper grammar";
      break;
    case LanguageType.ARABIC:
      languageInstructions =
        "Arabic (العربية), use proper RTL formatting and vocabulary";
      break;
    default:
      languageInstructions = "English, clear and concise";
  }

  return `Create a professional diagram for React Flow that follows these critical requirements:
- LANGUAGE: ${languageInstructions}
- All nodes MUST use "genericNode" as the type
- All nodes MUST have "data.shape" property set to one of the available shapes
- All edges MUST have sourceHandle and targetHandle properties set
- Flow direction: ${isRTL ? "right-to-left (RTL)" : "left-to-right (LTR)"}
- All node labels and text content MUST be in ${language}`;
}

/**
 * Get connection handles requirements
 */
function getConnectionHandlesRequirements(): string {
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
function getIndustryStyleRequirements(industry: IndustryType): string {
  // Get color palette
  const palette = getColorPalette(industry);

  return `STYLING REQUIREMENTS:
- Use this industry-specific color palette: ${JSON.stringify(palette)}
- Apply professional design principles for ${industry} industry
- EVERY node MUST have styling with proper colors and formatting
- Style decision nodes (diamond) and data stores (cylinder) distinctively
- The "nodeStyles" object MUST be keyed by node ID (not class name)`;
}

/**
 * Gets diagram type specific requirements
 */
function getDiagramTypeRequirements(
  diagramType: DiagramType,
  language: LanguageType
): string {
  // Determine if the language is RTL for connection instructions
  const isRTL = language === LanguageType.ARABIC;

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
- CONNECTIONS: ${isRTL ? "For RTL languages, connect left side of source to right side of target" : "For LTR languages, connect right side of source to left side of target"}
- Organize in logical sequence with clear flow direction
- ALL TEXT LABELS must be in the selected language (${language})`;

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
- Realistic layout with proper sizing and positioning of UI components
- ALL UI TEXT AND LABELS should be in the selected language (${language})
- For ${isRTL ? "RTL languages, align text to the right and layout from right to left" : "LTR languages, align text to the left and layout from left to right"}`;

    case DiagramType.EVENT_VISITOR_EXPERIENCE:
      return `EVENT VISITOR EXPERIENCE REQUIREMENTS:
- Create a LOGICAL PHYSICAL LAYOUT of an event space with rectangular areas for main zones
- Include 8-12 distinct areas (entrance, registration, halls, booths, refreshment areas, etc.)
- Place booth rectangles with proper spacing to create visitor walkways
- Use ACTOR shape for visitor personas (2-3 different visitor types)
- Create 2-3 distinct visitor journey paths through the event, each with:
  * Clear starting points (entrance/registration areas) 
  * Sequential movement through 4-6 areas of interest
  * Logical ending points
- Each visitor actor MUST BE CONNECTED to their journey with ANIMATED ARROWS
- CONNECTION RULE: Arrows must indicate DIRECTION OF MOVEMENT:
  * For horizontal movement: connect from left side to right side, or right side to left side
  * For vertical movement: connect from top to bottom, or bottom to top
- ALL visitor paths must be clearly visible, animate in the direction of travel
- Ensure actors are positioned logically along their journey path
- Layout should realistically represent event floor plan with proper spacing and zones
- ALL AREA LABELS AND DESCRIPTIONS must be in the selected language (${language})`;

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
- Create a clean, professionally spaced hierarchy
- ALL NODE LABELS (titles, positions, department names) must be in the selected language (${language})
- Layout direction is always top-down regardless of language`;

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
- Connections represent relationships between ideas/concepts
- ALL CONCEPT TEXT AND LABELS must be in the selected language (${language})
- For ${isRTL ? "RTL languages, prioritize expansion from right to left" : "LTR languages, prioritize expansion from left to right"}`;

    default:
      return `GENERAL DIAGRAM REQUIREMENTS:
- Create diagram with at least 10 nodes
- Use appropriate shapes for different elements
- Include proper connections between related elements
- Balanced layout with proper spacing
- Clear labels on all elements
- Ensure professional appearance with consistent styling
- ALL TEXT must be in the selected language (${language})`;
  }
}

/**
 * Get color palette for an industry
 */
export function getColorPalette(industry: IndustryType): string[] {
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
  return luminance > 0.5 ? "#212121" : "#FFFFFF";
}
