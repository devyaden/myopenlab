import { Anthropic } from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { z } from "zod";
import { buildWorkspaceIndex } from "@/lib/agent/workspace";
import {
  AGENT_SYSTEM_PROMPT,
  renderWorkspaceContext,
  intentHint,
} from "@/lib/agent/prompt";
import { runAgentLoop, type AgentEvent } from "@/lib/agent/loop";
import { toolDefsForIntent } from "@/lib/agent/registry";
import { toContentBlocks } from "@/lib/agent/content-blocks";
import { sanitizeHistory } from "@/lib/agent/history";
import {
  findCompactionSplit,
  transcriptForSummary,
} from "@/lib/agent/compaction";

const agentSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
  canvasId: z.string().uuid().optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
  // Phase E: a UI intent chip biases tool choice + the prompt (bias, not restrict).
  intent: z.enum(["create", "edit", "link", "optimize"]).optional(),
});

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = agentSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid input" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const input = parsed.data;

  const { checkAiTokenLimit, recordTokenUsage } = await import(
    "@/lib/services/ai-usage"
  );
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const tokenStatus = await checkAiTokenLimit(user.id);
  if (!tokenStatus.allowed) {
    const overDaily = tokenStatus.daily >= tokenStatus.dailyLimit;
    return new Response(
      JSON.stringify({
        error: "AI token limit reached",
        reason: "ai_tokens",
        message: overDaily
          ? "You've reached your daily AI token limit. It resets tomorrow, or upgrade for a higher allowance."
          : "You've reached your monthly AI token limit. Upgrade for a higher allowance.",
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // Resolve / create the conversation.
  let conversationId = input.conversationId ?? null;
  if (!conversationId) {
    const { data: created } = await supabase
      .from("agent_conversation")
      .insert({
        user_id: user.id,
        canvas_id: input.canvasId ?? null,
        title: input.message.slice(0, 60),
      })
      .select("id")
      .single();
    conversationId = created?.id ?? null;
  }
  if (!conversationId) {
    return new Response(
      JSON.stringify({ error: "Could not start conversation" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Load prior turns.
  const { data: priorRows } = await supabase
    .from("agent_message")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  // Attachments for this turn (already uploaded via /upload).
  let attachmentBlocks: any[] = [];
  if (input.attachmentIds && input.attachmentIds.length > 0) {
    const { data: atts } = await supabase
      .from("agent_attachment")
      .select("public_url, file_name, media_type, kind, extracted_text")
      .eq("user_id", user.id)
      .in("id", input.attachmentIds);
    attachmentBlocks = toContentBlocks(atts ?? []);
  }

  const userContent: any[] = [
    { type: "text", text: input.message },
    ...attachmentBlocks,
  ];

  const priorMessages = (priorRows ?? []).map((r: any) => ({
    role: r.role,
    content: r.content,
  }));

  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY! });

  // Phase F4: auto-compaction. If the replayed history approaches the plan's
  // per-conversation context cap, summarize the oldest turns and replay only the
  // recent tail + a recap (best-effort; on any failure we fall back to full history).
  let replayMessages = priorMessages;
  let summaryBlockText: string | null = null;
  if (tokenStatus.contextCap > 0) {
    const split = findCompactionSplit(priorMessages, tokenStatus.contextCap);
    if (split > 0) {
      try {
        const head = priorMessages.slice(0, split);
        const recap = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content:
                "Summarize the earlier part of this assistant/user conversation into a concise recap. PRESERVE: decisions made, the names/ids/codes of any artifacts created or edited, and any open threads or pending follow-ups. Be terse and factual.\n\n" +
                transcriptForSummary(head),
            },
          ],
        });
        const text = (recap.content as any[])
          .map((b: any) => (b.type === "text" ? b.text : ""))
          .join("")
          .trim();
        if (text) {
          summaryBlockText = text;
          replayMessages = priorMessages.slice(split);
          // Persist for transparency (best-effort; column may not exist pre-migration).
          await supabase
            .from("agent_conversation")
            .update({ summary: text, compacted_through_ordinal: split })
            .eq("id", conversationId);
        }
      } catch (err) {
        console.error("compaction failed; using full history:", err);
      }
    }
  }

  // Repair any invalid tool_use/tool_result pairing in the loaded history before
  // replaying it (legacy batch-inserted turns can come back out of order). A no-op
  // for well-formed histories.
  const messages = sanitizeHistory([
    ...replayMessages,
    { role: "user", content: userContent },
  ]);

  // System blocks: stable role (cached) + per-request workspace index.
  const index = await buildWorkspaceIndex(supabase, user.id);
  const systemBlocks: any[] = [
    {
      type: "text",
      text: AGENT_SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" },
    },
    { type: "text", text: renderWorkspaceContext(index.text) },
  ];
  // Recap of older, compacted turns (Phase F4) — kept out of the cached block.
  if (summaryBlockText)
    systemBlocks.push({
      type: "text",
      text: `EARLIER IN THIS CONVERSATION (a summary of older turns that were compacted to save context):\n${summaryBlockText}`,
    });
  // Per-intent nudge (kept out of the cached block above so it doesn't bust the cache).
  const hint = intentHint(input.intent);
  if (hint) systemBlocks.push({ type: "text", text: hint });
  const encoder = new TextEncoder();

  // The user-turn ordinal (count of prior REAL user turns — tool-result turns are
  // also stored with role "user", so exclude them). Every proposal emitted in this
  // request belongs to this turn; it re-attaches proposals to the right bubble when
  // the conversation is reopened.
  const isToolResultTurn = (m: any) =>
    m.role === "user" &&
    Array.isArray(m.content) &&
    m.content.some((b: any) => b?.type === "tool_result");
  const userTurnOrdinal = priorMessages.filter(
    (m: any) => m.role === "user" && !isToolResultTurn(m)
  ).length;

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const safeEnqueue = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          /* stream already closed by the client */
        }
      };
      const send = (event: any) => safeEnqueue(`data: ${JSON.stringify(event)}\n\n`);

      // Heartbeat: keep the connection alive through long thinking gaps. With
      // adaptive thinking (display omitted) the stream can be byte-silent for many
      // seconds, which lets proxies/load balancers drop it mid-build. An SSE
      // comment is ignored by the client parser (it only reads `data:` lines).
      const heartbeat = setInterval(() => safeEnqueue(`: ping\n\n`), 15000);

      // Tell the client which conversation this is (esp. for newly created ones).
      send({ type: "meta", conversationId });

      const emit = (event: AgentEvent) => send(event);

      // Persist incrementally so a 300s timeout mid-build never loses the turn:
      // the user turn up front, then each assistant/tool message as it's produced,
      // and each proposal as it's emitted.
      await supabase.from("agent_message").insert({
        conversation_id: conversationId,
        role: "user",
        content: userContent,
      });

      const onTurnAppended = async (message: any) => {
        await supabase.from("agent_message").insert({
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
        });
      };

      const onProposalPersist = async (proposal: any, index: number) => {
        // Non-fatal: if the agent_proposal table isn't present yet, this resolves
        // with an error in `error` (not a throw) and we just return null — the
        // proposal still streams and applies, it just won't survive a reload.
        const { data } = await supabase
          .from("agent_proposal")
          .insert({
            conversation_id: conversationId,
            message_ordinal: userTurnOrdinal,
            proposal_index: index,
            proposal_json: proposal,
            status: "pending",
          })
          .select("id")
          .single();
        return data?.id ?? null;
      };

      try {
        const turnStart = Date.now();
        const { usage: turnUsage, stats } = await runAgentLoop({
          client,
          systemBlocks,
          messages,
          tools: input.intent ? toolDefsForIntent(input.intent) : undefined,
          ctx: { supabase, userId: user.id, currentCanvasId: input.canvasId },
          emit,
          onTurnAppended,
          onProposalPersist,
        });

        const { captureServer } = await import("@/lib/posthog/server-capture");
        await captureServer(user.id, "ai.agent.turn", {
          messageLength: input.message.length,
          hadAttachments: Boolean(input.attachmentIds?.length),
          fromCanvas: Boolean(input.canvasId),
          // Phase B: observability — per-turn shape + cost.
          iterations: stats.iterations,
          toolCallCount: stats.toolCalls,
          proposalCount: stats.proposals,
          durationMs: Date.now() - turnStart,
          billableTokens: turnUsage.billableTokens,
          contextTokens: turnUsage.contextTokens,
          inputTokens: turnUsage.inputTokens,
          outputTokens: turnUsage.outputTokens,
          cacheReadTokens: turnUsage.cacheReadTokens,
        });

        // Meter the spend against the plan's daily/monthly budgets…
        await recordTokenUsage(user.id, turnUsage);
        // …and tell the client the live context size + budgets so it can render
        // the context + budget meters (numbers reflect this turn included).
        send({
          type: "usage",
          contextTokens: turnUsage.contextTokens,
          contextCap: tokenStatus.contextCap,
          daily: tokenStatus.daily + turnUsage.billableTokens,
          monthly: tokenStatus.monthly + turnUsage.billableTokens,
          dailyLimit: tokenStatus.dailyLimit,
          monthlyLimit: tokenStatus.monthlyLimit,
        });
      } catch (err: any) {
        send({ type: "error", message: err?.message ?? "Agent failed" });
        try {
          const { captureServer } = await import("@/lib/posthog/server-capture");
          await captureServer(user.id, "ai.agent.turn.error", {
            message: String(err?.message ?? "unknown"),
          });
        } catch {
          /* analytics is best-effort */
        }
      } finally {
        clearInterval(heartbeat);
        await supabase
          .from("agent_conversation")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);
        closed = true;
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
