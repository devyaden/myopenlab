"use client";

import { useState } from "react";

/**
 * Shown when a save is rejected because the document changed elsewhere since it
 * was loaded (optimistic-concurrency conflict, or a newer version observed via
 * realtime while there are local edits). Nothing is lost: the losing side is
 * backed up to localStorage before either choice is applied.
 */
export function ConflictDialog({
  mineHtml,
  theirsHtml,
  onKeepMine,
  onTakeTheirs,
  onClose,
}: {
  mineHtml: string;
  theirsHtml: string;
  onKeepMine: () => void;
  onTakeTheirs: () => void;
  onClose: () => void;
}) {
  const [showDiff, setShowDiff] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            This document changed elsewhere
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Someone (or another tab/the AI) saved a newer version while you were
            editing. Choose which to keep — the other version is saved to a local
            backup, so nothing is lost.
          </p>
        </div>

        {showDiff && (
          <div className="grid grid-cols-2 gap-px overflow-auto border-b bg-gray-200">
            <div className="bg-white p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
                Your version
              </div>
              <div
                className="prose prose-sm max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: mineHtml }}
              />
            </div>
            <div className="bg-white p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                Their version
              </div>
              <div
                className="prose prose-sm max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: theirsHtml }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 px-6 py-4">
          <button
            type="button"
            onClick={() => setShowDiff((v) => !v)}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            {showDiff ? "Hide comparison" : "View comparison"}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Decide later
            </button>
            <button
              type="button"
              onClick={onTakeTheirs}
              className="rounded border border-emerald-600 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              Take theirs
            </button>
            <button
              type="button"
              onClick={onKeepMine}
              className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Keep mine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConflictDialog;
