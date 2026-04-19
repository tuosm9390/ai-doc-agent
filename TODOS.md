# TODOs

Post-MVP items from adversarial review (v0.1.0.0).

## Security / Correctness

- [ ] **LLM JSON trust boundary** — `step_eval` passes raw LLM output directly to `json.loads`. Add schema validation (e.g. Pydantic) and cap score values to 1–10 range.
- [ ] **Input length limits** — `/generate` accepts unbounded `topic` and `instructions`. Add server-side max-length validation (e.g. 500 / 2000 chars).
- [ ] **SSE error parser** — frontend SSE reader crashes if a `data:` line contains invalid JSON. Wrap parse in try/catch and surface a user-facing error state.
- [ ] **localStorage error handling** — `localStorage.setItem` can throw `QuotaExceededError`. Wrap in try/catch to avoid silent failure on result save.

## Reliability

- [ ] **Race condition on rapid submit** — multiple in-flight `/generate` requests can interleave SSE events. Add an AbortController to cancel the previous stream when a new request starts.
- [ ] **Anthropic client connection pool** — `AsyncAnthropic()` is instantiated at module level with default settings. Under load, configure connection limits and timeouts explicitly.

## Done

- [x] FastAPI backend with 4-step SSE pipeline
- [x] Next.js frontend with live step progress
- [x] Mocked test suite (pytest + vitest)
- [x] GitHub Actions CI
- [x] `import json` moved to module top level
