from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.health_history import EngineeringHealthHistory
from app.services.engineering_health_history_service import (
    engineering_health_history_service,
)


router = APIRouter(
    prefix="/projects/{project_id}/engineering-health",
    tags=["Engineering Health"],
)


@router.get(
    "/history",
    response_model=EngineeringHealthHistory,
)
def read_project_engineering_health_history(
    project_id: str,
    days: int = Query(
        default=30,
        ge=1,
        le=365,
    ),
    limit: int = Query(
        default=30,
        ge=1,
        le=365,
    ),
    db: Session = Depends(get_db),
):
    return engineering_health_history_service.get_project_history(
        db,
        project_id,
        days=days,
        limit=limit,
    )
