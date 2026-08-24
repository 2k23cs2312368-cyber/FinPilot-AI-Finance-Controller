import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import FinancialReportResponse
from app.models import AppSettings
from app.services.analytics_service import get_financial_kpis, get_budget_comparisons, calculate_30d_cash_forecast
from app.agents.revenue_agent import revenue_agent
from app.agents.expense_agent import expense_agent
from app.agents.risk_agent import risk_agent
from app.agents.audit_agent import audit_agent
from app.services.audit_service import create_audit_entry

router = APIRouter(prefix="/api/reports", tags=["Financial Reports"])

@router.post("/generate", response_model=FinancialReportResponse)
def generate_financial_report(db: Session = Depends(get_db)):
    """
    Generates a full autonomous executive financial report
    synthesizing all 5 specialized domain agents.
    """
    settings_obj = db.query(AppSettings).first()
    business_name = settings_obj.business_name if settings_obj else "Saroha Cloud Innovations Pvt Ltd"

    kpis = get_financial_kpis(db, days=30)
    rev_agent_data = revenue_agent.analyze(db, days=30)
    exp_agent_data = expense_agent.analyze(db, days=30)
    cf_data = calculate_30d_cash_forecast(db)
    risk_summary = risk_agent.get_risk_summary(db)
    audit_data = audit_agent.perform_system_audit(db)
    budget_comparisons = get_budget_comparisons(db)

    now_str = datetime.datetime.utcnow().strftime("%B %d, %Y - %H:%M UTC")

    # Executive Summary Narrative
    exec_summary = (
        f"FinPilot AI autonomous financial synthesis for {business_name}. "
        f"In the trailing 30-day operating window, total recognized revenue reached {kpis['revenue']['formatted_value']} "
        f"({kpis['revenue']['pct_change']:+.1f}%), against total expenditures of {kpis['expenses']['formatted_value']} "
        f"({kpis['expenses']['pct_change']:+.1f}%), resulting in a net profit of {kpis['net_profit']['formatted_value']}. "
        f"Overall business risk is indexed at {kpis['risk_score']['value']}/100 with {risk_summary['critical_count']} critical anomaly alerts open."
    )

    strategic_recommendations = [
        f"Accelerate growth in {rev_agent_data['top_category']} which currently yields {rev_agent_data['top_category_share_pct']}% of revenue inflows.",
        f"Enforce procurement discipline on '{exp_agent_data['top_category']}' to halt budget variance (+{exp_agent_data['growth_pct']}%).",
        f"Maintain minimum liquidity reserves above ₹{cf_data['minimum_cash_reserve']:,.2f} to protect 30-day operational runway ({cf_data['runway_days']} days).",
        "Review flagged transactions in the Risk Center before releasing high-ticket settlements.",
        "Implement mandatory purchase order matching to eliminate vendor duplicate invoicing."
    ]

    create_audit_entry(
        db=db,
        action="FINANCIAL_REPORT_GENERATED",
        entity="report",
        entity_id="exec_summary_30d",
        user="Lead Finance Controller",
        ai_agent="AI Controller Orchestrator",
        previous_value="",
        new_value="GENERATED_SUCCESS",
        details="Generated comprehensive multi-agent financial executive report."
    )

    return {
        "generated_at": now_str,
        "period": "Trailing 30-Day Fiscal Window",
        "business_name": business_name,
        "executive_summary": exec_summary,
        "revenue_analysis": {
            "total_revenue": kpis["revenue"]["value"],
            "formatted_revenue": kpis["revenue"]["formatted_value"],
            "growth_pct": rev_agent_data["growth_pct"],
            "top_category": rev_agent_data["top_category"],
            "top_category_amount": rev_agent_data["top_category_amount"],
            "key_findings": rev_agent_data["key_findings"]
        },
        "expense_analysis": {
            "total_expenses": kpis["expenses"]["value"],
            "formatted_expenses": kpis["expenses"]["formatted_value"],
            "growth_pct": exp_agent_data["growth_pct"],
            "top_category": exp_agent_data["top_category"],
            "top_category_amount": exp_agent_data["top_category_amount"],
            "key_findings": exp_agent_data["key_findings"],
            "duplicates_detected": exp_agent_data["duplicates_detected"]
        },
        "profitability_analysis": {
            "net_profit": kpis["net_profit"]["value"],
            "formatted_net_profit": kpis["net_profit"]["formatted_value"],
            "profit_margin_pct": round((kpis["net_profit"]["value"] / kpis["revenue"]["value"] * 100) if kpis["revenue"]["value"] > 0 else 0, 1),
            "status": kpis["net_profit"]["status"]
        },
        "cash_flow_analysis": {
            "current_cash_balance": cf_data["current_cash"],
            "projected_closing_cash_30d": cf_data["projected_closing_cash_30d"],
            "runway_days": cf_data["runway_days"],
            "reserve_breach_expected": cf_data["reserve_breach_expected"],
            "recommendation": cf_data["ai_recommendation"]
        },
        "risk_compliance_summary": {
            "risk_score": kpis["risk_score"]["value"],
            "risk_level": kpis["risk_score"]["subtitle"],
            "open_critical_alerts": risk_summary["critical_count"],
            "open_high_alerts": risk_summary["high_count"],
            "ledger_integrity_score": audit_data["integrity_score"],
            "compliance_status": audit_data["compliance_status"]
        },
        "budget_variance_summary": budget_comparisons,
        "strategic_ai_recommendations": strategic_recommendations,
        "author": "FinPilot AI Autonomous Controller Engine"
    }
