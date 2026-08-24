import datetime
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from app.database import get_db
from app.models import Transaction, Customer, AuditLog
from app.schemas import TransactionOut, TransactionCreate, TransactionAnalysisResult
from app.agents.risk_agent import risk_agent
from app.services.audit_service import create_audit_entry

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

@router.get("", response_model=dict)
def get_transactions(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    category: Optional[str] = None,
    sort_by: str = Query("date", pattern="^(date|amount|risk_score)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$")
):
    query = db.query(Transaction)

    # Filtering
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Transaction.id.ilike(search_fmt)) |
            (Transaction.customer_name.ilike(search_fmt)) |
            (Transaction.category.ilike(search_fmt)) |
            (Transaction.notes.ilike(search_fmt))
        )
    if status and status != "ALL":
        query = query.filter(Transaction.status == status)
    if risk_level and risk_level != "ALL":
        query = query.filter(Transaction.risk_level == risk_level)
    if category and category != "ALL":
        query = query.filter(Transaction.category == category)

    total = query.count()

    # Sorting
    order_col = getattr(Transaction, sort_by)
    if sort_order == "desc":
        query = query.order_by(desc(order_col))
    else:
        query = query.order_by(asc(order_col))

    # Pagination
    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()

    return {
        "items": [TransactionOut.model_validate(t) for t in items],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit > 0 else 1
    }

@router.get("/{txn_id}", response_model=TransactionOut)
def get_transaction_by_id(txn_id: str, db: Session = Depends(get_db)):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn

@router.post("/{txn_id}/analyze", response_model=TransactionAnalysisResult)
def analyze_transaction(txn_id: str, db: Session = Depends(get_db)):
    """Runs deep AI risk analysis on a single transaction and updates its assessment"""
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    result = risk_agent.analyze_transaction(db, txn_id)

    # Persist updated risk score and explanation
    txn.risk_score = result["risk_score"]
    txn.risk_level = result["risk_level"]
    txn.signals = json.dumps(result["signals"])
    txn.ai_explanation = result["explanation"]
    txn.simulated_action = result["recommended_action"]
    db.commit()
    db.refresh(txn)

    # Log audit entry
    create_audit_entry(
        db=db,
        action="TRANSACTION_ANALYZED",
        entity="transaction",
        entity_id=txn.id,
        user="Finance Controller",
        ai_agent="Financial Risk Agent",
        previous_value="",
        new_value=f"Risk: {txn.risk_score} ({txn.risk_level})",
        details=f"AI Deep Analysis performed. Recommendation: {txn.simulated_action}"
    )

    return result

@router.post("/{txn_id}/action")
def update_transaction_action(
    txn_id: str,
    action_data: dict = Body(...),
    db: Session = Depends(get_db)
):
    """
    Updates the simulated action for a transaction (ALLOW, MONITOR, MANUAL_REVIEW, BLOCK).
    NOTE: Simulated action modifies local demo status and does not alter real gateway funds.
    """
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    new_action = action_data.get("action", "MONITOR")
    prev_action = txn.simulated_action
    txn.simulated_action = new_action
    
    if new_action == "BLOCK":
        txn.status = "FAILED"
        txn.notes = f"{txn.notes} | Blocked by Controller via AI Risk Engine"
    
    db.commit()

    create_audit_entry(
        db=db,
        action="TRANSACTION_ACTION_UPDATED",
        entity="transaction",
        entity_id=txn.id,
        user="Finance Controller",
        ai_agent="Financial Risk Agent",
        previous_value=prev_action,
        new_value=new_action,
        details=f"Controller applied action {new_action} (Simulated protection rule)."
    )

    return {"message": f"Action successfully updated to {new_action}", "transaction_id": txn.id, "simulated_action": new_action}

@router.post("", response_model=TransactionOut)
def create_transaction(txn_in: TransactionCreate, db: Session = Depends(get_db)):
    """Creates a new transaction record with automatic risk evaluation"""
    import random
    gen_id = f"txn_{random.randint(100000, 999999)}"
    
    # Auto risk score initial estimation
    risk_score = 15
    if txn_in.amount > 150000:
        risk_score += 40
    if txn_in.status == "FAILED":
        risk_score += 25
    elif txn_in.status == "REFUNDED":
        risk_score += 35

    risk_level = risk_agent.calculate_risk_level(risk_score)

    new_txn = Transaction(
        id=gen_id,
        date=datetime.datetime.utcnow(),
        customer_id=txn_in.customer_id,
        customer_name=txn_in.customer_name,
        amount=txn_in.amount,
        payment_method=txn_in.payment_method,
        status=txn_in.status,
        category=txn_in.category,
        risk_score=risk_score,
        risk_level=risk_level,
        simulated_action="MONITOR" if risk_score > 60 else "ALLOW",
        notes=txn_in.notes or ""
    )
    db.add(new_txn)
    db.commit()
    db.refresh(new_txn)

    create_audit_entry(
        db=db,
        action="TRANSACTION_CREATED",
        entity="transaction",
        entity_id=new_txn.id,
        user="Finance Controller",
        ai_agent="Revenue Intelligence Agent",
        previous_value="",
        new_value=f"₹{new_txn.amount:,.2f} ({new_txn.status})",
        details=f"New transaction logged under category {new_txn.category}"
    )

    return new_txn
