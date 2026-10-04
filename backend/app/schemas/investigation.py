from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

class TimelineEvent(BaseModel):
    timestamp: Optional[datetime] = None
    type: str
    description: str
    reference_id: Optional[str] = None
    url: Optional[str] = None

class ContributingFactor(BaseModel):
    title: str
    description: str

class Recommendation(BaseModel):
    title: str
    action_type: str
    target_id: Optional[str] = None
    target_url: Optional[str] = None

class EvidenceData(BaseModel):
    health_score: Optional[float] = None
    health_change: Optional[float] = None
    open_issues: Optional[int] = None
    critical_issues: Optional[int] = None
    stale_issues: Optional[int] = None
    failed_ci_runs: Optional[int] = None
    total_ci_runs: Optional[int] = None
    linked_prs: Optional[int] = None
    linked_commits: Optional[int] = None

class ProblemSummary(BaseModel):
    title: str
    severity: str
    current_state: str
    why_it_matters: str


class AIInference(BaseModel):
    statement: str
    confidence: str
    supporting_evidence: List[str]

class AIRecommendation(BaseModel):
    title: str
    reason: str
    priority: str

class AIInvestigationAnalysis(BaseModel):
    summary: str
    facts: List[str]
    inferences: List[AIInference]
    recommendations: List[AIRecommendation]
    uncertainty: List[str]

class StructuredInvestigation(BaseModel):
    id: str
    project_id: str
    category: str
    problem: ProblemSummary
    confidence: str
    evidence: EvidenceData
    timeline: List[TimelineEvent]
    contributing_factors: List[ContributingFactor]
    recommendations: List[Recommendation]
    ai_analysis: Optional[AIInvestigationAnalysis] = None
