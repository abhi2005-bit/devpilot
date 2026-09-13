import json

from sqlalchemy.orm import Session

from app.schemas.ai import AIInsight
from app.services.engineering_health_service import (
    engineering_health_service,
)
from app.services.engineering_metrics_service import (
    engineering_metrics_service,
)
from app.services.groq_service import groq_service


class AIAnalysisService:
    async def analyze_project(
        self,
        db: Session,
        project_id: str,
        analysis_type: str = "summary",
    ) -> AIInsight:
        metrics = (
            await engineering_metrics_service.get_project_metrics(
                db,
                project_id,
                include_github=True,
                lookback_days=14,
                github_limit=25,
            )
        )

        health = (
            await engineering_health_service.get_project_health(
                db,
                project_id,
                include_github=True,
                lookback_days=14,
                github_limit=25,
            )
        )

        engineering_data = {
            "project_id": metrics.project_id,
            "lookback_days": metrics.lookback_days,
            "health": {
                "score": health.score,
                "status": health.status,
                "issue_health": health.issue_health.model_dump(),
                "cicd_reliability": (
                    health.cicd_reliability.model_dump()
                ),
                "delivery_activity": (
                    health.delivery_activity.model_dump()
                ),
                "github_activity": (
                    health.github_activity.model_dump()
                ),
            },
            "issues": metrics.issues.model_dump(),
            "cicd": metrics.cicd.model_dump(),
            "github": metrics.github.model_dump(),
            "activity": metrics.activity.model_dump(),
        }

        system_prompt = """
You are DevPilot's Engineering Intelligence Analyst.

Your job is to analyze engineering project data and provide
evidence-based engineering insights.

Rules:

1. Only use information present in the supplied engineering data.
2. Never invent metrics, incidents, users, causes, or events.
3. Do not claim something is certain when the data only suggests it.
4. Distinguish clearly between observed facts and reasonable
   engineering recommendations.
5. Focus on actionable engineering decisions.
6. Keep the response concise and useful to an engineering team.
7. Return ONLY valid JSON.
8. The JSON must contain exactly these fields:
   title, summary, severity, recommendation, evidence.
9. severity must be exactly one of:
   positive, warning, risk.
10. evidence must be a JSON array of short factual statements.
"""

        user_prompt = f"""
Analyze this DevPilot engineering project.

Requested analysis type:
{analysis_type}

Engineering data:
{json.dumps(engineering_data, indent=2, default=str)}

Return JSON in exactly this structure:

{{
  "title": "short engineering insight title",
  "summary": "brief evidence-based explanation",
  "severity": "positive",
  "recommendation": "specific recommended action",
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