from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.intelligence import EngineeringIntelligenceContext
from app.services.intelligence_context_service import (
    intelligence_context_service,
)


router = APIRouter(
    prefix="/projects/{project_id}/intelligence-context",
    tags=["Intelligence Context"],
)


@router.get(
    "",
    response_model=EngineeringIntelligenceContext,
)
async def read_project_intelligence_context(
    project_id: str,
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
    return await intelligence_context_service.build_project_context(
        db=db,
        project_id=project_id,
        lookback_days=lookback_days,
        github_limit=github_limit,
    )
