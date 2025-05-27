import { CSSProperties, useEffect, useRef } from "react";
import { ReactFlowState, useStore } from "reactflow";

const canvasStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  position: "absolute",
  zIndex: 10,
  pointerEvents: "none",
};

const storeSelector = (state: ReactFlowState) => ({
  width: state.width,
  height: state.height,
  transform: state.transform,
});

export type HelperLinesProps = {
  horizontal?: number;
  vertical?: number;
  horizontalCenter?: number;
  verticalCenter?: number;
};

// a simple component to display the helper lines
// it puts a canvas on top of the React Flow pane and draws the lines using the canvas API
function HelperLinesRenderer({
  horizontal,
  vertical,
  horizontalCenter,
  verticalCenter,
}: HelperLinesProps) {
  const { width, height, transform } = useStore(storeSelector);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!ctx || !canvas) {
      return;
    }

    const dpi = window.devicePixelRatio;
    canvas.width = width * dpi;
    canvas.height = height * dpi;

    ctx.scale(dpi, dpi);
    ctx.clearRect(0, 0, width, height);

    // Draw existing alignment lines (top/bottom alignment)
    ctx.strokeStyle = "#003F91";
    ctx.lineWidth = 1;

    if (typeof vertical === "number") {
      ctx.moveTo(vertical * transform[2] + transform[0], 0);
      ctx.lineTo(vertical * transform[2] + transform[0], height);
      ctx.stroke();
    }

    if (typeof horizontal === "number") {
      ctx.moveTo(0, horizontal * transform[2] + transform[1]);
      ctx.lineTo(width, horizontal * transform[2] + transform[1]);
      ctx.stroke();
    }

    // Draw center alignment lines with a different style to distinguish them
    ctx.strokeStyle = "#FF6B35"; // Different color for center lines
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]); // Dashed line to distinguish from edge alignment

    if (typeof verticalCenter === "number") {
      ctx.beginPath();
      ctx.moveTo(verticalCenter * transform[2] + transform[0], 0);
      ctx.lineTo(verticalCenter * transform[2] + transform[0], height);
      ctx.stroke();
    }

    if (typeof horizontalCenter === "number") {
      ctx.beginPath();
      ctx.moveTo(0, horizontalCenter * transform[2] + transform[1]);
      ctx.lineTo(width, horizontalCenter * transform[2] + transform[1]);
      ctx.stroke();
    }

    // Reset line dash for any future drawings
    ctx.setLineDash([]);
  }, [
    width,
    height,
    transform,
    horizontal,
    vertical,
    horizontalCenter,
    verticalCenter,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="react-flow__canvas"
      style={canvasStyle}
    />
  );
}

export default HelperLinesRenderer;
