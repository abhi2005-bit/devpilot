from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User as UserModel
from app.schemas.document import Document, DocumentCreate, DocumentUpdate
from app.services.document_service import document_service, DocumentNotFoundError
from app.core.exceptions import ProjectNotFoundError

router = APIRouter(
    prefix="/projects/{project_id}/documents",
    tags=["Documents"],
)

@router.get(
    "",
    response_model=list[Document],
)
def list_documents(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    try:
        return document_service.get_by_project(db, project_id, current_user.id)
    except ProjectNotFoundError:
        raise HTTPException(status_code=404, detail="Project not found")

@router.get(
    "/{document_id}",
    response_model=Document,
)
def get_document(
    project_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    try:
        return document_service.get_by_id(db, project_id, document_id, current_user.id)
    except ProjectNotFoundError:
        raise HTTPException(status_code=404, detail="Project not found")
    except DocumentNotFoundError:
        raise HTTPException(status_code=404, detail="Document not found")

@router.post(
    "",
    response_model=Document,
    status_code=status.HTTP_201_CREATED,
)
def create_document(
    project_id: int,
    data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    try:
        return document_service.create(db, project_id, current_user.id, data)
    except ProjectNotFoundError:
        raise HTTPException(status_code=404, detail="Project not found")

@router.patch(
    "/{document_id}",
    response_model=Document,
)
def update_document(
    project_id: int,
    document_id: int,
    data: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    try:
        return document_service.update(db, project_id, document_id, current_user.id, data)
    except ProjectNotFoundError:
        raise HTTPException(status_code=404, detail="Project not found")
    except DocumentNotFoundError:
        raise HTTPException(status_code=404, detail="Document not found")

@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_document(
    project_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    try:
        document_service.delete(db, project_id, document_id, current_user.id)
    except ProjectNotFoundError:
        raise HTTPException(status_code=404, detail="Project not found")
    except DocumentNotFoundError:
        raise HTTPException(status_code=404, detail="Document not found")
