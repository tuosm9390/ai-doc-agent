"use client";

import { useState, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import StepList from "@/components/StepList";
import {
  AppState,
  DocType,
  GenerateResult,
  PipelineEvent,
  StepEvent,
} from "@/lib/types";

const DOC_TYPES: DocType[] = [
  "일반 문서",
  "기술 보고서",
  "제안서",
  "회의록",
  "이메일",
  "블로그 포스트",
];

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 8 ? "bg-green-500" : value >= 5 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span className="font-medium">{value}/10</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${value * 10}%` }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("home");
  const [topic, setTopic] = useState("");
  const [docType, setDocType] = useState<DocType>("일반 문서");
  const [instructions, setInstructions] = useState("");
  const [stepEvents, setStepEvents] = useState<StepEvent[]>([]);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;

    // Cancel any in-flight request before starting a new one (#5)
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAppState("running");
    setStepEvents([]);
    setResult(null);
    setError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, doc_type: docType, instructions }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      if (!res.body) throw new Error("스트림이 없습니다.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          // Skip malformed SSE lines without crashing (#3)
          let event: PipelineEvent;
          try {
            event = JSON.parse(line.slice(6));
          } catch {
            continue;
          }

          if (event.step === "complete") {
            setResult(event.result);
            setAppState("result");
            // Save to localStorage for dashboard (#4)
            try {
              const history = JSON.parse(localStorage.getItem("doc-history") ?? "[]");
              history.unshift({
                id: Date.now().toString(),
                topic,
                doc_type: docType,
                result: event.result,
                created_at: Date.now(),
              });
              localStorage.setItem("doc-history", JSON.stringify(history.slice(0, 50)));
            } catch {
              // QuotaExceededError or unavailable — skip silently
            }
          } else if (event.step === "error") {
            setError(event.message);
            setAppState("error");
          } else {
            setStepEvents((prev) => {
              const next = prev.filter((e) => e.step !== event.step);
              return [...next, event as StepEvent];
            });
          }
        }
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
      setAppState("error");
    }
  }, [topic, docType, instructions]);

  if (appState === "running") {
    return (
      <div className="max-w-xl mx-auto">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">문서 생성 중</h1>
        <p className="text-sm text-gray-500 mb-8">잠시만 기다려주세요...</p>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <StepList events={stepEvents} />
        </div>
      </div>
    );
  }

  if (appState === "result" && result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">생성 완료</h1>
          <button
            onClick={() => setAppState("home")}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            새 문서 만들기 →
          </button>
        </div>

        {/* Eval scores */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold text-gray-900">
              {result.scores.overall}
            </span>
            <span className="text-sm text-gray-400">/10 종합 점수</span>
          </div>
          <div className="space-y-2.5">
            <ScoreBar label="명확성" value={result.scores.clarity} />
            <ScoreBar label="구조" value={result.scores.structure} />
            <ScoreBar label="완성도" value={result.scores.completeness} />
          </div>
          {result.scores.feedback && (
            <p className="mt-4 text-xs text-gray-500 border-t border-gray-100 pt-4">
              {result.scores.feedback}
            </p>
          )}
        </div>

        {/* Document content */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <article className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {result.content}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    );
  }

  if (appState === "error") {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-sm font-medium text-red-800">오류 발생</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
        <button
          onClick={() => setAppState("home")}
          className="mt-4 text-sm text-gray-500 hover:text-gray-900"
        >
          ← 다시 시도
        </button>
      </div>
    );
  }

  // HOME
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">문서 자동 생성</h1>
      <p className="text-sm text-gray-500 mb-8">
        주제를 입력하면 AI가 문서를 작성하고 품질을 평가합니다.
      </p>

      <div className="space-y-5">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1.5">
            주제 <span className="text-red-500">*</span>
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="예: 재생에너지 산업 동향 분석"
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          />
        </div>

        <div>
          <label htmlFor="doc_type" className="block text-sm font-medium text-gray-700 mb-1.5">
            문서 유형
          </label>
          <select
            id="doc_type"
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          >
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1.5">
            추가 지시사항 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="예: 3페이지 분량, 결론에 액션 아이템 포함"
            rows={3}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={!topic.trim()}
          className="w-full py-2.5 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          문서 생성
        </button>
      </div>
    </div>
  );
}
