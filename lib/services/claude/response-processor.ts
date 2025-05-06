import {
  DiagramType,
  IndustryType,
  LanguageType,
} from "@/lib/types/diagram-types";
import { CanvasData } from "./types";

/**
 * Process and validate Claude API tool response
 */
export function processClaudeToolResponse(
  response: any,
  diagramType: DiagramType,
  industry: IndustryType,
  language: LanguageType = LanguageType.ENGLISH,
  generateFallbackData: (
    diagramType: DiagramType,
    industry: IndustryType,
    prompt: string,
    language: LanguageType
  ) => any
): CanvasData {
  try {
    // Extract tool calls from the response
    const toolCalls = response.content.filter(
      (item: any) => item.type === "tool_use"
    );

    if (toolCalls.length === 0) {
      console.error("No tool calls found in Claude response");
      return generateFallbackData(
        diagramType,
        industry,
        "No valid diagram data in response",
        language
      );
    }

    // Get the diagram data from the tool call
    const diagramData = toolCalls[0];
    // const diagramData = toolCall.tool_calls.find(
    //   (call: any) => call.name === "generateDiagram"
    // );

    if (!diagramData || !diagramData.input) {
      console.error("No diagram data found in tool call");
      return generateFallbackData(
        diagramType,
        industry,
        "No valid diagram data in tool call",
        language
      );
    }

    // The diagram data is already parsed as an object in input
    const canvasData = diagramData.input;

    // Store diagram metadata in the canvas data for validation and rendering
    canvasData.diagramType = diagramType;
    canvasData.language = language;
    canvasData.industry = industry;

    if (isCanvasDataMinimallyValid(canvasData)) {
      // Improve edge handles if needed
      const improvedData = improveEdgeHandles(canvasData);
      return improvedData;
    } else {
      console.error("Generated canvas data failed validation");
      return generateFallbackData(
        diagramType,
        industry,
        "Invalid diagram structure",
        language
      );
    }
  } catch (error) {
    console.error("Error processing Claude tool response:", error);
    return generateFallbackData(
      diagramType,
      industry,
      "Error processing response",
      language
    );
  }
}

/**
 * Check if canvas data has minimal valid structure (just enough to render)
 */
export function isCanvasDataMinimallyValid(canvasData: any): boolean {
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

    // Special validation for EVENT_VISITOR_EXPERIENCE diagrams
    if (canvasData.diagramType === DiagramType.EVENT_VISITOR_EXPERIENCE) {
      // Find visitor/actor nodes
      const actorNodes = canvasData.nodes.filter(
        (node: any) =>
          node.data.shape === "actor" ||
          (node.data.label &&
            node.data.label.toLowerCase().includes("attendee")) ||
          (node.data.label && node.data.label.toLowerCase().includes("visitor"))
      );

      // If we have actor nodes, ensure they have connections
      if (actorNodes.length > 0) {
        // Check if each actor has at least one connection
        actorNodes.forEach((actor: any) => {
          const hasConnection = canvasData.edges.some(
            (edge: any) => edge.source === actor.id || edge.target === actor.id
          );

          if (!hasConnection) {
            // Create at least one connection from this actor to some area
            const possibleTargets = canvasData.nodes.filter(
              (node: any) =>
                node.id !== actor.id &&
                node.data.shape !== "actor" &&
                !node.data.label.toLowerCase().includes("visitor") &&
                !node.data.label.toLowerCase().includes("attendee")
            );

            if (possibleTargets.length > 0) {
              // Find closest area node
              let closestNode = possibleTargets[0];
              let closestDistance = Number.MAX_VALUE;

              for (const target of possibleTargets) {
                const distance = Math.sqrt(
                  Math.pow(target.position.x - actor.position.x, 2) +
                    Math.pow(target.position.y - actor.position.y, 2)
                );

                if (distance < closestDistance) {
                  closestDistance = distance;
                  closestNode = target;
                }
              }

              // Generate a unique edge ID to avoid duplicates
              let edgeId = `edge-auto-${actor.id}-${closestNode.id}`;
              let suffix = 0;

              // Check if this edge ID already exists and make it unique if needed
              while (canvasData.edges.some((edge: any) => edge.id === edgeId)) {
                suffix++;
                edgeId = `edge-auto-${actor.id}-${closestNode.id}-${suffix}`;
              }

              // Add edge from actor to the closest area
              canvasData.edges.push({
                id: edgeId,
                source: actor.id,
                target: closestNode.id,
                animated: true,
                type: "smoothstep",
                style: {
                  strokeWidth: 2,
                  stroke: "#3B82F6",
                  opacity: 0.8,
                },
                markerEnd: { type: "arrowclosed" },
                sourceHandle: "g", // Default to right handle for actors
                targetHandle: "d", // Default to left handle for targets
              });
            }
          }
        });
      }
    }

    return true;
  } catch (error) {
    console.error("Error validating canvas data:", error);
    return false;
  }
}

