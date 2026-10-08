from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.core.security import create_access_token
from app.main import app
from app.models import Project, User, Document

client = TestClient(app)

def test_documents_require_auth():
    response = client.get("/api/v1/projects/1/documents")
    assert response.status_code == 401

def test_document_crud(db):
    user = User(name="Doc User", email="doc@example.com", created_at=datetime.now(timezone.utc))
    db.add(user)
    db.commit()

    project = Project(
        name="Doc Project", 
        description="test", 
        owner_id=user.id, 
        created_at=datetime.now(timezone.utc)
    )
    db.add(project)
    db.commit()

    token = create_access_token(str(user.id))
    headers = {"Authorization": f"Bearer {token}"}

    # Create
    response = client.post(
        f"/api/v1/projects/{project.id}/documents",
        json={"title": "Test Doc", "category": "Architecture", "content": "Markdown"},
        headers=headers
    )
    assert response.status_code == 201
    doc_id = response.json()["id"]

    # List
    response = client.get(f"/api/v1/projects/{project.id}/documents", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 1

    # Get
    response = client.get(f"/api/v1/projects/{project.id}/documents/{doc_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["title"] == "Test Doc"

    # Update
    response = client.patch(
        f"/api/v1/projects/{project.id}/documents/{doc_id}",
        json={"title": "Updated Doc"},
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Doc"

    # Delete
    response = client.delete(f"/api/v1/projects/{project.id}/documents/{doc_id}", headers=headers)
    assert response.status_code == 204

    # Verify deleted
    response = client.get(f"/api/v1/projects/{project.id}/documents/{doc_id}", headers=headers)
    assert response.status_code == 404

def test_cross_project_access_rejection(db):
    user_a = User(name="User A", email="a@example.com", created_at=datetime.now(timezone.utc))
    user_b = User(name="User B", email="b@example.com", created_at=datetime.now(timezone.utc))
    db.add_all([user_a, user_b])
    db.commit()

    project_a = Project(name="Project A", description="A", owner_id=user_a.id, created_at=datetime.now(timezone.utc))
    db.add(project_a)
    db.commit()

    doc = Document(project_id=project_a.id, title="Secret", category="Guides", created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc))
    db.add(doc)
    db.commit()

    # User B tries to access User A's project documents
    token_b = create_access_token(str(user_b.id))
    headers_b = {"Authorization": f"Bearer {token_b}"}

    response = client.get(f"/api/v1/projects/{project_a.id}/documents", headers=headers_b)
    assert response.status_code == 404

    response = client.get(f"/api/v1/projects/{project_a.id}/documents/{doc.id}", headers=headers_b)
    assert response.status_code == 404
