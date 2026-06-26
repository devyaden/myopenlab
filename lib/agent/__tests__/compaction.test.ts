import { describe, it, expect } from "vitest";
import {
  estimateTokens,
  isRealUserMessage,
  findCompactionSplit,
} from "@/lib/agent/compaction";

const userMsg = (text: string) => ({ role: "user", content: text });
const asstMsg = (text: string) => ({ role: "assistant", content: text });
const toolResultTurn = () => ({
  role: "user",
  content: [{ type: "tool_result", tool_use_id: "x", content: "ok" }],
});

describe("isRealUserMessage", () => {
  it("accepts a plain user turn, rejects a tool_result turn", () => {
    expect(isRealUserMessage(userMsg("hi"))).toBe(true);
    expect(isRealUserMessage(toolResultTurn())).toBe(false);
    expect(isRealUserMessage(asstMsg("hi"))).toBe(false);
  });
});

describe("findCompactionSplit", () => {
  it("returns -1 when history is comfortably under the cap", () => {
    const msgs = [userMsg("hello"), asstMsg("hi there")];
    expect(findCompactionSplit(msgs, 100000)).toBe(-1);
  });

  it("returns -1 when no cap is set", () => {
    const big = Array.from({ length: 50 }, (_, i) => userMsg("x".repeat(2000) + i));
    expect(findCompactionSplit(big, 0)).toBe(-1);
  });

  it("splits at a real-user-message boundary when over the cap", () => {
    // Build many turns so estimated tokens exceed the cap.
    const msgs: any[] = [];
    for (let i = 0; i < 40; i++) {
      msgs.push(userMsg("question " + "y".repeat(400) + i));
      msgs.push(asstMsg("answer " + "z".repeat(400) + i));
    }
    const cap = 2000; // small cap to force compaction
    const split = findCompactionSplit(msgs, cap);
    expect(split).toBeGreaterThan(0);
    expect(split).toBeLessThan(msgs.length);
    // the tail must begin at a genuine user message (never mid tool-pair)
    expect(isRealUserMessage(msgs[split])).toBe(true);
  });

  it("estimateTokens grows with content size", () => {
    const small = estimateTokens([userMsg("hi")]);
    const large = estimateTokens([userMsg("x".repeat(4000))]);
    expect(large).toBeGreaterThan(small);
  });
});
