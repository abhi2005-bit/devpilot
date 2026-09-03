from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ProjectNotFoundError
from app.models.cicd_run import CICDRun as CICDRunModel
from app.models.project import Project as ProjectModel
from app.schemas.cicd import (
    CICDHealth,
    CICDRun,
    CICDRunCreate,
)
from app.services.github_service import github_service


class CICDService:

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

    def get_runs(
        self,
        db: Session,
        project_id: str,
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
            raise ValueError(
                "CI/CD run not found"
            )

        return self._to_schema(run)

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
            raise ValueError(
                "GitHub repository is not connected "
                "to this project"
            )

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
                    CICDRunModel.url
                    == workflow_run.url,
                )
            )

            started_at = datetime.fromisoformat(
                workflow_run.started_at.replace(
                    "Z",
                    "+00:00",
                )
            ).replace(tzinfo=None)

            completed_at = None

            if workflow_run.completed_at:
                completed_at = datetime.fromisoformat(
                    workflow_run.completed_at.replace(
                        "Z",
                        "+00:00",
                    )
                ).replace(tzinfo=None)

            if existing_run:

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
        )


cicd_service = CICDService()