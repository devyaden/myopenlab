"use client";

import { useEffect, useRef, useState } from "react";

export default function DottedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Set canvas to full width/height and ensure pixel clarity
    const handleResize = () => {
      // Get the display pixel ratio for crisp rendering
      const dpr = window.devicePixelRatio || 1;

      // Set the canvas dimensions accounting for device pixel ratio
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * 0.8 * dpr;

      // Scale the canvas back down with CSS
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight * 0.8}px`;

      // Scale the context to ensure correct drawing
      ctx.scale(dpr, dpr);

      // Prevent anti-aliasing for crisp dots
      ctx.imageSmoothingEnabled = false;

      initDots(); // Reinitialize dots when resizing
    };

    // Colors
    const primaryColor = "#09BC8A";
    const backgroundColor = "#000A1F";
    const foregroundColor = "#F3F3F3";

    // Create static dots pattern
    const dots: { x: number; y: number; color: string }[] = [];

    function initDots() {
      dots.length = 0; // Clear existing dots

      // Perfect square grid with uniform spacing
      const spacing = 30; // Space between dots (both horizontally and vertically)

      // Calculate the number of dots needed horizontally and vertically
      // Add 2 to ensure we cover the entire screen with the parallax effect
      const numDotsX = Math.ceil(window.innerWidth / spacing) + 2;
      const numDotsY = Math.ceil((window.innerHeight * 0.8) / spacing) + 2;

      // Offset to center the grid
      const offsetX = (window.innerWidth - (numDotsX - 1) * spacing) / 2;
      const offsetY = (window.innerHeight * 0.8 - (numDotsY - 1) * spacing) / 2;

      // Create a perfect square grid
      for (let i = 0; i < numDotsX; i++) {
        for (let j = 0; j < numDotsY; j++) {
          // Calculate positions with offset to center the grid
          const x = Math.round(i * spacing + offsetX);
          const y = Math.round(j * spacing + offsetY);

          // Determine color - mostly foreground color with some accent colors
          let color;
          const colorRand = Math.random();
          if (colorRand < 0.92) {
            color = foregroundColor;
          } else if (colorRand < 0.98) {
            color = primaryColor;
          } else {
            color = backgroundColor;
          }

          dots.push({ x, y, color });
        }
      }
    }

    function drawDots() {
      if (!ctx || !canvas) return;

      // Clear canvas with background color
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight * 0.8);

      // Calculate parallax effect based on mouse position
      const parallaxStrength = 5; // How much the dots move
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const offsetX =
        ((mousePosition.x - centerX) / centerX) * parallaxStrength;
      const offsetY =
        ((mousePosition.y - centerY) / centerY) * parallaxStrength;

      // Draw each dot as a small square for crisp edges
      const dotSize = 1; // 1px dot size for a clean, crisp look

      dots.forEach((dot) => {
        ctx.fillStyle = dot.color;

        // Use fillRect for perfectly square dots without anti-aliasing
        // Round positions to align with pixel grid
        const x = Math.round(dot.x + offsetX);
        const y = Math.round(dot.y + offsetY);

        ctx.fillRect(x, y, dotSize, dotSize);
      });
    }

    // Handle mouse movement for parallax
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    // Initialize and set up event listeners
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    // Initial setup
    handleResize();

    // Set up animation frame to update on mouse move
    let animationFrameId: number;

    const animate = () => {
      drawDots();
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mousePosition]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full z-0"
      style={{ pointerEvents: "none" }}
    />
  );
}
