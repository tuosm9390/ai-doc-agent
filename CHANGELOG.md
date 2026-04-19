# Changelog

## [0.1.0.0] - 2026-04-19

### Added
- FastAPI backend with SSE streaming `/generate` endpoint
- 4-step async pipeline: context → draft (Claude Haiku) → eval (Claude Sonnet) → format
- CORS restricted to `FRONTEND_URL` env variable
- `/health` endpoint for uptime checks
- Next.js 15 frontend with HOME / RUNNING / RESULT / DASHBOARD screens
- Real-time step progress via SSE (ReadableStream + TextDecoder)
- Recharts-based eval score dashboard
- react-markdown rendering for generated document output
- `aria-live="polite"` on StepList for screen reader accessibility
- pytest test suite: pure pipeline functions + mocked Anthropic API + /generate SSE endpoint
- vitest test suite: type shape tests + StepList component tests
- GitHub Actions CI (Python 3.12 + Node 20) on push/PR
- TESTING.md with framework conventions and run commands

### Fixed
- Moved `import json` from inside `step_eval()` to module top level
- CORS policy tightened from wildcard to explicit origin
- `requirements.txt` dependency conflict: `supabase>=2.10.0`, `httpx>=0.27.0`
