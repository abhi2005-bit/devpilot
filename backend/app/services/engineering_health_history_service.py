from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ProjectNotFoundError
from app.models.engineering_health_snapshot import (
    EngineeringHealthSnapshot,
)
from app.models.project import Project as ProjectModel
from app.schemas.health_history import (
    EngineeringHealthHistory,
    EngineeringHealthHistoryItem,
)


class EngineeringHealthHistoryService:
    def get_project_history(
        self,
        db: Session,
        project_id: str,
        days: int = 30,
        limit: int = 30,
    ) -> EngineeringHealthHistory:
        try:
            project_id_int = int(project_id)
        except ValueError:
            raise ProjectNotFoundError()

        project_statement = select(ProjectModel).where(
            ProjectModel.id == project_id_int
        )

        project = db.scalar(project_statement)

        if project is None:
            raise ProjectNotFoundError()

        cutoff = datetime.utcnow() - timedelta(days=days)

        snapshot_statement = (
            select(EngineeringHealthSnapshot)
            .where(
                EngineeringHealthSnapshot.project_id == project_id_int,
                EngineeringHealthSnapshot.generated_at >= cutoff,
            )
            .order_by(
                EngineeringHealthSnapshot.generated_at.asc(),
                EngineeringHealthSnapshot.id.asc(),
            )
            .limit(limit)
        )

        snapshots = db.scalars(snapshot_statement).all()

        return EngineeringHealthHistory(
            project_id=project_id_int,
            days=days,
            snapshots=[
                EngineeringHealthHistoryItem(
                    generated_at=snapshot.generated_at,
                    score=snapshot.score,
                    status=snapshot.status,
                    issue_health=snapshot.issue_health,
                    cicd_reliability=snapshot.cicd_reliability,
                    delivery_activity=snapshot.delivery_activity,
                    github_activity=snapshot.github_activity,
                )
                for snapshot in snapshots
            ],
        )


engineering_health_history_service = EngineeringHealthHistoryService()
