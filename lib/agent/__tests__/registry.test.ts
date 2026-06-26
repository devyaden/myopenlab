import { describe, it, expect } from "vitest";
import { AGENT_TOOLS, executeAgentTool } from "@/lib/agent/tools";
import {
  AGENT_TOOL_REGISTRY,
  getTool,
  toolsForIntent,
  toolDefsForIntent,
} from "@/lib/agent/registry";

describe("agent tool registry", () => {
  it("derives AGENT_TOOLS from the registry, in order", () => {
    expect(AGENT_TOOLS).toHaveLength(AGENT_TOOL_REGISTRY.length);
    expect(AGENT_TOOLS.map((t: any) => t.name)).toEqual(
      AGENT_TOOL_REGISTRY.map((t) => t.name)
    );
  });

  it("preserves the original (cache-stable) prefix order of the macro tools", () => {
    // The first 15 tools must match the pre-registry AGENT_TOOLS array exactly so
    // the prompt-cached tool list doesn't shift.
    expect(AGENT_TOOLS.slice(0, 15).map((t: any) => t.name)).toEqual([
      "list_canvases",
      "search_canvases",
      "get_canvas",
      "get_canvas_history",
      "resolve_code",
      "list_backlinks",
      "generate_diagram",
      "propose_create_canvas",
      "propose_update_canvas",
      "get_document",
      "propose_create_document",
      "propose_update_document",
      "propose_process_page",
      "list_directory",
      "propose_create_directory",
    ]);
  });

  it("registers the Phase D edit/link/optimize tools", () => {
    for (const name of [
      "edit_canvas",
      "edit_document_blocks",
      "edit_directory",
      "link_artifacts",
      "optimize_canvas",
    ]) {
      expect(getTool(name), name).toBeDefined();
    }
  });

  it("biases tools for an intent but keeps read + propose_* available", () => {
    const names = toolsForIntent("edit").map((t) => t.name);
    expect(names).toContain("edit_canvas"); // the intent's tool
    expect(names).toContain("get_canvas"); // read tools always kept
    expect(names).toContain("propose_create_canvas"); // propose_* always kept
    expect(names).not.toContain("optimize_canvas"); // a different intent's tool
    // no intent → everything
    expect(toolDefsForIntent(undefined)).toHaveLength(AGENT_TOOL_REGISTRY.length);
  });

  it("degrades an unknown tool gracefully", async () => {
    const res = await executeAgentTool("does_not_exist", {}, {
      supabase: {} as any,
      userId: "u",
    });
    expect(res.content).toContain("Unknown tool");
  });
});
