from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import async_session
from app.routers.notes import router as notes_router
from app.routers.patients import router as patients_router
from app.seed import seed_notes, seed_patients


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with async_session() as db:
        await seed_patients(db)
        await seed_notes(db)
        await db.commit()
    yield


app = FastAPI(title="Dash MD API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


app.include_router(patients_router)
app.include_router(notes_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
