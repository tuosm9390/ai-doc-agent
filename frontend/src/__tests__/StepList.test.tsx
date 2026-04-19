import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StepList from "@/components/StepList";
import type { StepEvent } from "@/lib/types";

describe("StepList", () => {
  it("renders all 4 step labels in idle state", () => {
    render(<StepList events={[]} />);
    expect(screen.getByText(/컨텍스트 수집/)).toBeInTheDocument();
    expect(screen.getByText(/초안 작성/)).toBeInTheDocument();
    expect(screen.getByText(/Eval 산정/)).toBeInTheDocument();
    expect(screen.getByText(/결과 포맷/)).toBeInTheDocument();
  });

  it("shows done icon for completed step", () => {
    const events: StepEvent[] = [
      { step: 1, status: "done", label: "컨텍스트 수집", elapsed: 0.3 },
    ];
    render(<StepList events={events} />);
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("shows elapsed time for done step", () => {
    const events: StepEvent[] = [
      { step: 1, status: "done", label: "컨텍스트 수집", elapsed: 1.5 },
    ];
    render(<StepList events={events} />);
    expect(screen.getByText("1.5s")).toBeInTheDocument();
  });

  it("shows running indicator for active step", () => {
    const events: StepEvent[] = [
      { step: 2, status: "running", label: "초안 작성" },
    ];
    render(<StepList events={events} />);
    expect(screen.getByText("●")).toBeInTheDocument();
  });

  it("has aria-live for accessibility", () => {
    const { container } = render(<StepList events={[]} />);
    const live = container.querySelector("[aria-live]");
    expect(live).toBeInTheDocument();
    expect(live?.getAttribute("aria-live")).toBe("polite");
  });
});
