from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.dashboard import DashboardSummary
from app.services.dashboard_service import dashboard_service


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "/summary",
    response_model=DashboardSummary,
)
def read_dashboard_summary(
    db: Session = Depends(get_db),
):
    return dashboard_service.get_summary(db)