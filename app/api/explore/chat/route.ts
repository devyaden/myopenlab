import { Anthropic } from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { z } from "zod";
import { buildWorkspaceIndex, type WorkspacePlaybook } from "@/lib/agent/workspace";
import { renderWorkspaceContext } from "@/lib/agent/prompt";
import {
  GOVERNANCE_SYSTEM_PROMPT,
  renderScopeContext,
  renderFocusContext,
} from "@/lib/explore/prompt";
import { EXPLORE_TOOL_DEFS } from "@/lib/explore/tools";
import { requireExploreAccess, type ExplorerScope } from "@/lib/explore/access";
import { runAgentLoop, type AgentEvent } from "@/lib/agent/loop";
import { sanitizeHistory } from "@/lib/agent/history";
import {
  findCompactionSplit,
  transcriptForSummary,
} from "@/lib/agent/compaction";

const exploreSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
  // The entity the user clicked in the governance browser, used to ground "this".
  focus: z
    .object({
      label: z.string().max(200),
      code: z.string().max(60).nullish(),
      kind: z.string().max(40).optional(),
    })
    .nullish(),
});

export const maxDuration = 300;

/** Compact one playbook index line, matching lib/agent/workspace.ts's format. */
function playbookLine(p: WorkspacePlaybook): string {
  const kind = p.directory_kind ? `${p.directory_kind} directory` : p.type;
  return `- [${p.id}]${p.code ? ` {${p.code}}` : ""} "${p.name}" (${kind}${
    p.folder ? `, folder: ${p.folder}` : ""
  })`;
}

/** The workspace context block, narrowed to the scope's allowed canvases when set. */
function scopedWorkspaceText(
  index: { playbooks: WorkspacePlaybook[]; text: string },
  scope: ExplorerScope
): string {
  // v1: allowedCanvasIds is always null ⇒ the whole workspace. When directory
  // scoping goes live, this is the ONLY place the index gets narrowed.
  if (!scope.allowedCanvasIds) return renderWorkspaceContext(index.text);
  const allowed = new Set(scope.allowedCanvasIds);
  const visible = index.playbooks.filter((p) => allowed.has(p.id));
  const text =
    visible.length === 0
      ? "No playbooks are within your current scope."
      : visible.map(playbookLine).join("\n");
  return renderWorkspaceContext(text);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = exploreSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid input" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const input = parsed.data;

  // Single access gate: authenticate, check the exploration seat, resolve scope.
  const access = await requireExploreAccess();
  if (!access.ok) {
    return new Response(JSON.stringify({ error: access.error }), {
      status: access.status,
      headers: { "Content-Type": "application/json" },
    });
  }
  const { supabase, user, scope } = access;

  const { checkAiTokenLimit, recordTokenUsage } = await import(
    "@/lib/services/ai-usage"
  );
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

  // Resolve / create the conversation (best-effort: the table may not be present
  // pre-migration, in which case we proceed without persistence).
  let conversationId = input.conversationId ?? null;
  if (!conversationId) {
    const { data: created } = await supabase
      .from("explore_conversation")
      .insert({
        user_id: user.id,
        title: input.message.slice(0, 60),
        scope_label: scope.label,
      })
      .select("id")
      .single();
    conversationId = created?.id ?? null;
  }

  // Load prior turns (empty if persistence is unavailable).
  const { data: priorRows } = conversationId
    ? await supabase
        .from("explore_message")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
    : { data: null as any };

  const userContent: any[] = [{ type: "text", text: input.message }];
  const priorMessages = (priorRows ?? []).map((r: any) => ({
    role: r.role,
    content: r.content,
  }));

  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY! });

  // Auto-compaction: summarize the oldest turns if history nears the context cap.
  let replayMessages = priorMessages;
  let summaryBlockText: string | null = null;
  if (conversationId && tokenStatus.contextCap > 0) {
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
                "Summarize the earlier part of this Q&A conversation into a concise recap. PRESERVE: the user's questions, the key facts/answers given, and any artifacts (names + codes) discussed. Be terse and factual.\n\n" +
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
          await supabase
            .from("explore_conversation")
            .update({ summary: text, compacted_through_ordinal: split })
            .eq("id", conversationId);
        }
      } catch (err) {
        console.error("explore compaction failed; using full history:", err);
      }
    }
  }

  const messages = sanitizeHistory([
    ...replayMessages,
    { role: "user", content: userContent },
  ]);

  // System blocks: stable governance prompt (cached) + per-request workspace +
  // scope banner + optional clicked-node focus.
  const index = await buildWorkspaceIndex(supabase, user.id);
  const systemBlocks: any[] = [
    {
      type: "text",
      text: GOVERNANCE_SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" },
    },
    { type: "text", text: scopedWorkspaceText(index, scope) },
    { type: "text", text: renderScopeContext(scope) },
  ];
  if (summaryBlockText)
    systemBlocks.push({
      type: "text",
      text: `EARLIER IN THIS CONVERSATION (a summary of older turns that were compacted to save context):\n${summaryBlockText}`,
    });
  const focusHint = renderFocusContext(input.focus);
  if (focusHint) systemBlocks.push({ type: "text", text: focusHint });

  const encoder = new TextEncoder();

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
      const send = (event: any) =>
        safeEnqueue(`data: ${JSON.stringify(event)}\n\n`);
      // Heartbeat through long thinking gaps so proxies don't drop the stream.
      const heartbeat = setInterval(() => safeEnqueue(`: ping\n\n`), 15000);

      send({ type: "meta", conversationId });
      const emit = (event: AgentEvent) => send(event);

      // Persist incrementally (best-effort) so a timeout never loses the turn.
      if (conversationId) {
        await supabase.from("explore_message").insert({
          conversation_id: conversationId,
          role: "user",
          content: userContent,
        });
      }
      const onTurnAppended = async (message: any) => {
        if (!conversationId) return;
        await supabase.from("explore_message").insert({
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
        });
      };

      try {
        const turnStart = Date.now();
        const { usage: turnUsage, stats } = await runAgentLoop({
          client,
          systemBlocks,
          messages,
          tools: EXPLORE_TOOL_DEFS, // read-only: no proposal can ever be emitted
          ctx: { supabase, userId: user.id, currentCanvasId: null },
          emit,
          onTurnAppended,
        });

        try {
          const { captureServer } = await import(
            "@/lib/posthog/server-capture"
          );
          await captureServer(user.id, "explore.chat.turn", {
            messageLength: input.message.length,
            hadFocus: Boolean(input.focus),
            iterations: stats.iterations,
            toolCallCount: stats.toolCalls,
            durationMs: Date.now() - turnStart,
            billableTokens: turnUsage.billableTokens,
            contextTokens: turnUsage.contextTokens,
          });
        } catch {
          /* analytics is best-effort */
        }

        await recordTokenUsage(user.id, turnUsage);
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
        send({ type: "error", message: err?.message ?? "Exploration failed" });
      } finally {
        clearInterval(heartbeat);
        if (conversationId) {
          await supabase
            .from("explore_conversation")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", conversationId);
        }
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
