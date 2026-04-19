export type DocType =
  | "일반 문서"
  | "기술 보고서"
  | "제안서"
  | "회의록"
  | "이메일"
  | "블로그 포스트";

export interface GenerateRequest {
  topic: string;
  doc_type: DocType;
  instructions?: string;
}

export interface StepEvent {
  step: number;
  status: "running" | "done";
  label: string;
  elapsed?: number;
}

export interface EvalScores {
  overall: number;
  clarity: number;
  structure: number;
  completeness: number;
  feedback: string;
}

export interface GenerateResult {
  content: string;
  scores: EvalScores;
  generated_at: number;
}

export interface CompleteEvent {
  step: "complete";
  result: GenerateResult;
}

export interface ErrorEvent {
  step: "error";
  message: string;
}

export type PipelineEvent = StepEvent | CompleteEvent | ErrorEvent;

export type AppState = "home" | "running" | "result" | "error";

export interface HistoryItem {
  id: string;
  topic: string;
  doc_type: DocType;
  result: GenerateResult;
  created_at: number;
}
