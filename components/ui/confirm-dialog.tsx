"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/**
 * ConfirmDialog with blast-radius — the Atlas guard for destructive / hard-to-undo
 * actions. Shows what happens AND what else will be affected (e.g. references that
 * will break), in plain language, before the user commits. Foolproof law: nothing
 * destructive happens without a clear, consequence-aware confirmation.
 */
export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  /** Plain-language list of side effects ("3 references will break", …). */
  blastRadius?: React.ReactNode[];
  blastRadiusLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  blastRadius,
  blastRadiusLabel = "This will also:",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 font-display">
            {destructive && (
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
            )}
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {blastRadius && blastRadius.length > 0 && (
          <div className="rounded-md border border-attention/40 bg-attention-tint px-3 py-2.5 text-sm">
            <p className="mb-1 font-medium text-attention-text">
              {blastRadiusLabel}
            </p>
            <ul className="list-inside list-disc space-y-0.5 text-foreground/90">
              {blastRadius.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={(e) => {
              // Keep the dialog controlled by the caller (await async work, then close).
              e.preventDefault();
              void onConfirm();
            }}
            className={cn(
              destructive &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {loading ? "Working…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmDialog;
