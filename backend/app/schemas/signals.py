from typing import Literal

from pydantic import BaseModel


SignalCategory = Literal[
    "issues",
    "cicd",
    "github",
    "delivery",
]

SignalType = Literal[
    "risk",
    "warning",
    "positive",
    "observation",
]

SignalSeverity = Literal[
    "risk",
    "warning",
    "positive",
    "neutral",
]


class EngineeringSignal(BaseModel):
    category: SignalCategory
    type: SignalType
    severity: SignalSeverity
    title: str
    description: str
    value: str
    evidence: list[str]
    recommendation: str


class EngineeringSignals(BaseModel):
    project_id: int
    generated_at: str
    signals: list[EngineeringSignal]
