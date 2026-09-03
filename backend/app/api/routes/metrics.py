from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.metrics import EngineeringMetrics
from app.services.engineering_metrics_service import (
    engineering_metrics_service,
)


router = APIRouter(
    prefix="/projects/{project_id}/metrics",
    tags=["Engineering Metrics"],
)


@router.get(
    "",
    response_model=EngineeringMetrics,
)
async def read_project_engineering_metrics(
    project_id: str,
    include_github: bool = Query(default=False),
    lookback_days: int = Query(default=14, ge=1, le=90),
    github_limit: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return await engineering_metrics_service.get_project_metrics(
        db,
        project_id,
        include_github=include_github,
        lookback_days=lookback_days,
        github_limit=github_limit,
    )
