import { describe, it, expect } from "vitest";
import {
  accumulateUsage,
  billableTokens,
  emptyTurnUsage,
  TOKEN_WEIGHTS,
} from "@/lib/agent/tokens";

describe("billableTokens", () => {
  it("weights output above input and discounts cache reads", () => {
    const out = billableTokens({
      inputTokens: 100,
      outputTokens: 100,
      cacheReadTokens: 100,
      cacheCreationTokens: 0,
    });
    const w = TOKEN_WEIGHTS;
    expect(out).toBe(
      Math.round(100 * w.output + 100 * w.input + 100 * w.input * w.cacheRead)
    );
    // output dominates: 100 output costs more than 100 (uncached) input
    expect(100 * w.output).toBeGreaterThan(100 * w.input);
  });
});

describe("accumulateUsage", () => {
  it("sums across calls and tracks the LAST call's context size", () => {
    let u = emptyTurnUsage();
    u = accumulateUsage(u, { input_tokens: 1000, output_tokens: 50 });
    u = accumulateUsage(u, {
      input_tokens: 1800,
      output_tokens: 70,
      cache_read_input_tokens: 200,
    });
    expect(u.inputTokens).toBe(2800);
    expect(u.outputTokens).toBe(120);
    expect(u.cacheReadTokens).toBe(200);
    // contextTokens reflects only the most recent call (input + cache).
    expect(u.contextTokens).toBe(1800 + 200);
    expect(u.billableTokens).toBeGreaterThan(0);
  });

  it("treats missing usage as zero", () => {
    const u = accumulateUsage(emptyTurnUsage(), null);
    expect(u.billableTokens).toBe(0);
    expect(u.contextTokens).toBe(0);
  });
});
