from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.health import EngineeringHealth
from app.services.engineering_health_service import (
    engineering_health_service,
)


router = APIRouter(
    prefix="/projects/{project_id}/health",
    tags=["Engineering Health"],
)


@router.get(
    "",
    response_model=EngineeringHealth,
)
async def read_project_engineering_health(
    project_id: str,
    include_github: bool = Query(default=True),
    lookback_days: int = Query(
        default=14,
        ge=1,
        le=90,
    ),
    github_limit: int = Query(
        default=25,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
):
    return await engineering_health_service.get_project_health(
        db,
        project_id,
        include_github=include_github,
        lookback_days=lookback_days,
        github_limit=github_limit,
    )