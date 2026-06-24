"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAgentStore } from "@/lib/store/useAgent";
import { useCanvasStore } from "@/lib/store/useCanvas";
import { useDocumentStore } from "@/components/editor/hooks/useDocument";
import { emitEmbedRefresh } from "@/lib/realtime/embed-refresh";
import { playbookHref } from "@/lib/playbook-href";
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
  kind: "create" | "update";
  target?: "canvas" | "document" | "directory"; // absent ⇒ "canvas" (back-compat)
  name?: string;
  code?: string | null;
  folder_id?: string | null;
  canvas_id?: string | null;
  diagram?: { nodes: any[]; edges: any[]; nodeStyles: Record<string, any> };
  body?: any[]; // document block list (target === "document")
  directory_kind?: "person" | "role"; // target === "directory"
  people?: any[]; // directory rows (target === "directory")
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
  const isDocument = proposal.target === "document";
  const isDirectory = proposal.target === "directory";

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
        Open <ArrowUpRight size={12} />
      </Link>
    ) : null;

  const statusBadge =
    proposal.status === "applied" ? (
      <span className="flex items-center gap-1 text-xs text-green-600">
        <Check size={13} /> Applied
      </span>
    ) : proposal.status === "failed" ? (
      <span className="text-xs text-destructive">Failed</span>
    ) : proposal.status === "discarded" ? (
      <span className="text-xs text-muted-foreground">Discarded</span>
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
          {proposal.status === "failed" ? "Retry" : "Apply"}
        </button>
      </div>
    ) : null;

  if (isDirectory) {
    const people = proposal.people ?? [];
    return (
      <div className="rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-xs font-medium">
            New {proposal.directory_kind ?? "person"} directory:{" "}
            {proposal.name ?? "Directory"}
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
              ? `New document: ${proposal.name ?? "Untitled"}`
              : "Update to this document"}
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
            ? `New playbook: ${proposal.name ?? "Untitled"}`
            : "Update to this playbook"}
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
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

export function AgentChat() {
  const { isOpen, canvasId, close } = useAgentStore();
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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, liveText, toolActivity]);

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

  const send = useCallback(async (overrideText?: string) => {
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

  if (!isOpen) return null;

  return (
    <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[440px] flex-col border-l bg-background shadow-2xl">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <span className="font-semibold">Workspace Agent</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setShowHistory((s) => !s);
              if (!showHistory) loadConversations();
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            title="History"
          >
            <History size={17} />
          </button>
          <button
            onClick={startNewChat}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            title="New chat"
          >
            <Plus size={17} />
          </button>
          <button
            onClick={close}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            title="Close"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {showHistory && (
        <div className="max-h-48 overflow-y-auto border-b bg-muted/30">
          {conversations.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              No past conversations.
            </p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => openConversation(c.id)}
                className="block w-full truncate px-4 py-2 text-left text-sm hover:bg-muted"
              >
                {c.title || "Untitled conversation"}
              </button>
            ))
          )}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && !streaming && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <Sparkles size={28} className="mx-auto mb-3 text-primary/60" />
            <p className="font-medium text-foreground">
              Ask about your playbooks
            </p>
            <p className="mt-1">
              &ldquo;What playbooks do I have?&rdquo;, &ldquo;Create a hiring
              process&rdquo;, &ldquo;Add an approval step to vendor
              onboarding&rdquo;.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="space-y-2">
            <div
              className={
                m.role === "user"
                  ? "ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
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
                  Apply all ({pendingCount})
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
                Using {toolActivity.replace(/_/g, " ")}…
              </div>
            )}
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {liveText || (
                <span className="text-muted-foreground">Thinking…</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-3">
        {!streaming &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "assistant" && (
            <button
              onClick={() => send("continue")}
              className="mb-2 flex items-center gap-1.5 rounded-md border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              title="Have the agent keep building"
            >
              <Sparkles size={13} className="text-primary" />
              Continue building
            </button>
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask or instruct the agent…"
            rows={1}
            className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={() => send()}
            disabled={streaming || !input.trim()}
            className="rounded-md bg-primary p-2 text-primary-foreground hover:opacity-90 disabled:opacity-50"
            title="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
