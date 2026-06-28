"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCanvasStore } from "@/lib/store/useCanvas";
import type { RecentColorSlot } from "@/types/store";
import { Pipette, X } from "lucide-react";
import { useState } from "react";

// Curated theme palette — neutrals plus the brand green and a small set of
// accent ramps. Two rows, ten swatches each. Tweak here to restyle the picker
// project-wide without touching the toolbar wiring.
const THEME_COLORS: string[] = [
  // Row 1: neutrals
  "#FFFFFF",
  "#F3F4F6",
  "#E5E7EB",
  "#9CA3AF",
  "#6B7280",
  "#374151",
  "#111827",
  "#000000",
  "#09BC8A",
  "#003F91",
  // Row 2: accents
  "#FEE2E2",
  "#FCA5A5",
  "#EF4444",
  "#F59E0B",
  "#FDE68A",
  "#10B981",
  "#34D399",
  "#60A5FA",
  "#8B5CF6",
  "#EC4899",
];

interface ColorPickerPopoverProps {
  slot: RecentColorSlot;
  value: string;
  onChange: (color: string) => void;
  /** Indeterminate / multi-select-mixed display; ignored when value is set. */
  mixed?: boolean;
  /** Disable the trigger entirely (no selection, etc). */
  disabled?: boolean;
  /** Show a "Transparent" / "None" option (useful for fill and border). */
  allowTransparent?: boolean;
  /** Tooltip / aria-label for the trigger. */
  label?: string;
}

const Swatch = ({
  color,
  active,
  onClick,
  title,
}: {
  color: string;
  active?: boolean;
  onClick: () => void;
  title?: string;
}) => {
  const isTransparent =
    color === "transparent" || color === "rgba(0,0,0,0)" || color === "";
  return (
    <button
      type="button"
      onClick={onClick}
      title={title || color}
      aria-label={title || color}
      className={`h-6 w-6 rounded border transition ${
        active
          ? "ring-2 ring-offset-1 ring-[#09BC8A] border-[#09BC8A]"
          : "border-border hover:border-border"
      }`}
      style={
        isTransparent
          ? {
              backgroundImage:
                "linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)",
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
            }
          : { backgroundColor: color }
      }
    />
  );
};

export function ColorPickerPopover({
  slot,
  value,
  onChange,
  mixed,
  disabled,
  allowTransparent,
  label,
}: ColorPickerPopoverProps) {
  const recentColors = useCanvasStore((s) => s.recentColors);
  const pushRecentColor = useCanvasStore((s) => s.pushRecentColor);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const slotRecents = recentColors?.[slot] || [];

  const commit = (color: string) => {
    if (!color) return;
    onChange(color);
    if (color !== "transparent") pushRecentColor(slot, color);
    setOpen(false);
  };

  const eyedropper = async () => {
    // EyeDropper API is Chromium-only. Hide the button entirely elsewhere.
    const Eye = (window as any).EyeDropper;
    if (!Eye) return;
    try {
      const dropper = new Eye();
      const result = await dropper.open();
      if (result?.sRGBHex) commit(result.sRGBHex);
    } catch {
      // user cancelled — no-op
    }
  };

  const showEyedropper =
    typeof window !== "undefined" && "EyeDropper" in window;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={label || `${slot} color`}
          title={label || `${slot} color`}
          className={`flex items-center justify-center h-9 w-10 border rounded-md overflow-hidden ${
            disabled ? "opacity-50 cursor-not-allowed" : "hover:border-border"
          }`}
        >
          <span
            className="block h-6 w-7 rounded-sm border border-black/10"
            style={
              mixed
                ? {
                    backgroundImage:
                      "linear-gradient(135deg, #fff 0%, #fff 25%, #999 25%, #999 50%, #fff 50%, #fff 75%, #999 75%, #999 100%)",
                    backgroundSize: "8px 8px",
                  }
                : value === "transparent" || !value
                  ? {
                      backgroundImage:
                        "linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)",
                      backgroundSize: "8px 8px",
                      backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                    }
                  : { backgroundColor: value }
            }
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[260px] p-3"
        onOpenAutoFocus={() => setDraft(value)}
      >
        <div className="space-y-3">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1.5">
              Theme colors
            </div>
            <div className="grid grid-cols-10 gap-1">
              {THEME_COLORS.map((c) => (
                <Swatch
                  key={c}
                  color={c}
                  active={!mixed && c.toLowerCase() === value?.toLowerCase()}
                  onClick={() => commit(c)}
                />
              ))}
            </div>
          </div>

          {slotRecents.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1.5">
                Recent
              </div>
              <div className="grid grid-cols-10 gap-1">
                {slotRecents.map((c) => (
                  <Swatch
                    key={`recent-${c}`}
                    color={c}
                    active={!mixed && c.toLowerCase() === value?.toLowerCase()}
                    onClick={() => commit(c)}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1.5">
              Custom
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={
                  draft && draft !== "transparent" && /^#/.test(draft)
                    ? draft
                    : "#000000"
                }
                onChange={(e) => setDraft(e.target.value)}
                className="h-8 w-10 rounded border border-border cursor-pointer"
              />
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => {
                  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(draft)) commit(draft);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(draft))
                      commit(draft);
                  }
                }}
                placeholder="#000000"
                className="flex-1 h-8 px-2 text-sm rounded border border-border outline-none focus:border-border"
              />
              <button
                type="button"
                onClick={() => {
                  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(draft)) commit(draft);
                }}
                className="h-8 px-3 text-sm rounded border border-border hover:bg-accent"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            {showEyedropper && (
              <button
                type="button"
                onClick={eyedropper}
                className="flex items-center gap-1.5 h-8 px-2 text-sm rounded border border-border hover:bg-accent"
                title="Pick color from screen"
              >
                <Pipette className="h-3.5 w-3.5" />
                Pick
              </button>
            )}
            {allowTransparent && (
              <button
                type="button"
                onClick={() => commit("transparent")}
                className="flex items-center gap-1.5 h-8 px-2 text-sm rounded border border-border hover:bg-accent ml-auto"
                title="No color"
              >
                <X className="h-3.5 w-3.5" />
                None
              </button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
