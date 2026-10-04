from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.investigation import StructuredInvestigation
from app.services.investigation_service import investigation_service
from app.services.ai_investigation_service import ai_investigation_service
from app.api.dependencies import get_current_user_project
from app.db.database import get_db

router = APIRouter(
    prefix="/projects/{project_id}/investigations",
    tags=["Investigations"],
)

@router.get("/analyze", response_model=StructuredInvestigation)
async def analyze_problem(
    project_id: str,
    category: str,
    item_id: str,
    title: str,
    description: str,
    db: Session = Depends(get_db),
    _project: object = Depends(get_current_user_project),
):
    try:
        return await investigation_service.investigate_problem(
            db=db,
            project_id=project_id,
            category=category,
            item_id=item_id,
            title=title,
            description=description
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/analyze/ai", response_model=StructuredInvestigation)
async def analyze_problem_ai(
    project_id: str,
    category: str,
    item_id: str,
    title: str,
    description: str,
    db: Session = Depends(get_db),
    _project: object = Depends(get_current_user_project),
):
    try:
        base_investigation = await investigation_service.investigate_problem(
            db=db,
            project_id=project_id,
            category=category,
            item_id=item_id,
            title=title,
            description=description
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    try:
        ai_analysis = await ai_investigation_service.analyze_investigation(base_investigation)
        base_investigation.ai_analysis = ai_analysis
    except Exception as e:
        import logging
        logging.error(f"AI investigation failed: {e}")
        pass
        
    return base_investigation
