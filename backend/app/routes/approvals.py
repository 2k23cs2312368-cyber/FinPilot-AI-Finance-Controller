import datetime
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Approval, Transaction, Expense
from app.schemas import ApprovalOut, ApprovalCreate, ApprovalDecisionRequest
from app.services.audit_service import create_audit_entry

router = APIRouter(prefix="/api/approvals", tags=["Approval Center"])

@router.get("", response_model=List[ApprovalOut])
def get_approvals(
    decision: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Approval)
    if decision and decision != "ALL":
        query = query.filter(Approval.decision == decision)
    return query.order_by(Approval.created_at.desc()).all()

@router.post("", response_model=ApprovalOut)
def create_approval(appr_in: ApprovalCreate, db: Session = Depends(get_db)):
    gen_id = f"appr_{random.randint(100000, 999999)}"
    new_appr = Approval(
        id=gen_id,
        requested_by="FinPilot AI Engine",
        ai_agent=appr_in.ai_agent or "Financial Risk Agent",
        title=appr_in.title,
        reason=appr_in.reason,
        risk_level=appr_in.risk_level,
        entity_type=appr_in.entity_type,
        entity_id=appr_in.entity_id,
        proposed_action=appr_in.proposed_action,
        decision="PENDING",
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_appr)
    db.commit()
    db.refresh(new_appr)

    create_audit_entry(
        db=db,
        action="APPROVAL_TICKET_CREATED",
        entity="approval",
        entity_id=new_appr.id,
        user="FinPilot AI Engine",
        ai_agent=new_appr.ai_agent,
        previous_value="",
        new_value="PENDING",
        details=f"Proposed Action: {new_appr.proposed_action} on {new_appr.entity_type} {new_appr.entity_id}"
    )

    return new_appr

@router.post("/{appr_id}/decision", response_model=ApprovalOut)
def process_approval_decision(
    appr_id: str,
    decision_req: ApprovalDecisionRequest,
    db: Session = Depends(get_db)
):
    """Processes human approval / rejection / review decision for an AI proposal"""
    appr = db.query(Approval).filter(Approval.id == appr_id).first()
    if not appr:
        raise HTTPException(status_code=404, detail="Approval ticket not found")

    prev_dec = appr.decision
    appr.decision = decision_req.decision
    appr.decision_by = "Lead Finance Controller"
    appr.decision_time = datetime.datetime.utcnow()
    appr.decision_notes = decision_req.decision_notes

    # Execute simulated effect if approved
    if appr.decision == "APPROVED" and appr.entity_type == "transaction":
        txn = db.query(Transaction).filter(Transaction.id == appr.entity_id).first()
        if txn:
            txn.simulated_action = appr.proposed_action
            if "BLOCK" in appr.proposed_action.upper():
                txn.status = "FAILED"
                txn.notes = f"{txn.notes} | Block approved by Human Controller"

    db.commit()
    db.refresh(appr)

    create_audit_entry(
        db=db,
        action=f"RECOMMENDATION_{appr.decision}",
        entity="approval",
        entity_id=appr.id,
        user=appr.decision_by,
        ai_agent=appr.ai_agent,
        previous_value=prev_dec,
        new_value=appr.decision,
        details=f"Decision Note: {appr.decision_notes}"
    )

    return appr
