"use client";

import { useMemo } from "react";

/**
 * A zero-network, non-interactive preview of a flow embed, derived purely from
 * the snapshot already stored in the node's attrs (nodes / edges / styles).
 *
 * It paints synchronously as a single <svg> at the embed's reserved size, so an
 * off-screen embed shows its diagram instantly with no blank flash and no layout
 * shift — then the real (heavy) ReactFlow instance mounts in its place once the
 * embed scrolls into view. The shapes/positions/colours match the live canvas,
 * so the swap is barely perceptible.
 */

interface SnapNode {
  id: string;
  position?: { x: number; y: number };
  width?: number;
  height?: number;
  type?: string;
  data?: any;
  style?: any;
}
interface SnapEdge {
  id?: string;
  source: string;
  target: string;
}

/** Pick a readable text colour for a given (possibly dark) fill. */
function textColorFor(fill: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(fill.trim());
  if (!m) return "#1f2937";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  // perceived luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#1f2937" : "#ffffff";
}

export function FlowSnapshotPreview({
  nodes,
  edges,
  styles,
  isRTL,
}: {
  nodes: SnapNode[];
  edges: SnapEdge[];
  styles: Record<string, any>;
  isRTL?: boolean;
}) {
  const model = useMemo(() => {
    const placed = (nodes || []).filter(
      (n) => n.position && typeof n.position.x === "number"
    );
    if (placed.length === 0) return null;

    const boxes = placed.map((n) => {
      const w = n.width || n.data?.width || 120;
      const h = n.height || n.data?.height || 60;
      const fill =
        styles[n.id]?.backgroundColor ||
        n.data?.style?.backgroundColor ||
        n.style?.backgroundColor ||
        "#ffffff";
      const label = String(
        n.data?.label ?? n.data?.text ?? n.data?.title ?? n.data?.value ?? ""
      ).slice(0, 32);
      return {
        id: n.id,
        x: n.position!.x,
        y: n.position!.y,
        w,
        h,
        fill,
        text: textColorFor(fill),
        label,
        shape: String(n.data?.shape ?? n.type ?? "rectangle").toLowerCase(),
      };
    });

    const minX = Math.min(...boxes.map((b) => b.x));
    const minY = Math.min(...boxes.map((b) => b.y));
    const maxX = Math.max(...boxes.map((b) => b.x + b.w));
    const maxY = Math.max(...boxes.map((b) => b.y + b.h));
    const pad = 24;

    const centers: Record<string, { cx: number; cy: number }> = {};
    boxes.forEach((b) => {
      centers[b.id] = { cx: b.x + b.w / 2, cy: b.y + b.h / 2 };
    });
    const lines = (edges || [])
      .filter((e) => centers[e.source] && centers[e.target])
      .map((e) => ({
        x1: centers[e.source].cx,
        y1: centers[e.source].cy,
        x2: centers[e.target].cx,
        y2: centers[e.target].cy,
      }));

    return {
      boxes,
      lines,
      viewBox: `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${
        maxY - minY + pad * 2
      }`,
    };
  }, [nodes, edges, styles]);

  if (!model) {
    // Nothing positioned to draw (empty/fresh embed) — render nothing rather
    // than a spinner; the live canvas will take over once in view.
    return <div style={{ width: "100%", height: "100%" }} aria-hidden />;
  }

  return (
    <svg
      viewBox={model.viewBox}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      style={{ display: "block", direction: isRTL ? "rtl" : "ltr" }}
    >
      {model.lines.map((l, i) => (
        <line
          key={`e${i}`}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke="#c4c8cf"
          strokeWidth={1.5}
        />
      ))}
      {model.boxes.map((b) => {
        const isRound = /capsule|circle|ellipse|pill|round/.test(b.shape);
        const isDiamond = /diamond|decision|rhombus/.test(b.shape);
        return (
          <g key={b.id}>
            {isDiamond ? (
              <polygon
                points={`${b.x + b.w / 2},${b.y} ${b.x + b.w},${b.y + b.h / 2} ${
                  b.x + b.w / 2
                },${b.y + b.h} ${b.x},${b.y + b.h / 2}`}
                fill={b.fill}
                stroke="#9ca3af"
                strokeWidth={1}
              />
            ) : (
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx={isRound ? b.h / 2 : 6}
                fill={b.fill}
                stroke="#9ca3af"
                strokeWidth={1}
              />
            )}
            {b.label && (
              <text
                x={b.x + b.w / 2}
                y={b.y + b.h / 2}
                fontSize={Math.max(8, Math.min(13, b.h / 4))}
                textAnchor="middle"
                dominantBaseline="central"
                fill={b.text}
              >
                {b.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default FlowSnapshotPreview;
