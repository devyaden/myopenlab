import type Anthropic from "@anthropic-ai/sdk";
import {
  AGENT_TOOLS,
  executeAgentTool,
  type AgentToolContext,
  type ToolProposal,
} from "./tools";
import {
  accumulateUsage,
  emptyTurnUsage,
  type TurnUsage,
} from "./tokens";
import {
  newRunId,
  summarizeToolInput,
  traceToolCall,
  traceTurn,
} from "./trace";

export const AGENT_MODEL = "claude-opus-4-8";
// A safety net only — Task Budgets (output_config.task_budget) does the real
// self-moderation, and the soft wrap-up near the cap hands off cleanly. With
// incremental persistence a stop here never loses work.
const MAX_ITERATIONS = 18;
const MAX_TOKENS = 16000;

export type AgentEvent =
  | { type: "delta"; text: string }
  | { type: "tool"; name: string }
  | { type: "proposal"; id: string; dbId?: string; proposal: ToolProposal }
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
  /** Optional tool subset (e.g. biased for a UI intent). Defaults to all tools. */
  tools?: any[];
  emit: (event: AgentEvent) => void;
  // Called as each assistant/tool message is appended, so the caller can persist
  // incrementally — a timeout mid-loop then never loses the turn.
  onTurnAppended?: (message: any) => Promise<void>;
  // Called as each proposal is produced; returns the persisted row id (or null),
  // which is forwarded to the client so it can update the proposal's status on apply.
  onProposalPersist?: (proposal: ToolProposal, index: number) => Promise<string | null>;
}): Promise<{
  appended: any[];
  usage: TurnUsage;
  stats: { iterations: number; toolCalls: number; proposals: number };
}> {
  const { client, systemBlocks, ctx, emit, onTurnAppended, onProposalPersist } = opts;
  const messages = [...opts.messages];
  const appended: any[] = [];
  let proposalCounter = 0;
  // Phase B/F1: one run id for the whole turn, a running token total, and counters
  // for the dev trace + the route's analytics.
  const runId = ctx.runId ?? newRunId();
  ctx.runId = runId;
  const startedAt = Date.now();
  let usage = emptyTurnUsage();
  let iterationsRun = 0;
  let toolCallCount = 0;
  // Task Budgets is a beta. If the header is rejected for this account/SDK we drop
  // it (once) and fall back to the known-good GA call, so the agent never breaks.
  let taskBudgetSupported = true;

  // `as any` on params: adaptive thinking + effort + task_budget whose exact SDK
  // typing may lag; the values are honored at runtime. task_budget gives the model
  // a running token countdown for the whole turn so it self-moderates and wraps up
  // gracefully on big builds instead of getting chopped at the cap.
  const tools = opts.tools ?? AGENT_TOOLS;
  const makeStream = () => {
    const common = {
      model: AGENT_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemBlocks,
      tools,
      messages,
      thinking: { type: "adaptive" },
    };
    if (taskBudgetSupported) {
      return client.beta.messages.stream({
        ...common,
        output_config: {
          effort: "xhigh",
          task_budget: { type: "tokens", total: 120000 },
        },
        betas: ["task-budgets-2026-03-13"],
      } as any);
    }
    return client.messages.stream({
      ...common,
      output_config: { effort: "xhigh" },
    } as any);
  };

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    iterationsRun = iteration + 1;
    let finalMessage: any;
    for (let attempt = 0; ; attempt++) {
      const stream: any = makeStream();
      stream.on("text", (text: string) => {
        if (text) emit({ type: "delta", text });
      });
      try {
        finalMessage = await stream.finalMessage();
        break;
      } catch (err) {
        // Drop the task-budgets beta once and retry with plain GA params if it's
        // rejected; otherwise propagate the error.
        if (taskBudgetSupported && attempt === 0) {
          taskBudgetSupported = false;
          continue;
        }
        throw err;
      }
    }

    // Fold this call's token usage into the turn total (the last call's input ≈
    // the full replayed conversation, i.e. the context-meter number).
    usage = accumulateUsage(usage, finalMessage.usage);

    // Record the assistant turn (full content, including any tool_use blocks)
    // and persist it immediately so a timeout later in the loop doesn't lose it.
    const assistantTurn = { role: "assistant", content: finalMessage.content };
    messages.push(assistantTurn);
    appended.push(assistantTurn);
    await onTurnAppended?.(assistantTurn);

    if (finalMessage.stop_reason !== "tool_use") {
      break;
    }

    // Execute each tool call and build the tool_result user turn.
    const toolResults: any[] = [];
    for (const block of finalMessage.content as any[]) {
      if (block.type !== "tool_use") continue;
      toolCallCount += 1;
      emit({ type: "tool", name: block.name });
      const toolStart = Date.now();
      try {
        const result = await executeAgentTool(block.name, block.input, ctx);
        if (result.proposal) {
          const id = `proposal-${++proposalCounter}`;
          let dbId: string | undefined;
          if (onProposalPersist) {
            dbId =
              (await onProposalPersist(result.proposal, proposalCounter)) ??
              undefined;
          }
          emit({ type: "proposal", id, dbId, proposal: result.proposal });
        }
        traceToolCall({
          runId,
          name: block.name,
          inputSummary: summarizeToolInput(block.name, block.input),
          durationMs: Date.now() - toolStart,
          ok: true,
          proposalKind: result.proposal
            ? `${result.proposal.kind}:${result.proposal.target ?? "canvas"}`
            : undefined,
        });
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result.content,
        });
      } catch (err: any) {
        traceToolCall({
          runId,
          name: block.name,
          inputSummary: summarizeToolInput(block.name, block.input),
          durationMs: Date.now() - toolStart,
          ok: false,
          error: String(err?.message ?? "unknown"),
        });
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: `Tool error: ${err?.message ?? "unknown"}`,
          is_error: true,
        });
      }
    }

    // Approaching the iteration cap: nudge the agent to wrap up the current
    // artifact and hand off cleanly (a few artifacts per turn, then "continue")
    // instead of getting cut off mid-build. Everything proposed so far is already
    // streamed + persisted, so this loses nothing. Delivered as a text block on
    // the tool-result turn so it needs no extra beta header.
    if (iteration >= MAX_ITERATIONS - 2) {
      toolResults.push({
        type: "text",
        text:
          "You are nearly out of build iterations for this turn. Finish the artifact you are working on now, then STOP — do not start a new large artifact. In your final message, briefly list what you proposed this turn and what still remains, and end with exactly: \"Apply these, then say 'continue' to build the rest.\"",
      });
    }

    const toolTurn = { role: "user", content: toolResults };
    messages.push(toolTurn);
    appended.push(toolTurn);
    await onTurnAppended?.(toolTurn);
  }

  emit({ type: "done" });

  const stats = {
    iterations: iterationsRun,
    toolCalls: toolCallCount,
    proposals: proposalCounter,
  };
  traceTurn({
    runId,
    ...stats,
    durationMs: Date.now() - startedAt,
    billableTokens: usage.billableTokens,
    contextTokens: usage.contextTokens,
  });
  return { appended, usage, stats };
}
