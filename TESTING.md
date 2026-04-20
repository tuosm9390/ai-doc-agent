# Testing

100% test coverage is the key to great vibe coding. Tests let you move fast, trust your instincts, and ship with confidence — without them, vibe coding is just yolo coding. With tests, it's a superpower.

## Frameworks

| Layer                    | Framework                       | Version    |
| ------------------------ | ------------------------------- | ---------- |
| Backend (Python/FastAPI) | pytest + pytest-asyncio         | pytest 9.x |
| Frontend (Next.js)       | vitest + @testing-library/react | vitest 4.x |

## How to Run

### Backend

```bash
cd backend
python -m pytest tests/ -v
```

### Frontend

```bash
cd frontend
npx vitest run
```

## Test Layers

### Backend Unit Tests (`backend/tests/`)

- **test_main.py** — FastAPI endpoints: `/health`, `/generate` validation, `format_sse`; input length limits (topic ≤500, instructions ≤2000)
- **test_pipeline.py** — Pipeline step functions: `step_context`, `step_format` (pure, no API calls)
- **test_pipeline_mocked.py** — `step_draft`, `step_eval`, `run_pipeline` with `AsyncMock` patching `pipeline.client.messages.create`; covers plain JSON, markdown code block, score clamping (above 10 / below 1), invalid JSON rejection
- **test_generate_endpoint.py** — `/generate` SSE streaming happy path + error event branch via `mock.patch("main.run_pipeline")`

### Frontend Unit Tests (`frontend/src/__tests__/`)

- **types.test.ts** — TypeScript type shape assertions (EvalScores, GenerateResult, AppState)
- **StepList.test.tsx** — StepList component: idle labels, done icon (`✓`), elapsed time, running indicator (`●`), `aria-live="polite"` accessibility

## Conventions

- Test files: `test_*.py` (Python), `*.test.ts/tsx` (TypeScript)
- Async tests use `@pytest.mark.asyncio` (auto-mode enabled in pytest.ini)
- Mock external API calls (Anthropic) — never call real APIs in tests
- Each test asserts real behavior, not just existence

## Test Expectations

- 100% coverage is the goal
- New functions → write a corresponding test
- Bug fixed → write a regression test
- Error handling → write a test that triggers the error
- Conditional branch → write tests for both paths
- Never commit code that makes existing tests fail
