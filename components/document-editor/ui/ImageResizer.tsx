"use client";

import type { LexicalEditor } from "lexical";
import type { JSX } from "react";

import { calculateZoomLevel } from "@lexical/utils";
import type * as React from "react";
import { useRef, useState, useEffect } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const Direction = {
  east: 1 << 0,
  north: 1 << 3,
  south: 1 << 1,
  west: 1 << 2,
};

export default function ImageResizer({
  onResizeStart,
  onResizeEnd,
  buttonRef,
  imageRef,
  maxWidth,
  editor,
  showCaption,
  setShowCaption,
  captionsEnabled,
}: {
  editor: LexicalEditor;
  buttonRef: { current: null | HTMLButtonElement };
  imageRef: { current: null | HTMLElement };
  maxWidth?: number;
  onResizeEnd: (width: "inherit" | number, height: "inherit" | number) => void;
  onResizeStart: () => void;
  setShowCaption: (show: boolean) => void;
  showCaption: boolean;
  captionsEnabled: boolean;
}): JSX.Element {
  const controlWrapperRef = useRef<HTMLDivElement>(null);
  const userSelect = useRef({
    priority: "",
    value: "default",
  });
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(true);
  const [resizePreview, setResizePreview] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const positioningRef = useRef<{
    currentHeight: "inherit" | number;
    currentWidth: "inherit" | number;
    direction: number;
    isResizing: boolean;
    ratio: number;
    startHeight: number;
    startWidth: number;
    startX: number;
    startY: number;
  }>({
    currentHeight: 0,
    currentWidth: 0,
    direction: 0,
    isResizing: false,
    ratio: 0,
    startHeight: 0,
    startWidth: 0,
    startX: 0,
    startY: 0,
  });

  const editorRootElement = editor.getRootElement();
  // Allow full container width without padding reduction
  const maxWidthContainer = maxWidth
    ? maxWidth
    : editorRootElement !== null
      ? editorRootElement.getBoundingClientRect().width
      : window.innerWidth;
  const maxHeightContainer =
    editorRootElement !== null
      ? editorRootElement.getBoundingClientRect().height - 20
      : 100;

  const minWidth = 100;
  const minHeight = 100;

  const setStartCursor = (direction: number) => {
    const ew = direction === Direction.east || direction === Direction.west;
    const ns = direction === Direction.north || direction === Direction.south;
    const nwse =
      (direction & Direction.north && direction & Direction.west) ||
      (direction & Direction.south && direction & Direction.east);

    const cursorDir = ew ? "ew" : ns ? "ns" : nwse ? "nwse" : "nesw";

    if (editorRootElement !== null) {
      editorRootElement.style.setProperty(
        "cursor",
        `${cursorDir}-resize`,
        "important"
      );
    }
    if (document.body !== null) {
      document.body.style.setProperty(
        "cursor",
        `${cursorDir}-resize`,
        "important"
      );
      userSelect.current.value = document.body.style.getPropertyValue(
        "-webkit-user-select"
      );
      userSelect.current.priority = document.body.style.getPropertyPriority(
        "-webkit-user-select"
      );
      document.body.style.setProperty(
        "-webkit-user-select",
        `none`,
        "important"
      );
    }
  };

  const setEndCursor = () => {
    if (editorRootElement !== null) {
      editorRootElement.style.setProperty("cursor", "text");
    }
    if (document.body !== null) {
      document.body.style.setProperty("cursor", "default");
      document.body.style.setProperty(
        "-webkit-user-select",
        userSelect.current.value,
        userSelect.current.priority
      );
    }
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    direction: number
  ) => {
    if (!editor.isEditable()) {
      return;
    }

    const image = imageRef.current;
    const controlWrapper = controlWrapperRef.current;

    if (image !== null && controlWrapper !== null) {
      event.preventDefault();
      const { width, height } = image.getBoundingClientRect();
      const zoom = calculateZoomLevel(image);
      const positioning = positioningRef.current;
      positioning.startWidth = width;
      positioning.startHeight = height;
      positioning.ratio = width / height;
      positioning.currentWidth = width;
      positioning.currentHeight = height;
      positioning.startX = event.clientX / zoom;
      positioning.startY = event.clientY / zoom;
      positioning.isResizing = true;
      positioning.direction = direction;

      setStartCursor(direction);
      onResizeStart();

      controlWrapper.classList.add("image-control-wrapper--resizing");
      image.style.height = `${height}px`;
      image.style.width = `${width}px`;

      // Update the wrapper dimensions to match the image
      updateWrapperDimensions();

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    }
  };

  const handlePointerMove = (event: PointerEvent) => {
    const image = imageRef.current;
    const positioning = positioningRef.current;

    const isHorizontal =
      positioning.direction & (Direction.east | Direction.west);
    const isVertical =
      positioning.direction & (Direction.south | Direction.north);

    if (image !== null && positioning.isResizing) {
      // Get the bounds of the editor to constrain resizing
      const editorBounds = editorRootElement?.getBoundingClientRect() || {
        left: 0,
        top: 0,
        right: window.innerWidth,
        bottom: window.innerHeight,
      };

      // Constrain the pointer position to the editor bounds
      const constrainedClientX = clamp(
        event.clientX,
        editorBounds.left,
        editorBounds.right
      );
      const constrainedClientY = clamp(
        event.clientY,
        editorBounds.top,
        editorBounds.bottom
      );

      const zoom = calculateZoomLevel(image);

      // Calculate available width - allow use of full container
      const availableWidth = maxWidthContainer;

      // Corner cursor
      if (isHorizontal && isVertical) {
        let diff = Math.floor(positioning.startX - constrainedClientX / zoom);
        diff = positioning.direction & Direction.east ? -diff : diff;

        // Allow full width resizing
        const width = clamp(
          positioning.startWidth + diff,
          minWidth,
          availableWidth
        );

        let height;
        if (aspectRatioLocked) {
          // Maintain aspect ratio
          height = width / positioning.ratio;
        } else {
          // Allow free-form resizing
          let heightDiff = Math.floor(
            positioning.startY - constrainedClientY / zoom
          );
          heightDiff =
            positioning.direction & Direction.south ? -heightDiff : heightDiff;
          height = clamp(
            positioning.startHeight + heightDiff,
            minHeight,
            maxHeightContainer
          );
        }

        image.style.width = `${width}px`;
        image.style.height = `${height}px`;
        positioning.currentHeight = height;
        positioning.currentWidth = width;

        // Update resize preview
        setResizePreview({ width, height });

        // Update the wrapper dimensions to match the image
        updateWrapperDimensions();
      } else if (isVertical) {
        let diff = Math.floor(positioning.startY - constrainedClientY / zoom);
        diff = positioning.direction & Direction.south ? -diff : diff;

        const height = clamp(
          positioning.startHeight + diff,
          minHeight,
          maxHeightContainer
        );

        let width;
        if (aspectRatioLocked) {
          // Maintain aspect ratio
          width = height * positioning.ratio;
          // Allow full width resizing
          width = clamp(width, minWidth, maxWidthContainer);
          // Recalculate height based on clamped width to maintain perfect ratio
          const adjustedHeight = width / positioning.ratio;
          image.style.width = `${width}px`;
          image.style.height = `${adjustedHeight}px`;
          positioning.currentWidth = width;
          positioning.currentHeight = adjustedHeight;
          setResizePreview({ width, height: adjustedHeight });
        } else {
          image.style.height = `${height}px`;
          positioning.currentHeight = height;
          setResizePreview({
            width: positioning.currentWidth as number,
            height,
          });
        }

        // Update the wrapper dimensions to match the image
        updateWrapperDimensions();
      } else {
        let diff = Math.floor(positioning.startX - constrainedClientX / zoom);
        diff = positioning.direction & Direction.east ? -diff : diff;

        // Allow full width resizing
        const width = clamp(
          positioning.startWidth + diff,
          minWidth,
          availableWidth
        );

        let height;
        if (aspectRatioLocked) {
          // Maintain aspect ratio
          height = width / positioning.ratio;
          image.style.height = `${height}px`;
          positioning.currentHeight = height;
        }

        image.style.width = `${width}px`;
        positioning.currentWidth = width;

        setResizePreview({
          width,
          height: aspectRatioLocked
            ? (height as number)
            : (positioning.currentHeight as number),
        });

        // Update the wrapper dimensions to match the image
        updateWrapperDimensions();
      }
    }
  };

  const handlePointerUp = () => {
    const image = imageRef.current;
    const positioning = positioningRef.current;
    const controlWrapper = controlWrapperRef.current;

    if (image !== null && controlWrapper !== null && positioning.isResizing) {
      const width = positioning.currentWidth;
      const height = positioning.currentHeight;

      // Reset positioning state
      positioning.startWidth = 0;
      positioning.startHeight = 0;
      positioning.ratio = 0;
      positioning.startX = 0;
      positioning.startY = 0;
      positioning.currentWidth = 0;
      positioning.currentHeight = 0;
      positioning.isResizing = false;

      controlWrapper.classList.remove("image-control-wrapper--resizing");
      setResizePreview(null);
      setEndCursor();
      onResizeEnd(width, height);

      // Final update to wrapper dimensions
      updateWrapperDimensions();

      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    }
  };

  const toggleAspectRatio = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAspectRatioLocked(!aspectRatioLocked);
  };

  // Function to update the wrapper dimensions to match the image
  const updateWrapperDimensions = () => {
    if (controlWrapperRef.current && imageRef.current) {
      const imageRect = imageRef.current.getBoundingClientRect();
      const wrapper = controlWrapperRef.current;

      // Set the wrapper dimensions to match the image exactly
      wrapper.style.width = `${imageRect.width}px`;
      wrapper.style.height = `${imageRect.height}px`;

      // Make sure wrapper has the exact same bounds as image
      wrapper.style.top = "0";
      wrapper.style.left = "0";
      wrapper.style.right = "0";
      wrapper.style.bottom = "0";
    }
  };

  // Update wrapper dimensions when the component mounts or when the image changes
  useEffect(() => {
    updateWrapperDimensions();

    // Set up a resize observer to update the wrapper dimensions when the image resizes
    if (imageRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        updateWrapperDimensions();
      });

      resizeObserver.observe(imageRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [imageRef.current]);

  // Also update on every render to ensure the wrapper stays in sync
  useEffect(() => {
    updateWrapperDimensions();
  }, []);

  return (
    <div
      ref={controlWrapperRef}
      className={`image-resizer-wrapper ${positioningRef.current.isResizing ? "image-control-wrapper--resizing" : ""}`}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      {!showCaption && captionsEnabled && (
        <button
          className="image-caption-button"
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            setShowCaption(!showCaption);
          }}
        >
          Add Caption
        </button>
      )}

      {/* Aspect ratio lock button */}
      <button
        className={`image-aspect-ratio-button ${aspectRatioLocked ? "locked" : "unlocked"}`}
        onClick={toggleAspectRatio}
        title={aspectRatioLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {aspectRatioLocked ? (
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          ) : (
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M12 22V2" />
          )}
        </svg>
      </button>

      {/* Size display overlay */}
      {resizePreview && (
        <div className="image-resize-info">
          {Math.round(resizePreview.width)} × {Math.round(resizePreview.height)}
        </div>
      )}

      {/* Resize handles */}
      <div
        className="image-resizer image-resizer-n"
        onPointerDown={(event) => {
          handlePointerDown(event, Direction.north);
        }}
      />
      <div
        className="image-resizer image-resizer-ne"
        onPointerDown={(event) => {
          handlePointerDown(event, Direction.north | Direction.east);
        }}
      />
      <div
        className="image-resizer image-resizer-e"
        onPointerDown={(event) => {
          handlePointerDown(event, Direction.east);
        }}
      />
      <div
        className="image-resizer image-resizer-se"
        onPointerDown={(event) => {
          handlePointerDown(event, Direction.south | Direction.east);
        }}
      />
      <div
        className="image-resizer image-resizer-s"
        onPointerDown={(event) => {
          handlePointerDown(event, Direction.south);
        }}
      />
      <div
        className="image-resizer image-resizer-sw"
        onPointerDown={(event) => {
          handlePointerDown(event, Direction.south | Direction.west);
        }}
      />
      <div
        className="image-resizer image-resizer-w"
        onPointerDown={(event) => {
          handlePointerDown(event, Direction.west);
        }}
      />
      <div
        className="image-resizer image-resizer-nw"
        onPointerDown={(event) => {
          handlePointerDown(event, Direction.north | Direction.west);
        }}
      />
    </div>
  );
}
