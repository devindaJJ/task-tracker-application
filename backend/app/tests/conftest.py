"""
Shared pytest fixtures.

Tests run against an in-memory SQLite database (via aiosqlite) rather than
Postgres, so the suite is fast and has zero external dependencies -- ideal
for CI. This is safe here because we don't rely on any Postgres-specific
SQL features; everything goes through the SQLAlchemy ORM. `.env.example`
+ Alembic remain the source of truth for the *real* Postgres schema.
"""
from collections.abc import AsyncGenerator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db.base_all_models import Base
from app.db.session import get_db
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, expire_on_commit=False)

    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def alice_tokens(client: AsyncClient) -> dict:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "alice@example.com", "full_name": "Alice Smith", "password": "SecurePass123"},
    )
    resp = await client.post(
        "/api/v1/auth/login", json={"email": "alice@example.com", "password": "SecurePass123"}
    )
    return resp.json()


@pytest_asyncio.fixture
async def bob_tokens(client: AsyncClient) -> dict:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "bob@example.com", "full_name": "Bob Jones", "password": "SecurePass456"},
    )
    resp = await client.post(
        "/api/v1/auth/login", json={"email": "bob@example.com", "password": "SecurePass456"}
    )
    return resp.json()


@pytest_asyncio.fixture
async def promote_to_admin(client: AsyncClient, db_session: AsyncSession):
    """
    Returns an async callable that promotes a user to admin directly via the
    DB session (mirroring how this would be done in production: no self-serve
    admin promotion endpoint exists, by design) and returns fresh tokens.
    """
    from sqlalchemy import select

    from app.models.user import User, UserRole

    async def _promote(email: str, password: str) -> dict:
        result = await db_session.execute(select(User).where(User.email == email))
        user = result.scalar_one()
        user.role = UserRole.ADMIN
        await db_session.commit()

        resp = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
        return resp.json()

    return _promote
