from datetime import datetime
from urllib.parse import parse_qs, urlparse

import httpx
import jwt
import pytest
from fastapi.testclient import TestClient

from app.api.routes import github as github_route
from app.core.security import (
    create_access_token,
    create_github_oauth_state,
    decode_access_token,
    decode_github_oauth_state,
)
from app.db.database import settings
from app.main import app
from app.models.user import User


client = TestClient(app)


class MockTokenResponse:
    status_code = 200

    @staticmethod
    def json():
        return {"access_token": "mocked-github-access-token"}


class MockOAuthClient:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        return None

    async def post(self, *args, **kwargs):
        return MockTokenResponse()


def _create_user(db, name: str, email: str) -> User:
    user = User(name=name, email=email, created_at=datetime.now())
    db.add(user)
    db.flush()
    return user


def _auth_headers(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


def test_github_authorization_url_contains_bound_state_and_local_callback(db, monkeypatch):
    user = _create_user(db, "OAuth Owner", "oauth-owner@example.com")
    monkeypatch.setattr(settings, "github_client_id", "mock-client-id")
    monkeypatch.setattr(settings, "github_client_secret", "mock-client-secret")
    monkeypatch.setattr(settings, "github_redirect_uri", "http://127.0.0.1:5175/github/callback")

    response = client.get("/api/v1/github/authorize", headers=_auth_headers(user))

    assert response.status_code == 200
    payload = response.json()
    query = parse_qs(urlparse(payload["url"]).query)
    assert query["state"] == [payload["state"]]
    assert query["redirect_uri"] == ["http://127.0.0.1:5175/github/callback"]
    assert query["scope"] == ["repo,read:user"]
    assert decode_github_oauth_state(payload["state"]) == user.id
    with pytest.raises(jwt.InvalidTokenError):
        # The state token is not signed with the DevPilot API-token key.
        decode_access_token(payload["state"])


def test_github_callback_accepts_valid_state_and_saves_token_for_initiating_user(
    db,
    monkeypatch,
):
    user = _create_user(db, "OAuth Callback Owner", "oauth-callback@example.com")
    state = create_github_oauth_state(user.id)
    monkeypatch.setattr(settings, "github_client_id", "mock-client-id")
    monkeypatch.setattr(settings, "github_client_secret", "mock-client-secret")
    monkeypatch.setattr(github_route.httpx, "AsyncClient", MockOAuthClient)

    response = client.post(
        "/api/v1/github/callback",
        headers=_auth_headers(user),
        json={"code": "mock-authorization-code", "state": state},
    )

    assert response.status_code == 200
    assert response.json() == {"status": "success"}
    db.refresh(user)
    assert user.github_token == "mocked-github-access-token"


@pytest.mark.parametrize("invalid_state", ["missing", "tampered", "expired", "mismatched"])
def test_github_callback_rejects_invalid_state_before_token_exchange(
    db,
    monkeypatch,
    invalid_state,
):
    user = _create_user(db, "OAuth Invalid State Owner", f"oauth-{invalid_state}@example.com")
    other_user = _create_user(db, "Other OAuth Owner", f"other-{invalid_state}@example.com")
    if invalid_state == "missing":
        state = None
    elif invalid_state == "expired":
        state = create_github_oauth_state(user.id, expires_in_seconds=-1)
    elif invalid_state == "mismatched":
        state = create_github_oauth_state(other_user.id)
    else:
        state = create_github_oauth_state(user.id)
        header, payload, signature = state.split(".")
        state = f"{header}.{payload}.{'A' if signature[0] != 'A' else 'B'}{signature[1:]}"

    exchange_called = False

    class ForbiddenOAuthClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, traceback):
            return None

        async def post(self, *args, **kwargs):
            nonlocal exchange_called
            exchange_called = True
            raise AssertionError("Invalid state must be rejected before token exchange.")

    monkeypatch.setattr(settings, "github_client_id", "mock-client-id")
    monkeypatch.setattr(settings, "github_client_secret", "mock-client-secret")
    monkeypatch.setattr(github_route.httpx, "AsyncClient", ForbiddenOAuthClient)
    payload = {"code": "must-not-be-exchanged"}
    if state is not None:
        payload["state"] = state

    response = client.post(
        "/api/v1/github/callback",
        headers=_auth_headers(user),
        json=payload,
    )

    assert response.status_code == 400
    assert not exchange_called
    assert "must-not-be-exchanged" not in response.text
    assert state is None or state not in response.text
    db.refresh(user)
    assert user.github_token is None


def test_github_token_exchange_error_does_not_expose_sensitive_values(db, monkeypatch):
    user = _create_user(db, "OAuth Error Owner", "oauth-error@example.com")
    state = create_github_oauth_state(user.id)
    monkeypatch.setattr(settings, "github_client_id", "mock-client-id")
    monkeypatch.setattr(settings, "github_client_secret", "mock-client-secret")

    class FailingOAuthClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, traceback):
            return None

        async def post(self, *args, **kwargs):
            raise RuntimeError(
                "mock-client-secret mock-authorization-code mocked-github-access-token"
            )

    monkeypatch.setattr(github_route.httpx, "AsyncClient", FailingOAuthClient)
    response = client.post(
        "/api/v1/github/callback",
        headers=_auth_headers(user),
        json={"code": "mock-authorization-code", "state": state},
    )

    assert response.status_code == 502
    assert "mock-client-secret" not in response.text
    assert "mock-authorization-code" not in response.text
    assert "mocked-github-access-token" not in response.text
    db.refresh(user)
    assert user.github_token is None
