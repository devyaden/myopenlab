import { Anthropic } from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { z } from "zod";
import { buildWorkspaceIndex } from "@/lib/agent/workspace";
import { AGENT_SYSTEM_PROMPT, renderWorkspaceContext } from "@/lib/agent/prompt";
import { runAgentLoop, type AgentEvent } from "@/lib/agent/loop";
import { toContentBlocks } from "@/lib/agent/content-blocks";

const agentSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
  canvasId: z.string().uuid().optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
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

  const { checkAiUsageLimit, incrementAiUsage } = await import(
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

  const usage = await checkAiUsageLimit(user.id);
  if (!usage.allowed) {
    return new Response(
      JSON.stringify({
        error: "AI usage limit reached",
        message: `You've reached your monthly limit of ${usage.limit} AI requests.`,
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
  const messages = [...priorMessages, { role: "user", content: userContent }];

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

  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY! });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      // Tell the client which conversation this is (esp. for newly created ones).
      send({ type: "meta", conversationId });

      const emit = (event: AgentEvent) => send(event);

      try {
        const { appended } = await runAgentLoop({
          client,
          systemBlocks,
          messages,
          ctx: { supabase, userId: user.id, currentCanvasId: input.canvasId },
          emit,
        });

        // Persist: the user turn, then everything the loop appended.
        const rows = [
          { conversation_id: conversationId, role: "user", content: userContent },
          ...appended.map((m) => ({
            conversation_id: conversationId,
            role: m.role,
            content: m.content,
          })),
        ];
        await supabase.from("agent_message").insert(rows);
        await supabase
          .from("agent_conversation")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);

        // Count one AI request per user turn (not per internal tool round-trip).
        await incrementAiUsage(user.id);

        const { captureServer } = await import("@/lib/posthog/server-capture");
        await captureServer(user.id, "ai.agent.turn", {
          messageLength: input.message.length,
          hadAttachments: Boolean(input.attachmentIds?.length),
          fromCanvas: Boolean(input.canvasId),
        });
      } catch (err: any) {
        send({ type: "error", message: err?.message ?? "Agent failed" });
      } finally {
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
