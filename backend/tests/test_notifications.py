from datetime import datetime
from fastapi.testclient import TestClient
from app.core.security import create_access_token
from app.main import app
from app.models import User
from app.models.notification import Notification

client = TestClient(app)

def test_get_notifications(db):
    user_a = User(name="User NA", email="userna@example.com", created_at=datetime.now())
    user_b = User(name="User NB", email="usernb@example.com", created_at=datetime.now())
    db.add_all([user_a, user_b])
    db.flush()

    n1 = Notification(user_id=user_a.id, type="TEST", title="T1", message="M1", is_read=False)
    n2 = Notification(user_id=user_a.id, type="TEST", title="T2", message="M2", is_read=True)
    n3 = Notification(user_id=user_b.id, type="TEST", title="T3", message="M3", is_read=False)
    db.add_all([n1, n2, n3])
    db.commit()

    token_a = create_access_token(user_a.id)
    token_b = create_access_token(user_b.id)

    # User A gets own notifications
    resp_a = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {token_a}"})
    assert resp_a.status_code == 200
    data_a = resp_a.json()
    assert len(data_a) == 2
    assert data_a[0]["title"] in ["T1", "T2"]

    # User B gets own notifications
    resp_b = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {token_b}"})
    assert resp_b.status_code == 200
    assert len(resp_b.json()) == 1

def test_mark_notification_read(db):
    user = User(name="User NC", email="usernc@example.com", created_at=datetime.now())
    db.add(user)
    db.flush()
    n = Notification(user_id=user.id, type="TEST", title="T", message="M", is_read=False)
    db.add(n)
    db.commit()

    token = create_access_token(user.id)
    resp = client.post(f"/api/v1/notifications/{n.id}/read", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    
    db.refresh(n)
    assert n.is_read == True

def test_mark_all_notifications_read(db):
    user = User(name="User ND", email="usernd@example.com", created_at=datetime.now())
    db.add(user)
    db.flush()
    n1 = Notification(user_id=user.id, type="TEST", title="T1", message="M1", is_read=False)
    n2 = Notification(user_id=user.id, type="TEST", title="T2", message="M2", is_read=False)
    db.add_all([n1, n2])
    db.commit()

    token = create_access_token(user.id)
    resp = client.post("/api/v1/notifications/read-all", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200

    db.refresh(n1)
    db.refresh(n2)
    assert n1.is_read == True
    assert n2.is_read == True
