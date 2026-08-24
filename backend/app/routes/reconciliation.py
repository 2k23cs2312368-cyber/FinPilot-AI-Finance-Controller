import datetime
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models import (
    ReconciliationException,
    ReconciliationBatch,
    BankStatementRecord,
    GatewaySettlementRecord,
    Transaction,
    Approval
)
from app.schemas import (
    ReconciliationOverviewResponse,
    ReconciliationExceptionOut,
    ReconciliationBatchOut,
    ReconciliationResolveRequest,
    BankStatementRecordOut,
    GatewaySettlementRecordOut,
    TransactionOut
)
from app.agents.reconciliation_agent import reconciliation_agent
from app.services.audit_service import create_audit_entry

router = APIRouter(prefix="/api/reconciliation", tags=["Multi-Source Reconciliation"])

@router.get("/overview", response_model=ReconciliationOverviewResponse)
def get_reconciliation_overview(db: Session = Depends(get_db)):
    """Returns live measurable match rate, reconciled volume, and 3-way source sync summary"""
    return reconciliation_agent.get_reconciliation_metrics(db)

@router.get("/exceptions", response_model=List[ReconciliationExceptionOut])
def get_reconciliation_exceptions(
    exception_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(ReconciliationException)
    if exception_type and exception_type != "ALL":
        query = query.filter(ReconciliationException.exception_type == exception_type)
    if severity and severity != "ALL":
        query = query.filter(ReconciliationException.severity == severity)
    if status and status != "ALL":
        query = query.filter(ReconciliationException.status == status)

    return query.order_by(desc(ReconciliationException.discrepancy_amount), desc(ReconciliationException.detected_date)).all()

@router.post("/run")
def run_reconciliation_batch(db: Session = Depends(get_db)):
    """Triggers an automated multi-source reconciliation batch across Ledger, Gateway, and Bank records"""
    return reconciliation_agent.run_auto_reconcile_batch(db)

@router.post("/exceptions/{exp_id}/resolve", response_model=ReconciliationExceptionOut)
def resolve_reconciliation_exception(
    exp_id: str,
    resolve_req: ReconciliationResolveRequest,
    db: Session = Depends(get_db)
):
    exp = reconciliation_agent.resolve_exception(
        db=db,
        exception_id=exp_id,
        action=resolve_req.action,
        resolution_notes=resolve_req.resolution_notes or ""
    )
    if not exp:
        raise HTTPException(status_code=404, detail="Reconciliation exception not found")
    return exp

@router.post("/exceptions/{exp_id}/escalate")
def escalate_exception_to_approval(exp_id: str, db: Session = Depends(get_db)):
    """Escalates high-value reconciliation exception to the Human-in-the-Loop Approval Center"""
    exp = db.query(ReconciliationException).filter(ReconciliationException.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Reconciliation exception not found")

    appr_id = f"appr_rec_{random.randint(100000, 999999)}"
    new_appr = Approval(
        id=appr_id,
        requested_by="Multi-Source Reconciliation Agent",
        ai_agent="Multi-Source Reconciliation Agent",
        title=f"Reconciliation Adjustment: {exp.exception_type} (₹{exp.discrepancy_amount:,.2f})",
        reason=f"{exp.ai_diagnosis}. Recommendation: {exp.recommended_action}",
        risk_level=exp.severity,
        entity_type="reconciliation_exception",
        entity_id=exp.id,
        proposed_action=exp.recommended_action,
        decision="PENDING",
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_appr)
    exp.status = "ESCALATED"
    exp.resolution_notes = f"Escalated to Approval Center (Ticket: {appr_id})"
    db.commit()

    create_audit_entry(
        db=db,
        action="RECONCILIATION_EXCEPTION_ESCALATED",
        entity="reconciliation_exception",
        entity_id=exp.id,
        user="Multi-Source Reconciliation Agent",
        ai_agent="Multi-Source Reconciliation Agent",
        previous_value="UNRESOLVED",
        new_value="ESCALATED_FOR_APPROVAL",
        details=f"Escalated discrepancy ₹{exp.discrepancy_amount:,.2f} for human controller authorization."
    )

    return {"message": "Exception escalated to Approval Center successfully", "approval_id": appr_id}

@router.get("/sources")
def get_reconciliation_sources(db: Session = Depends(get_db), limit: int = Query(20, ge=1, le=100)):
    """Returns side-by-side raw feed records for transparent multi-source inspection"""
    ledger_txns = db.query(Transaction).order_by(desc(Transaction.date)).limit(limit).all()
    gateway_records = db.query(GatewaySettlementRecord).order_by(desc(GatewaySettlementRecord.date)).limit(limit).all()
    bank_records = db.query(BankStatementRecord).order_by(desc(BankStatementRecord.date)).limit(limit).all()

    return {
        "ledger_records": [TransactionOut.model_validate(t) for t in ledger_txns],
        "gateway_records": [GatewaySettlementRecordOut.model_validate(g) for g in gateway_records],
        "bank_records": [BankStatementRecordOut.model_validate(b) for b in bank_records]
    }
