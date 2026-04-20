import json
import os
import time
from typing import AsyncGenerator

from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, field_validator

load_dotenv()


class EvalResult(BaseModel):
    overall: int
    clarity: int
    structure: int
    completeness: int
    feedback: str = ""

    @field_validator("overall", "clarity", "structure", "completeness", mode="before")
    @classmethod
    def clamp_score(cls, v):
        try:
            return max(1, min(10, int(v)))
        except (TypeError, ValueError):
            return 1


client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

DRAFT_MODEL = "gemini-2.5-flash"
EVAL_MODEL = "gemini-2.5-flash"


async def step_context(topic: str, doc_type: str, instructions: str) -> dict:
    """Step 1: Collect and structure context."""
    return {
        "topic": topic,
        "doc_type": doc_type,
        "instructions": instructions,
        "collected_at": time.time(),
    }


async def step_draft(context: dict) -> str:
    """Step 2: Generate draft using Gemini Flash."""
    prompt = f"""문서 유형: {context['doc_type']}
주제: {context['topic']}
추가 지시사항: {context['instructions'] or '없음'}

위 정보를 바탕으로 전문적이고 구조적인 문서를 작성해주세요.
마크다운 형식으로 작성하되, 명확한 제목, 본문, 결론을 포함해주세요."""

    response = await client.aio.models.generate_content(
        model=DRAFT_MODEL,
        contents=prompt,
    )
    return response.text


async def step_eval(draft: str, context: dict) -> dict:
    """Step 3: Evaluate draft using Gemini Flash as judge."""
    eval_prompt = f"""다음 문서를 평가해주세요. 아래 기준으로 1-10점을 매겨주세요.

문서 유형: {context['doc_type']}
주제: {context['topic']}

=== 문서 내용 ===
{draft}
=== 평가 끝 ===

다음 JSON 형식으로만 응답해주세요:
{{
  "overall": <1-10 정수>,
  "clarity": <1-10 정수>,
  "structure": <1-10 정수>,
  "completeness": <1-10 정수>,
  "feedback": "<한 문장 피드백>"
}}"""

    response = await client.aio.models.generate_content(
        model=EVAL_MODEL,
        contents=eval_prompt,
    )

    text = response.text.strip()
    if "```" in text:
        text = text.split("```")[1].replace("json", "").strip()
    parsed = json.loads(text)
    return EvalResult.model_validate(parsed).model_dump()


async def step_format(draft: str, eval_result: dict) -> dict:
    """Step 4: Format final output."""
    return {
        "content": draft,
        "scores": eval_result,
        "generated_at": time.time(),
    }


async def run_pipeline(
    topic: str,
    doc_type: str,
    instructions: str,
) -> AsyncGenerator[dict, None]:
    """Run 4-step generation pipeline, yielding SSE events."""

    yield {"step": 1, "status": "running", "label": "컨텍스트 수집"}
    t0 = time.time()
    context = await step_context(topic, doc_type, instructions)
    yield {"step": 1, "status": "done", "label": "컨텍스트 수집", "elapsed": round(time.time() - t0, 1)}

    yield {"step": 2, "status": "running", "label": "초안 작성"}
    t0 = time.time()
    draft = await step_draft(context)
    yield {"step": 2, "status": "done", "label": "초안 작성", "elapsed": round(time.time() - t0, 1)}

    yield {"step": 3, "status": "running", "label": "Eval 산정"}
    t0 = time.time()
    eval_result = await step_eval(draft, context)
    yield {"step": 3, "status": "done", "label": "Eval 산정", "elapsed": round(time.time() - t0, 1)}

    yield {"step": 4, "status": "running", "label": "결과 포맷"}
    t0 = time.time()
    result = await step_format(draft, eval_result)
    yield {"step": 4, "status": "done", "label": "결과 포맷", "elapsed": round(time.time() - t0, 1)}

    yield {"step": "complete", "result": result}
