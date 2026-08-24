from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models import AuditLog
from app.schemas import AuditLogOut

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogOut])
def get_audit_logs(
    entity: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    ai_agent: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if entity and entity != "ALL":
        query = query.filter(AuditLog.entity == entity)
    if action and action != "ALL":
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if ai_agent and ai_agent != "ALL":
        query = query.filter(AuditLog.ai_agent == ai_agent)

    return query.order_by(desc(AuditLog.timestamp)).limit(limit).all()
