import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.security import create_access_token
from app.main import app
from app.models import Project, User
from app.models.engineering_health_snapshot import EngineeringHealthSnapshot
from app.services.engineering_health_service import engineering_health_service

client = TestClient(app)

def test_create_project_with_owner_role_does_not_return_500(db):
    user = User(
        name="Test Owner",
        email="test_owner@example.com",
        created_at=datetime.now(),
    )
    db.add(user)
    db.commit()

    response = client.post(
        "/api/v1/projects",
        headers={
            "Authorization": f"Bearer {create_access_token(user.id)}",
        },
        json={
            "name": "New Project",
            "description": "Desc",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert len(data["members"]) == 1
    assert data["members"][0]["role"] == "OWNER"

def test_create_project_normalizes_github_url(db):
    user = User(
        name="Test Owner 2",
        email="test_owner2@example.com",
        created_at=datetime.now(),
    )
    db.add(user)
    db.commit()

    response = client.post(
        "/api/v1/projects",
        headers={
            "Authorization": f"Bearer {create_access_token(user.id)}",
        },
        json={
            "name": "Normalized Project",
            "description": "Desc",
            "github_owner": "abhi2005-bit",
            "github_repo": "https://github.com/abhi2005-bit/devpilot.git",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["github_owner"] == "abhi2005-bit"
    assert data["github_repo"] == "devpilot"
    assert data["github_url"] == "https://github.com/abhi2005-bit/devpilot"

@pytest.mark.asyncio
async def test_delete_project_prevents_health_snapshot_race(db):
    user = User(
        name="Test Owner 3",
        email="test_owner3@example.com",
        created_at=datetime.now(),
    )
    db.add(user)
    db.flush()

    project = Project(
        name="Project to Delete",
        description="Desc",
        owner_id=user.id,
        created_at=datetime.now(),
    )
    db.add(project)
    db.commit()
    project_id = project.id

    # Delete project
    db.delete(project)
    db.commit()

    # Attempt to persist health snapshot
    await engineering_health_service.get_project_health(
        db,
        str(project_id),
        persist_snapshot=True
    )
    
    # Verify no snapshot was created and no error was raised
    snapshots = db.scalars(
        select(EngineeringHealthSnapshot).where(EngineeringHealthSnapshot.project_id == project_id)
    ).all()
    assert len(snapshots) == 0
