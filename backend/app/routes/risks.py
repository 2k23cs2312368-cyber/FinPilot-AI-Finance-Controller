import datetime
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import RiskAlert, Approval
from app.schemas import RiskAlertOut, RiskResolveRequest
from app.services.audit_service import create_audit_entry

router = APIRouter(prefix="/api/risks", tags=["Risk Center"])

@router.get("", response_model=List[RiskAlertOut])
def get_risk_alerts(
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(RiskAlert)
    if severity and severity != "ALL":
        query = query.filter(RiskAlert.severity == severity)
    if status and status != "ALL":
        query = query.filter(RiskAlert.status == status)

    return query.order_by(RiskAlert.risk_score.desc(), RiskAlert.detected_date.desc()).all()

@router.post("/{risk_id}/resolve", response_model=RiskAlertOut)
def resolve_risk_alert(
    risk_id: str,
    resolve_req: RiskResolveRequest,
    db: Session = Depends(get_db)
):
    risk = db.query(RiskAlert).filter(RiskAlert.id == risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk alert not found")

    prev_status = risk.status
    risk.status = resolve_req.status
    risk.resolution_notes = resolve_req.resolution_notes
    db.commit()
    db.refresh(risk)

    create_audit_entry(
        db=db,
        action="RISK_STATE_CHANGED",
        entity="risk_alert",
        entity_id=risk.id,
        user="Finance Controller",
        ai_agent="Financial Risk Agent",
        previous_value=prev_status,
        new_value=risk.status,
        details=f"Resolution: {risk.resolution_notes}"
    )

    return risk

@router.post("/{risk_id}/escalate")
def escalate_risk_to_approval(risk_id: str, db: Session = Depends(get_db)):
    """Escalates a high or critical risk to the Human-in-the-Loop Approval Center"""
    risk = db.query(RiskAlert).filter(RiskAlert.id == risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk alert not found")

    appr_id = f"appr_{random.randint(100000, 999999)}"
    new_appr = Approval(
        id=appr_id,
        requested_by="Financial Risk Agent",
        ai_agent="Financial Risk Agent",
        title=f"Action Required: {risk.risk_type} (Score {risk.risk_score}/100)",
        reason=risk.reason,
        risk_level=risk.severity,
        entity_type=risk.entity_type,
        entity_id=risk.entity_id,
        proposed_action=risk.recommended_action,
        decision="PENDING",
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_appr)
    risk.status = "ESCALATED"
    risk.resolution_notes = f"Escalated to Approval Center (Ticket: {appr_id})"
    db.commit()

    create_audit_entry(
        db=db,
        action="RISK_ESCALATED_TO_APPROVAL",
        entity="approval",
        entity_id=appr_id,
        user="Financial Risk Agent",
        ai_agent="Financial Risk Agent",
        previous_value=risk.status,
        new_value="PENDING_APPROVAL",
        details=f"Escalated risk item {risk.id} for human review."
    )

    return {"message": "Risk escalated to Approval Center successfully", "approval_id": appr_id}
