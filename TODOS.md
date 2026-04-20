# TODOs

Post-MVP items from adversarial review (v0.1.0.0).

## Security / Correctness

- [x] **LLM JSON trust boundary** — `EvalResult` Pydantic model clamps scores to 1–10 range.
- [x] **Input length limits** — topic max 500, instructions max 2000 chars (Pydantic Field).
- [x] **SSE error parser** — try/catch around `JSON.parse`, malformed lines skipped.
- [x] **localStorage error handling** — try/catch wraps `setItem`, `QuotaExceededError` handled.

## Reliability

- [x] **Race condition on rapid submit** — AbortController cancels previous in-flight SSE request.
- [x] **Connection pool** — Switched to Google Gemini (`google-genai`); Anthropic client removed.

## Done

- [x] FastAPI backend with 4-step SSE pipeline
- [x] Next.js frontend with live step progress
- [x] Mocked test suite (pytest + vitest)
- [x] GitHub Actions CI
- [x] `import json` moved to module top level
