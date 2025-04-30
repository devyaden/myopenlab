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
      const systemPrompt = `You are an AI assistant that specializes in creating professional, high-quality diagram data for a React Flow canvas.
Your task is to generate a professional-looking diagram based on the user's requirements.

Here are the details:
- Language: ${language}
- Diagram Type: ${diagramType}
- Industry: ${industry}

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

Styling guidelines:
- Use proper padding within nodes (at least 10px)
- Use a professional, consistent color palette appropriate for the industry
- For organization charts or process flows, use a consistent color per node type
- Set appropriate fontSize: 14-18px for main nodes, 12-14px for supporting nodes
- Use verticalAlign property ("top", "middle", "bottom") to control text placement
- Use textAlign property ("left", "center", "right") consistently

Edge styling recommendations:
- Use meaninful edge types based on relationship: "default", "straight", "step", "smoothstep"
- For flowcharts, use arrows to indicate direction of flow
- For sequence diagrams, use animated edges for active flows
- Add appropriate labels to edges when the relationship needs explanation

IMPORTANT: You must ONLY respond with the valid JSON data structure, and nothing else. Do not include any explanations, introductions, or notes. Just return the JSON structure itself.

Here's a template example for a flowchart. Follow this structure EXACTLY, with your own node content:
{
  "nodes": [
    {
        "id": "swimlane-1746007296093",
        "type": "swimlaneNode",
        "position": {
            "x": 498.3661485132866,
            "y": 452.1274552502338
        },
        "style": {
            "width": 918,
            "height": 380
        },
        "data": {
            "label": "New Swimlane",
            "lanes": [
                {
                    "id": "lane-1746007296093",
                    "label": "Lane 1",
                    "height": 150
                }
            ]
        },
        "width": 918,
        "height": 380,
        "selected": false,
        "positionAbsolute": {
            "x": 495.2556061803725,
            "y": 452.1274552502338
        },
        "dragging": true,
        "resizing": false
    },
    {
        "id": "node-1746007212631",
        "type": "genericNode",
        "position": {
            "x": 346.09036215604596,
            "y": 124.21706612297538
        },
        "data": {
            "label": "New square",
            "shape": "square",
            "from": "node-1746007408045",
            "to": "",
            "id": "",
            "task": "",
            "type": ""
        },
        "connectable": true,
        "width": 100,
        "height": 100,
        "selected": false,
        "positionAbsolute": {
            "x": 350.2199603266128,
            "y": 554.6771974904236
        },
        "dragging": true,
        "parentNode": "swimlane-1746007296093"
    },
    {
        "id": "node-1746007408045",
        "type": "genericNode",
        "position": {
            "x": 498.3661485132866,
            "y": -78.41526355375106
        },
        "data": {
            "label": "New diamond",
            "shape": "diamond",
            "from": "",
            "to": "node-1746007212631",
            "id": "",
            "task": "",
            "type": ""
        },
        "connectable": true,
        "width": 410,
        "height": 391,
        "selected": false,
        "style": {
            "width": 410,
            "height": 391
        },
        "resizing": false,
        "positionAbsolute": {
            "x": 501.9773691604174,
            "y": -78.41526355375106
        },
        "dragging": true
    },
    {
        "id": "node-1746007383143",
        "type": "genericNode",
        "position": {
            "x": 1045.1898446158355,
            "y": 156.85660053259738
        },
        "data": {
            "label": "New hexagon",
            "shape": "hexagon",
            "from": "node-1746007408045",
            "to": "",
            "id": "",
            "task": "",
            "type": ""
        },
        "connectable": true,
        "width": 100,
        "height": 100,
        "selected": false,
        "positionAbsolute": {
            "x": 1045.1898446158355,
            "y": 156.85660053259738
        },
        "dragging": true
    }
],
  "edges": [
    {
        "source": "node-1746007408045",
        "sourceHandle": "g",
        "target": "node-1746007383143",
        "targetHandle": "d",
        "type": "smoothstep",
        "data": {
            "type": "default",
            "label": ""
        },
        "markerEnd": {
            "type": "arrowclosed"
        },
        "id": "reactflow__edge-node-1746007408045g-node-1746007383143d",
        "selected": false,
        "style": {
            "strokeWidth": 2,
            "edgeType": "animated",
            "strokeDasharray": "5,5",
            "className": "animated-edge"
        }
    },
    {
        "source": "node-1746007408045",
        "sourceHandle": "f",
        "target": "node-1746007212631",
        "targetHandle": "d",
        "type": "smoothstep",
        "data": {
            "type": "default",
            "label": ""
        },
        "markerEnd": {
            "type": "arrowclosed"
        },
        "id": "reactflow__edge-node-1746007408045f-node-1746007212631d",
        "selected": false,
        "style": {
            "edgeType": "double",
            "strokeWidth": 3,
            "className": "double-line"
        }
    }
],
  "nodeStyles": {
    "node-1746007212631": {
        "fontFamily": "Arial",
        "fontSize": 12,
        "isBold": false,
        "isItalic": false,
        "isUnderline": false,
        "textAlign": "left",
        "verticalAlign": "middle",
        "shape": "rectangle",
        "locked": false,
        "isVertical": true,
        "borderStyle": "solid",
        "borderWidth": 2,
        "backgroundColor": "#ffffff",
        "borderColor": "#000000",
        "textColor": "#000000",
        "lineHeight": 1.2
    },
    "node-1746007383143": {
        "fontFamily": "Arial",
        "fontSize": 12,
        "isBold": false,
        "isItalic": false,
        "isUnderline": false,
        "textAlign": "left",
        "verticalAlign": "middle",
        "shape": "rectangle",
        "locked": false,
        "isVertical": true,
        "borderStyle": "solid",
        "borderWidth": 2,
        "backgroundColor": "#0066eb",
        "borderColor": "#b60c0c",
        "textColor": "#000000",
        "lineHeight": 1.2
    },
    "node-1746007408045": {
        "fontFamily": "Helvetica",
        "fontSize": 9,
        "isBold": true,
        "isItalic": false,
        "isUnderline": false,
        "textAlign": "right",
        "verticalAlign": "middle",
        "shape": "rectangle",
        "locked": false,
        "isVertical": true,
        "borderStyle": "dashed",
        "borderWidth": 7,
        "backgroundColor": "#ffffff",
        "borderColor": "#000000",
        "textColor": "#d60000",
        "lineHeight": 1.2
    }
}
}

The output must be only valid JSON and nothing else - no markdown code blocks, no explanations, no extra text. Each node should have a unique id and a shape that is one of the supported shapes from ${ALL_SHAPES.join(", ")}.`;

      // User message
      const userMessage = `Create a ${language} ${diagramType} diagram for the ${industry} industry with these requirements: ${prompt}. Return ONLY valid JSON with the correct shape mappings for each node type. In flowcharts, ALWAYS use diamond shape for decision nodes. In architecture diagrams, ALWAYS use cylinder for databases.`;

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
          throw new Error(
            "Failed to extract valid JSON from the response. Please try again with a simpler diagram request."
          );
        }
      } else {
        throw new Error("No content in Claude response");
      }

      // Validate that we have the required structure
      if (
        !canvasData ||
        !canvasData.nodes ||
        !Array.isArray(canvasData.nodes)
      ) {
        throw new Error("Invalid diagram data structure. Missing nodes array.");
      }

      return canvasData;
    } catch (error) {
      console.error("Error in Claude service:", error);
      throw error;
    }
  }
}
