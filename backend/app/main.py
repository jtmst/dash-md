from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import async_session
from app.seed import seed_patients


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with async_session() as db:
        await seed_patients(db)
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


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
