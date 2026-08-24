import datetime
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func
from app.database import get_db
from app.models import Expense, Budget
from app.schemas import ExpenseOut, ExpenseCreate, ExpenseUpdate, CategoryExpenseSummary
from app.services.analytics_service import get_budget_comparisons
from app.services.audit_service import create_audit_entry

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])

@router.get("", response_model=dict)
def get_expenses(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = Query("date", pattern="^(date|amount|vendor)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$")
):
    query = db.query(Expense)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Expense.vendor.ilike(search_fmt)) |
            (Expense.description.ilike(search_fmt)) |
            (Expense.category.ilike(search_fmt))
        )
    if category and category != "ALL":
        query = query.filter(Expense.category == category)
    if status and status != "ALL":
        query = query.filter(Expense.status == status)

    total = query.count()

    order_col = getattr(Expense, sort_by)
    if sort_order == "desc":
        query = query.order_by(desc(order_col))
    else:
        query = query.order_by(asc(order_col))

    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()

    return {
        "items": [ExpenseOut.model_validate(e) for e in items],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit > 0 else 1
    }

@router.get("/categories", response_model=List[CategoryExpenseSummary])
def get_expense_categories_summary(db: Session = Depends(get_db)):
    return get_budget_comparisons(db)

@router.post("", response_model=ExpenseOut)
def create_expense(exp_in: ExpenseCreate, db: Session = Depends(get_db)):
    """
    Creates an expense and automatically runs AI risk checks:
    - Checks category budget allocation
    - Detects duplicate charges from same vendor within 48h
    """
    gen_id = f"exp_{random.randint(100000, 999999)}"
    now = exp_in.date or datetime.datetime.utcnow()

    # 1. AI Budget check
    budget = db.query(Budget).filter(Budget.category == exp_in.category).first()
    allocated = budget.allocated_amount if budget else 150000.0
    month_start = datetime.datetime(now.year, now.month, 1)
    
    current_month_cat_spend = db.query(func.sum(Expense.amount)).filter(
        Expense.category == exp_in.category,
        Expense.date >= month_start
    ).scalar() or 0.0

    ai_risk = "NORMAL"
    if (current_month_cat_spend + exp_in.amount) > (allocated * 1.15):
        ai_risk = "ABOVE_BUDGET"

    # 2. AI Duplicate check
    two_days_ago = now - datetime.timedelta(days=2)
    potential_duplicate = db.query(Expense).filter(
        Expense.vendor.ilike(exp_in.vendor),
        Expense.amount == exp_in.amount,
        Expense.date >= two_days_ago
    ).first()

    if potential_duplicate:
        ai_risk = "DUPLICATE_SUSPECT"

    new_exp = Expense(
        id=gen_id,
        date=now,
        vendor=exp_in.vendor,
        category=exp_in.category,
        amount=exp_in.amount,
        payment_method=exp_in.payment_method,
        status=exp_in.status,
        ai_risk=ai_risk,
        description=exp_in.description or ""
    )
    db.add(new_exp)
    db.commit()
    db.refresh(new_exp)

    create_audit_entry(
        db=db,
        action="EXPENSE_CREATED",
        entity="expense",
        entity_id=new_exp.id,
        user="Finance Controller",
        ai_agent="Expense Controller Agent",
        previous_value="",
        new_value=f"₹{new_exp.amount:,.2f} ({new_exp.category})",
        details=f"Vendor: {new_exp.vendor} | AI Risk Assessment: {ai_risk}"
    )

    return new_exp

@router.put("/{exp_id}", response_model=ExpenseOut)
def update_expense(exp_id: str, exp_update: ExpenseUpdate, db: Session = Depends(get_db)):
    exp = db.query(Expense).filter(Expense.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")

    prev_val = f"₹{exp.amount:,.2f} ({exp.category}) - {exp.vendor}"

    if exp_update.vendor is not None:
        exp.vendor = exp_update.vendor
    if exp_update.category is not None:
        exp.category = exp_update.category
    if exp_update.amount is not None:
        exp.amount = exp_update.amount
    if exp_update.payment_method is not None:
        exp.payment_method = exp_update.payment_method
    if exp_update.status is not None:
        exp.status = exp_update.status
    if exp_update.description is not None:
        exp.description = exp_update.description

    db.commit()
    db.refresh(exp)

    new_val = f"₹{exp.amount:,.2f} ({exp.category}) - {exp.vendor}"

    create_audit_entry(
        db=db,
        action="EXPENSE_MODIFIED",
        entity="expense",
        entity_id=exp.id,
        user="Finance Controller",
        ai_agent="Expense Controller Agent",
        previous_value=prev_val,
        new_value=new_val,
        details="Expense record parameters updated."
    )

    return exp

@router.delete("/{exp_id}")
def delete_expense(exp_id: str, db: Session = Depends(get_db)):
    exp = db.query(Expense).filter(Expense.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")

    record_summary = f"₹{exp.amount:,.2f} to {exp.vendor} ({exp.category})"
    db.delete(exp)
    db.commit()

    create_audit_entry(
        db=db,
        action="EXPENSE_DELETED",
        entity="expense",
        entity_id=exp_id,
        user="Finance Controller",
        ai_agent="Expense Controller Agent",
        previous_value=record_summary,
        new_value="DELETED",
        details="Expense record purged from active ledger."
    )

    return {"message": "Expense successfully deleted", "expense_id": exp_id}
