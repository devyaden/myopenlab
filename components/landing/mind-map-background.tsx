"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  radius: number;
  color: string;
  label: string;
  icon?: string;
  connections: number[];
  isMain?: boolean;
  isSmall?: boolean;
  textBelow?: string;
}

export default function MindMapBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas to full width/height
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 0.8; // 80% of viewport height
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // Create nodes with fixed positions as in the image
    const nodes: Node[] = [];

    // Central node
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const mainNodeRadius = 70;
    const mainNodeColor = "#304693"; // Dark blue
    const subtopicRadius = 55;
    const subtopicColor = "#4A90E2"; // Light blue
    const smallNodeRadius = 20;
    const smallNodeColor = "#72B6EF"; // Light blue for small nodes

    // Main center node
    nodes.push({
      x: centerX,
      y: centerY,
      radius: mainNodeRadius,
      color: mainNodeColor,
      label: "MIND\nMAP",
      connections: [],
      isMain: true,
    });

    // Define positions relative to center (angle and distance)
    const topics = [
      {
        angle: -Math.PI / 2 - Math.PI / 5,
        label: "Placeholder",
        icon: "network",
      },
      { angle: -Math.PI / 6, label: "Placeholder", icon: "settings" },
      { angle: Math.PI / 4, label: "Placeholder", icon: "door" },
      { angle: Math.PI - Math.PI / 6, label: "Placeholder", icon: "flowchart" },
      { angle: Math.PI + Math.PI / 3, label: "Placeholder", icon: "megaphone" },
    ];

    // Distance from center to main nodes
    const distance = Math.min(canvas.width, canvas.height) * 0.28;

    // Add main topic nodes
    topics.forEach((topic, i) => {
      const x = centerX + Math.cos(topic.angle) * distance;
      const y = centerY + Math.sin(topic.angle) * distance;

      // Add main topic node
      nodes.push({
        x,
        y,
        radius: subtopicRadius,
        color: subtopicColor,
        label: topic.label,
        icon: topic.icon,
        connections: [0], // Connect to center
        textBelow:
          i === 0 || i === 4
            ? "This is a sample text.\nInsert your desired\ntext here."
            : undefined,
      });

      // Add small nodes where needed
      if (i === 0 || i === 2 || i === 4) {
        // Add small node between this node and center
        const smallDistance = distance * 0.6;
        const smallX = centerX + Math.cos(topic.angle) * smallDistance;
        const smallY = centerY + Math.sin(topic.angle) * smallDistance;

        nodes.push({
          x: smallX,
          y: smallY,
          radius: smallNodeRadius,
          color: smallNodeColor,
          label: "",
          connections: [0], // Connect to center
          isSmall: true,
        });
      }
    });

    // Add small nodes on right and bottom
    nodes.push({
      x: centerX + distance * 0.65,
      y: centerY + distance * 0.3,
      radius: smallNodeRadius,
      color: mainNodeColor,
      label: "",
      connections: [0],
      isSmall: true,
    });

    nodes.push({
      x: centerX + distance * 0.3,
      y: centerY + distance * 0.65,
      radius: smallNodeRadius,
      color: smallNodeColor,
      label: "",
      connections: [0],
      isSmall: true,
    });

    // Draw function
    const draw = () => {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw connections first (lines)
      ctx.lineWidth = 2;
      nodes.forEach((node, index) => {
        if (index === 0) return; // Skip center node connections (handled by others)

        node.connections.forEach((connIndex) => {
          const connectedNode = nodes[connIndex];
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(connectedNode.x, connectedNode.y);
          ctx.strokeStyle = "#E5E5E5"; // Light gray line
          ctx.stroke();
        });
      });

      // Draw subtle concentric circles around main node
      ctx.beginPath();
      ctx.arc(centerX, centerY, mainNodeRadius + 15, 0, Math.PI * 2);
      ctx.strokeStyle = "#E5E5E5";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, mainNodeRadius + 30, 0, Math.PI * 2);
      ctx.strokeStyle = "#F5F5F5";
      ctx.stroke();

      // Draw nodes
      nodes.forEach((node) => {
        // Draw perfect circles
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Draw labels
        if (node.label) {
          if (node.isMain) {
            // White text for main node
            ctx.font = "bold 20px Arial";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // Split label into lines
            const lines = node.label.split("\n");
            lines.forEach((line, i) => {
              const yOffset = (i - (lines.length - 1) / 2) * 24;
              ctx.fillText(line, node.x, node.y + yOffset);
            });
          } else {
            // Text for other nodes
            ctx.font = "bold 16px Arial";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(node.label, node.x, node.y);
          }
        }

        // Draw icons (simplified representation)
        if (node.icon) {
          ctx.fillStyle = "white";
          // Draw icon placeholder based on type
          switch (node.icon) {
            case "network":
              drawNetworkIcon(ctx, node.x, node.y - 10, 30);
              break;
            case "settings":
              drawGearIcon(ctx, node.x, node.y - 5, 30);
              break;
            case "door":
              drawDoorIcon(ctx, node.x, node.y - 5, 30);
              break;
            case "flowchart":
              drawFlowchartIcon(ctx, node.x, node.y - 5, 30);
              break;
            case "megaphone":
              drawMegaphoneIcon(ctx, node.x, node.y - 5, 30);
              break;
          }
        }

        // Draw text below nodes
        if (node.textBelow) {
          ctx.font = "12px Arial";
          ctx.fillStyle = "black";
          ctx.textAlign = "center";

          // Split text into lines
          const lines = node.textBelow.split("\n");
          lines.forEach((line, i) => {
            ctx.fillText(line, node.x, node.y + node.radius + 20 + i * 18);
          });
        }
      });

      // Request next frame with slow animation
      animationRef.current = requestAnimationFrame(draw);
    };

    // Simple icon drawing functions
    function drawNetworkIcon(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number
    ) {
      const s = size / 2;
      // Draw network nodes and connections
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x - s / 2, y - s / 2, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x + s / 2, y - s / 2, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x - s / 2, y + s / 2, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x + s / 2, y + s / 2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Connect lines
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - s / 2, y - s / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + s / 2, y - s / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - s / 2, y + s / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + s / 2, y + s / 2);
      ctx.stroke();
    }

    function drawGearIcon(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number
    ) {
      // Draw two gears
      ctx.beginPath();
      ctx.arc(x - 8, y, 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x + 8, y, 10, 0, Math.PI * 2);
      ctx.stroke();

      // Add gear teeth
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        ctx.beginPath();
        ctx.moveTo(x - 8 + Math.cos(angle) * 10, y + Math.sin(angle) * 10);
        ctx.lineTo(x - 8 + Math.cos(angle) * 14, y + Math.sin(angle) * 14);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + 8 + Math.cos(angle) * 10, y + Math.sin(angle) * 10);
        ctx.lineTo(x + 8 + Math.cos(angle) * 14, y + Math.sin(angle) * 14);
        ctx.stroke();
      }
    }

    function drawDoorIcon(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number
    ) {
      // Draw door frame
      const width = size * 0.8;
      const height = size;

      ctx.beginPath();
      ctx.rect(x - width / 2, y - height / 2, width, height);
      ctx.stroke();

      // Draw door handle
      ctx.beginPath();
      ctx.arc(x + width / 4, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawFlowchartIcon(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number
    ) {
      const s = size / 3;

      // Draw flowchart boxes and connections
      ctx.beginPath();
      ctx.rect(x - s, y - s, s * 2, s);
      ctx.stroke();

      ctx.beginPath();
      ctx.rect(x - s, y, s * 2, s);
      ctx.stroke();

      // Draw arrows
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + s);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, y + s / 2);
      ctx.lineTo(x - s / 2, y + s / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, y + s / 2);
      ctx.lineTo(x + s / 2, y + s / 2);
      ctx.stroke();
    }

    function drawMegaphoneIcon(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number
    ) {
      // Draw megaphone
      ctx.beginPath();
      ctx.moveTo(x - size / 2, y);
      ctx.lineTo(x, y - size / 3);
      ctx.lineTo(x + size / 2, y - size / 3);
      ctx.lineTo(x + size / 2, y + size / 3);
      ctx.lineTo(x, y + size / 3);
      ctx.lineTo(x - size / 2, y);
      ctx.stroke();

      // Draw sound waves
      ctx.beginPath();
      ctx.arc(x + size / 2 + 5, y, 5, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x + size / 2 + 10, y, 10, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
    }

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full z-0"
      style={{ pointerEvents: "none" }}
    />
  );
}
