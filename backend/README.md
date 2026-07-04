# Task Tracker — Backend

FastAPI + SQLAlchemy (async) + PostgreSQL backend for the Task Tracker application.

## Stack

- **Framework:** FastAPI (async)
- **ORM:** SQLAlchemy 2.0 (async, `asyncpg` driver)
- **Migrations:** Alembic
- **Database:** PostgreSQL 16
- **Auth:** JWT (access + refresh tokens), `bcrypt` password hashing
- **Real-time:** Native WebSockets
- **Testing:** pytest + httpx (against an in-memory SQLite DB for speed/isolation)
- **Linting:** ruff

## Setup

### 1. Start the database

From the repo root:

```bash
docker-compose up -d
```

This starts Postgres 16 on `localhost:5432` with the credentials already wired
into `.env.example` (user: `tasktracker`, db: `tasktracker`).

### 2. Set up the Python environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` if you changed any Docker Compose credentials. At minimum,
**generate a real secret** for production use:

```bash
openssl rand -hex 32   # paste into JWT_SECRET_KEY
```

### 4. Run database migrations

```bash
alembic upgrade head
```

This creates the `users` and `tasks` tables. See `alembic/versions/` for the
migration history, or `../db-scripts/schema.sql` for a plain-SQL reference of
the resulting schema (not executed directly — Alembic is the source of truth).

### 5. Run the server

```bash
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Interactive docs (Swagger): http://localhost:8000/docs
- Alternative docs (ReDoc): http://localhost:8000/redoc

## Running Tests

```bash
pytest -v
```

Tests run against an isolated in-memory SQLite database via a `db_session`
fixture (see `app/tests/conftest.py`), so they require no external services
and run in seconds. This is safe here because the app relies only on
standard SQLAlchemy ORM constructs, not Postgres-specific SQL.

## Linting

```bash
ruff check app/
```

## Verifying the Database Directly

If you want to bypass the ORM and confirm the schema by hand:

```bash
docker exec -it tasktracker_postgres psql -U tasktracker -d tasktracker -f /db-scripts/verify.sql
```

or, connected via `psql` locally:

```bash
psql -h localhost -U tasktracker -d tasktracker -f ../db-scripts/verify.sql
```

This checks tables, enum values, columns, foreign keys, indexes, the current
migration version, and row counts — everything needed to confirm a fresh
setup matches what the application expects.

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, router registration, CORS
│   ├── core/
│   │   ├── config.py         # Settings loaded from .env
│   │   ├── security.py       # Password hashing, JWT creation/verification
│   │   └── exception_handlers.py  # Consistent error response shape
│   ├── models/                # SQLAlchemy models (User, Task)
│   ├── schemas/                # Pydantic request/response schemas
│   ├── api/
│   │   ├── deps.py            # Auth + RBAC dependencies
│   │   └── routes/             # auth.py, tasks.py, users.py, ws.py
│   ├── db/
│   │   ├── base.py             # Declarative base
│   │   ├── session.py          # Async engine + session factory
│   │   └── types.py            # Portable UUID column type
│   ├── ws/
│   │   └── manager.py          # WebSocket connection manager
│   └── tests/                  # pytest suite
├── alembic/                    # Migrations
├── requirements.txt
└── .env.example
```

## Design Decisions

- **RBAC is enforced at the query level, not just the route level.** Regular
  users' task list/detail/update/delete queries are always scoped to
  `owner_id = current_user.id` server-side — a user can never see another
  user's task even if they guess its ID or pass a different `owner_id` filter.
  Unauthorized access to another user's task returns `404`, not `403`, so
  users can't distinguish "doesn't exist" from "exists but isn't yours."
- **Admin promotion is DB-only by design.** There's intentionally no
  `PATCH /users/{id}/role` endpoint — self-serve admin promotion is a
  privilege-escalation risk in a system this small. Promotion is done via a
  direct SQL `UPDATE` (see the "Assumptions" section below).
- **Enum values are stored lowercase in Postgres** (`values_callable` on the
  SQLAlchemy `Enum` type), matching the values used everywhere else in the
  app (JWT payloads, JSON responses) instead of SQLAlchemy's default of
  storing the Python enum's *member name*.
- **A portable `GUID` column type** is used instead of Postgres' native
  `UUID` type directly, so the same models work against the SQLite database
  used in tests without any behavior change in production.
- **WebSocket auth uses a query parameter**, not a header, because browsers
  cannot set custom headers during a WebSocket handshake.

## Assumptions

- Task `status` is a fixed enum (`todo`, `in_progress`, `done`) rather than
  a free-text or admin-configurable field.
- There is no email verification step on registration — accounts are active
  immediately. This would be a reasonable addition for a production system.
- To test admin functionality locally, promote a user directly in the
  database:
  ```sql
  UPDATE users SET role = 'admin' WHERE email = 'someone@example.com';
  ```
  They'll need to log in again (or refresh their token) to pick up the new
  role, since role is embedded in the JWT payload.

## Future Improvements

- The WebSocket connection manager is in-memory and single-process. A
  multi-instance deployment would need a shared pub/sub layer (e.g. Redis)
  to broadcast events across all API instances.
- Refresh tokens are not currently revocable (no server-side denylist/rotation
  tracking). A production system would want refresh token rotation with
  reuse detection.
- Rate limiting on `/auth/login` and `/auth/register` to mitigate brute-force
  and enumeration attacks.
