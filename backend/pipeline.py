import anthropic
import time
from typing import AsyncGenerator


client = anthropic.AsyncAnthropic()


async def step_context(topic: str, doc_type: str, instructions: str) -> dict:
    """Step 1: Collect and structure context."""
    context = {
        "topic": topic,
        "doc_type": doc_type,
        "instructions": instructions,
        "collected_at": time.time(),
    }
    return context


async def step_draft(context: dict) -> str:
    """Step 2: Generate draft using Claude Haiku."""
    prompt = f"""문서 유형: {context['doc_type']}
주제: {context['topic']}
추가 지시사항: {context['instructions'] or '없음'}

위 정보를 바탕으로 전문적이고 구조적인 문서를 작성해주세요.
마크다운 형식으로 작성하되, 명확한 제목, 본문, 결론을 포함해주세요."""

    message = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


async def step_eval(draft: str, context: dict) -> dict:
    """Step 3: Evaluate draft using Claude Sonnet as judge."""
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

    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[{"role": "user", "content": eval_prompt}],
    )

    import json
    text = message.content[0].text.strip()
    # Extract JSON from possible markdown code blocks
    if "```" in text:
        text = text.split("```")[1].replace("json", "").strip()
    return json.loads(text)


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
