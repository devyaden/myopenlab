"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAgentStore } from "@/lib/store/useAgent";
import { useCanvasStore } from "@/lib/store/useCanvas";
import { useDocumentStore } from "@/components/editor/hooks/useDocument";
import { emitEmbedRefresh } from "@/lib/realtime/embed-refresh";
import { emitLibraryRefresh } from "@/lib/realtime/library-refresh";
import { playbookHref } from "@/lib/playbook-href";
import { useT } from "@/lib/i18n/LocaleProvider";
import { AgentIntents, type AgentIntent } from "@/components/agent/AgentIntents";
import { toolLabelKey } from "@/lib/agent/tool-labels";
import {
  blocksToTiptapDoc,
  blocksToPlainText,
} from "@/lib/agent/document-blocks";
import ReactFlow, { Background } from "reactflow";
import "reactflow/dist/style.css";
import {
  edgeTypes,
  nodeTypes,
  onReactFlowError,
} from "@/components/canvas-new/flow-config";
import {
  X,
  Send,
  Paperclip,
  Loader2,
  History,
  Plus,
  Sparkles,
  Check,
  ArrowUpRight,
} from "lucide-react";

interface Proposal {
  id: string;
  // The persisted agent_proposal row id (when the server has stored it), used to
  // update its status on apply and to restore proposals when a conversation is reopened.
  dbId?: string;
  kind: "create" | "update" | "patch" | "link";
  target?: "canvas" | "document" | "directory" | "reference"; // absent ⇒ "canvas" (back-compat)
  name?: string;
  code?: string | null;
  folder_id?: string | null;
  canvas_id?: string | null;
  diagram?: { nodes: any[]; edges: any[]; nodeStyles: Record<string, any> };
  body?: any[]; // document block list (target === "document")
  directory_kind?: "person" | "role"; // target === "directory"
  people?: any[]; // directory rows (target === "directory")
  // Phase D: fine-grained edits (kind === "patch") + links (kind === "link").
  ops?: any[];
  diff?: { before?: any; after?: any };
  reference?: {
    fromCanvas: string;
    fromNode?: string | null;
    toCanvas?: string | null;
    toCode?: string | null;
    toNode?: string | null;
    type: string;
  };
  status: "pending" | "applied" | "discarded" | "failed";
  // Set once applied so the chat can offer an inline "Open" link (instead of
  // navigating away on apply, which used to destroy the chat).
  appliedCanvasId?: string | null;
  appliedType?: string | null; // canvas_type used to route the Open link
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  proposals?: Proposal[];
}

interface PendingAttachment {
  id: string;
  file_name: string;
  kind: string;
}

interface ConversationSummary {
  id: string;
  title: string | null;
  updated_at: string;
}

// A short one-line label for a document block (for the diff preview).
function blockLabel(b: any): string {
  const t = blocksToPlainText([b], 80).trim();
  return t || `(${b?.type ?? "block"})`;
}

// Order-insensitive multiset diff of two string arrays → added / removed.
function multisetDiff(
  before: string[],
  after: string[]
): { added: string[]; removed: string[] } {
  const count = (arr: string[]) => {
    const m = new Map<string, number>();
    for (const x of arr) m.set(x, (m.get(x) ?? 0) + 1);
    return m;
  };
  const bm = count(before);
  const am = count(after);
  const removed: string[] = [];
  const added: string[] = [];
  bm.forEach((c, k) => {
    for (let i = 0; i < c - (am.get(k) ?? 0); i++) removed.push(k);
  });
  am.forEach((c, k) => {
    for (let i = 0; i < c - (bm.get(k) ?? 0); i++) added.push(k);
  });
  return { added, removed };
}

// Red/green +/- diff rows shared by the patch previews.
function DiffRows({ added, removed }: { added: string[]; removed: string[] }) {
  const t = useT();
  if (added.length === 0 && removed.length === 0)
    return (
      <p className="text-xs text-muted-foreground">
        {t("agent.proposal.noChanges")}
      </p>
    );
  return (
    <ul className="space-y-0.5 font-mono text-[11px] leading-relaxed">
      {removed.map((t, i) => (
        <li key={`r${i}`} className="text-destructive">
          − {t}
        </li>
      ))}
      {added.map((t, i) => (
        <li key={`a${i}`} className="text-green-600">
          + {t}
        </li>
      ))}
    </ul>
  );
}

