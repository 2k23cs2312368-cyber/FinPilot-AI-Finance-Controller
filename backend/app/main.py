import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, get_db, SessionLocal
from app.models import Transaction
from app.seed_data import seed_database

# Import routers
from app.routes.dashboard import router as dashboard_router
from app.routes.transactions import router as transactions_router
from app.routes.expenses import router as expenses_router
from app.routes.budgets import router as budgets_router
from app.routes.cashflow import router as cashflow_router
from app.routes.risks import router as risks_router
from app.routes.approvals import router as approvals_router
from app.routes.audit_logs import router as audit_logs_router
from app.routes.insights import router as insights_router
from app.routes.copilot import router as copilot_router
from app.routes.reports import router as reports_router
from app.routes.settings import router as settings_router
from app.routes.reconciliation import router as reconciliation_router
from app.agents.ai_service import ai_service

# Initialize DB Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FinPilot AI API",
    description="Autonomous AI Finance Controller — Razorpay AI Builder Internship 2026 (Track 4)",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev and preview
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup auto-seed check
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        count = db.query(Transaction).count()
        if count == 0:
            print("[FinPilot AI] Fresh database detected. Auto-seeding initial demo data...")
            seed_database(db)
            print("[FinPilot AI] Demo data seeded successfully.")
        else:
            print(f"[FinPilot AI] Database ready with {count} transactions.")
    finally:
        db.close()

# Include API Routers
app.include_router(dashboard_router)
app.include_router(transactions_router)
app.include_router(expenses_router)
app.include_router(budgets_router)
app.include_router(cashflow_router)
app.include_router(reconciliation_router)
app.include_router(risks_router)
app.include_router(approvals_router)
app.include_router(audit_logs_router)
app.include_router(insights_router)
app.include_router(copilot_router)
app.include_router(reports_router)
app.include_router(settings_router)

@app.get("/")
def root():
    return {
        "app": "FinPilot AI — Autonomous AI Finance Controller",
        "version": "1.0.0",
        "track": "Razorpay AI Builder Track 4: AI Finance Controller",
        "status": "online",
        "ai_engine": ai_service.get_ai_mode(),
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    txn_count = db.query(Transaction).count()
    return {
        "status": "healthy",
        "database": "connected",
        "transactions_loaded": txn_count,
        "ai_engine": ai_service.get_ai_mode()
    }
