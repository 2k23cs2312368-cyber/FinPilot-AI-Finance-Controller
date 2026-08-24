from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AppSettings
from app.schemas import AppSettingsOut, AppSettingsUpdate
from app.agents.ai_service import ai_service
from app.services.audit_service import create_audit_entry
from app.seed_data import seed_database

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("", response_model=AppSettingsOut)
def get_app_settings(db: Session = Depends(get_db)):
    settings_obj = db.query(AppSettings).first()
    if not settings_obj:
        settings_obj = AppSettings(id=1)
        db.add(settings_obj)
        db.commit()
        db.refresh(settings_obj)

    return {
        "id": settings_obj.id,
        "business_name": settings_obj.business_name,
        "currency": settings_obj.currency,
        "currency_symbol": settings_obj.currency_symbol,
        "minimum_cash_reserve": settings_obj.minimum_cash_reserve,
        "monthly_expense_limit": settings_obj.monthly_expense_limit,
        "monthly_revenue_target": settings_obj.monthly_revenue_target,
        "risk_threshold_high": settings_obj.risk_threshold_high,
        "risk_threshold_critical": settings_obj.risk_threshold_critical,
        "ai_mode": settings_obj.ai_mode,
        "has_gemini_key": ai_service.is_gemini_active()
    }

@router.put("", response_model=AppSettingsOut)
def update_app_settings(s_update: AppSettingsUpdate, db: Session = Depends(get_db)):
    settings_obj = db.query(AppSettings).first()
    if not settings_obj:
        settings_obj = AppSettings(id=1)
        db.add(settings_obj)

    if s_update.business_name is not None:
        settings_obj.business_name = s_update.business_name
    if s_update.currency_symbol is not None:
        settings_obj.currency_symbol = s_update.currency_symbol
    if s_update.minimum_cash_reserve is not None:
        settings_obj.minimum_cash_reserve = s_update.minimum_cash_reserve
    if s_update.monthly_expense_limit is not None:
        settings_obj.monthly_expense_limit = s_update.monthly_expense_limit
    if s_update.monthly_revenue_target is not None:
        settings_obj.monthly_revenue_target = s_update.monthly_revenue_target
    if s_update.risk_threshold_high is not None:
        settings_obj.risk_threshold_high = s_update.risk_threshold_high
    if s_update.risk_threshold_critical is not None:
        settings_obj.risk_threshold_critical = s_update.risk_threshold_critical
    if s_update.ai_mode is not None:
        settings_obj.ai_mode = s_update.ai_mode

    db.commit()
    db.refresh(settings_obj)

    create_audit_entry(
        db=db,
        action="SETTINGS_UPDATED",
        entity="settings",
        entity_id="app_settings",
        user="Finance Controller",
        ai_agent="Compliance & Audit Agent",
        previous_value="",
        new_value=f"Reserve: ₹{settings_obj.minimum_cash_reserve:,.2f} | Limit: ₹{settings_obj.monthly_expense_limit:,.2f}",
        details="Updated controller operational limits and risk thresholds."
    )

    return {
        "id": settings_obj.id,
        "business_name": settings_obj.business_name,
        "currency": settings_obj.currency,
        "currency_symbol": settings_obj.currency_symbol,
        "minimum_cash_reserve": settings_obj.minimum_cash_reserve,
        "monthly_expense_limit": settings_obj.monthly_expense_limit,
        "monthly_revenue_target": settings_obj.monthly_revenue_target,
        "risk_threshold_high": settings_obj.risk_threshold_high,
        "risk_threshold_critical": settings_obj.risk_threshold_critical,
        "ai_mode": settings_obj.ai_mode,
        "has_gemini_key": ai_service.is_gemini_active()
    }

@router.post("/seed-demo-data")
def trigger_seed_demo_data(db: Session = Depends(get_db)):
    """Re-seeds database with rich, realistic Indian fintech demo dataset"""
    count_txns, count_exps = seed_database(db)
    return {
        "message": "Demo financial dataset successfully seeded!",
        "transactions_seeded": count_txns,
        "expenses_seeded": count_exps,
        "status": "ready"
    }
