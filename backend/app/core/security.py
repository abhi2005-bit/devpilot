from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import secrets

import jwt
from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError

from app.db.database import settings


password_hash = PasswordHash.recommended()
GITHUB_OAUTH_STATE_ALGORITHM = "HS256"


def _github_oauth_state_key() -> bytes:
    return hmac.new(
        settings.jwt_secret_key.encode("utf-8"),
        b"devpilot:github-oauth-state:v1",
        hashlib.sha256,
    ).digest()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return password_hash.verify(password, hashed_password)
    except UnknownHashError:
        # Treat corrupt or unsupported stored hashes as invalid credentials.
        return False


def create_access_token(
    user_id: int,
    expires_minutes: int | None = None,
) -> str:
    if expires_minutes is None:
        expires_minutes = settings.jwt_access_token_expire_minutes

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=expires_minutes)

    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> int:
    payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )

    subject = payload.get("sub")

    if subject is None:
        raise ValueError("Token does not contain a user id.")

    try:
        return int(subject)
    except (TypeError, ValueError) as exc:
        raise ValueError("Token contains an invalid user id.") from exc


def create_github_oauth_state(
    user_id: int,
    expires_in_seconds: int = 600,
) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(seconds=expires_in_seconds),
        "purpose": "github_oauth_state",
        "nonce": secrets.token_urlsafe(32),
    }
    return jwt.encode(
        payload,
        _github_oauth_state_key(),
        algorithm=GITHUB_OAUTH_STATE_ALGORITHM,
    )


def decode_github_oauth_state(state: str) -> int:
    try:
        payload = jwt.decode(
            state,
            _github_oauth_state_key(),
            algorithms=[GITHUB_OAUTH_STATE_ALGORITHM],
            options={
                "require": ["sub", "iat", "exp", "purpose", "nonce"],
            },
        )
    except jwt.PyJWTError as exc:
        raise ValueError("Invalid or expired GitHub OAuth state.") from exc

    if payload.get("purpose") != "github_oauth_state" or not payload.get("nonce"):
        raise ValueError("Invalid or expired GitHub OAuth state.")

    try:
        return int(payload["sub"])
    except (TypeError, ValueError) as exc:
        raise ValueError("Invalid or expired GitHub OAuth state.") from exc
