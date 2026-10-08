from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.document import Document as DocumentModel
from app.models.project import Project as ProjectModel
from app.schemas.document import Document, DocumentCreate, DocumentUpdate
from app.core.exceptions import ProjectNotFoundError

class DocumentNotFoundError(Exception):
    pass

class DocumentService:
    def _to_schema(self, document: DocumentModel) -> Document:
        return Document(
            id=document.id,
            project_id=document.project_id,
            author_id=document.author_id,
            title=document.title,
            description=document.description,
            category=document.category,
            content=document.content,
            created_at=document.created_at,
            updated_at=document.updated_at
        )

    def get_by_project(self, db: Session, project_id: int, user_id: int) -> list[Document]:
        project = db.execute(
            select(ProjectModel).where(ProjectModel.id == project_id)
        ).scalar_one_or_none()
        
        if not project or project.owner_id != user_id:
            raise ProjectNotFoundError(f"Project {project_id} not found")

        documents = db.execute(
            select(DocumentModel)
            .where(DocumentModel.project_id == project_id)
            .order_by(DocumentModel.updated_at.desc())
        ).scalars().all()
        
        return [self._to_schema(doc) for doc in documents]

    def get_by_id(self, db: Session, project_id: int, document_id: int, user_id: int) -> Document:
        project = db.execute(
            select(ProjectModel).where(ProjectModel.id == project_id)
        ).scalar_one_or_none()
        
        if not project or project.owner_id != user_id:
            raise ProjectNotFoundError(f"Project {project_id} not found")

        document = db.execute(
            select(DocumentModel).where(
                DocumentModel.id == document_id,
                DocumentModel.project_id == project_id
            )
        ).scalar_one_or_none()

        if not document:
            raise DocumentNotFoundError(f"Document {document_id} not found")

        return self._to_schema(document)

    def create(self, db: Session, project_id: int, user_id: int, data: DocumentCreate) -> Document:
        project = db.execute(
            select(ProjectModel).where(ProjectModel.id == project_id)
        ).scalar_one_or_none()

        if not project or project.owner_id != user_id:
            raise ProjectNotFoundError(f"Project {project_id} not found")

        now = datetime.now(timezone.utc)
        document = DocumentModel(
            project_id=project_id,
            author_id=user_id,
            title=data.title,
            description=data.description,
            category=data.category,
            content=data.content,
            created_at=now,
            updated_at=now
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        return self._to_schema(document)

    def update(self, db: Session, project_id: int, document_id: int, user_id: int, data: DocumentUpdate) -> Document:
        project = db.execute(
            select(ProjectModel).where(ProjectModel.id == project_id)
        ).scalar_one_or_none()
        
        if not project or project.owner_id != user_id:
            raise ProjectNotFoundError(f"Project {project_id} not found")

        document = db.execute(
            select(DocumentModel).where(
                DocumentModel.id == document_id,
                DocumentModel.project_id == project_id
            )
        ).scalar_one_or_none()

        if not document:
            raise DocumentNotFoundError(f"Document {document_id} not found")

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(document, key, value)
            
        document.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(document)
        
        return self._to_schema(document)

    def delete(self, db: Session, project_id: int, document_id: int, user_id: int) -> bool:
        project = db.execute(
            select(ProjectModel).where(ProjectModel.id == project_id)
        ).scalar_one_or_none()
        
        if not project or project.owner_id != user_id:
            raise ProjectNotFoundError(f"Project {project_id} not found")

        document = db.execute(
            select(DocumentModel).where(
                DocumentModel.id == document_id,
                DocumentModel.project_id == project_id
            )
        ).scalar_one_or_none()

        if not document:
            raise DocumentNotFoundError(f"Document {document_id} not found")

        db.delete(document)
        db.commit()
        
        return True

document_service = DocumentService()
