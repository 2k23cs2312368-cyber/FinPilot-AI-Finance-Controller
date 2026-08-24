from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AIInsight
from app.schemas import AIInsightOut

router = APIRouter(prefix="/api/insights", tags=["AI Insights"])

@router.get("", response_model=List[AIInsightOut])
def get_ai_insights(
    category: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(AIInsight).filter(AIInsight.is_active == True)
    if category and category != "ALL":
        query = query.filter(AIInsight.category == category)
    if severity and severity != "ALL":
        query = query.filter(AIInsight.severity == severity)

    return query.order_by(AIInsight.created_at.desc()).all()
