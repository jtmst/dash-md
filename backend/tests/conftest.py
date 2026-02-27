import os
import socket
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import settings
from app.database import Base, get_db
from app.main import app


def _test_db_url() -> str:
    if url := os.environ.get("TEST_DATABASE_URL"):
        return url
    base = settings.DATABASE_URL
    try:
        socket.getaddrinfo("postgres", 5432)
    except socket.gaierror:
        base = base.replace("@postgres:", "@localhost:")
    return base.rsplit("/", 1)[0] + "/dash_md_test"


TEST_DATABASE_URL = _test_db_url()

engine = create_async_engine(TEST_DATABASE_URL)
TestSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


@pytest.fixture(scope="session", autouse=True)
async def setup_db():
    """Create tables once for the test session, drop when done."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(autouse=True)
async def clean_tables():
    """Truncate all tables between tests for isolation."""
    yield
    async with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(table.delete())


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP client pointed at the test app with DB override."""

    async def override_get_db():
        async with TestSessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


async def create_test_patient(client, **overrides):
    data = {
        "first_name": "Test",
        "last_name": "Patient",
        "date_of_birth": "1990-01-15",
        "gender": "Female",
        "email": "test@example.com",
        "phone": "555-0100",
        "address": "123 Test St",
        **overrides,
    }
    response = await client.post("/api/patients", json=data)
    assert response.status_code == 201
    return response.json()
