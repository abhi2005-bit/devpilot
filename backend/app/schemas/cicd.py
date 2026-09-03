from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CICDRunBase(BaseModel):
    github_run_id: int | None = None

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
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int


class CICDJob(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    cicd_run_id: int
    github_job_id: int
    name: str
    status: str
    conclusion: str | None
    started_at: datetime | None
    completed_at: datetime | None
    url: str | None

class CICDHealth(BaseModel):
    total_runs: int
    successful_runs: int
    failed_runs: int
    running_runs: int
    success_rate: float
    failure_rate: float
    total_failed_tests: int
    failed_jobs: int
