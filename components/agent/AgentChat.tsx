"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAgentStore } from "@/lib/store/useAgent";
import { useCanvasStore } from "@/lib/store/useCanvas";
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
} from "lucide-react";

interface Proposal {
  id: string;
  kind: "create" | "update";
  name?: string;
  code?: string | null;
  folder_id?: string | null;
  canvas_id?: string | null;
  diagram: { nodes: any[]; edges: any[]; nodeStyles: Record<string, any> };
  status: "pending" | "applied" | "discarded";
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
}: {
  proposal: Proposal;
  onApply: () => void;
  applying: boolean;
}) {
  const nodes = (proposal.diagram.nodes ?? []).map((n: any) => ({
    ...n,
    width: n.width || 120,
    height: n.height || 60,
  }));
  const edges = (proposal.diagram.edges ?? []).map((e: any) => ({
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
        {proposal.status === "applied" ? (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <Check size={13} /> Applied
          </span>
        ) : proposal.status === "discarded" ? (
          <span className="text-xs text-muted-foreground">Discarded</span>
        ) : null}
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
  const router = useRouter();
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
    const loaded: ChatMessage[] = (json.messages ?? [])
      .filter((m: any) => m.role === "user" || m.role === "assistant")
      .map((m: any) => {
        const blocks = Array.isArray(m.content) ? m.content : [];
        const text = blocks
          .filter((b: any) => b.type === "text")
          .map((b: any) => b.text)
          .join("\n");
        return { role: m.role, text };
      })
      .filter((m: ChatMessage) => m.text.trim().length > 0);
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

  const markApplied = useCallback((msgIdx: number, proposalId: string) => {
    setMessages((prev) =>
      prev.map((m, i) =>
        i === msgIdx
          ? {
              ...m,
              proposals: m.proposals?.map((p) =>
                p.id === proposalId ? { ...p, status: "applied" } : p
              ),
            }
          : m
      )
    );
  }, []);

  const applyProposal = useCallback(
    async (msgIdx: number, proposal: Proposal) => {
      setApplyingId(proposal.id);
      try {
        // If the proposal updates the playbook that's currently open in the
        // editor, apply it straight into the canvas store so it renders
        // instantly. syncChanges() persists it through the normal save path
        // (which also writes a history snapshot) — no separate API write needed.
        if (proposal.kind === "update" && proposal.canvas_id) {
          const store = useCanvasStore.getState();
          if (store.id === proposal.canvas_id) {
            store.initializeWithAIData({
              nodes: proposal.diagram.nodes,
              edges: proposal.diagram.edges,
              nodeStyles: proposal.diagram.nodeStyles,
            });
            // Persist in the background so the spinner clears immediately;
            // the canvas has already updated via initializeWithAIData.
            void store.syncChanges();
            markApplied(msgIdx, proposal.id);
            return;
          }
        }

        // Otherwise commit via the API (create, or update to a playbook that
        // isn't the one currently open).
        const body =
          proposal.kind === "create"
            ? {
                kind: "create",
                name: proposal.name ?? "Untitled Playbook",
                code: proposal.code ?? null,
                folder_id: proposal.folder_id ?? null,
                diagram: proposal.diagram,
              }
            : {
                kind: "update",
                canvas_id: proposal.canvas_id,
                diagram: proposal.diagram,
              };
        const res = await fetch("/api/ai/agent/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (res.ok) {
          markApplied(msgIdx, proposal.id);
          if (proposal.kind === "create" && json.canvasId) {
            router.push(`/protected/playbook/${json.canvasId}`);
          }
        }
      } finally {
        setApplyingId(null);
      }
    },
    [router, markApplied]
  );

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
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
            collectedProposals.push({ ...event.proposal, id: event.id, status: "pending" });
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
            {m.proposals?.map((p) => (
              <ProposalPreview
                key={p.id}
                proposal={p}
                applying={applyingId === p.id}
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
            onClick={send}
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
