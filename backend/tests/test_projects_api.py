from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_get_missing_project():
    response = client.get(
        "/api/v1/projects/999999"
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Project not found"
    }