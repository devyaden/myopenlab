// Thin barrel over the agent tool registry. Tools are declared (def + handler
// together) in lib/agent/tools/* and assembled in lib/agent/registry-tools.ts.
// This module preserves the original import surface — AGENT_TOOLS, executeAgentTool,
// and the shared types — so callers (lib/agent/loop.ts) need no changes.
import { buildToolDefs, getTool } from "./registry";
import type { AgentToolContext, ToolExecutionResult } from "./registry";

export type {
  AgentToolContext,
  ToolProposal,
  ToolExecutionResult,
  AgentToolDef,
  ToolCategory,
  ToolIntent,
} from "./registry";

/** Anthropic tool definitions exposed to the agent (registry order). */
export const AGENT_TOOLS: any[] = buildToolDefs();

/**
 * Executes a tool server-side. Every handler re-derives scope from ctx.userId so
 * the agent can never read or write another user's data. Dispatch goes through
 * the registry, so an unknown name degrades to the same graceful message as before.
 */
export async function executeAgentTool(
  name: string,
  input: any,
  ctx: AgentToolContext
): Promise<ToolExecutionResult> {
  const tool = getTool(name);
  if (!tool) return { content: `Unknown tool: ${name}` };
  return tool.handler(input, ctx);
}
