"use client";

import { useEffect, useState } from "react";
import {
  joinDocumentPresence,
  type PresenceUser,
} from "@/lib/realtime/document-presence";

/**
 * A small stack of avatars for the OTHER people currently editing this document.
 * Renders nothing when you're alone. Backed by Supabase Realtime presence
 * (best-effort).
 */
export function PresenceAvatars({
  canvasId,
  self,
}: {
  canvasId: string;
  self: PresenceUser;
}) {
  const [others, setOthers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!canvasId || !self.id) return;
    const { leave } = joinDocumentPresence(canvasId, self, setOthers);
    return leave;
  }, [canvasId, self.id, self.name, self.color]);

  if (others.length === 0) return null;

  const shown = others.slice(0, 3);
  const extra = others.length - shown.length;
  const title = `${others.map((o) => o.name).join(", ")} ${
    others.length === 1 ? "is" : "are"
  } editing`;

  return (
    <div className="flex items-center" title={title}>
      <div className="flex -space-x-2">
        {shown.map((o) => (
          <div
            key={o.id}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow-sm"
            style={{ backgroundColor: o.color }}
          >
            {(o.name || "?").slice(0, 1).toUpperCase()}
          </div>
        ))}
      </div>
      {extra > 0 && (
        <span className="ml-1 text-xs text-gray-500">+{extra}</span>
      )}
    </div>
  );
}

export default PresenceAvatars;
