from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import (
    CICDRunNotFoundError,
    GitHubRepositoryNotConnectedError,
    InvalidGitHubResponseError,
    ProjectNotFoundError,
)
from app.models.cicd_run import (
    CICDJob as CICDJobModel,
    CICDRun as CICDRunModel,
)
from app.models.project import Project as ProjectModel
from app.schemas.cicd import (
    CICDHealth,
    CICDJob,
    CICDRun,
    CICDRunCreate,
)
from app.services.github_service import github_service


class CICDService:
    def _parse_github_datetime(
        self,
        value: str | None,
    ) -> datetime | None:
        if value is None:
            return None

        try:
            return datetime.fromisoformat(
                value.replace(
                    "Z",
                    "+00:00",
                )
            ).replace(tzinfo=None)
        except ValueError as exc:
            raise InvalidGitHubResponseError() from exc

    def _get_project_id(
        self,
        project_id: str,
    ) -> int:
        try:
            return int(project_id)
        except ValueError:
            raise ProjectNotFoundError()

    def _to_schema(
        self,
        run: CICDRunModel,
    ) -> CICDRun:
        return CICDRun.model_validate(run)

    def _job_to_schema(
        self,
        job: CICDJobModel,
    ) -> CICDJob:
        return CICDJob.model_validate(job)

    def get_runs(
        self,
        db: Session,
        project_id: str,
        limit: int = 50,
        offset: int = 0,
    ) -> list[CICDRun]:
        project_id_int = self._get_project_id(project_id)

        project = db.scalar(
            select(ProjectModel).where(
                ProjectModel.id == project_id_int
            )
        )

        if project is None:
            raise ProjectNotFoundError()

        statement = (
            select(CICDRunModel)
            .where(
                CICDRunModel.project_id == project_id_int
            )
            .order_by(
                CICDRunModel.started_at.desc()
            )
            .offset(offset)
            .limit(limit)
        )

        runs = db.scalars(statement).all()

        return [
            self._to_schema(run)
            for run in runs
        ]

    def get_run(
        self,
        db: Session,
        project_id: str,
        run_id: int,
    ) -> CICDRun:
        project_id_int = self._get_project_id(project_id)

        project = db.scalar(
            select(ProjectModel).where(
                ProjectModel.id == project_id_int
            )
        )

        if project is None:
            raise ProjectNotFoundError()

        statement = select(CICDRunModel).where(
            CICDRunModel.id == run_id,
            CICDRunModel.project_id == project_id_int,
        )

        run = db.scalar(statement)

        if run is None:
            raise CICDRunNotFoundError()

        return self._to_schema(run)

    def get_jobs(
        self,
        db: Session,
        project_id: str,
        run_id: int,
        limit: int = 100,
        offset: int = 0,
    ) -> list[CICDJob]:
        project_id_int = self._get_project_id(project_id)

        run = db.scalar(
            select(CICDRunModel).where(
                CICDRunModel.id == run_id,
                CICDRunModel.project_id == project_id_int,
            )
        )

        if run is None:
            raise CICDRunNotFoundError()

        statement = (
            select(CICDJobModel)
            .where(
                CICDJobModel.project_id == project_id_int,
                CICDJobModel.cicd_run_id == run_id,
            )
            .order_by(CICDJobModel.started_at.desc())
            .offset(offset)
            .limit(limit)
        )

        jobs = db.scalars(statement).all()

        return [
            self._job_to_schema(job)
            for job in jobs
        ]

    def create_run(
        self,
        db: Session,
        data: CICDRunCreate,
    ) -> CICDRun:
        project = db.scalar(
            select(ProjectModel).where(
                ProjectModel.id == data.project_id
            )
        )

        if project is None:
            raise ProjectNotFoundError()

        run = CICDRunModel(
            project_id=data.project_id,
            github_run_id=data.github_run_id,
            workflow_name=data.workflow_name,
            branch=data.branch,
            commit_sha=data.commit_sha,
            status=data.status,
            conclusion=data.conclusion,
            failed_tests=data.failed_tests,
            started_at=data.started_at,
            completed_at=data.completed_at,
            url=data.url,
        )

        db.add(run)
        db.commit()
        db.refresh(run)

        return self._to_schema(run)

    async def sync_github_runs(
        self,
        db: Session,
        project_id: str,
        limit: int = 10,
    ) -> list[CICDRun]:

        project_id_int = self._get_project_id(
            project_id
        )

        project = db.scalar(
            select(ProjectModel).where(
                ProjectModel.id == project_id_int
            )
        )

        if project is None:
            raise ProjectNotFoundError()

        if (
            not project.github_owner
            or not project.github_repo
        ):
            raise GitHubRepositoryNotConnectedError()

        workflow_runs = (
            await github_service.get_workflow_runs(
                project.github_owner,
                project.github_repo,
                limit,
            )
        )

        for workflow_run in workflow_runs:

            existing_run = db.scalar(
                select(CICDRunModel).where(
                    CICDRunModel.project_id
                    == project_id_int,
                    CICDRunModel.github_run_id
                    == workflow_run.id,
                )
            )

            if existing_run is None:
                existing_run = db.scalar(
                    select(CICDRunModel).where(
                        CICDRunModel.project_id
                        == project_id_int,
                        CICDRunModel.github_run_id.is_(None),
                        CICDRunModel.url
                        == workflow_run.url,
                    )
                )

            started_at = self._parse_github_datetime(
                workflow_run.started_at
            )

            if started_at is None:
                raise InvalidGitHubResponseError()

            completed_at = self._parse_github_datetime(
                workflow_run.completed_at
            )

            if existing_run:

                existing_run.github_run_id = (
                    workflow_run.id
                )

                existing_run.workflow_name = (
                    workflow_run.workflow_name
                )

                existing_run.branch = (
                    workflow_run.branch
                )

                existing_run.commit_sha = (
                    workflow_run.commit_sha
                )

                existing_run.status = (
                    workflow_run.status
                )

                existing_run.conclusion = (
                    workflow_run.conclusion
                )

                existing_run.started_at = (
                    started_at
                )

                existing_run.completed_at = (
                    completed_at
                )

                existing_run.url = (
                    workflow_run.url
                )

            else:

                new_run = CICDRunModel(
                    project_id=project_id_int,
                    github_run_id=workflow_run.id,
                    workflow_name=(
                        workflow_run.workflow_name
                    ),
                    branch=workflow_run.branch,
                    commit_sha=(
                        workflow_run.commit_sha
                    ),
                    status=workflow_run.status,
                    conclusion=(
                        workflow_run.conclusion
                    ),
                    failed_tests=0,
                    started_at=started_at,
                    completed_at=completed_at,
                    url=workflow_run.url,
                )

                db.add(new_run)

                existing_run = new_run

            db.flush()

            jobs = await github_service.get_jobs(
                project.github_owner,
                project.github_repo,
                workflow_run.id,
            )

            failed_jobs = 0

            for job in jobs:
                if job.conclusion == "failure":
                    failed_jobs += 1

                existing_job = db.scalar(
                    select(CICDJobModel).where(
                        CICDJobModel.cicd_run_id
                        == existing_run.id,
                        CICDJobModel.github_job_id
                        == job.id,
                    )
                )

                started_at = self._parse_github_datetime(
                    job.started_at
                )
                completed_at = self._parse_github_datetime(
                    job.completed_at
                )

                if existing_job:
                    existing_job.name = job.name
                    existing_job.status = job.status
                    existing_job.conclusion = (
                        job.conclusion
                    )
                    existing_job.started_at = started_at
                    existing_job.completed_at = completed_at
                    existing_job.url = job.url
                else:
                    db.add(
                        CICDJobModel(
                            project_id=project_id_int,
                            cicd_run_id=existing_run.id,
                            github_job_id=job.id,
                            name=job.name,
                            status=job.status,
                            conclusion=job.conclusion,
                            started_at=started_at,
                            completed_at=completed_at,
                            url=job.url,
                        )
                    )

            existing_run.failed_tests = failed_jobs

        db.commit()

        statement = (
            select(CICDRunModel)
            .where(
                CICDRunModel.project_id
                == project_id_int
            )
            .order_by(
                CICDRunModel.started_at.desc()
            )
        )

        runs = db.scalars(statement).all()

        return [
            self._to_schema(run)
            for run in runs
        ]

    def get_health(
        self,
        db: Session,
        project_id: str,
    ) -> CICDHealth:
        project_id_int = self._get_project_id(
            project_id
        )

        project = db.scalar(
            select(ProjectModel).where(
                ProjectModel.id == project_id_int
            )
        )

        if project is None:
            raise ProjectNotFoundError()

        statement = select(CICDRunModel).where(
            CICDRunModel.project_id == project_id_int
        )

        runs = db.scalars(statement).all()

        total_runs = len(runs)

        successful_runs = sum(
            1
            for run in runs
            if run.conclusion == "success"
        )

        failed_runs = sum(
            1
            for run in runs
            if run.conclusion == "failure"
        )

        running_runs = sum(
            1
            for run in runs
            if run.status in {
                "queued",
                "in_progress",
            }
        )

        total_failed_tests = sum(
            run.failed_tests
            for run in runs
        )

        failed_jobs = db.scalar(
            select(func.count())
            .select_from(CICDJobModel)
            .where(
                CICDJobModel.project_id == project_id_int,
                CICDJobModel.conclusion == "failure",
            )
        ) or 0

        completed_runs = (
            successful_runs + failed_runs
        )

        if completed_runs > 0:
            success_rate = (
                successful_runs
                / completed_runs
                * 100
            )

            failure_rate = (
                failed_runs
                / completed_runs
                * 100
            )
        else:
            success_rate = 0.0
            failure_rate = 0.0

        return CICDHealth(
            total_runs=total_runs,
            successful_runs=successful_runs,
            failed_runs=failed_runs,
            running_runs=running_runs,
            success_rate=round(
                success_rate,
                2,
            ),
            failure_rate=round(
                failure_rate,
                2,
            ),
            total_failed_tests=total_failed_tests,
            failed_jobs=failed_jobs,
        )


cicd_service = CICDService()
