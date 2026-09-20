import json

from sqlalchemy.orm import Session

from app.schemas.ai import AIInsight
from app.services.groq_service import groq_service
from app.services.intelligence_context_service import (
    intelligence_context_service,
)


class AIAnalysisService:
    async def analyze_project(
        self,
        db: Session,
        project_id: str,
        analysis_type: str = "summary",
    ) -> AIInsight:
        context = (
            await intelligence_context_service.build_project_context(
                db=db,
                project_id=project_id,
                lookback_days=14,
                github_limit=25,
            )
        )

        intelligence_data = {
            "project_id": context.project_id,
            "lookback_days": context.lookback_days,
            "health": context.health.model_dump(),
            "metrics": context.metrics.model_dump(),
            "signals": context.signals.model_dump(),
            "context_facts": context.context_facts,
        }

        system_prompt = """
You are DevPilot's Engineering Intelligence Analyst.

Your job is to reason about software engineering project data
and produce evidence-based engineering insights.

The supplied data comes from deterministic engineering metrics,
engineering health calculations, and engineering signals.

Rules:

1. Only use information present in the supplied intelligence context.
2. Never invent metrics, incidents, users, causes, events, or timelines.
3. Do not claim a root cause unless the supplied data explicitly proves it.
4. You may identify relationships between observed engineering facts,
   but describe them as observations or likely patterns when appropriate.
5. Distinguish observed facts from engineering recommendations.
6. Prioritize cross-system reasoning over simply repeating individual signals.
7. Focus on actionable engineering decisions.
8. Keep the response concise and useful to an engineering team.
9. Evidence must contain factual observations from the supplied data.
10. Recommendations must be practical actions supported by the evidence.
11. Return ONLY valid JSON.
12. The JSON must contain exactly these fields:
    title, summary, severity, recommendation, evidence.
13. severity must be exactly one of:
    positive, warning, risk.
14. evidence must be a JSON array of short factual statements.
15. Do not use markdown.
"""

        analysis_guidance = {
            "summary": """
Provide an overall engineering summary.
Identify the most important relationship between the project's
health, engineering metrics, and signals.
""",
            "health": """
Analyze the project's engineering health.
Explain which health components contribute most to the current
health status and support the explanation with evidence.
""",
            "risks": """
Identify the most important current engineering risk.
Prefer risks supported by multiple signals or multiple engineering
systems when the data supports such a relationship.
""",
            "bottlenecks": """
Identify the most significant delivery bottleneck supported by
the available engineering data.
Look for relationships between active work, issue completion,
CI/CD reliability, GitHub activity, and pull requests.
""",
        }

        requested_guidance = analysis_guidance.get(
            analysis_type,
            analysis_guidance["summary"],
        )

        user_prompt = f"""
Analyze this DevPilot engineering project.

Requested analysis type:
{analysis_type}

Analysis guidance:
{requested_guidance}

Engineering Intelligence Context:
{json.dumps(intelligence_data, indent=2, default=str)}

Return JSON in exactly this structure:

{{
  "title": "short engineering insight title",
  "summary": "brief evidence-based engineering explanation",
  "severity": "positive",
  "recommendation": "specific recommended engineering action",
  "evidence": [
    "factual observation 1",
    "factual observation 2"
  ]
}}
"""

        response = await groq_service.generate(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )

        try:
            parsed_response = json.loads(response)
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                "Groq returned invalid JSON."
            ) from exc

        return AIInsight.model_validate(parsed_response)


ai_analysis_service = AIAnalysisService()