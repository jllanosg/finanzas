from fastapi import APIRouter, Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.routers import accounts, budgets, categories, dashboard, transactions

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="A small REST API for accounts, transactions, budgets, and dashboard totals.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],
)

api = APIRouter(prefix=settings.api_v1_prefix)


@api.get("/health", tags=["health"])
def health(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}


api.include_router(accounts.router)
api.include_router(categories.router)
api.include_router(transactions.router)
api.include_router(budgets.router)
api.include_router(dashboard.router)
app.include_router(api)


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {
        "name": settings.app_name,
        "docs": "/docs",
        "api": settings.api_v1_prefix,
    }
