"use client";

import { memo, useState, useCallback, useEffect, useRef } from "react";
import type React from "react";

interface TextNodeProps {
  data: {
    label: string;
    style?: React.CSSProperties & {
      fontFamily?: string;
      fontSize?: number;
      isBold?: boolean;
      isItalic?: boolean;
      isUnderline?: boolean;
      textAlign?: "left" | "center" | "right" | "justify";
      textColor?: string;
      lineHeight?: number;
    };
    onLabelChange?: (nodeId: string, newLabel: string) => void;
  };
  id: string;
  selected: boolean;
}

export const TextNode = memo(({ data, id, selected }: TextNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(data.label);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (data.onLabelChange) {
      data.onLabelChange(id, labelValue);
    }
  }, [data, id, labelValue]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && event.shiftKey) {
        event.preventDefault();
        setIsEditing(false);
        if (data.onLabelChange) {
          data.onLabelChange(id, labelValue);
        }
      }
    },
    [data, id, labelValue]
  );

  const getTextStyle = (): React.CSSProperties => ({
    fontFamily: data.style?.fontFamily || "Arial",
    fontSize: `${data.style?.fontSize || 12}px`,
    fontWeight: data.style?.isBold ? "bold" : "normal",
    fontStyle: data.style?.isItalic ? "italic" : "normal",
    textDecoration: data.style?.isUnderline ? "underline" : "none",
    textAlign: data.style?.textAlign || "left",
    color: data.style?.textColor || "#000000",
    lineHeight: `${data.style?.lineHeight || 1.2}`,
    padding: "0",
    margin: "0",
    backgroundColor: "transparent",
    border: selected ? "1px dashed #3182ce" : "1px dashed transparent",
    borderRadius: "4px",
    outline: "none",
    resize: "none",
    overflow: "hidden",
  });

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing, labelValue]);

  return (
    <div style={{ position: "relative" }}>
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={labelValue}
          onChange={(e) => {
            setLabelValue(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{ ...getTextStyle(), width: "auto", height: "auto" }}
          autoFocus
        />
      ) : (
        <div
          onDoubleClick={handleDoubleClick}
          style={{ ...getTextStyle(), width: "auto", height: "auto" }}
        >
          {labelValue}
        </div>
      )}
    </div>
  );
});

TextNode.displayName = "TextNode";
