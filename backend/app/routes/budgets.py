import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Budget, Expense, Transaction, AppSettings
from app.schemas import BudgetOut, BudgetCreate, BudgetUpdate, BudgetOverviewOut
from app.services.analytics_service import get_budget_comparisons
from app.services.audit_service import create_audit_entry

router = APIRouter(prefix="/api/budgets", tags=["Budgets"])

@router.get("/overview", response_model=BudgetOverviewOut)
def get_budget_overview(db: Session = Depends(get_db)):
    settings_obj = db.query(AppSettings).first()
    rev_target = settings_obj.monthly_revenue_target if settings_obj else 2500000.0
    exp_budget = settings_obj.monthly_expense_limit if settings_obj else 1800000.0
    min_reserve = settings_obj.minimum_cash_reserve if settings_obj else 500000.0

    now = datetime.datetime.utcnow()
    month_start = datetime.datetime(now.year, now.month, 1)

    curr_rev = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == "SUCCESS",
        Transaction.date >= month_start
    ).scalar() or 0.0

    curr_exp = db.query(func.sum(Expense.amount)).filter(
        Expense.status.in_(["PAID", "APPROVED", "FLAGGED"]),
        Expense.date >= month_start
    ).scalar() or 0.0

    rev_progress = (curr_rev / rev_target * 100) if rev_target > 0 else 0.0
    exp_used = (curr_exp / exp_budget * 100) if exp_budget > 0 else 0.0

    comparisons = get_budget_comparisons(db)
    over_budget_items = [c for c in comparisons if c["status"] == "OVER_BUDGET"]

    if over_budget_items:
        overall_status = "OVER_BUDGET"
        ai_assessment = (
            f"⚠️ Budget Alert: Total spend is at {exp_used:.1f}% of monthly ceiling. "
            f"Critical overrun detected in {over_budget_items[0]['category']} (+{over_budget_items[0]['variance_pct']}%). "
            f"At this trajectory, total monthly budget could exceed allowance by ₹{(curr_exp - exp_budget):,.2f}."
        )
    elif exp_used > 85:
        overall_status = "AT_RISK"
        ai_assessment = f"Spend is pacing high at {exp_used:.1f}% of total budget. Non-essential procurements should require sign-off."
    else:
        overall_status = "ON_TRACK"
        ai_assessment = f"Budget utilization is healthy at {exp_used:.1f}% with revenue tracking at {rev_progress:.1f}% of monthly goal."

    return {
        "monthly_revenue_target": rev_target,
        "monthly_expense_budget": exp_budget,
        "min_cash_reserve": min_reserve,
        "current_revenue": round(curr_rev, 2),
        "current_expense": round(curr_exp, 2),
        "revenue_target_progress_pct": round(rev_progress, 1),
        "expense_budget_used_pct": round(exp_used, 1),
        "overall_status": overall_status,
        "category_comparisons": comparisons,
        "ai_budget_assessment": ai_assessment
    }

@router.get("", response_model=List[BudgetOut])
def get_all_budgets(db: Session = Depends(get_db)):
    return db.query(Budget).all()

@router.post("", response_model=BudgetOut)
def create_or_update_budget(b_in: BudgetCreate, db: Session = Depends(get_db)):
    existing = db.query(Budget).filter(Budget.category == b_in.category).first()
    prev_val = f"₹{existing.allocated_amount:,.2f}" if existing else "None"

    if existing:
        existing.allocated_amount = b_in.allocated_amount
        existing.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(existing)
        res = existing
    else:
        new_b = Budget(
            category=b_in.category,
            allocated_amount=b_in.allocated_amount,
            period=b_in.period or "2026-03"
        )
        db.add(new_b)
        db.commit()
        db.refresh(new_b)
        res = new_b

    create_audit_entry(
        db=db,
        action="BUDGET_CONFIGURED",
        entity="budget",
        entity_id=str(res.id),
        user="Finance Controller",
        ai_agent="Expense Controller Agent",
        previous_value=prev_val,
        new_value=f"₹{res.allocated_amount:,.2f}",
        details=f"Category '{res.category}' budget target adjusted."
    )

    return res

@router.put("/{budget_id}", response_model=BudgetOut)
def update_budget(budget_id: int, b_update: BudgetUpdate, db: Session = Depends(get_db)):
    b = db.query(Budget).filter(Budget.id == budget_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Budget entry not found")

    prev_val = f"₹{b.allocated_amount:,.2f}"
    b.allocated_amount = b_update.allocated_amount
    b.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(b)

    create_audit_entry(
        db=db,
        action="BUDGET_MODIFIED",
        entity="budget",
        entity_id=str(b.id),
        user="Finance Controller",
        ai_agent="Expense Controller Agent",
        previous_value=prev_val,
        new_value=f"₹{b.allocated_amount:,.2f}",
        details=f"Category '{b.category}' budget allocation updated."
    )

    return b
