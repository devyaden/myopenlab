"use client";

import { useCallback, useEffect, useState } from "react";

// Dev-only inspector for agent runs. Lists the user's conversations and renders a
// flat trace (text / tool_use / tool_result / proposals) for the selected one,
// from data the agent already persists. Returns 404 in production (the API route
// is hard-gated); this page is a thin viewer for debugging tool behavior locally.

interface Conversation {
  id: string;
  title: string | null;
  canvas_id: string | null;
  updated_at: string | null;
}

interface TraceBlock {
  role: string;
  type: "text" | "tool_use" | "tool_result" | "thinking";
  text?: string;
  name?: string;
  input?: Record<string, any>;
  is_error?: boolean;
  content?: string;
}

interface ProposalRow {
  message_ordinal: number;
  proposal_index: number;
  proposal_json: any;
  status: string;
  applied_canvas_id: string | null;
}

export default function AgentRunsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<TraceBlock[]>([]);
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/ai/agent/conversations")
      .then((r) => r.json())
      .then((j) => setConversations(j.conversations ?? []))
      .catch(() => setConversations([]));
  }, []);

  const open = useCallback(async (id: string) => {
    setSelected(id);
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/agent/runs/${id}`);
      if (!res.ok) {
        setBlocks([]);
        setProposals([]);
        return;
      }
      const j = await res.json();
      setBlocks(j.blocks ?? []);
      setProposals(j.proposals ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4 p-4 text-sm">
      <aside className="w-72 shrink-0 overflow-y-auto rounded-lg border">
        <div className="border-b px-3 py-2 font-medium">Agent runs (dev)</div>
        {conversations.length === 0 ? (
          <p className="px-3 py-2 text-muted-foreground">No conversations.</p>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => open(c.id)}
              className={`block w-full truncate px-3 py-2 text-left hover:bg-muted ${
                selected === c.id ? "bg-muted font-medium" : ""
              }`}
              title={c.id}
            >
              {c.title || "Untitled"}
            </button>
          ))
        )}
      </aside>

      <main className="flex-1 overflow-y-auto rounded-lg border p-4">
        {loading && <p className="text-muted-foreground">Loading…</p>}
        {!loading && !selected && (
          <p className="text-muted-foreground">Select a conversation.</p>
        )}
        {!loading && selected && (
          <div className="space-y-3">
            {proposals.length > 0 && (
              <div className="rounded-md border bg-muted/30 p-3">
                <div className="mb-1 font-medium">
                  Proposals ({proposals.length})
                </div>
                {proposals.map((p, i) => (
                  <div key={i} className="font-mono text-xs">
                    #{p.message_ordinal}.{p.proposal_index} ·{" "}
                    {p.proposal_json?.kind}:
                    {p.proposal_json?.target ?? "canvas"} · {p.status}
                  </div>
                ))}
              </div>
            )}
            {blocks.map((b, i) => (
              <div key={i} className="rounded-md border p-2">
                <div className="mb-1 text-xs uppercase text-muted-foreground">
                  {b.role} · {b.type}
                  {b.is_error ? " · error" : ""}
                </div>
                {b.type === "tool_use" && (
                  <div>
                    <span className="font-mono font-medium">{b.name}</span>
                    <pre className="mt-1 whitespace-pre-wrap break-all text-xs text-muted-foreground">
                      {JSON.stringify(b.input, null, 2)}
                    </pre>
                  </div>
                )}
                {(b.type === "text" || b.type === "tool_result") && (
                  <pre className="whitespace-pre-wrap break-words text-xs">
                    {b.text ?? b.content}
                  </pre>
                )}
                {b.type === "thinking" && (
                  <span className="text-xs italic text-muted-foreground">
                    (thinking)
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
