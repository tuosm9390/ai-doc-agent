# ai-doc-agent

AI 문서 생성 에이전트. 주제와 문서 유형을 입력하면 Claude가 초안을 작성하고 품질을 평가해 결과를 실시간으로 스트리밍합니다.

## Architecture

```
frontend (Next.js 15)
    ↓ SSE stream
backend (FastAPI)
    ↓
    Step 1: 컨텍스트 수집
    Step 2: 초안 작성     ← Claude Haiku
    Step 3: 품질 평가     ← Claude Sonnet
    Step 4: 결과 포맷
```

## Quick Start

**Backend**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # ANTHROPIC_API_KEY 입력
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 후 주제와 문서 유형을 입력하면 됩니다.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API 키 (필수) |
| `FRONTEND_URL` | CORS 허용 origin (기본값: `http://localhost:3000`) |

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | 서버 상태 확인 |
| `POST` | `/generate` | 문서 생성 (SSE 스트림 반환) |

### `/generate` Request

```json
{
  "topic": "AI 트렌드 2025",
  "doc_type": "기술 보고서",
  "instructions": "3페이지 분량으로 작성"
}
```

### SSE Event Shape

```json
{ "step": 1, "status": "running", "label": "컨텍스트 수집" }
{ "step": 1, "status": "done",    "label": "컨텍스트 수집", "elapsed": 0.1 }
{ "step": "complete", "result": { "content": "...", "scores": { "overall": 8 } } }
```

## Testing

```bash
# Backend (16 tests)
cd backend && python -m pytest tests/ -v

# Frontend (9 tests)
cd frontend && npx vitest run
```

자세한 내용은 [TESTING.md](TESTING.md)를 참고하세요.

## Post-MVP

개선 예정 항목은 [TODOS.md](TODOS.md)에 정리되어 있습니다.
