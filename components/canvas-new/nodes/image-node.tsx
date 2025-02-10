"use client";

import { memo, useState, useEffect } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import Image from "next/image";

interface ImageNodeProps {
  data: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  selected: boolean;
  style?: { width?: number; height?: number };
}

export const ImageNode = memo(({ data, selected, style }: ImageNodeProps) => {
  const [size, setSize] = useState({
    width: style?.width || data.width,
    height: style?.height || data.height,
  });

  useEffect(() => {
    setSize({
      width: style?.width || data.width,
      height: style?.height || data.height,
    });
  }, [style, data.width, data.height]);

  const onResize = (
    _: unknown,
    newSize: {
      width: number;
      height: number;
    }
  ) => {
    setSize({ width: newSize.width, height: newSize.height });
  };

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={50}
        minHeight={50}
        onResize={onResize}
        keepAspectRatio
      />
      <div
        style={{ width: size.width, height: size.height, position: "relative" }}
      >
        <Image
          src={data.src || "/placeholder.svg"}
          alt={data.alt}
          fill
          style={{ objectFit: "contain" }}
        />
      </div>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </>
  );
});

ImageNode.displayName = "ImageNode";
