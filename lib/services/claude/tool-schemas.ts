import { DiagramType } from "@/lib/types/diagram-types";

/**
 * Create appropriate tool schema for diagram generation
 */
export function createDiagramToolSchema(diagramType: DiagramType) {
  // Base schema for all diagram types
  const baseSchema = {
    name: "generateDiagram",
    description: `Generates a ${diagramType} diagram based on user requirements`,
    input_schema: {
      type: "object",
      properties: {
        nodes: {
          type: "array",
          description: "Array of nodes in the diagram",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Unique identifier for the node",
              },
              type: {
                type: "string",
                enum: ["genericNode"],
                description: "Must be 'genericNode' for all nodes",
              },
              position: {
                type: "object",
                description: "Position coordinates of the node",
                properties: {
                  x: { type: "number" },
                  y: { type: "number" },
                },
                required: ["x", "y"],
              },
              data: {
                type: "object",
                description: "Node data including label and shape",
                properties: {
                  label: {
                    type: "string",
                    description: "Text label for the node",
                  },
                  shape: {
                    type: "string",
                    enum: [
                      "rectangle",
                      "rounded",
                      "circle",
                      "diamond",
                      "hexagon",
                      "triangle",
                      "actor",
                      "interface",
                      "cylinder",
                      "document",
                      "message-bubble",
                      "capsule",
                    ],
                    description: "Shape of the node",
                  },
                },
                required: ["label", "shape"],
              },
              width: {
                type: "number",
                description: "Width of the node in pixels",
              },
              height: {
                type: "number",
                description: "Height of the node in pixels",
              },
            },
            required: ["id", "type", "position", "data", "width", "height"],
          },
        },
        edges: {
          type: "array",
          description: "Array of connections between nodes",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Unique identifier for the edge",
              },
              source: {
                type: "string",
                description: "ID of the source node",
              },
              target: {
                type: "string",
                description: "ID of the target node",
              },
              sourceHandle: {
                type: "string",
                description:
                  "Handle ID on the source node (g=right, h=left, e=top, f=bottom)",
                enum: ["g", "h", "e", "f"],
              },
              targetHandle: {
                type: "string",
                description:
                  "Handle ID on the target node (c=right, d=left, a=top, b=bottom)",
                enum: ["c", "d", "a", "b"],
              },
              type: {
                type: "string",
                description: "Type of edge connection",
                enum: ["default", "smoothstep", "step", "straight"],
              },
              animated: {
                type: "boolean",
                description: "Whether the edge has animation",
              },
              style: {
                type: "object",
                description: "Edge styling",
                properties: {
                  stroke: { type: "string" },
                  strokeWidth: { type: "number" },
                },
              },
            },
            required: [
              "id",
              "source",
              "target",
              "sourceHandle",
              "targetHandle",
            ],
          },
        },
        nodeStyles: {
          type: "object",
          description: "Styling for nodes, keyed by node ID",
          additionalProperties: {
            type: "object",
            properties: {
              fontFamily: { type: "string" },
              fontSize: { type: "number" },
              isBold: { type: "boolean" },
              isItalic: { type: "boolean" },
              isUnderline: { type: "boolean" },
              textAlign: { type: "string" },
              verticalAlign: { type: "string" },
              shape: { type: "string" },
              locked: { type: "boolean" },
              isVertical: { type: "boolean" },
              borderStyle: { type: "string" },
              borderWidth: { type: "number" },
              backgroundColor: { type: "string" },
              borderColor: { type: "string" },
              textColor: { type: "string" },
              lineHeight: { type: "number" },
              boxShadow: { type: "string" },
            },
          },
        },
      },
      required: ["nodes", "edges", "nodeStyles"],
    },
  };

  // Customize schema based on diagram type
  if (diagramType === DiagramType.WEBSITE_WIREFRAME) {
    // For wireframes, edges are optional
    const wireframeSchema = JSON.parse(JSON.stringify(baseSchema));
    wireframeSchema.input_schema.required = ["nodes", "nodeStyles"];
    return [wireframeSchema];
  }

  return [baseSchema];
}