function ProposalPreview({
  proposal,
  onApply,
  applying,
  disabled,
}: {
  proposal: Proposal;
  onApply: () => void;
  applying: boolean;
  disabled?: boolean;
}) {
  const t = useT();
  const isDocument = proposal.target === "document";
  const isDirectory = proposal.target === "directory";
  const isPatch = proposal.kind === "patch";
  const isLink = proposal.kind === "link";

  // Once applied, offer a link to the artifact instead of navigating on apply —
  // the chat stays open and the other proposals remain applyable.
  const openLink =
    proposal.status === "applied" && proposal.appliedCanvasId ? (
      // Client-side navigation (Next <Link>) so the layout-mounted chat survives —
      // the user can view the new artifact and come back to apply the rest.
      <Link
        href={playbookHref(proposal.appliedCanvasId, proposal.appliedType)}
        className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        {t("agent.proposal.open")} <ArrowUpRight size={12} />
      </Link>
    ) : null;

  const statusBadge =
    proposal.status === "applied" ? (
      <span className="flex items-center gap-1 text-xs text-green-600">
        <Check size={13} /> {t("agent.proposal.applied")}
      </span>
    ) : proposal.status === "failed" ? (
      <span className="text-xs text-destructive">{t("agent.proposal.failed")}</span>
    ) : proposal.status === "discarded" ? (
      <span className="text-xs text-muted-foreground">
        {t("agent.proposal.discarded")}
      </span>
    ) : null;

  const headerRight = (
    <div className="flex items-center gap-2">
      {openLink}
      {statusBadge}
    </div>
  );

  // Apply when pending; Retry when a previous apply failed.
  const footer =
    proposal.status === "pending" || proposal.status === "failed" ? (
      <div className="flex justify-end gap-2 border-t px-3 py-2">
        <button
          onClick={onApply}
          disabled={applying || disabled}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {applying ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Check size={13} />
          )}
          {proposal.status === "failed"
            ? t("agent.proposal.retry")
            : t("agent.proposal.apply")}
        </button>
      </div>
    ) : null;

  // ── Link proposal (a typed cross-reference) ────────────────────────────────
  if (isLink) {
    const r = proposal.reference;
    const to = r?.toCode || r?.toCanvas || "target";
    return (
      <div className="rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-xs font-medium">{t("agent.proposal.newLink")}</span>
          {headerRight}
        </div>
        <div className="px-3 py-2 text-xs">
          <span className="font-mono text-green-600">
            ＋ {r?.fromNode ? "step → " : "this → "}
            {to}
          </span>
          <span className="ml-1 text-muted-foreground">({r?.type})</span>
        </div>
        {footer}
      </div>
    );
  }

  // ── Patch proposal: document block diff ────────────────────────────────────
  if (isPatch && isDocument) {
    const before = (proposal.diff?.before ?? []) as any[];
    const after = (proposal.diff?.after ?? []) as any[];
    const { added, removed } = multisetDiff(
      before.map(blockLabel),
      after.map(blockLabel)
    );
    return (
      <div className="rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-xs font-medium">{t("agent.proposal.editDocument")}</span>
          {headerRight}
        </div>
        <div className="max-h-[220px] overflow-y-auto px-3 py-2">
          <DiffRows added={added} removed={removed} />
        </div>
        <div className="border-t px-3 py-1 text-[10px] text-muted-foreground">
          {proposal.ops?.length ?? 0} op{(proposal.ops?.length ?? 0) === 1 ? "" : "s"}
        </div>
        {footer}
      </div>
    );
  }

  // ── Patch proposal: directory row diff ─────────────────────────────────────
  if (isPatch && isDirectory) {
    const before = (proposal.diff?.before ?? []) as any[];
    const after = (proposal.diff?.after ?? []) as any[];
    const label = (n: any) => String(n?.data?.label ?? n?.label ?? "(row)");
    const { added, removed } = multisetDiff(before.map(label), after.map(label));
    return (
      <div className="rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-xs font-medium">{t("agent.proposal.editDirectory")}</span>
          {headerRight}
        </div>
        <div className="max-h-[220px] overflow-y-auto px-3 py-2">
          <DiffRows added={added} removed={removed} />
        </div>
        {footer}
      </div>
    );
  }

  // ── Patch proposal: canvas (flow) diff — preview the resulting flow + delta ─
  if (isPatch) {
    const beforeNodes = (proposal.diff?.before?.nodes ?? []) as any[];
    const afterDiagram = proposal.diff?.after ?? { nodes: [], edges: [] };
    const label = (n: any) => String(n?.data?.label ?? n?.id ?? "(node)");
    const { added, removed } = multisetDiff(
      beforeNodes.map(label),
      (afterDiagram.nodes ?? []).map(label)
    );
    const nodes = (afterDiagram.nodes ?? []).map((n: any) => ({
      ...n,
      width: n.width || 120,
      height: n.height || 60,
    }));
    const edges = (afterDiagram.edges ?? []).map((e: any) => ({
      ...e,
      type: "custom",
      sourceHandle: e.sourceHandle || "g",
      targetHandle: e.targetHandle || "d",
    }));
    return (
      <div className="rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-xs font-medium">{t("agent.proposal.editFlow")}</span>
          {headerRight}
        </div>
        <div className="h-[180px] w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onError={onReactFlowError}
            fitView
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background />
          </ReactFlow>
        </div>
        {(added.length > 0 || removed.length > 0) && (
          <div className="max-h-[120px] overflow-y-auto border-t px-3 py-2">
            <DiffRows added={added} removed={removed} />
          </div>
        )}
        {footer}
      </div>
    );
  }

  if (isDirectory) {
    const people = proposal.people ?? [];
    return (
      <div className="rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-xs font-medium">
            {t("agent.proposal.newDirectory", {
              kind: proposal.directory_kind ?? "person",
              name: proposal.name ?? "Directory",
            })}
          </span>
          {headerRight}
        </div>
        <div className="max-h-[220px] overflow-y-auto px-3 py-2">
          {people.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              An empty directory (you can add rows after).
            </p>
          ) : (
            <ul className="space-y-0.5 text-xs text-muted-foreground">
              {people.slice(0, 30).map((p: any, i: number) => (
                <li key={i}>
                  • {String(p?.name ?? p?.label ?? p?.Name ?? `Row ${i + 1}`)}
                  {p?.role || p?.Role ? ` — ${p.role ?? p.Role}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t px-3 py-1 text-[10px] text-muted-foreground">
          {people.length} row{people.length === 1 ? "" : "s"}
        </div>
        {footer}
      </div>
    );
  }

  if (isDocument) {
    const summary = blocksToPlainText(proposal.body ?? [], 600);
    const blockCount = (proposal.body ?? []).length;
    return (
      <div className="rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-xs font-medium">
            {proposal.kind === "create"
              ? t("agent.proposal.newDocument", { name: proposal.name ?? "Untitled" })
              : t("agent.proposal.updateDocument")}
          </span>
          {headerRight}
        </div>
        <div className="max-h-[220px] overflow-y-auto px-3 py-2">
          <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-muted-foreground">
            {summary || "(empty document)"}
          </pre>
        </div>
        <div className="border-t px-3 py-1 text-[10px] text-muted-foreground">
          {blockCount} block{blockCount === 1 ? "" : "s"}
        </div>
        {footer}
      </div>
    );
  }

  const nodes = (proposal.diagram?.nodes ?? []).map((n: any) => ({
    ...n,
    width: n.width || 120,
    height: n.height || 60,
  }));
  const edges = (proposal.diagram?.edges ?? []).map((e: any) => ({
    ...e,
    type: "custom",
    sourceHandle: e.sourceHandle || "g",
    targetHandle: e.targetHandle || "d",
  }));
  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-medium">
          {proposal.kind === "create"
            ? t("agent.proposal.newPlaybook", { name: proposal.name ?? "Untitled" })
            : t("agent.proposal.updatePlaybook")}
        </span>
        {headerRight}
      </div>
      <div className="h-[200px] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onError={onReactFlowError}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
        </ReactFlow>
      </div>
      {proposal.status === "pending" && (
        <div className="flex justify-end gap-2 border-t px-3 py-2">
          <button
            onClick={onApply}
            disabled={applying}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {applying ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Check size={13} />
            )}
            {t("agent.proposal.apply")}
          </button>
        </div>
      )}
    </div>
  );
}

export function AgentChat() {
  const t = useT();
  const { isOpen, canvasId, close } = useAgentStore();
  // Phase E: a chosen intent chip is "armed" until the next send, which carries it.
  const [pendingIntent, setPendingIntent] = useState<string | null>(null);
  // Phase F3: context + budget meters (seeded on open, updated live per turn).
  const [usageMeter, setUsageMeter] = useState<{
    contextTokens: number;
    contextCap: number;
    daily: number;
    monthly: number;
    dailyLimit: number;
    monthlyLimit: number;
  } | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [toolActivity, setToolActivity] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applyingAll, setApplyingAll] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, liveText, toolActivity]);

  // Seed the budget meters when the panel opens (context fills in once a turn runs).
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetch("/api/ai/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j || j.unlimited) return;
        setUsageMeter((cur) => ({
          contextTokens: cur?.contextTokens ?? 0,
          contextCap: j.contextCap ?? 0,
          daily: j.daily ?? 0,
          monthly: j.monthly ?? 0,
          dailyLimit: j.dailyLimit ?? 0,
          monthlyLimit: j.monthlyLimit ?? 0,
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/ai/agent/conversations");
    if (res.ok) {
      const json = await res.json();
      setConversations(json.conversations ?? []);
    }
  }, []);

  const startNewChat = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setAttachments([]);
    setShowHistory(false);
  }, []);

  const openConversation = useCallback(async (id: string) => {
    const res = await fetch(`/api/ai/agent/conversations/${id}`);
    if (!res.ok) return;
    const json = await res.json();

    // Tag each message with the user-turn it belongs to (the server stamps each
    // proposal with the same ordinal = count of prior user turns), so restored
    // proposals re-attach to the right assistant bubble.
    let turn = -1;
    const tagged = (json.messages ?? [])
      .filter((m: any) => m.role === "user" || m.role === "assistant")
      .map((m: any) => {
        const blocks = Array.isArray(m.content) ? m.content : [];
        // Tool-result turns are stored with role "user" (and a near-cap wrap-up
        // turn even carries a text block) — they aren't real user turns and must
        // not be shown or counted.
        const isToolTurn =
          m.role === "user" && blocks.some((b: any) => b?.type === "tool_result");
        if (m.role === "user" && !isToolTurn) turn += 1;
        const text = blocks
          .filter((b: any) => b.type === "text")
          .map((b: any) => b.text)
          .join("\n");
        return { role: m.role as "user" | "assistant", text, turn, isToolTurn };
      });

    // Group restored proposals by their turn ordinal.
    const proposalsByTurn = new Map<number, Proposal[]>();
    for (const p of json.proposals ?? []) {
      const src = p.proposal_json ?? {};
      const target = src.target;
      const appliedType =
        target === "document"
          ? "document"
          : target === "directory"
          ? "table"
          : "canvas";
      const restored: Proposal = {
        ...src,
        id: `db-${p.id}`,
        dbId: p.id,
        status: p.status ?? "pending",
        appliedCanvasId: p.applied_canvas_id ?? undefined,
        appliedType,
      };
      const arr = proposalsByTurn.get(p.message_ordinal) ?? [];
      arr.push(restored);
      proposalsByTurn.set(p.message_ordinal, arr);
    }

    // The last assistant message (with text) of each turn carries that turn's
    // proposals — mirroring how they render live.
    const lastAsstIdx = new Map<number, number>();
    tagged.forEach((m: any, i: number) => {
      if (m.role === "assistant" && m.text.trim().length > 0)
        lastAsstIdx.set(m.turn, i);
    });

    const loaded: ChatMessage[] = [];
    tagged.forEach((m: any, i: number) => {
      if (m.isToolTurn) return; // tool-result turns (incl. any wrap-up nudge) aren't shown
      if (m.text.trim().length === 0) return; // drop tool-only bubbles
      const msg: ChatMessage = { role: m.role, text: m.text };
      if (m.role === "assistant" && lastAsstIdx.get(m.turn) === i) {
        const props = proposalsByTurn.get(m.turn);
        if (props?.length) msg.proposals = props;
      }
      loaded.push(msg);
    });
    // Any turn whose assistant bubble had no text still needs its proposals shown.
    proposalsByTurn.forEach((props, t) => {
      if (!lastAsstIdx.has(t) && props.length) {
        loaded.push({ role: "assistant", text: "Proposed changes", proposals: props });
      }
    });

    setConversationId(id);
    setMessages(loaded);
    setShowHistory(false);
  }, []);

  const handleAttach = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", file);
        if (conversationId) form.append("conversationId", conversationId);
        if (canvasId) form.append("canvasId", canvasId);
        const res = await fetch("/api/ai/agent/upload", {
          method: "POST",
          body: form,
        });
        const json = await res.json();
        if (res.ok) {
          if (json.conversationId) setConversationId(json.conversationId);
          setAttachments((a) => [...a, json.attachment]);
        }
      } finally {
        setUploading(false);
      }
    },
    [conversationId, canvasId]
  );

  const markApplied = useCallback(
    (
      msgIdx: number,
      proposalId: string,
      applied?: { canvasId?: string | null; type?: string | null }
    ) => {
      setMessages((prev) =>
        prev.map((m, i) =>
          i === msgIdx
            ? {
                ...m,
                proposals: m.proposals?.map((p) =>
                  p.id === proposalId
                    ? {
                        ...p,
                        status: "applied",
                        appliedCanvasId: applied?.canvasId ?? p.appliedCanvasId,
                        appliedType: applied?.type ?? p.appliedType,
                      }
                    : p
                ),
              }
            : m
        )
      );
    },
    []
  );

  const markFailed = useCallback((msgIdx: number, proposalId: string) => {
    setMessages((prev) =>
      prev.map((m, i) =>
        i === msgIdx
          ? {
              ...m,
              proposals: m.proposals?.map((p) =>
                p.id === proposalId ? { ...p, status: "failed" } : p
              ),
            }
          : m
      )
    );
  }, []);

  // Commits a single proposal. Never navigates — on a successful create it records
  // the new id so the chat can show an inline "Open" link, keeping the conversation
  // (and any sibling proposals) intact. Returns true on success.
  const applyProposal = useCallback(
    async (msgIdx: number, proposal: Proposal): Promise<boolean> => {
      setApplyingId(proposal.id);
      try {
        // ── Patch proposals (fine-grained edits) ────────────────────────────
        // The server re-resolves the ops against the latest artifact and returns
        // the result, so an open editor can adopt it instantly.
        if (proposal.kind === "patch") {
          const res = await fetch("/api/ai/agent/apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: "patch",
              target: proposal.target ?? "canvas",
              canvas_id: proposal.canvas_id,
              ops: proposal.ops ?? [],
              proposalId: proposal.dbId,
            }),
          });
          const json = await res.json();
          if (!res.ok) {
            markFailed(msgIdx, proposal.id);
            return false;
          }
          const type =
            proposal.target === "document"
              ? "document"
              : proposal.target === "directory"
                ? "table"
                : "canvas";
          markApplied(msgIdx, proposal.id, {
            canvasId: proposal.canvas_id,
            type,
          });
          if (proposal.target === "document" && proposal.canvas_id) {
            const docStore = useDocumentStore.getState();
            if (docStore.canvas_id === proposal.canvas_id && Array.isArray(json.body)) {
              docStore.applyDocumentContent(
                blocksToTiptapDoc(json.body),
                typeof json.version === "number" ? json.version : undefined
              );
            }
          } else if (proposal.canvas_id) {
            // canvas or directory: refresh the open flow + any embeds of it.
            if (
              (!proposal.target || proposal.target === "canvas") &&
              json.diagram
            ) {
              const store = useCanvasStore.getState();
              if (store.id === proposal.canvas_id) {
                store.initializeWithAIData({
                  nodes: json.diagram.nodes,
                  edges: json.diagram.edges,
                  nodeStyles: json.diagram.nodeStyles,
                });
              }
            }
            emitEmbedRefresh(proposal.canvas_id);
          }
          return true;
        }

        // ── Link proposals (a typed cross-reference) ────────────────────────
        if (proposal.kind === "link") {
          const res = await fetch("/api/ai/agent/apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: "link",
              reference: proposal.reference,
              proposalId: proposal.dbId,
            }),
          });
          const json = await res.json();
          if (!res.ok) {
            markFailed(msgIdx, proposal.id);
            return false;
          }
          markApplied(msgIdx, proposal.id, {
            canvasId: json.canvasId ?? proposal.reference?.fromCanvas ?? null,
          });
          return true;
        }

        // ── Directory proposals ─────────────────────────────────────────────
        if (proposal.target === "directory") {
          const res = await fetch("/api/ai/agent/apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: "create",
              target: "directory",
              name: proposal.name ?? "Directory",
              code: proposal.code ?? null,
              folder_id: proposal.folder_id ?? null,
              directory_kind: proposal.directory_kind ?? "person",
              people: proposal.people ?? [],
              proposalId: proposal.dbId,
            }),
          });
          const json = await res.json();
          if (!res.ok) {
            markFailed(msgIdx, proposal.id);
            return false;
          }
          // A directory is a Table canvas — link it on the playbook route.
          markApplied(msgIdx, proposal.id, {
            canvasId: json.canvasId,
            type: "table",
          });
          // A new item entered the library — refresh the sidebar + pickers.
          emitLibraryRefresh();
          return true;
        }

        // ── Document proposals ──────────────────────────────────────────────
        // Always commit through the API (it writes document_data, the history
        // snapshot, and reconciles cross-references). If the targeted document
        // is the one open in the editor, also push the content in instantly so
        // it re-renders without a flash.
        if (proposal.target === "document") {
          const res = await fetch("/api/ai/agent/apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              proposal.kind === "create"
                ? {
                    kind: "create",
                    target: "document",
                    name: proposal.name ?? "Untitled Document",
                    code: proposal.code ?? null,
                    folder_id: proposal.folder_id ?? null,
                    body: proposal.body ?? [],
                    proposalId: proposal.dbId,
                  }
                : {
                    kind: "update",
                    target: "document",
                    canvas_id: proposal.canvas_id,
                    body: proposal.body ?? [],
                    proposalId: proposal.dbId,
                  }
            ),
          });
          const json = await res.json();
          if (!res.ok) {
            markFailed(msgIdx, proposal.id);
            return false;
          }
          const newId =
            proposal.kind === "create" ? json.canvasId : proposal.canvas_id;
          markApplied(msgIdx, proposal.id, {
            canvasId: newId,
            type: "document",
          });
          if (proposal.kind === "create") {
            // A new document entered the library — refresh the sidebar + pickers.
            emitLibraryRefresh();
          }
          const docStore = useDocumentStore.getState();
          if (
            proposal.kind === "update" &&
            proposal.canvas_id &&
            docStore.canvas_id === proposal.canvas_id
          ) {
            // The edited document is open — re-render it instantly, adopting
            // the server's new version so the next user save doesn't conflict.
            docStore.applyDocumentContent(
              blocksToTiptapDoc(proposal.body ?? []),
              typeof json.version === "number" ? json.version : undefined
            );
          }
          return true;
        }

        // ── Canvas update to the playbook that's currently open ─────────────
        // Apply straight into the canvas store so it renders instantly.
        // syncChanges() persists through the normal save path (history snapshot
        // included) — no separate API write needed.
        if (proposal.kind === "update" && proposal.canvas_id && proposal.diagram) {
          const store = useCanvasStore.getState();
          if (store.id === proposal.canvas_id) {
            store.initializeWithAIData({
              nodes: proposal.diagram.nodes,
              edges: proposal.diagram.edges,
              nodeStyles: proposal.diagram.nodeStyles,
            });
            // Persist in the background so the spinner clears immediately.
            void store.syncChanges();
            // Nudge any document embedding this canvas to refetch now.
            emitEmbedRefresh(proposal.canvas_id);
            markApplied(msgIdx, proposal.id, {
              canvasId: proposal.canvas_id,
              type: "canvas",
            });
            return true;
          }
        }

        // ── Otherwise commit via the API (create, or update to a playbook that
        //    isn't the one currently open). ─────────────────────────────────
        const body =
          proposal.kind === "create"
            ? {
                kind: "create",
                name: proposal.name ?? "Untitled Playbook",
                code: proposal.code ?? null,
                folder_id: proposal.folder_id ?? null,
                diagram: proposal.diagram,
                proposalId: proposal.dbId,
              }
            : {
                kind: "update",
                canvas_id: proposal.canvas_id,
                diagram: proposal.diagram,
                proposalId: proposal.dbId,
              };
        const res = await fetch("/api/ai/agent/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) {
          markFailed(msgIdx, proposal.id);
          return false;
        }
        // An update committed via the API targets a canvas that isn't the one
        // open in the editor — exactly the case a document embed cares about.
        if (proposal.kind === "update" && proposal.canvas_id) {
          emitEmbedRefresh(proposal.canvas_id);
        }
        const newId =
          proposal.kind === "create" ? json.canvasId : proposal.canvas_id;
        markApplied(msgIdx, proposal.id, { canvasId: newId, type: "canvas" });
        if (proposal.kind === "create") {
          // A new playbook entered the library — refresh the sidebar + pickers.
          emitLibraryRefresh();
        }
        return true;
      } catch {
        markFailed(msgIdx, proposal.id);
        return false;
      } finally {
        setApplyingId(null);
      }
    },
    [markApplied, markFailed]
  );

  // Applies every still-pending proposal in an assistant message, in the order
  // the agent emitted them (its intended dependency order — e.g. a flow before
  // the process page that embeds it). Continues past failures and reports them.
  const applyAll = useCallback(
    async (msgIdx: number, proposals: Proposal[]) => {
      setApplyingAll(true);
      try {
        for (const p of proposals) {
          if (p.status !== "pending" && p.status !== "failed") continue;
          // eslint-disable-next-line no-await-in-loop
          await applyProposal(msgIdx, p);
        }
      } finally {
        setApplyingAll(false);
      }
    },
    [applyProposal]
  );

  const send = useCallback(async (overrideText?: string, intent?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || streaming) return;
    if (overrideText === undefined) setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setStreaming(true);
    setLiveText("");
    setToolActivity(null);

    const attachmentIds = attachments.map((a) => a.id);
    setAttachments([]);

    // Accumulators captured outside React state for the stream lifetime.
    let acc = "";
    const collectedProposals: Proposal[] = [];

    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId: conversationId ?? undefined,
          canvasId: canvasId ?? undefined,
          attachmentIds: attachmentIds.length ? attachmentIds : undefined,
          intent: intent ?? undefined,
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: err.message || err.error || "Something went wrong.",
          },
        ]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          let event: any;
          try {
            event = JSON.parse(line.slice(5).trim());
          } catch {
            continue;
          }
          if (event.type === "meta" && event.conversationId) {
            setConversationId(event.conversationId);
          } else if (event.type === "delta") {
            acc += event.text;
            setLiveText(acc);
          } else if (event.type === "tool") {
            setToolActivity(event.name);
          } else if (event.type === "proposal") {
            collectedProposals.push({
              ...event.proposal,
              id: event.id,
              dbId: event.dbId,
              status: "pending",
            });
          } else if (event.type === "usage") {
            setUsageMeter({
              contextTokens: event.contextTokens ?? 0,
              contextCap: event.contextCap ?? 0,
              daily: event.daily ?? 0,
              monthly: event.monthly ?? 0,
              dailyLimit: event.dailyLimit ?? 0,
              monthlyLimit: event.monthlyLimit ?? 0,
            });
          } else if (event.type === "error") {
            acc += `\n\n⚠️ ${event.message}`;
            setLiveText(acc);
          }
        }
      }
    } catch {
      acc += "\n\n⚠️ Connection interrupted.";
    } finally {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: acc || "(no response)",
          proposals: collectedProposals.length ? collectedProposals : undefined,
        },
      ]);
      setLiveText("");
      setToolActivity(null);
      setStreaming(false);
    }
  }, [input, streaming, attachments, conversationId, canvasId]);

  // Send the textarea content, carrying any armed intent, then disarm it.
  const submit = useCallback(() => {
    void send(undefined, pendingIntent ?? undefined);
    setPendingIntent(null);
  }, [send, pendingIntent]);

  // An intent chip: if there's text, send now with that intent; otherwise arm it
  // (toggle) so the next message carries it, and focus the input.
  const handleIntent = useCallback(
    (intent: AgentIntent) => {
      const text = input.trim();
      if (text) {
        void send(text, intent);
        setInput("");
        setPendingIntent(null);
      } else {
        setPendingIntent((cur) => (cur === intent ? null : intent));
        inputRef.current?.focus();
      }
    },
    [input, send]
  );

  if (!isOpen) return null;

  return (
    <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[440px] flex-col border-l bg-background shadow-2xl rtl:left-0 rtl:right-auto rtl:border-l-0 rtl:border-r">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <span className="font-semibold">{t("agent.title")}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setShowHistory((s) => !s);
              if (!showHistory) loadConversations();
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            title={t("agent.history")}
          >
            <History size={17} />
          </button>
          <button
            onClick={startNewChat}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            title={t("agent.newChat")}
          >
            <Plus size={17} />
          </button>
          <button
            onClick={close}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            title={t("agent.close")}
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {showHistory && (
        <div className="max-h-48 overflow-y-auto border-b bg-muted/30">
          {conversations.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              {t("agent.noConversations")}
            </p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => openConversation(c.id)}
                className="block w-full truncate px-4 py-2 text-left text-sm hover:bg-muted"
              >
                {c.title || t("agent.untitled")}
              </button>
            ))
          )}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && !streaming && (
          <div className="mt-8 text-sm text-muted-foreground">
            <Sparkles size={28} className="mx-auto mb-3 text-primary/60" />
            <p className="text-center font-medium text-foreground">
              {t("agent.empty.title")}
            </p>
            <p className="mt-1 text-center">{t("agent.empty.hint")}</p>
            <div className="mx-auto mt-3 flex max-w-[320px] flex-col gap-1.5">
              {(["list", "create", "edit"] as const).map((k) => {
                const ex = t(`agent.examples.${k}`);
                return (
                  <button
                    key={k}
                    onClick={() => {
                      void send(ex, pendingIntent ?? undefined);
                      setPendingIntent(null);
                    }}
                    className="rounded-md border bg-background px-3 py-2 text-left text-xs text-foreground hover:bg-muted"
                  >
                    {ex}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex justify-center">
              <AgentIntents
                hasContext={Boolean(canvasId)}
                onPick={handleIntent}
              />
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="space-y-2">
            <div
              className={
                m.role === "user"
                  ? "ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground rtl:ml-0 rtl:mr-auto"
                  : "w-fit max-w-[90%] text-sm leading-relaxed text-foreground whitespace-pre-wrap"
              }
            >
              {m.text}
            </div>
            {m.proposals && m.proposals.length > 1 && (() => {
              const pendingCount = m.proposals.filter(
                (p) => p.status === "pending" || p.status === "failed"
              ).length;
              if (pendingCount < 2) return null;
              return (
                <button
                  onClick={() => applyAll(i, m.proposals!)}
                  disabled={applyingAll || applyingId !== null}
                  className="flex items-center gap-1.5 rounded-md border border-primary bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-60"
                >
                  {applyingAll ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Check size={13} />
                  )}
                  {t("agent.proposal.applyAll", { count: pendingCount })}
                </button>
              );
            })()}
            {m.proposals?.map((p) => (
              <ProposalPreview
                key={p.id}
                proposal={p}
                applying={applyingId === p.id}
                disabled={applyingAll}
                onApply={() => applyProposal(i, p)}
              />
            ))}
          </div>
        ))}

        {streaming && (
          <div className="space-y-1">
            {toolActivity && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 size={12} className="animate-spin" />
                {t(toolLabelKey(toolActivity))}
              </div>
            )}
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {liveText || (
                <span className="text-muted-foreground">{t("agent.thinking")}</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-3">
        {usageMeter && usageMeter.contextCap > 0 && (
          <div className="mb-2 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>
                {Math.round(
                  (usageMeter.contextTokens / usageMeter.contextCap) * 100
                )}
                % context
              </span>
              {usageMeter.dailyLimit > 0 && (
                <span>
                  {Math.round(
                    (usageMeter.daily / usageMeter.dailyLimit) * 100
                  )}
                  % daily tokens
                </span>
              )}
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full ${
                  usageMeter.contextTokens / usageMeter.contextCap > 0.8
                    ? "bg-destructive"
                    : "bg-primary"
                }`}
                style={{
                  width: `${Math.min(100, Math.round((usageMeter.contextTokens / usageMeter.contextCap) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}
        {!streaming &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "assistant" && (
            <button
              onClick={() => send("continue")}
              className="mb-2 flex items-center gap-1.5 rounded-md border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              title={t("agent.continueBuilding")}
            >
              <Sparkles size={13} className="text-primary" />
              {t("agent.continueBuilding")}
            </button>
          )}
        {/* Context-aware action chips (Create / Edit / Link / Optimize). */}
        {messages.length > 0 && (
          <div className="mb-2">
            <AgentIntents
              hasContext={Boolean(canvasId)}
              disabled={streaming}
              onPick={handleIntent}
            />
          </div>
        )}
        {pendingIntent && (
          <div className="mb-2 text-[11px] text-muted-foreground">
            {t(`agent.intents.${pendingIntent}`)} —{" "}
            {t(`agent.intents.${pendingIntent}Tip`)}
          </div>
        )}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {attachments.map((a) => (
              <span
                key={a.id}
                className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
              >
                {a.file_name}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,text/markdown,text/csv,.docx,.md,.csv,.txt"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAttach(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted disabled:opacity-50"
            title="Attach file"
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Paperclip size={18} />
            )}
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={t("agent.placeholder")}
            rows={1}
            className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={submit}
            disabled={streaming || !input.trim()}
            className="rounded-md bg-primary p-2 text-primary-foreground hover:opacity-90 disabled:opacity-50"
            title={t("agent.askAi")}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
