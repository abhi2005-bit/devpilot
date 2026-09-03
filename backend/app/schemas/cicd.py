from datetime import datetime

from pydantic import BaseModel, Field


class CICDRunBase(BaseModel):
    workflow_name: str = Field(
        min_length=1,
        max_length=150,
    )

    branch: str = Field(
        min_length=1,
        max_length=150,
    )

    commit_sha: str | None = Field(
        default=None,
        max_length=100,
    )

    status: str = Field(
        min_length=1,
        max_length=50,
    )

    conclusion: str | None = Field(
        default=None,
        max_length=50,
    )

    failed_tests: int = Field(
        default=0,
        ge=0,
    )

    started_at: datetime

    completed_at: datetime | None = None

    url: str | None = None


class CICDRunCreate(CICDRunBase):
    project_id: int


class CICDRun(CICDRunBase):
    id: int
    project_id: int

    class Config:
        from_attributes = True


class CICDHealth(BaseModel):
    total_runs: int
    successful_runs: int
    failed_runs: int
    running_runs: int
    success_rate: float
    failure_rate: float
    total_failed_tests: int