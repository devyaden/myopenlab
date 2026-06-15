import {
  DiagramType,
  IndustryType,
  LanguageType,
} from "@/lib/types/diagram-types";

/**
 * Constructs user message for Claude. The user's free-form prompt is the
 * primary directive — everything else is fallback guidance.
 */
export function constructUserMessage(
  language: LanguageType,
  diagramType: DiagramType,
  industry: IndustryType,
  prompt: string
): string {
  return [
    `USER REQUEST (this is the primary instruction — follow it literally):`,
    `"${prompt}"`,
    ``,
    `Render this as a ${diagramType} diagram in ${language}.`,
    industry !== IndustryType.GENERAL
      ? `Context: ${industry} industry (use only if the user did not specify their own context).`
      : ``,
    ``,
    getDiagramTypeUserGuidance(diagramType),
    ``,
    `Important:`,
    `- Match the scale, content, and tone of the user's request. Do not pad with generic enterprise content if they asked for something simple.`,
    `- If the user named specific steps, entities, or labels, use those exact names. Do not substitute "industry-standard" terminology unless they asked for it.`,
    `- Use the provided generateDiagram tool to return the structured result.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function getDiagramTypeUserGuidance(diagramType: DiagramType): string {
  switch (diagramType) {
    case DiagramType.WORKFLOW:
      return `Workflow: lay nodes out horizontally with ~250px spacing. Use rectangle for processes, diamond for decisions, cylinder for data, document for documents, hexagon for quality gates, rounded for start/end. Pick the node count from the user's request — three steps means three nodes; a complex enterprise process may need 60+. Do not invent extra steps the user did not ask for.`;
    case DiagramType.WEBSITE_WIREFRAME:
      return `Website wireframe: rectangle shapes for all UI containers. NO edges between elements. Match the pages/sections the user asked for; do not add hero/testimonials/pricing sections unless requested.`;
    case DiagramType.EVENT_VISITOR_EXPERIENCE:
      return `Event layout: each distinct area is its own node. Use the actor shape for visitor personas. Match the scale to the request — a small workshop has fewer zones than a trade show. Connect visitor actors to the areas they visit with animated edges.`;
    case DiagramType.HIERARCHY:
      return `Hierarchy: tree-shaped, top-to-bottom. Use the structure the user described. If they did not specify, a 3-5 level corporate org chart is a reasonable default — but do not impose C-suite titles if the user described something different (a school, a sports team, a family tree, etc.).`;
    case DiagramType.MINDMAP:
      return `Mind map: capsule shapes, central node radiating outward. Depth and breadth should match the user's topic — a focused topic may need only 8-15 nodes, a broad strategic theme may need 60+. Do not force generic strategic pillars (Market, Operations, Finance, etc.) unless the user asked for them.`;
    default:
      return `Choose a node count that matches the user's request. Use industry-appropriate shapes.`;
  }
}

/**
 * Creates the system prompt. Keeps the structural / technical rules; relaxes
 * the content rules so the user's prompt is the source of truth.
 */
export function createSystemPrompt(
  language: LanguageType,
  diagramType: DiagramType,
  industry: IndustryType
): string {
  const commonRequirements = getCommonRequirements(language);
  const diagramTypeRequirements = getDiagramTypeRequirements(
    diagramType,
    language
  );
  const connectionHandles = getConnectionHandlesRequirements();
  const industryStyles = getIndustryStyleRequirements(industry);

  return [
    "You are a diagram generator. Your job is to translate the user's request into a structured diagram using the generateDiagram tool.",
    "",
    "PRIORITY ORDER:",
    "1. Follow the user's specific request literally — labels, scale, structure, and tone all come from them.",
    "2. The guidance below is fallback only — apply it where the user did not specify, and override it where they did.",
    "3. Never invent content the user did not ask for to make a diagram look more 'professional' or 'complete'.",
    "",
    "STRUCTURAL REQUIREMENTS:",
    commonRequirements,
    "",
    diagramTypeRequirements,
    "",
    diagramType !== DiagramType.WEBSITE_WIREFRAME ? connectionHandles : "",
    "",
    industryStyles,
    "",
    "DATA SHAPE (enforced by tool schema):",
    "- All nodes use type \"genericNode\".",
    "- Node data must contain ONLY 'label' and 'shape'. Width and height go on the node, not in data.",
    "- Edges must include sourceHandle and targetHandle.",
  ]
    .filter(Boolean)
    .join("\n")
    .replace(/\n\n+/g, "\n\n")
    .trim();
}

/**
 * Common requirements for all diagram types.
 */
