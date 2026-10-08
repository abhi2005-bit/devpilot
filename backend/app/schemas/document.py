from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional

class DocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "All Docs"
    content: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    content: Optional[str] = None

class Document(DocumentBase):
    id: int
    project_id: int
    author_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
