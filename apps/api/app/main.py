from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json
from app.api.routes import check, transactions, persona, buddies, freeze, gamification, risk, nudges, simulations, profiling, receipts
from app.core.config import get_settings
from app.core.database import init_db
from app.core.logging_config import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    setup_logging(settings.environment)
    await init_db()
    yield


app = FastAPI(
    title="BajetBuddy API",
    description="AI-powered spending intervention engine for Malaysia",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the Next.js frontend
settings = get_settings()
origins = json.loads(settings.allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(check.router, prefix="/api/check", tags=["check"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(persona.router, prefix="/api/persona", tags=["persona"])
app.include_router(buddies.router, prefix="/api/buddies", tags=["buddies"])
app.include_router(freeze.router, prefix="/api/freeze", tags=["freeze"])
app.include_router(gamification.router, prefix="/api/gamification", tags=["gamification"])
app.include_router(risk.router, prefix="/api/risk", tags=["risk"])
app.include_router(nudges.router, prefix="/api/nudges", tags=["nudges"])
app.include_router(simulations.router, prefix="/api/simulations", tags=["simulations"])
app.include_router(profiling.router, prefix="/api/profiling", tags=["profiling"])
app.include_router(receipts.router, prefix="/api/receipts", tags=["receipts"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "bajetbuddy-api"}


@app.get("/")
async def root():
    return {"message": "BajetBuddy API 💚 — Duit smart, hidup lega."}
