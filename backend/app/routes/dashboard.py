from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.schemas import DashboardOverviewResponse
from app.services.analytics_service import get_financial_kpis, get_chart_data
from app.models import AIInsight, RiskAlert, Approval
from app.agents.ai_service import ai_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardOverviewResponse)
def get_dashboard_data(
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db)
):
    """
    Returns complete dashboard overview including live KPIs,
    interactive chart series (Revenue vs Expense, Net Profit, Cash Flow,
    Expense breakdown, Refund trends, Payment status), AI insights,
    and open alert counters.
    """
    kpis = get_financial_kpis(db, days=days)
    charts = get_chart_data(db, days=days)
    
    # Active AI insights
    insights = db.query(AIInsight).filter(AIInsight.is_active == True).order_by(AIInsight.created_at.desc()).limit(6).all()

    # Alert counters
    critical_risks = db.query(func.count(RiskAlert.id)).filter(
        RiskAlert.status == "OPEN",
        RiskAlert.severity.in_(["CRITICAL", "HIGH"])
    ).scalar() or 0

    pending_approvals = db.query(func.count(Approval.id)).filter(
        Approval.decision == "PENDING"
    ).scalar() or 0

    return {
        "kpis": kpis,
        "revenue_expense_chart": charts["revenue_expense_chart"],
        "profit_trend_chart": charts["profit_trend_chart"],
        "cash_flow_trend_chart": charts["cash_flow_trend_chart"],
        "expense_breakdown_chart": charts["expense_breakdown_chart"],
        "refund_trend_chart": charts["refund_trend_chart"],
        "payment_status_breakdown": charts["payment_status_breakdown"],
        "recent_insights": insights,
        "critical_risks_count": critical_risks,
        "pending_approvals_count": pending_approvals,
        "ai_engine_status": ai_service.get_ai_mode()
    }
