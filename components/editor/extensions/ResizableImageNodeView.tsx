import React, { useCallback, useEffect, useRef, useState } from "react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";

const ResizableImageNodeView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  editor,
  selected,
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [width, setWidth] = useState<number | undefined>(node.attrs.width);
  const [height, setHeight] = useState<number | undefined>(node.attrs.height);

  const startResizing = useCallback(
    (e: React.MouseEvent, direction: string) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);

      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = imageRef.current?.width || 0;
      const startHeight = imageRef.current?.height || 0;

      const onMouseMove = (e: MouseEvent) => {
        if (!imageRef.current) return;

        let newWidth = startWidth;
        let newHeight = startHeight;

        // Calculate new dimensions based on the resize direction
        if (direction.includes("e") || direction.includes("w")) {
          const diffX = direction.includes("e")
            ? e.clientX - startX
            : startX - e.clientX;
          newWidth = startWidth + diffX;
          newHeight = newWidth / aspectRatio; // Maintain aspect ratio
        } else if (direction.includes("s") || direction.includes("n")) {
          const diffY = direction.includes("s")
            ? e.clientY - startY
            : startY - e.clientY;
          newHeight = startHeight + diffY;
          newWidth = newHeight * aspectRatio; // Maintain aspect ratio
        }

        // Apply minimum size constraints
        if (newWidth < 50) newWidth = 50;
        if (newHeight < 50) newHeight = 50;

        // Update local state to show resize preview
        setWidth(newWidth);
        setHeight(newHeight);
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        setIsResizing(false);

        // Save the resized dimensions to the node
        if (width && height) {
          updateAttributes({
            width,
            height,
          });
        }
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [aspectRatio, height, updateAttributes, width]
  );

  // Calculate and store the aspect ratio when the image is loaded
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      const ratio = naturalWidth / naturalHeight;
      setAspectRatio(ratio);

      // If width/height not set initially, set them based on the natural dimensions
      if (!width || !height) {
        setWidth(naturalWidth);
        setHeight(naturalHeight);
        updateAttributes({
          width: naturalWidth,
          height: naturalHeight,
        });
      }
    }
  }, [height, updateAttributes, width]);

  // Update dimensions in local state if node attrs change
  useEffect(() => {
    setWidth(node.attrs.width);
    setHeight(node.attrs.height);
  }, [node.attrs.width, node.attrs.height]);

  return (
    <NodeViewWrapper className="resizable-image-wrapper">
      <div
        className={`resizable-image-container ${selected ? "selected" : ""}`}
        style={{
          position: "relative",
          display: "inline-block",
          margin: "10px",
        }}
      >
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ""}
          width={width}
          height={height}
          style={{
            maxWidth: "100%",
            display: "block",
            cursor: isResizing ? "nwse-resize" : "default",
          }}
          onLoad={handleImageLoad}
          draggable={false}
        />

        {selected && (
          <>
            {/* Resize handles */}
            <div
              className="resize-handle resize-handle-se"
              style={{
                position: "absolute",
                bottom: "-5px",
                right: "-5px",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#1d4ed8",
                border: "1px solid white",
                cursor: "nwse-resize",
                zIndex: 10,
              }}
              onMouseDown={(e) => startResizing(e, "se")}
            />
            <div
              className="resize-handle resize-handle-sw"
              style={{
                position: "absolute",
                bottom: "-5px",
                left: "-5px",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#1d4ed8",
                border: "1px solid white",
                cursor: "nesw-resize",
                zIndex: 10,
              }}
              onMouseDown={(e) => startResizing(e, "sw")}
            />
            <div
              className="resize-handle resize-handle-ne"
              style={{
                position: "absolute",
                top: "-5px",
                right: "-5px",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#1d4ed8",
                border: "1px solid white",
                cursor: "nesw-resize",
                zIndex: 10,
              }}
              onMouseDown={(e) => startResizing(e, "ne")}
            />
            <div
              className="resize-handle resize-handle-nw"
              style={{
                position: "absolute",
                top: "-5px",
                left: "-5px",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#1d4ed8",
                border: "1px solid white",
                cursor: "nwse-resize",
                zIndex: 10,
              }}
              onMouseDown={(e) => startResizing(e, "nw")}
            />
            <div
              className="resize-frame"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                border: "1px solid #1d4ed8",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export default ResizableImageNodeView;
