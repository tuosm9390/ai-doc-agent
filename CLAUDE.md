## Project

AI Document Generation Agent + Eval Pipeline

- **Backend:** FastAPI + SSE (`backend/`) — `uvicorn main:app --reload`
- **Frontend:** Next.js App Router + Tailwind (`frontend/`) — `npm run dev`

## Architecture

4-step Python pipeline: context → draft (Haiku) → eval (Sonnet) → format.
SSE events streamed to frontend via `/generate` endpoint.

## Testing

No test framework yet. Run backend: `cd backend && uvicorn main:app --reload --port 8000`

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
