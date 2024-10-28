interface ShapeProps {
  width: number;
  height: number;
}

const ShapeComponents: Record<string, React.FC<ShapeProps>> = {
  circle: ({ width, height }) => (
    <ellipse
      cx={width / 2}
      cy={height / 2}
      rx={width / 2.2}
      ry={height / 2.2}
    />
  ),
  square: ({ width, height }) => {
    const padding = Math.min(width, height) * 0.1;
    return (
      <rect
        x={padding}
        y={padding}
        width={width - padding * 2}
        height={height - padding * 2}
      />
    );
  },
  diamond: ({ width, height }) => {
    const points = [
      `${width / 2},${height * 0.1}`,
      `${width * 0.9},${height / 2}`,
      `${width / 2},${height * 0.9}`,
      `${width * 0.1},${height / 2}`,
    ].join(" ");
    return <polygon points={points} />;
  },
  cylinder: ({ width, height }) => {
    const padding = Math.min(width, height) * 0.1;
    const w = width - padding * 2;
    const h = height - padding * 2;
    const x = padding;
    const y = padding;
    const ellipseHeight = Math.min(h * 0.15, w * 0.3);

    return (
      <g>
        <path
          d={`
            M${x},${y + ellipseHeight}
            v${h - ellipseHeight * 2}
            q0,${ellipseHeight} ${w},${ellipseHeight}
            v-${h - ellipseHeight * 2}
            q0,-${ellipseHeight} -${w},-${ellipseHeight}
            Z
          `}
        />
        <ellipse
          cx={x + w / 2}
          cy={y + ellipseHeight}
          rx={w / 2}
          ry={ellipseHeight}
        />
      </g>
    );
  },
  triangle: ({ width, height }) => {
    const points = [
      `${width / 2},${height * 0.1}`,
      `${width * 0.9},${height * 0.9}`,
      `${width * 0.1},${height * 0.9}`,
    ].join(" ");
    return <polygon points={points} />;
  },
  parallelogram: ({ width, height }) => {
    const skew = width * 0.15;
    const points = [
      `${skew},${height * 0.1}`,
      `${width - 0},${height * 0.1}`,
      `${width - skew},${height * 0.9}`,
      `${0},${height * 0.9}`,
    ].join(" ");
    return <polygon points={points} />;
  },
  task: ({ width, height }) => {
    const padding = Math.min(width, height) * 0.1;
    return (
      <rect
        x={padding}
        y={padding}
        width={width - padding * 2}
        height={height - padding * 2}
        rx={10}
        ry={10}
      />
    );
  },
};

export default ShapeComponents;
