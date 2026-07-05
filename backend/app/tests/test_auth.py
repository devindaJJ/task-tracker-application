import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_register_success(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "newuser@example.com", "full_name": "New User", "password": "SecurePass123"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "newuser@example.com"
    assert body["role"] == "user"
    assert "hashed_password" not in body


async def test_register_duplicate_email_returns_409(client: AsyncClient):
    payload = {"email": "dup@example.com", "full_name": "Dup", "password": "SecurePass123"}
    await client.post("/api/v1/auth/register", json=payload)
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409


async def test_register_short_password_returns_422(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "shortpw@example.com", "full_name": "Short", "password": "short"},
    )
    assert response.status_code == 422


async def test_register_invalid_email_returns_422(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "not-an-email", "full_name": "Bad Email", "password": "SecurePass123"},
    )
    assert response.status_code == 422


async def test_login_success_returns_token_pair(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "login@example.com", "full_name": "Login User", "password": "SecurePass123"},
    )
    response = await client.post(
        "/api/v1/auth/login", json={"email": "login@example.com", "password": "SecurePass123"}
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"


async def test_login_wrong_password_returns_401(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "wrongpw@example.com", "full_name": "User", "password": "SecurePass123"},
    )
    response = await client.post(
        "/api/v1/auth/login", json={"email": "wrongpw@example.com", "password": "WrongPassword"}
    )
    assert response.status_code == 401


async def test_login_nonexistent_user_returns_401(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login", json={"email": "ghost@example.com", "password": "SecurePass123"}
    )
    assert response.status_code == 401


async def test_refresh_token_issues_new_pair(client: AsyncClient, alice_tokens: dict):
    response = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": alice_tokens["refresh_token"]}
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body


async def test_refresh_with_access_token_rejected(client: AsyncClient, alice_tokens: dict):
    """An access token must not work as a refresh token."""
    response = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": alice_tokens["access_token"]}
    )
    assert response.status_code == 401