/**
 * Improves Claude's edge handles to ensure professional diagram appearance
 * This is used when validating the returned canvas data
 */
export function improveEdgeHandles(canvasData: any): any {
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
          edgeProps.sourceHandle = "h"; // left
          edgeProps.targetHandle = "c"; // right
        } else {
          edgeProps.sourceHandle = "g"; // right
          edgeProps.targetHandle = "d"; // left
        }
        break;

      case DiagramType.EVENT_VISITOR_EXPERIENCE:
        // Event experience uses animated arrows for visitor journeys
        edgeProps.animated = true;
        edgeProps.markerEnd = { type: "arrowclosed" };

        // Check if this is a visitor -> location edge (visitor paths)
        const isVisitorEdge =
          sourceNode.data?.shape === "actor" ||
          sourceNode.id.includes("visitor") ||
          targetNode.data?.shape === "actor" ||
          targetNode.id.includes("visitor");

        // Make visitor edges more visually distinct
        if (isVisitorEdge) {
          // Use a unique style for visitor path edges
          edgeProps.style = {
            stroke: "#3B82F6",
            strokeWidth: 2.5,
            opacity: 0.8,
          };
        }

        // Connection based on movement direction
        const dx = targetCenter.x - sourceCenter.x;
        const dy = targetCenter.y - sourceCenter.y;

        if (Math.abs(dy) > Math.abs(dx)) {
          // Vertical movement is predominant
          if (dy > 0) {
            // Moving down
            edgeProps.sourceHandle = "f"; // bottom
            edgeProps.targetHandle = "a"; // top
          } else {
            // Moving up
            edgeProps.sourceHandle = "e"; // top
            edgeProps.targetHandle = "b"; // bottom
          }
        } else {
          // Horizontal movement is predominant
          if (dx > 0) {
            // Moving right
            edgeProps.sourceHandle = "g"; // right
            edgeProps.targetHandle = "d"; // left
          } else {
            // Moving left
            edgeProps.sourceHandle = "h"; // left
            edgeProps.targetHandle = "c"; // right
          }
        }
        break;

      case DiagramType.HIERARCHY:
        // Hierarchies always connect bottom to top with arrows
        edgeProps.sourceHandle = "f"; // bottom
        edgeProps.targetHandle = "a"; // top
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
            edgeProps.sourceHandle = "g"; // right
            edgeProps.targetHandle = "d"; // left
          } else {
            edgeProps.sourceHandle = "h"; // left
            edgeProps.targetHandle = "c"; // right
          }
        } else if (isCentralNode) {
          // Vertical connection for central node
          if (sourceCenter.y < targetCenter.y) {
            edgeProps.sourceHandle = "f"; // bottom
            edgeProps.targetHandle = "a"; // top
          } else {
            edgeProps.sourceHandle = "e"; // top
            edgeProps.targetHandle = "b"; // bottom
          }
        } else {
          // Force left/right connection for non-central nodes
          if (sourceCenter.x < targetCenter.x) {
            edgeProps.sourceHandle = "g"; // right
            edgeProps.targetHandle = "d"; // left
          } else {
            edgeProps.sourceHandle = "h"; // left
            edgeProps.targetHandle = "c"; // right
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
            edgeProps.sourceHandle = "g"; // right
            edgeProps.targetHandle = "d"; // left
          } else {
            edgeProps.sourceHandle = "h"; // left
            edgeProps.targetHandle = "c"; // right
          }
        } else {
          // Vertical connection
          if (sourceCenter.y < targetCenter.y) {
            edgeProps.sourceHandle = "f"; // bottom
            edgeProps.targetHandle = "a"; // top
          } else {
            edgeProps.sourceHandle = "e"; // top
            edgeProps.targetHandle = "b"; // bottom
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
