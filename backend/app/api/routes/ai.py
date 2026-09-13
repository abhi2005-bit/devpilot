from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.ai import (
    AIAnalysisRequest,
    AIInsight,
)
from app.services.ai_analysis_service import (
    ai_analysis_service,
)


router = APIRouter(
    prefix="/projects/{project_id}/ai",
    tags=["AI"],
)


@router.post(
    "/analyze",
    response_model=AIInsight,
)
async def analyze_project(
    project_id: str,
    request: AIAnalysisRequest,
    db: Session = Depends(get_db),
):
    return await ai_analysis_service.analyze_project(
        db=db,
        project_id=project_id,
        analysis_type=request.analysis_type,
    )
