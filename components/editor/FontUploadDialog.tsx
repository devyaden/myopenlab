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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALLOWED_FONT_FORMATS,
  type UserFont,
} from "@/lib/font-storage";
import { parseFontFile } from "@/lib/font-parse";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

type PendingStatus = "ready" | "uploading" | "uploaded" | "error";

interface PendingFont {
  /** Stable key for the table row. */
  key: string;
  file: File;
  familyName: string;
  weight: number;
  style: "normal" | "italic";
  fromBinary: boolean;
  status: PendingStatus;
  /** Set when status === "error". */
  errorMessage?: string;
}

interface FontUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fonts: UserFont[];
  onUpload: (input: {
    file: File;
    familyName: string;
    weight: number;
    style: "normal" | "italic";
  }) => Promise<void>;
  onRemove: (font: UserFont) => Promise<void>;
}

const ACCEPT_ATTR = ALLOWED_FONT_FORMATS.map((e) => `.${e}`).join(",");

export default function FontUploadDialog({
  isOpen,
  onClose,
  fonts,
  onUpload,
  onRemove,
}: FontUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingFont[]>([]);
  const [busy, setBusy] = useState(false);

  const onPickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const parsed: PendingFont[] = [];
    for (const file of Array.from(files)) {
      try {
        const meta = await parseFontFile(file);
        parsed.push({
          key: `${file.name}-${file.lastModified}-${file.size}-${parsed.length}`,
          file,
          familyName: meta.familyName,
          weight: meta.weight,
          style: meta.style,
          fromBinary: meta.fromBinary,
          status: "ready",
        });
      } catch (err) {
        toast.error(
          `Couldn't read ${file.name}: ${
            err instanceof Error ? err.message : "unknown error"
          }`
        );
      }
    }
    setPending((prev) => [...prev, ...parsed]);
    // Allow re-picking the same file by clearing the input value.
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updatePending = (key: string, patch: Partial<PendingFont>) => {
    setPending((prev) =>
      prev.map((p) => (p.key === key ? { ...p, ...patch } : p))
    );
  };

  const removePending = (key: string) => {
    setPending((prev) => prev.filter((p) => p.key !== key));
  };

  const uploadAll = async () => {
    const toUpload = pending.filter(
      (p) => p.status === "ready" || p.status === "error"
    );
    if (toUpload.length === 0) return;
    setBusy(true);

    // Mark all queued as uploading up front so the UI feels responsive.
    setPending((prev) =>
      prev.map((p) =>
        toUpload.find((q) => q.key === p.key)
          ? { ...p, status: "uploading", errorMessage: undefined }
          : p
      )
    );

    const results = await Promise.allSettled(
      toUpload.map(async (p) => {
        if (!p.familyName.trim()) {
          throw new Error("Family name required");
        }
        await onUpload({
          file: p.file,
          familyName: p.familyName.trim(),
          weight: p.weight,
          style: p.style,
        });
        return p.key;
      })
    );

    setPending((prev) =>
      prev.map((p) => {
        const idx = toUpload.findIndex((q) => q.key === p.key);
        if (idx === -1) return p;
        const result = results[idx];
        if (result.status === "fulfilled") {
          return { ...p, status: "uploaded" };
        }
        return {
          ...p,
          status: "error",
          errorMessage:
            result.reason instanceof Error
              ? result.reason.message
              : "Upload failed",
        };
      })
    );

    const failures = results.filter((r) => r.status === "rejected").length;
    if (failures === 0) {
      toast.success(
        toUpload.length === 1
          ? "Font uploaded."
          : `Uploaded ${toUpload.length} fonts.`
      );
    } else if (failures === toUpload.length) {
      toast.error(`Upload failed for all ${failures} fonts. See rows.`);
    } else {
      toast.error(`Uploaded ${toUpload.length - failures}; ${failures} failed.`);
    }
    setBusy(false);
  };

  const clearUploaded = () => {
    setPending((prev) => prev.filter((p) => p.status !== "uploaded"));
  };

  const handleRemove = async (font: UserFont) => {
    setBusy(true);
    try {
      await onRemove(font);
      toast.success(`Removed "${font.familyName}".`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove font."
      );
    } finally {
      setBusy(false);
    }
  };

  const queuedCount = pending.filter(
    (p) => p.status === "ready" || p.status === "error"
  ).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[820px]">
        <DialogHeader>
          <DialogTitle>Custom fonts</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* File picker + queued table */}
          <div className="rounded-md border">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b">
              <div>
                <Label className="text-base">Add fonts</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select multiple files to import a whole family — metadata
                  is read from each font's binary (TTF / OTF / WOFF) or
                  inferred from the filename (WOFF2). 2 MB max per file.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_ATTR}
                  multiple
                  className="hidden"
                  onChange={(e) => onPickFiles(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Choose files
                </Button>
              </div>
            </div>

            {pending.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                Pick one or more font files to begin.
              </div>
            ) : (
              <>
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="text-left font-medium px-3 py-2">
                          Family
                        </th>
                        <th className="text-left font-medium px-3 py-2 w-32">
                          Weight
                        </th>
                        <th className="text-left font-medium px-3 py-2 w-28">
                          Style
                        </th>
                        <th className="text-left font-medium px-3 py-2 w-20">
                          Source
                        </th>
                        <th className="px-3 py-2 w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {pending.map((p) => (
                        <tr
                          key={p.key}
                          className={
                            p.status === "uploaded" ? "opacity-60" : undefined
                          }
                        >
                          <td className="px-3 py-2">
                            <Input
                              value={p.familyName}
                              onChange={(e) =>
                                updatePending(p.key, {
                                  familyName: e.target.value,
                                })
                              }
                              disabled={
                                busy || p.status === "uploading" ||
                                p.status === "uploaded"
                              }
                              className="h-8"
                            />
                            <div className="text-[11px] text-muted-foreground mt-1 truncate">
                              {p.file.name} · {(p.file.size / 1024).toFixed(0)} KB
                              {p.status === "error" && p.errorMessage && (
                                <span className="text-destructive">
                                  {" "}
                                  · {p.errorMessage}
                                </span>
                              )}
                              {p.status === "uploading" && (
                                <span> · uploading…</span>
                              )}
                              {p.status === "uploaded" && (
                                <span className="text-emerald-600">
                                  {" "}
                                  · done
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <Select
                              value={String(p.weight)}
                              onValueChange={(v) =>
                                updatePending(p.key, { weight: Number(v) })
                              }
                              disabled={
                                busy || p.status === "uploading" ||
                                p.status === "uploaded"
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {WEIGHTS.map((w) => (
                                  <SelectItem key={w} value={String(w)}>
                                    {w}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <Select
                              value={p.style}
                              onValueChange={(v) =>
                                updatePending(p.key, {
                                  style: v as "normal" | "italic",
                                })
                              }
                              disabled={
                                busy || p.status === "uploading" ||
                                p.status === "uploaded"
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="italic">Italic</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2 align-top text-[11px] text-muted-foreground">
                            {p.fromBinary ? "binary" : "filename"}
                          </td>
                          <td className="px-3 py-2 align-top">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => removePending(p.key)}
                              disabled={busy || p.status === "uploading"}
                              aria-label="Remove from queue"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-t">
                  <div className="text-xs text-muted-foreground">
                    {queuedCount === 0
                      ? "All processed."
                      : `${queuedCount} ready to upload`}
                  </div>
                  <div className="flex items-center gap-2">
                    {pending.some((p) => p.status === "uploaded") && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearUploaded}
                        disabled={busy}
                      >
                        Clear done
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={uploadAll}
                      disabled={busy || queuedCount === 0}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {busy
                        ? "Uploading…"
                        : queuedCount > 1
                          ? `Upload ${queuedCount} fonts`
                          : "Upload"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Library */}
          <div className="space-y-2">
            <Label>Your fonts ({fonts.length})</Label>
            {fonts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No custom fonts uploaded yet.
              </p>
            ) : (
              <ScrollArea className="h-56 rounded-md border">
                <ul className="divide-y">
                  {fonts.map((font) => (
                    <li
                      key={font.id}
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-base truncate"
                          style={{
                            fontFamily: font.familyName,
                            fontWeight: font.weight,
                            fontStyle: font.style,
                          }}
                        >
                          {font.familyName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {font.weight} · {font.style} · .{font.format}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(font)}
                        disabled={busy}
                        aria-label={`Remove ${font.familyName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
