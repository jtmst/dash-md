# Dash MD

Patient management dashboard for a medical practice. React/TypeScript frontend, FastAPI backend, PostgreSQL database — fully containerized with Docker Compose.

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs

The database is created, migrated, and seeded automatically on first startup (20 patients, 16 clinical notes).

## Architecture

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Vite, React 19, TypeScript | SPA with client-side routing |
| UI | MUI (Material UI) v7 | Component library, theming, responsive layout |
| Data Fetching | TanStack Query v5 | Caching, background refetch, mutation invalidation |
| Routing | React Router v7 | Nested layouts, parameterized routes |
| HTTP Client | Axios | Response interceptors, base URL configuration |
| Backend | FastAPI | Async request handling, auto-generated OpenAPI docs |
| ORM | SQLAlchemy 2.0 (async) | Mapped column types, relationship loading |
| Migrations | Alembic | Async migrations, auto-generated from models |
| Database | PostgreSQL 16 | ARRAY columns, UUID primary keys |

### Project Structure

```
dash-md/
├── backend/
│   └── app/
│       ├── main.py          # App entrypoint, middleware, lifespan
│       ├── config.py         # Environment-based settings
│       ├── database.py       # Async engine, session, Base
│       ├── middleware.py      # Request logging
│       ├── models/           # SQLAlchemy models
│       ├── schemas/          # Pydantic request/response schemas
│       ├── services/         # Business logic
│       └── routers/          # API endpoints
├── frontend/
│   └── src/
│       ├── api/              # Axios client, API functions
│       ├── hooks/            # TanStack Query hooks
│       ├── components/       # Reusable UI (PatientForm, NotesList, etc.)
│       ├── pages/            # Route-level components
│       ├── layouts/          # Dashboard shell (header, sidebar, content)
│       ├── theme/            # MUI theme configuration
│       ├── types/            # TypeScript interfaces
│       └── utils/            # Formatting, error parsing
└── docker-compose.yml
```

## Core Features

### Dashboard Home

Overview page with patient statistics (total, active, critical, inactive counts) and a recent patients table. Stat cards link to filtered views.

### Patient List

Paginated table with search (debounced), status filtering, and sortable columns. Handles loading, error, and empty states. Responsive layout.

### Patient Detail

Full patient profile organized into personal, medical, and record information cards. Responsive grid layout with status indicators and formatted dates.

### Patient Create / Edit

Shared form component supporting both modes. Personal and medical fields with client-side validation mirroring backend constraints. Server-side validation errors mapped to fields. PUT uses full-replacement semantics (RFC 7231).

### Patient Delete

Confirmation dialog with error handling. Cascade deletes associated notes. Redirects to list with cache invalidation.

### Clinical Notes

Notes section on each patient detail page. Add notes with content and clinical timestamp. Delete with confirmation. Notes ordered newest-first.

### Patient Summary

Template-based summary synthesizing patient demographics, conditions, allergies, and recent notes into a readable narrative. Optionally supports LLM-generated summaries via OpenRouter (see below).

### API Design

RESTful endpoints under `/api` with:
- Pagination (`limit`/`offset`) with configurable page sizes
- Search across name and email fields (ILIKE with wildcard escaping)
- Status filtering with enum validation
- Sortable columns with allowlist validation
- UUID primary keys
- Proper HTTP status codes (201 Created, 204 No Content, 404, 422)
- Global exception handler preventing internal details from leaking to clients

## Additional Features

### Alembic Migrations

Database schema managed through Alembic async migrations from day one. Migrations run automatically on container startup via the backend entrypoint script. New models just need `alembic revision --autogenerate`.

### Request Logging Middleware

Structured JSON access logs on every request: method, path, status code, response time, and a unique request ID. The `X-Request-ID` header is returned on every response (and accepted on incoming requests for end-to-end tracing). Request/response bodies are never logged.

### LLM-Powered Summaries (Optional)

The patient summary endpoint supports an optional LLM mode via [OpenRouter](https://openrouter.ai/). Set these in `.env`:

```
SUMMARY_MODE=llm
OPENROUTER_API_KEY=your-key-here
OPENROUTER_MODEL=google/gemini-2.0-flash-001
```

Falls back to template mode automatically on any failure (missing key, timeout, rate limit). The frontend renders identically regardless of mode.

### CI/CD Pipeline

GitHub Actions workflow with two parallel jobs:
- **Backend**: pytest integration tests against a PostgreSQL service container
- **Frontend**: TypeScript type checking and ESLint

### Hot Reloading

Both frontend (Vite) and backend (uvicorn `--reload`) support hot reloading in Docker via volume mounts. Code changes reflect immediately without rebuilding containers.

## Development

### Running Tests

```bash
# Backend integration tests (requires running postgres)
docker compose up -d postgres
cd backend && pip install -r requirements.txt && pytest tests -v

# Frontend type checking and linting
cd frontend && npx tsc --noEmit && npx eslint src/
```

### Database Migrations

```bash
# Generate a new migration after model changes
docker compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations manually
docker compose exec backend alembic upgrade head

# Check current migration state
docker compose exec postgres psql -U dash -d dash_md -c "SELECT * FROM alembic_version;"
```

### Useful Commands

```bash
# Rebuild a single service
docker compose up --build backend

# View backend logs
docker compose logs -f backend

# Connect to the database
docker compose exec postgres psql -U dash -d dash_md

# Stop everything
docker compose down

# Stop and remove data
docker compose down -v
```

## Security Considerations

This application handles synthetic patient data, but is designed with real PHI/PII practices in mind:

**Implemented:**
- CORS explicitly configured per environment (never wildcarded)
- All database queries parameterized via SQLAlchemy (no raw SQL)
- Input validation on all endpoints (Pydantic schemas with field constraints)
- Global exception handler prevents internal errors from leaking to clients
- Request logging excludes bodies, query parameters, and headers
- Environment variables for all secrets and connection strings
- LLM data minimization: only clinically relevant fields sent, capped at 5 notes / 500 chars each

**Out of scope (production requirements):**
- Authentication and authorization (RBAC per user role)
- Encryption at rest for the database
- Audit logging for data access and modifications
- Rate limiting on API endpoints
- HTTPS / TLS termination
- BAA with LLM provider if using external API with real patient data (or self-hosted model within trust boundary)
