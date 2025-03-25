// Common shape properties interface
export interface ShapeProps {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

// Shape definitions for both sidebar and node rendering
export const SHAPE_DEFINITIONS: any = {
  // Basic Shapes
  rectangle: {
    name: "Rectangle",
    viewBox: "0 0 100 100",
    render: (props: ShapeProps) => (
      <rect x="10" y="10" width="80" height="80" {...props} />
    ),
  },
  square: {
    name: "Square",
    viewBox: "0 0 100 100",
    render: (props: ShapeProps) => (
      <rect x="10" y="10" width="80" height="80" {...props} />
    ),
  },
  rounded: {
    name: "Rounded Rectangle",
    viewBox: "0 0 100 100",
    render: (props: ShapeProps) => (
      <rect x="10" y="10" width="80" height="80" rx="15" ry="15" {...props} />
    ),
  },
  circle: {
    name: "Circle",
    viewBox: "0 0 100 100",
    render: (props: ShapeProps) => <circle cx="50" cy="50" r="45" {...props} />,
  },
  diamond: {
    name: "Diamond",
    viewBox: "0 0 100 100",
    render: (props: ShapeProps) => (
      <polygon points="50,10 90,50 50,90 10,50" {...props} />
    ),
  },
  triangle: {
    name: "Triangle",
    viewBox: "0 0 100 100",
    render: (props: ShapeProps) => (
      <polygon points="50,10 90,90 10,90" {...props} />
    ),
  },
  hexagon: {
    name: "Hexagon",
    viewBox: "0 0 100 100",
    render: (props: ShapeProps) => (
      <polygon points="25,5 75,5 95,50 75,95 25,95 5,50" {...props} />
    ),
  },
  capsule: {
    name: "Pill Shape",
    viewBox: "0 0 100 50",
    render: (props: ShapeProps) => (
      <rect x="0" y="0" width="100" height="50" rx="25" ry="25" {...props} />
    ),
  },

  // Arrows
  "left-arrow": {
    name: "Left Arrow",
    viewBox: "0 0 100 100",
    render: (props: ShapeProps) => (
      <path d="M80,20 L40,20 L40,10 L10,50 L40,90 L40,80 L80,80 Z" {...props} />
    ),
  },
  "right-arrow": {
    name: "Right Arrow",
    viewBox: "0 0 100 100",
    render: (props: ShapeProps) => (
      <path d="M20,20 L60,20 L60,10 L90,50 L60,90 L60,80 L20,80 Z" {...props} />
    ),
  },
  "top-arrow": {
    name: "Top Arrow",
    viewBox: "0 0 100 100",
    render: (props: ShapeProps) => (
      <path d="M20,80 L20,40 L10,40 L50,10 L90,40 L80,40 L80,80 Z" {...props} />
    ),
  },
  "bottom-arrow": {
    name: "Bottom Arrow",
    viewBox: "0 0 100 100",
    render: (props: ShapeProps) => (
      <path d="M20,20 L20,60 L10,60 L50,90 L90,60 L80,60 L80,20 Z" {...props} />
    ),
  },

  // Resources
  document: {
    name: "Document",
    viewBox: "0 0 100 100",
    render: (props: ShapeProps) => (
      <path
        d="M20,10 L70,10 L80,20 L80,90 L20,90 Z M70,10 L70,20 L80,20"
        {...props}
      />
    ),
  },
  cylindar: {
    name: "Cylinder",
    viewBox: "0 0 100 100",
    render: (props: ShapeProps) => (
      <>
        <ellipse cx="50" cy="20" rx="30" ry="10" {...props} />
        <ellipse cx="50" cy="80" rx="30" ry="10" {...props} />
        <line x1="20" y1="20" x2="20" y2="80" {...props} />
        <line x1="80" y1="20" x2="80" y2="80" {...props} />
      </>
    ),
  },
  "message-bubble": {
    name: "Message Bubble",
    viewBox: "0 0 100 100",
    render: (props: ShapeProps) => (
      <path d="M10,10 L90,10 L90,70 L60,70 L50,90 L40,70 L10,70 Z" {...props} />
    ),
  },

  // Human Figures
  actor: {
    name: "Actor",
    viewBox: "-421 153 117 256",
    render: (props: ShapeProps) => (
      <path
        d="M-362.9,157.9c11.3,0,20.5,9.2,20.5,20.5s-9.2,20.5-20.5,20.5s-20.5-9.2-20.5-20.5S-374.2,157.9-362.9,157.9z M-337.1,204.2
        h-51.2c-14.2,0-25.6,11.4-25.6,25.6v62.6c0,4.9,3.9,9,9,9s9-3.9,9-9v-57.5c0-1.4,1.2-2.6,2.6-2.6c1.4,0,2.6,1.2,2.6,2.6v155.2
        c0,7.7,5.7,14,12.8,14s12.8-6.3,12.8-14v-88.5c0-1.4,1.2-2.6,2.6-2.6s2.6,1.2,2.6,2.6v88.5c0,7.7,5.7,14,12.8,14s12.8-6.3,12.8-14
        V234.9c0-1.4,1.2-2.6,2.6-2.6c1.4,0,2.6,1.2,2.6,2.6v57.6c0,4.9,3.9,9,9,9s9-3.9,9-9v-62.7C-311.5,215.6-323.2,204.2-337.1,204.2z"
        {...props}
      />
    ),
  },
  "standing-woman": {
    name: "Standing Woman",
    viewBox: "-63 65 128 128",
    render: (props: ShapeProps) => (
      <>
        <path
          d="M11.3,89.8c7.2,0,12.4,5.9,13.4,9.2l8.8,29c1.8,6.2-6.2,8.8-8.1,2.7l-8-26.6H13l13.3,47.3H13.6v36.9c0,6.3-9.5,6.3-9.5,0
          v-37.2h-4.8v37.1c0,6.4-9.5,6.4-9.5,0v-36.8h-12.7l13.2-47.3h-4.4l-7.9,26.7c-1.9,5.8-9.9,3.4-8.1-2.8l8.8-29
          c0.9-3.3,5.1-9.2,12.4-9.2C-8.9,89.8,11.3,89.8,11.3,89.8z"
          {...props}
        />
        <path
          d="M1.7,87.6C7.4,87.6,12,83,12,77.3C12,71.6,7.4,67,1.7,67C-4,67-8.5,71.6-8.5,77.3C-8.5,83-4,87.6,1.7,87.6"
          {...props}
        />
      </>
    ),
  },
  sitting: {
    name: "Sitting",
    viewBox: "0 0 128 128",
    render: (props: ShapeProps) => (
      <>
        <path
          d="M44.7,46.3c-2.1-13.7,17.6-17.8,20.8-3.9l5.4,26.8l20.1,0c5.8,0,8.9,4.7,8.9,9v36.4c0,8.9-12.6,8.8-12.6-0.2V86.2H61.6
          c-6,0-9.7-4.1-10.6-8.8L44.7,46.3z"
          {...props}
        />
        <path
          d="M54.1,30.3c6.5,0,11.8-5.2,11.9-11.8C66,12,60.7,6.7,54.1,6.7c-6.5,0-11.8,5.2-11.8,11.7C42.3,25,47.5,30.3,54.1,30.3"
          {...props}
        />
        <path
          d="M28.4,60.6c-1.4-7.6,8.6-9.4,10-1.8l4.4,23.9c1,5,4.6,9.2,9.8,10.8c1.6,0.5,3.3,0.5,4.8,0.6l14.5,0.1
          c7.7,0,7.7,10.1-0.1,10.1l-15.2-0.1c-2.3,0-4.7-0.3-7-1c-9-2.7-15.3-10.1-16.9-18.7L28.4,60.6z"
          {...props}
        />
      </>
    ),
  },
  "arms-stretched": {
    name: "Arms Stretched",
    viewBox: "0 0 256 256",
    render: (props: ShapeProps) => (
      <>
        <circle cx="127.7" cy="23.7" r="20.9" {...props} />
        <path
          d="M212.4,5.5c-3.6-3.6-9.3-3.6-12.9,0L170,35l-10.2,10.2c-3.1,3-7.1,4.6-11.1,4.6h-21h0h-21.3c-6.7,0-13.3,2.5-18.4,7.6
          l-50.4,50.4c-3.6,3.6-3.6,9.3,0,12.9c3.6,3.6,9.3,3.6,12.9,0l44.1-44.1c0.5-0.5,1.1-0.8,1.8-0.8c1.4,0,2.6,1.2,2.6,2.6v23.5v44.3
          v93.9c0,7.2,5.8,13,13,13c7.2,0,13-5.8,13-13v-91.3c0-1.4,1.2-2.6,2.6-2.6c1.4,0,2.6,1.2,2.6,2.6v91.3c0,7.2,5.8,13,13,13
          s13-5.8,13-13v-93.9h0V74.4l26.5-26.5l29.5-29.5C215.9,14.9,215.9,9.1,212.4,5.5z"
          {...props}
        />
      </>
    ),
  },
  "walking-man": {
    name: "Walking Man",
    viewBox: "-191 65 256 256",
    render: (props: ShapeProps) => (
      <path
        d="M-55.5,110.5c11.1,0.8,21.1-7.4,22.1-19c0.8-11.1-7.4-21.1-19-22.1c-11.1-0.8-21.1,7.4-22.1,19
        C-75.2,99.7-66.6,109.7-55.5,110.5 M-72.9,118.9c3.9-2.9,8.8-4.5,14.3-4.3c6.8,0.6,12.9,4.9,16.2,10l20.5,40.8l27.9,19.5
        c2.3,2,3.9,4.9,3.7,8c-0.2,5.1-4.9,8.8-10,8.2c-1.4,0-2.9-0.6-4.3-1.4l-30.1-20.5c-0.8-0.8-1.8-1.8-2.3-2.9l-7.8-15.2l-9.2,40.6
        l36.3,43c0.8,1.4,1.4,2.9,1.8,4.3l9.8,51.8c0,1.2,0,2,0,2.9c-0.6,7.8-7.2,13.1-14.9,12.9c-6.3-0.6-10.9-5.1-12.5-10.9l-9.2-48.3
        l-29.5-32.8l-6.8,31.5c-0.2,1.4-2.3,4.5-2.9,5.7l-28.1,47.9c-2.9,4.3-7.4,7.2-12.9,6.6c-7.8-0.6-13.5-7.2-12.9-14.9
        c0.2-2.3,1.2-4.3,2-6.1l26.4-44l21.9-97.1l-14.3,11.5l-7.8,34.6c-0.8,4.3-5.1,8-9.8,7.8c-5.1-0.2-8.8-4.9-8.6-10
        c0-0.2,0-0.8,0.2-1.2l8.8-40.3c0.6-1.8,1.4-3.1,2.9-4.3L-72.9,118.9z"
        {...props}
      />
    ),
  },
};

// List of human figure shapes
export const HUMAN_FIGURE_SHAPES = [
  "actor",
  "standing-woman",
  "sitting",
  "arms-stretched",
  "walking-man",
];

// Helper function to check if a shape is a human figure
export const isHumanFigure = (shape: string): boolean => {
  return HUMAN_FIGURE_SHAPES.includes(shape);
};

// Render a shape for the sidebar preview
export const renderShapePreview = (shape: string, size = 24) => {
  const svgStyle = {
    width: size,
    height: size,
    display: "inline-block",
  };

  if (SHAPE_DEFINITIONS[shape]) {
    return (
      <svg
        style={svgStyle}
        viewBox={SHAPE_DEFINITIONS[shape].viewBox}
        xmlns="http://www.w3.org/2000/svg"
      >
        {SHAPE_DEFINITIONS[shape].render({
          fill: isHumanFigure(shape) ? "none" : "white",
          stroke: "#000000",
          strokeWidth: isHumanFigure(shape) ? 1 : 2, // Thicker stroke for non-human shapes
        })}
      </svg>
    );
  }

  // Fallback for shapes not defined
  return <div className="w-6 h-6 border border-gray-400"></div>;
};

// Render a line for the sidebar preview
export const renderLinePreview = (type: string, size = 24) => {
  const svgStyle = {
    width: size,
    height: size,
    display: "inline-block",
  };

  switch (type) {
    case "solid-line":
      return (
        <svg
          style={svgStyle}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="2" y1="12" x2="22" y2="12" stroke="#000" strokeWidth="2" />
        </svg>
      );
    case "dashed-line":
      return (
        <svg
          style={svgStyle}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="2"
            y1="12"
            x2="22"
            y2="12"
            stroke="#000"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
        </svg>
      );
    case "dotted-line":
      return (
        <svg
          style={svgStyle}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="2"
            y1="12"
            x2="22"
            y2="12"
            stroke="#000"
            strokeWidth="2"
            strokeDasharray="1 2"
          />
        </svg>
      );
    default:
      return <div className="w-6 h-6 border border-gray-400"></div>;
  }
};
