import json
import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from pipeline import run_pipeline

load_dotenv()

app = FastAPI(title="AI Doc Agent", version="0.1.0")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    topic: str
    doc_type: str = "일반 문서"
    instructions: Optional[str] = None


def format_sse(data: dict) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/generate")
async def generate(req: GenerateRequest):
    if not req.topic.strip():
        raise HTTPException(status_code=422, detail="topic은 필수입니다.")

    async def event_stream():
        try:
            async for event in run_pipeline(
                topic=req.topic,
                doc_type=req.doc_type,
                instructions=req.instructions or "",
            ):
                yield format_sse(event)
        except Exception as e:
            yield format_sse({"step": "error", "message": str(e)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
