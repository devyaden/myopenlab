"use client";

import { Upload, Link2 } from "lucide-react";
import { useEffect } from "react";
import "./image-dialog.css";

interface ImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertImage: (url: string, isUpload: boolean) => void;
  isInline?: boolean;
}

export default function ImageDialog({
  isOpen,
  onClose,
  onInsertImage,
  isInline = false,
}: ImageDialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    // Fix pointer events before closing
    document.body.style.pointerEvents = "";
    onClose();
  };

  const handleUploadClick = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;

          // Fix pointer events before closing
          document.body.style.pointerEvents = "";
          onClose();

          // Small delay to ensure dialog is fully closed
          setTimeout(() => {
            onInsertImage(imageUrl, true);
          }, 10);
        };
        reader.readAsDataURL(file);
      }
      document.body.removeChild(fileInput);
    };

    fileInput.click();
  };

  const handleUrlClick = () => {
    const imageUrl = prompt(
      "Enter image URL:",
      "https://via.placeholder.com/150"
    );
    if (imageUrl) {
      // Fix pointer events before closing
      document.body.style.pointerEvents = "";
      onClose();

      // Small delay to ensure dialog is fully closed
      setTimeout(() => {
        onInsertImage(imageUrl, false);
      }, 10);
    }
  };

  return (
    <div className="image-insert-dialog" onClick={handleClose}>
      <div
        className="image-insert-dialog-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{isInline ? "Insert Inline Image" : "Insert Image"}</h3>
        <div className="image-insert-options">
          <button className="image-insert-option" onClick={handleUploadClick}>
            <Upload size={24} />
            <span>Upload from computer</span>
          </button>
          <button className="image-insert-option" onClick={handleUrlClick}>
            <Link2 size={24} />
            <span>By URL</span>
          </button>
        </div>
        <div className="image-insert-dialog-footer">
          <button onClick={handleClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
