import { describe, it, expect } from "vitest";
import type { EvalScores, GenerateResult, HistoryItem, AppState } from "@/lib/types";

describe("EvalScores shape", () => {
  it("accepts valid score object", () => {
    const scores: EvalScores = {
      overall: 8,
      clarity: 7,
      structure: 9,
      completeness: 8,
      feedback: "Well written",
    };
    expect(scores.overall).toBe(8);
    expect(scores.feedback).toBe("Well written");
  });

  it("accepts scores without feedback", () => {
    const scores: EvalScores = {
      overall: 6,
      clarity: 6,
      structure: 6,
      completeness: 6,
    };
    expect(scores.feedback).toBeUndefined();
  });
});

describe("GenerateResult shape", () => {
  it("contains content and scores", () => {
    const result: GenerateResult = {
      content: "# Document\n\nContent here.",
      scores: { overall: 7, clarity: 7, structure: 7, completeness: 7 },
      generated_at: Date.now(),
    };
    expect(result.content).toContain("Document");
    expect(result.scores.overall).toBe(7);
  });
});

describe("AppState values", () => {
  it("covers all expected states", () => {
    const states: AppState[] = ["home", "running", "result", "error"];
    expect(states).toHaveLength(4);
  });
});
