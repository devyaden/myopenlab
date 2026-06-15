import type Anthropic from "@anthropic-ai/sdk";
import {
  AGENT_TOOLS,
  executeAgentTool,
  type AgentToolContext,
  type ToolProposal,
} from "./tools";

export const AGENT_MODEL = "claude-opus-4-7";
const MAX_ITERATIONS = 12;
const MAX_TOKENS = 16000;

export type AgentEvent =
  | { type: "delta"; text: string }
  | { type: "tool"; name: string }
  | { type: "proposal"; id: string; proposal: ToolProposal }
  | { type: "error"; message: string }
  | { type: "done" };

/**
 * Manual agentic loop: streams text to `emit`, runs tools server-side between
 * rounds, and surfaces propose_* tool calls as `proposal` events (which the
 * client renders as approve-before-write previews). Returns every message
 * appended during the loop so the caller can persist the turn.
 */
export async function runAgentLoop(opts: {
  client: Anthropic;
  systemBlocks: any[];
  messages: any[];
  ctx: AgentToolContext;
  emit: (event: AgentEvent) => void;
}): Promise<{ appended: any[] }> {
  const { client, systemBlocks, ctx, emit } = opts;
  const messages = [...opts.messages];
  const appended: any[] = [];
  let proposalCounter = 0;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    // `as any` on params: the agent uses Opus-4.7-only params (adaptive thinking
    // + effort) whose exact SDK typing may lag; the values are honored at runtime.
    const stream = client.messages.stream({
      model: AGENT_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemBlocks,
      tools: AGENT_TOOLS,
      messages,
      thinking: { type: "adaptive" },
      output_config: { effort: "xhigh" },
    } as any);

    stream.on("text", (text: string) => {
      if (text) emit({ type: "delta", text });
    });

    const finalMessage = await stream.finalMessage();

    // Record the assistant turn (full content, including any tool_use blocks).
    messages.push({ role: "assistant", content: finalMessage.content });
    appended.push({ role: "assistant", content: finalMessage.content });

    if (finalMessage.stop_reason !== "tool_use") {
      break;
    }

    // Execute each tool call and build the tool_result user turn.
    const toolResults: any[] = [];
    for (const block of finalMessage.content as any[]) {
      if (block.type !== "tool_use") continue;
      emit({ type: "tool", name: block.name });
      try {
        const result = await executeAgentTool(block.name, block.input, ctx);
        if (result.proposal) {
          const id = `proposal-${++proposalCounter}`;
          emit({ type: "proposal", id, proposal: result.proposal });
        }
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result.content,
        });
      } catch (err: any) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: `Tool error: ${err?.message ?? "unknown"}`,
          is_error: true,
        });
      }
    }

    const toolTurn = { role: "user", content: toolResults };
    messages.push(toolTurn);
    appended.push(toolTurn);
  }

  emit({ type: "done" });
  return { appended };
}
