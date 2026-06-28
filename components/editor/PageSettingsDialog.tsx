"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { PaperOrientation, PaperSize } from "@/types/paper";
import {
  COMMON_PAPER_SIZES,
  PAPER_DIMENSIONS,
  PAPER_SIZE_GROUPS,
  mmToPx,
  pxToMm as rawPxToMm,
} from "@/utils/paper-sizes";
import { useEffect, useMemo, useState } from "react";

// Round margin display to 1 dp for the form. Storage keeps the full precision.
const pxToMm = (px: number) => Math.round(rawPxToMm(px) * 10) / 10;

export interface PageSettingsValue {
  pageSize: PaperSize;
  orientation: PaperOrientation;
  marginTop: number; // px (consistent with paginationSettings store)
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
}

interface PageSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  value: PageSettingsValue;
  onApply: (next: PageSettingsValue) => void;
}

export default function PageSettingsDialog({
  isOpen,
  onClose,
  value,
  onApply,
}: PageSettingsDialogProps) {
  const [draft, setDraft] = useState<PageSettingsValue>(value);

  useEffect(() => {
    if (isOpen) setDraft(value);
  }, [isOpen, value]);

  // Dimensions are now in mm (PAPER_DIMENSIONS is canonical portrait). Swap
  // for landscape. Margins below are still in px, converted on the fly.
  const dims = useMemo(() => {
    const raw = PAPER_DIMENSIONS[draft.pageSize] ?? { width: 210, height: 297 };
    return draft.orientation === "landscape"
      ? { width: raw.height, height: raw.width }
      : raw;
  }, [draft.pageSize, draft.orientation]);

  // Scale chosen so a typical A4 fits comfortably in the preview area.
  const previewScale = 0.6;
  const previewW = dims.width * previewScale;
  const previewH = dims.height * previewScale;
  // Margin rectangle is positioned in mm-space then scaled identically.
  const marginScale = (px: number) => rawPxToMm(px) * previewScale;

  const setMargin = (key: keyof PageSettingsValue, mm: number) => {
    if (Number.isNaN(mm) || mm < 0) return;
    setDraft((d) => ({ ...d, [key]: mmToPx(mm) }));
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Page setup</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6">
          <Tabs defaultValue="paper">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="paper">Paper</TabsTrigger>
              <TabsTrigger value="margins">Margins</TabsTrigger>
            </TabsList>

            <TabsContent value="paper" className="space-y-4">
              <div className="space-y-2">
                <Label>Paper size</Label>
                <Select
                  value={draft.pageSize}
                  onValueChange={(v) =>
                    setDraft((d) => ({ ...d, pageSize: v as PaperSize }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a size" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-72">
                      <SelectGroup>
                        <SelectLabel>Common</SelectLabel>
                        {COMMON_PAPER_SIZES.map((size) => (
                          <SelectItem key={`common-${size}`} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      {Object.entries(PAPER_SIZE_GROUPS).map(
                        ([group, sizes]) => {
                          // Radix Select renders the trigger label by matching
                          // value across all SelectItems; duplicates produce
                          // "A4A4". Filter Common-group sizes out of the
                          // category groups so each value appears once.
                          const filtered = sizes.filter(
                            (s) =>
                              !(COMMON_PAPER_SIZES as readonly string[]).includes(
                                s
                              )
                          );
                          if (filtered.length === 0) return null;
                          return (
                            <SelectGroup key={group}>
                              <SelectLabel>{group}</SelectLabel>
                              {filtered.map((size) => (
                                <SelectItem
                                  key={`${group}-${size}`}
                                  value={size}
                                >
                                  {size}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          );
                        }
                      )}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Orientation</Label>
                <ToggleGroup
                  type="single"
                  value={draft.orientation}
                  onValueChange={(v) => {
                    if (v) {
                      setDraft((d) => ({
                        ...d,
                        orientation: v as PaperOrientation,
                      }));
                    }
                  }}
                  className="justify-start"
                >
                  <ToggleGroupItem value="portrait">Portrait</ToggleGroupItem>
                  <ToggleGroupItem value="landscape">Landscape</ToggleGroupItem>
                </ToggleGroup>
              </div>

            </TabsContent>

            <TabsContent value="margins" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                All margins are in millimetres.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="margin-top">Top</Label>
                  <Input
                    id="margin-top"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.5}
                    value={pxToMm(draft.marginTop)}
                    onChange={(e) =>
                      setMargin("marginTop", parseFloat(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="margin-right">Right</Label>
                  <Input
                    id="margin-right"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.5}
                    value={pxToMm(draft.marginRight)}
                    onChange={(e) =>
                      setMargin("marginRight", parseFloat(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="margin-bottom">Bottom</Label>
                  <Input
                    id="margin-bottom"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.5}
                    value={pxToMm(draft.marginBottom)}
                    onChange={(e) =>
                      setMargin("marginBottom", parseFloat(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="margin-left">Left</Label>
                  <Input
                    id="margin-left"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.5}
                    value={pxToMm(draft.marginLeft)}
                    onChange={(e) =>
                      setMargin("marginLeft", parseFloat(e.target.value))
                    }
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      marginTop: mmToPx(25.4),
                      marginRight: mmToPx(25.4),
                      marginBottom: mmToPx(25.4),
                      marginLeft: mmToPx(25.4),
                    }))
                  }
                >
                  1″ default
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      marginTop: mmToPx(15),
                      marginRight: mmToPx(15),
                      marginBottom: mmToPx(15),
                      marginLeft: mmToPx(15),
                    }))
                  }
                >
                  Narrow (15 mm)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      marginTop: 0,
                      marginRight: 0,
                      marginBottom: 0,
                      marginLeft: 0,
                    }))
                  }
                >
                  None
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col items-center gap-2 self-start min-w-[160px]">
            <Label>Preview</Label>
            <svg
              width={Math.max(previewW, 60)}
              height={Math.max(previewH, 80)}
              viewBox={`0 0 ${previewW} ${previewH}`}
              className="border bg-card shadow-sm"
              aria-hidden
            >
              <rect
                x={marginScale(draft.marginLeft)}
                y={marginScale(draft.marginTop)}
                width={Math.max(
                  previewW -
                    marginScale(draft.marginLeft + draft.marginRight),
                  0
                )}
                height={Math.max(
                  previewH -
                    marginScale(draft.marginTop + draft.marginBottom),
                  0
                )}
                fill="none"
                stroke="#94a3b8"
                strokeDasharray="3 3"
              />
            </svg>
            <p className="text-xs text-muted-foreground">
              {draft.pageSize} · {draft.orientation}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {Math.round(dims.width)} × {Math.round(dims.height)} mm
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
