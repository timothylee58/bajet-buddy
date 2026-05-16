from __future__ import annotations

from app.core.auth import AuthenticatedUser, get_current_user


async def _fake_current_user() -> AuthenticatedUser:
    return AuthenticatedUser(user_id="demo-user", email="sarah@example.com")


def install_auth_override(app) -> None:
    app.dependency_overrides[get_current_user] = _fake_current_user
