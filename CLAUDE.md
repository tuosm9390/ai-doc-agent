## Project

AI Document Generation Agent + Eval Pipeline

- **Backend:** FastAPI + SSE (`backend/`) — `uvicorn main:app --reload`
- **Frontend:** Next.js App Router + Tailwind (`frontend/`) — `npm run dev`

## Architecture

4-step Python pipeline: context → draft (Haiku) → eval (Sonnet) → format.
SSE events streamed to frontend via `/generate` endpoint.

## Testing

- **Backend:** `cd backend && python -m pytest tests/ -v`
- **Frontend:** `cd frontend && npx vitest run`
- See `TESTING.md` for full conventions

Test expectations:
- When writing new functions, write a corresponding test
- When fixing a bug, write a regression test
- When adding error handling, write a test that triggers the error
- Never commit code that makes existing tests fail

## gstack

- Use `/browse` for all web browsing tasks.
- Never use `mcp__claude-in-chrome__*` tools.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action.

Key routing rules:
- Bugs, errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site → invoke qa
- Code review → invoke review
- Architecture review → invoke plan-eng-review
