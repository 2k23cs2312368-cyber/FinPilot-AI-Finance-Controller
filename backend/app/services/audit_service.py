import datetime
from sqlalchemy.orm import Session
from app.models import AuditLog

def create_audit_entry(
    db: Session,
    action: str,
    entity: str,
    entity_id: str,
    user: str = "System Controller",
    ai_agent: str = "Compliance & Audit Agent",
    previous_value: str = "",
    new_value: str = "",
    details: str = ""
) -> AuditLog:
    """Records an immutable audit entry in the database"""
    entry = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user=user,
        action=action,
        entity=entity,
        entity_id=str(entity_id),
        ai_agent=ai_agent,
        previous_value=str(previous_value),
        new_value=str(new_value),
        details=str(details)
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
