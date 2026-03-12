from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.database import Base, engine
from app.routers import stats, items, users, orders

import app.models.models  # noqa — register models before create_all
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stats.router)
app.include_router(items.router)
app.include_router(users.router)
app.include_router(orders.router)


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "app": settings.APP_NAME}


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "FastAPI Dashboard API",
        "docs": "/docs",
        "endpoints": ["/stats", "/items", "/users", "/orders"],
    }
