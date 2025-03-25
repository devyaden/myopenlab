import { Canvas } from "@/types/sidebar";
import { CANVAS_TYPE } from "@/types/store";
import { type ClassValue, clsx } from "clsx";
import { redirect } from "next/navigation";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

/**
 * Generates a unique untitled name for a new canvas, table, or document
 *
 * @param type - The type of item (CANVAS_TYPE.HYBRID, CANVAS_TYPE.TABLE, or CANVAS_TYPE.DOCUMENT)
 * @param existingItems - Array of existing canvases to check for name conflicts
 * @returns A string in the format "Untitled [Type] [Number]"
 */
export function generateUntitledName(
  type: CANVAS_TYPE,
  existingItems: Canvas[] = []
) {
  // Determine the item type label
  const itemType =
    type === CANVAS_TYPE.DOCUMENT
      ? "Document"
      : type === CANVAS_TYPE.TABLE
        ? "Table"
        : "Canvas";

  // Filter existing items to find those with similar names
  const itemsWithSimilarNames = existingItems.filter((canvas) =>
    canvas.name.startsWith(`Untitled ${itemType}`)
  );

  // Find the highest number used in existing names
  const nextNumber =
    itemsWithSimilarNames.length > 0
      ? Math.max(
          ...itemsWithSimilarNames.map((item) => {
            const match = item.name.match(/Untitled \w+ (\d+)/);
            return match ? Number.parseInt(match[1], 10) : 0;
          })
        ) + 1
      : 1;

  // Return the new name with the next available number
  return `Untitled ${itemType} ${nextNumber}`;
}
