"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { SlashItem } from "./slash-items";

export interface SlashCommandListHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

interface SlashCommandListProps {
  items: SlashItem[];
  command: (item: SlashItem) => void;
}

const SlashCommandList = forwardRef<
  SlashCommandListHandle,
  SlashCommandListProps
>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  // Keep the highlighted row in view during keyboard nav.
  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const select = (index: number) => {
    const item = items[index];
    if (item) command(item);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: (event: KeyboardEvent) => {
      if (items.length === 0) return false;
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) => (i + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        select(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  // Render flat list but insert a group header whenever the group changes.
  const rows = useMemo(() => {
    const out: Array<
      | { kind: "header"; group: string }
      | { kind: "item"; item: SlashItem; index: number }
    > = [];
    let lastGroup = "";
    items.forEach((item, index) => {
      if (item.group !== lastGroup) {
        out.push({ kind: "header", group: item.group });
        lastGroup = item.group;
      }
      out.push({ kind: "item", item, index });
    });
    return out;
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="slash-menu slash-menu--empty">No matching blocks</div>
    );
  }

  return (
    <div className="slash-menu" role="listbox" ref={containerRef}>
      {rows.map((row, i) => {
        if (row.kind === "header") {
          return (
            <div key={`h-${row.group}-${i}`} className="slash-menu__group">
              {row.group}
            </div>
          );
        }
        const { item, index } = row;
        const Icon = item.icon;
        return (
          <button
            key={`${item.group}-${item.title}`}
            type="button"
            role="option"
            aria-selected={index === selectedIndex}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className={`slash-menu__item${
              index === selectedIndex ? " is-selected" : ""
            }`}
            onMouseEnter={() => setSelectedIndex(index)}
            onClick={() => select(index)}
          >
            <span className="slash-menu__icon">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="slash-menu__text">
              <span className="slash-menu__title">{item.title}</span>
              <span className="slash-menu__desc">{item.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
});
SlashCommandList.displayName = "SlashCommandList";

export default SlashCommandList;
