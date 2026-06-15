"use client";

import { NodeViewWrapper } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  ShieldCheck,
  BadgeCheck,
  ListChecks,
  KeyRound,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { subscribeEmbedRefresh } from "@/lib/realtime/embed-refresh";

interface CardMeta {
  id: string;
  name: string;
  code: string | null;
  canvas_type: string;
  visibility: string;
  updated_at: string;
  owner: string | null;
}

const REF_TYPE_META: Record<string, { label: string; icon: LucideIcon }> = {
  template: { label: "Template", icon: FileText },
  policy: { label: "Policy", icon: ShieldCheck },
  standard: { label: "Standard", icon: BadgeCheck },
  checklist: { label: "Checklist", icon: ListChecks },
  authority: { label: "Authority", icon: KeyRound },
  document: { label: "Document", icon: FileText },
};

function relativeTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    const date = new Date(iso);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return null;
  }
}

/**
 * Phase 3: renders the live reference card for a `docReference` node. Fetches
 * lightweight metadata from /api/canvas/meta/[docId], stays fresh via the embed
 * refresh bus (so a rename / recode in another tab reflects here), and clicks
 * through to the referenced document.
 */
function DocReferenceNodeView({
  node,
  selected,
}: {
  node: any;
  selected: boolean;
}) {
  const router = useRouter();
  const docId: string | null = node.attrs.docId ?? null;
  const refType: string = node.attrs.refType ?? "document";
  const cachedLabel: string | null = node.attrs.label ?? null;
  const cachedCode: string | null = node.attrs.code ?? null;

  const [meta, setMeta] = useState<CardMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeMeta = REF_TYPE_META[refType] ?? REF_TYPE_META.document;
  const TypeIcon = typeMeta.icon;

  const fetchMeta = useCallback(async () => {
    if (!docId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/canvas/meta/${docId}`);
      if (!res.ok) {
        throw new Error(
          res.status === 404 ? "Referenced document not found" : "Couldn't load"
        );
      }
      const data = (await res.json()) as CardMeta;
      setMeta(data);
    } catch (err: any) {
      setError(err?.message || "Couldn't load");
    } finally {
      setLoading(false);
    }
  }, [docId]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  // Stay in sync if the referenced document is edited / renamed elsewhere.
  const fetchRef = useRef(fetchMeta);
  fetchRef.current = fetchMeta;
  useEffect(() => {
    if (!docId) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fetchRef.current(), 400);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") schedule();
    };
    const unsub = subscribeEmbedRefresh(docId, schedule);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      if (timer) clearTimeout(timer);
      unsub();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [docId]);

  const title = meta?.name || cachedLabel || "Untitled document";
  const code = meta?.code ?? cachedCode;
  const updated = relativeTime(meta?.updated_at);

  const open = () => {
    if (docId) router.push(`/protected/playbook/${docId}`);
  };

  return (
    <NodeViewWrapper
      className={`doc-reference-card${selected ? " is-selected" : ""}`}
      data-ref-type={refType}
    >
      <div
        className="doc-reference-card__inner"
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        }}
        title="Open referenced document"
      >
        <div className="doc-reference-card__icon" aria-hidden>
          <TypeIcon className="h-5 w-5" />
        </div>

        <div className="doc-reference-card__body">
          <div className="doc-reference-card__top">
            <span className="doc-reference-card__type">{typeMeta.label}</span>
            {code && <span className="doc-reference-card__code">{code}</span>}
          </div>
          <div className="doc-reference-card__title">{title}</div>
          <div className="doc-reference-card__meta">
            {error ? (
              <span className="doc-reference-card__error">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden /> {error}
              </span>
            ) : (
              <>
                {meta?.owner && (
                  <span className="doc-reference-card__owner">{meta.owner}</span>
                )}
                {updated && (
                  <span className="doc-reference-card__updated">
                    Updated {updated}
                  </span>
                )}
                {loading && !meta && (
                  <span className="doc-reference-card__loading">Loading…</span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="doc-reference-card__actions">
          <button
            type="button"
            className="doc-reference-card__refresh"
            title="Refresh card"
            onClick={(e) => {
              e.stopPropagation();
              fetchMeta();
            }}
          >
            <RefreshCw
              className={`h-3.5 w-3.5${loading ? " doc-reference-card__spin" : ""}`}
              aria-hidden
            />
          </button>
          <ExternalLink
            className="h-4 w-4 doc-reference-card__open"
            aria-hidden
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export default DocReferenceNodeView;
