"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { toolLabelKey } from "@/lib/agent/tool-labels";
import type { ExploreContext } from "@/lib/store/useExploration";
import { Send, Loader2, History, Plus, Telescope, X, PanelLeftClose } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface ConversationSummary {
  id: string;
  title: string | null;
  scope_label?: string | null;
  updated_at: string;
}

interface ExploreChatProps {
  scopeLabel: string;
  /** The entity the chat is grounded on (from the browser or a source chip). */
  context: ExploreContext | null;
  onClearContext: () => void;
  /** Clicking a {CODE} source chip in an answer. */
  onCode: (code: string) => void;
  /** When provided, shows a control to hide the chat pane. */
  onCollapse?: () => void;
}

// {HR-01}-style codes the model is told to cite become clickable source chips.
const CODE_RE = /\{([A-Za-z0-9][A-Za-z0-9-]*)\}/g;

function ChipText({
  text,
  onCode,
}: {
  text: string;
  onCode: (code: string) => void;
}) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  CODE_RE.lastIndex = 0;
  while ((m = CODE_RE.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const code = m[1];
    parts.push(
      <button
        key={`chip-${i++}`}
        onClick={() => onCode(code)}
        className="mx-0.5 rounded bg-primary/15 px-1 py-0.5 align-baseline font-mono text-[11px] font-medium text-primary hover:bg-primary/25"
        title={`Open ${code}`}
      >
        {code}
      </button>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export function ExploreChat({
  scopeLabel,
  context,
  onClearContext,
  onCode,
  onCollapse,
}: ExploreChatProps) {
  const t = useT();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [toolActivity, setToolActivity] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [usageMeter, setUsageMeter] = useState<{
    contextTokens: number;
    contextCap: number;
    daily: number;
    dailyLimit: number;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, liveText, toolActivity]);

  // Seed the budget meters (context fills in once a turn runs).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j || j.unlimited) return;
        setUsageMeter((cur) => ({
          contextTokens: cur?.contextTokens ?? 0,
          contextCap: j.contextCap ?? 0,
          daily: j.daily ?? 0,
          dailyLimit: j.dailyLimit ?? 0,
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/explore/conversations");
    if (res.ok) {
      const json = await res.json();
      setConversations(json.conversations ?? []);
    }
  }, []);

  const startNewChat = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setShowHistory(false);
  }, []);

  const openConversation = useCallback(async (id: string) => {
    const res = await fetch(`/api/explore/conversations/${id}`);
    if (!res.ok) return;
    const json = await res.json();
    const loaded: ChatMessage[] = (json.messages ?? [])
      .filter((m: any) => m.role === "user" || m.role === "assistant")
      .map((m: any) => {
        const blocks = Array.isArray(m.content) ? m.content : [];
        const isToolTurn =
          m.role === "user" && blocks.some((b: any) => b?.type === "tool_result");
        const text = blocks
          .filter((b: any) => b.type === "text")
          .map((b: any) => b.text)
          .join("\n");
        return { role: m.role, text, isToolTurn };
      })
      .filter((m: any) => !m.isToolTurn && m.text.trim().length > 0)
      .map((m: any) => ({ role: m.role, text: m.text }));
    setConversationId(id);
    setMessages(loaded);
    setShowHistory(false);
  }, []);

  const send = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if (!text || streaming) return;
      if (overrideText === undefined) setInput("");
      setMessages((m) => [...m, { role: "user", text }]);
      setStreaming(true);
      setLiveText("");
      setToolActivity(null);

      const focus = context
        ? { label: context.label, code: context.code ?? null, kind: context.kind }
        : undefined;

      let acc = "";
      try {
        const res = await fetch("/api/explore/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            conversationId: conversationId ?? undefined,
            focus,
          }),
        });

        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({}));
          setMessages((m) => [
            ...m,
            { role: "assistant", text: err.message || err.error || "Something went wrong." },
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
            } else if (event.type === "usage") {
              setUsageMeter({
                contextTokens: event.contextTokens ?? 0,
                contextCap: event.contextCap ?? 0,
                daily: event.daily ?? 0,
                dailyLimit: event.dailyLimit ?? 0,
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
        setMessages((m) => [...m, { role: "assistant", text: acc || "(no response)" }]);
        setLiveText("");
        setToolActivity(null);
        setStreaming(false);
        inputRef.current?.focus();
      }
    },
    [input, streaming, conversationId, context]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Telescope size={18} className="text-primary" />
          <span className="font-semibold text-foreground">{t("explore.chat.title")}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setShowHistory((s) => !s);
              if (!showHistory) loadConversations();
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            title={t("explore.chat.history")}
          >
            <History size={17} />
          </button>
          <button
            onClick={startNewChat}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            title={t("explore.chat.newChat")}
          >
            <Plus size={17} />
          </button>
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
              title={t("explore.chat.collapse")}
            >
              <PanelLeftClose size={17} className="rtl:-scale-x-100" />
            </button>
          )}
        </div>
      </div>

      {showHistory && (
        <div className="max-h-48 overflow-y-auto border-b border-border bg-muted/30">
          {conversations.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              {t("explore.chat.noConversations")}
            </p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => openConversation(c.id)}
                className="block w-full truncate px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
              >
                {c.title || t("explore.chat.untitled")}
              </button>
            ))
          )}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && !streaming && (
          <div className="mt-6 text-sm text-muted-foreground">
            <Telescope size={28} className="mx-auto mb-3 text-primary/60" />
            <p className="text-center font-medium text-foreground">
              {t("explore.chat.empty.title")}
            </p>
            <p className="mt-1 text-center">{t("explore.chat.empty.hint")}</p>
            <div className="mx-auto mt-3 flex max-w-[340px] flex-col gap-1.5">
              {(["owner", "approver", "policy"] as const).map((k) => {
                const ex = t(`explore.chat.examples.${k}`);
                return (
                  <button
                    key={k}
                    onClick={() => void send(ex)}
                    className="rounded-md border border-border bg-card px-3 py-2 text-left text-xs text-foreground hover:bg-muted"
                  >
                    {ex}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i}>
            <div
              className={
                m.role === "user"
                  ? "ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground rtl:ml-0 rtl:mr-auto"
                  : "w-fit max-w-[92%] whitespace-pre-wrap text-sm leading-relaxed text-foreground"
              }
            >
              {m.role === "assistant" ? (
                <ChipText text={m.text} onCode={onCode} />
              ) : (
                m.text
              )}
            </div>
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
                <span className="text-muted-foreground">{t("explore.chat.thinking")}</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        {usageMeter && usageMeter.contextCap > 0 && (
          <div className="mb-2 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>
                {Math.round((usageMeter.contextTokens / usageMeter.contextCap) * 100)}% context
              </span>
              {usageMeter.dailyLimit > 0 && (
                <span>
                  {Math.round((usageMeter.daily / usageMeter.dailyLimit) * 100)}% daily tokens
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

        {context ? (
          <div className="mb-2 flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-[11px] text-foreground">
            <span className="text-muted-foreground">{t("explore.chat.focusedOn")}</span>
            <span className="truncate font-medium">{context.label}</span>
            {context.code && (
              <span className="font-mono text-primary">{`{${context.code}}`}</span>
            )}
            <button
              onClick={onClearContext}
              className="ml-auto rounded p-0.5 text-muted-foreground hover:bg-muted"
              title={t("explore.chat.clearFocus")}
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <p className="mb-2 truncate text-[11px] text-muted-foreground">{scopeLabel}</p>
        )}

        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={t("explore.chat.placeholder")}
            rows={1}
            className="flex-1 resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={() => void send()}
            disabled={streaming || !input.trim()}
            className="rounded-md bg-primary p-2 text-primary-foreground hover:opacity-90 disabled:opacity-50"
            title={t("explore.chat.send")}
          >
            {streaming ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
