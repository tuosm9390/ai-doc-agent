"use client";

import { StepEvent } from "@/lib/types";

const STEPS = [
  { n: 1, label: "컨텍스트 수집" },
  { n: 2, label: "초안 작성" },
  { n: 3, label: "Eval 산정" },
  { n: 4, label: "결과 포맷" },
];

interface Props {
  events: StepEvent[];
}

export default function StepList({ events }: Props) {
  const byStep = Object.fromEntries(events.map((e) => [e.step, e]));

  return (
    <ul aria-live="polite" aria-label="생성 진행 상황" className="space-y-3">
      {STEPS.map(({ n, label }) => {
        const ev = byStep[n];
        const isDone = ev?.status === "done";
        const isRunning = ev?.status === "running";

        return (
          <li key={n} className="flex items-center gap-3 text-sm">
            <span className="w-6 text-center font-mono text-gray-400">
              {isDone ? "✓" : isRunning ? "●" : " "}
            </span>
            <span
              className={
                isDone
                  ? "text-gray-900"
                  : isRunning
                    ? "text-blue-600 font-medium"
                    : "text-gray-400"
              }
            >
              {`Step ${n}: ${label}`}
            </span>
            {isDone && ev.elapsed !== undefined && (
              <span className="text-gray-400 text-xs">{ev.elapsed}s</span>
            )}
            {isRunning && (
              <span className="text-blue-400 text-xs animate-pulse">•••</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
