# Testing

100% test coverage is the key to great vibe coding. Tests let you move fast, trust your instincts, and ship with confidence — without them, vibe coding is just yolo coding. With tests, it's a superpower.

## Frameworks

| Layer | Framework | Version |
|-------|-----------|---------|
| Backend (Python/FastAPI) | pytest + pytest-asyncio | pytest 9.x |
| Frontend (Next.js) | vitest + @testing-library/react | vitest 4.x |

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
- **test_main.py** — FastAPI endpoints: `/health`, `/generate` validation, `format_sse`
- **test_pipeline.py** — Pipeline step functions: `step_context`, `step_format` (pure, no API calls)

### Frontend Unit Tests (`frontend/src/__tests__/`)
- **types.test.ts** — TypeScript type shape assertions (EvalScores, GenerateResult, AppState)

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
