from datetime import datetime

from pydantic import BaseModel

from app.schemas.health import EngineeringHealth
from app.schemas.metrics import EngineeringMetrics
from app.schemas.signals import EngineeringSignals


class EngineeringIntelligenceContext(BaseModel):
    project_id: int
    generated_at: datetime
    lookback_days: int

    health: EngineeringHealth
    metrics: EngineeringMetrics
    signals: EngineeringSignals

    context_facts: list[str]
