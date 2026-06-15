"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  type KeyboardEvent,
} from "react";
import { FileText, LayoutGrid, Table as TableIcon } from "lucide-react";
import type { MentionFile } from "./hooks/useFileSearch";

export interface MentionListHandle {
  /**
   * Tiptap's suggestion plugin forwards keydown events here so the popup
   * can consume arrow / enter keys without bubbling them to the editor.
   * Returning `true` swallows the event.
   */
  onKeyDown: (event: KeyboardEvent) => boolean;
}

interface MentionListProps {
  items: MentionFile[];
  command: (item: {
    id: string;
    label: string;
    canvasType: string | null;
    code: string | null;
  }) => void;
}

const iconForType = (canvasType: string | null) => {
  switch ((canvasType ?? "").toLowerCase()) {
    case "table":
      return <TableIcon className="h-4 w-4 text-emerald-600" aria-hidden />;
    case "canvas":
    case "hybrid":
      return <LayoutGrid className="h-4 w-4 text-indigo-600" aria-hidden />;
    case "document":
    default:
      return <FileText className="h-4 w-4 text-slate-600" aria-hidden />;
  }
};

const MentionList = forwardRef<MentionListHandle, MentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Reset cursor when results change so the highlight doesn't drift past
    // the (possibly shorter) new list.
    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    const select = (index: number) => {
      const item = items[index];
      if (!item) return;
      command({
        id: item.id,
        label: item.name,
        canvasType: item.canvas_type,
        code: item.code,
      });
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i + items.length - 1) % Math.max(items.length, 1));
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % Math.max(items.length, 1));
          return true;
        }
        if (event.key === "Enter") {
          select(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="mention-list mention-list--empty">
          No matching files
        </div>
      );
    }

    return (
      <div className="mention-list" role="listbox">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={index === selectedIndex}
            className={`mention-list__item${
              index === selectedIndex ? " is-selected" : ""
            }`}
            onMouseEnter={() => setSelectedIndex(index)}
            onClick={() => select(index)}
          >
            <span className="mention-list__icon">
              {iconForType(item.canvas_type)}
            </span>
            <span className="mention-list__label">
              <span className="mention-list__name">{item.name}</span>
              {item.folder_name && (
                <span className="mention-list__folder">
                  {item.folder_name}
                </span>
              )}
            </span>
            {item.code && (
              <span className="mention-list__code">{item.code}</span>
            )}
          </button>
        ))}
      </div>
    );
  }
);
MentionList.displayName = "MentionList";

export default MentionList;
