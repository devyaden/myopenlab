"use client";

import type React from "react";

import { memo, useState, useEffect, useCallback } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import Image from "next/image";

interface ImageNodeProps {
  data: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    onImageLoad?: (width: number, height: number) => void;
  };
  selected: boolean;
  style?: { width?: number; height?: number };
}

export const ImageNode = memo(({ data, selected, style }: ImageNodeProps) => {
  const [size, setSize] = useState({
    width: style?.width || data.width || 200, // Default width if not provided
    height: style?.height || data.height || 200, // Default height if not provided
  });

  const [imageSrc, setImageSrc] = useState<string>(
    data.src || "/placeholder.svg"
  );

  // Function to get image dimensions without using the Image constructor
  const getImageDimensions = useCallback(
    (src: string): Promise<{ width: number; height: number }> => {
      return new Promise((resolve) => {
        const img = document.createElement("img");
        img.onload = () => {
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        };
        img.src = src;
      });
    },
    []
  );

  // Effect to update dimensions when src changes
  useEffect(() => {
    if (data.src) {
      getImageDimensions(data.src).then(({ width, height }) => {
        // Set a maximum size to prevent extremely large images
        const maxWidth = 400;
        const maxHeight = 400;

        let newWidth = width;
        let newHeight = height;

        // Scale down if needed while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          newWidth = Math.floor(width * ratio);
          newHeight = Math.floor(height * ratio);
        }

        setSize({ width: newWidth, height: newHeight });

        // Notify parent component if callback provided
        if (data.onImageLoad) {
          data.onImageLoad(newWidth, newHeight);
        }
      });
      setImageSrc(data.src);
    }
  }, [data.src, getImageDimensions, data.onImageLoad]);

  // Handle file upload from local storage
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const src = e.target?.result as string;
          setImageSrc(src);

          // Get dimensions of the uploaded image
          const { width, height } = await getImageDimensions(src);

          // Set a maximum size to prevent extremely large images
          const maxWidth = 400;
          const maxHeight = 400;

          let newWidth = width;
          let newHeight = height;

          // Scale down if needed while maintaining aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            newWidth = Math.floor(width * ratio);
            newHeight = Math.floor(height * ratio);
          }

          setSize({ width: newWidth, height: newHeight });

          // Notify parent component if callback provided
          if (data.onImageLoad) {
            data.onImageLoad(newWidth, newHeight);
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [getImageDimensions, data.onImageLoad]
  );

  const onResize = (_: unknown, newSize: { width: number; height: number }) => {
    setSize({ width: newSize.width, height: newSize.height });
  };

  return (
    <div
      className="relative"
      style={{
        width: size.width,
        height: size.height,
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={50}
        minHeight={50}
        onResize={onResize}
        keepAspectRatio
      />

      {/* Container for the image with handles properly positioned */}
      <div className="border border-border rounded-md overflow-hidden w-full h-full relative">
        <Image
          src={imageSrc || "/placeholder.svg"}
          alt={data.alt || "Image"}
          fill
          style={{ objectFit: "contain" }}
        />

        {/* Handles positioned at all four corners */}
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          style={{
            top: -5,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
          }}
          className="!bg-primary !border-foreground"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          style={{
            right: -5,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
          }}
          className="!bg-primary !border-foreground"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          style={{
            bottom: -5,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
          }}
          className="!bg-primary !border-foreground"
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          style={{
            left: -5,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
          }}
          className="!bg-primary !border-foreground"
        />

        {selected && (
          <div className="absolute bottom-2 right-2 z-20">
            <label
              htmlFor="upload-image"
              className="cursor-pointer bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs"
            >
              Change Image
              <input
                id="upload-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
});

ImageNode.displayName = "ImageNode";