function getCommonRequirements(language: LanguageType): string {
  const isRTL = language === LanguageType.ARABIC;

  let languageInstructions = "";
  switch (language) {
    case LanguageType.ENGLISH:
      languageInstructions = "English";
      break;
    case LanguageType.SPANISH:
      languageInstructions = "Spanish (Español), proper grammar";
      break;
    case LanguageType.FRENCH:
      languageInstructions = "French (Français), proper grammar";
      break;
    case LanguageType.GERMAN:
      languageInstructions = "German (Deutsch), proper grammar";
      break;
    case LanguageType.PORTUGUESE:
      languageInstructions = "Portuguese (Português), proper grammar";
      break;
    case LanguageType.JAPANESE:
      languageInstructions = "Japanese (日本語), appropriate honorifics";
      break;
    case LanguageType.CHINESE:
      languageInstructions = "Chinese (中文), simplified characters";
      break;
    case LanguageType.ARABIC:
      languageInstructions = "Arabic (العربية), proper grammar";
      break;
    default:
      languageInstructions = "English";
  }

  return [
    `- LANGUAGE: write all labels in ${languageInstructions}.`,
    `- All nodes MUST use "genericNode" as the type.`,
    `- All nodes MUST have a "data" object with ONLY "label" and "shape" properties.`,
    `- All edges MUST have sourceHandle and targetHandle properties.`,
    isRTL
      ? `- For Arabic workflows, lay nodes out right-to-left natively: place earlier steps at higher x-coordinates and later steps at lower x-coordinates so the flow reads naturally in Arabic.`
      : `- For horizontal flows, lay nodes out left-to-right: earlier steps at lower x-coordinates, later steps at higher x-coordinates.`,
    `- Match the user's tone. Do not impose formal/executive language unless they asked for it.`,
  ].join("\n");
}

/**
 * Connection handle legend.
 */
function getConnectionHandlesRequirements(): string {
  return `CONNECTION HANDLES:
- TARGET HANDLES: "a" (top), "b" (bottom), "c" (right), "d" (left)
- SOURCE HANDLES: "e" (top), "f" (bottom), "g" (right), "h" (left)
- Pick handles that match the actual relative positions of the connected nodes.`;
}

/**
 * Industry styling — color palette only. Tone is the user's call.
 */
function getIndustryStyleRequirements(industry: IndustryType): string {
  const palette = getColorPalette(industry);
  return `STYLING:
- Color palette to draw from: ${JSON.stringify(palette)}.
- "nodeStyles" object keyed by node ID. Visual hierarchy is fine but not required.
- Differentiate decision nodes (diamond) and data repositories (cylinder) with color where it helps clarity.`;
}

/**
 * Diagram-type-specific structural requirements. Content guidance lives in
 * getDiagramTypeUserGuidance() and is presented in the user message instead.
 */
function getDiagramTypeRequirements(
  diagramType: DiagramType,
  _language: LanguageType
): string {
  switch (diagramType) {
    case DiagramType.WORKFLOW:
      return `WORKFLOW STRUCTURE:
- Horizontal layout, ~250px spacing between nodes.
- Shapes: rectangle (process), diamond (decision), cylinder (data), document (document), hexagon (quality gate), rounded (start/end).
- Node dimensions: width=180px, height=90px (use 120x120 for diamonds and cylinders).
- All edges should have "animated": true.
- Match the node count to the user's request. Do not pad.`;

    case DiagramType.WEBSITE_WIREFRAME:
      return `WIREFRAME STRUCTURE:
- All elements use the "rectangle" shape.
- NO edges between elements.
- Build the pages and sections the user asked for. Do not auto-add hero/testimonials/pricing/etc. unless requested.`;

    case DiagramType.EVENT_VISITOR_EXPERIENCE:
      return `EVENT STRUCTURE:
- One node per distinct area.
- Use the "actor" shape for visitor personas.
- Connect visitor actors to areas they visit with animated edges.
- Number repeated areas (Booth 1, 2, 3...) only when the user implies multiples.`;

    case DiagramType.HIERARCHY:
      return `HIERARCHY STRUCTURE:
- Tree-shaped, top-to-bottom.
- Edges connect parent (top, source) to child (bottom, target).
- Use whatever roles/titles the user described. If they did not specify, a 3-5 level corporate org chart is a reasonable default.`;

    case DiagramType.MINDMAP:
      return `MINDMAP STRUCTURE:
- Use capsule shapes.
- Central node in the middle, sub-concepts radiating outward.
- Depth and breadth should match the user's topic — do not force a fixed set of "strategic pillars".`;

    default:
      return `GENERAL STRUCTURE:
- Choose shapes appropriate to the user's content.
- Edges should reflect the relationships described in the prompt.`;
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
  const r = parseInt(backgroundColor.slice(1, 3), 16);
  const g = parseInt(backgroundColor.slice(3, 5), 16);
  const b = parseInt(backgroundColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1F2937" : "#FFFFFF";
}
