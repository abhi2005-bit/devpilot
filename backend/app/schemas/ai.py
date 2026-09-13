from typing import Literal

from pydantic import BaseModel


class AIInsight(BaseModel):
    title: str
    summary: str
    severity: Literal[
        "positive",
        "warning",
        "risk",
    ]
    recommendation: str
    evidence: list[str]


class AIAnalysisRequest(BaseModel):
    analysis_type: Literal[
        "summary",
        "health",
        "risks",
        "bottlenecks",
    ] = "summary"