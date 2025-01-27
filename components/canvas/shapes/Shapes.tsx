import React from "react";

interface ShapeProps {
  width: number;
  height: number;
}

const ShapeComponents: Record<string, React.FC<ShapeProps>> = {
  circle: ({ width, height }) => (
    <ellipse
      cx={width / 2}
      cy={height / 2}
      rx={(width - 4) / 2}
      ry={(height - 4) / 2}
    />
  ),
  square: ({ width, height }) => (
    <rect x={2} y={2} width={width - 4} height={height - 4} />
  ),
  diamond: ({ width, height }) => {
    const points = [
      `${width / 2},2`,
      `${width - 2},${height / 2}`,
      `${width / 2},${height - 2}`,
      `2,${height / 2}`,
    ].join(" ");
    return <polygon points={points} />;
  },
  cylinder: ({ width, height }) => {
    const ellipseHeight = Math.min(height * 0.15, width * 0.3);
    return (
      <g>
        <path
          d={`
            M2,${ellipseHeight}
            v${height - ellipseHeight * 2 - 2}
            q0,${ellipseHeight} ${width - 4},${ellipseHeight}
            v-${height - ellipseHeight * 2 - 2}
            q0,-${ellipseHeight} -${width - 4},-${ellipseHeight}
            Z
          `}
        />
        <ellipse
          cx={width / 2}
          cy={ellipseHeight}
          rx={(width - 4) / 2}
          ry={ellipseHeight}
        />
      </g>
    );
  },
  triangle: ({ width, height }) => {
    const points = [
      `${width / 2},2`,
      `${width - 2},${height - 2}`,
      `2,${height - 2}`,
    ].join(" ");
    return <polygon points={points} />;
  },
  parallelogram: ({ width, height }) => {
    const skew = width * 0.15;
    const points = [
      `${skew + 2},2`,
      `${width - 2},2`,
      `${width - skew - 2},${height - 2}`,
      `2,${height - 2}`,
    ].join(" ");
    return <polygon points={points} />;
  },
  task: ({ width, height }) => (
    <rect x={2} y={2} width={width - 4} height={height - 4} rx={10} ry={10} />
  ),
};

export default ShapeComponents;
