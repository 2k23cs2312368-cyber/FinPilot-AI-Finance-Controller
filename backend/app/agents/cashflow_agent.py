import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.services.analytics_service import calculate_30d_cash_forecast, get_financial_kpis

class CashFlowAgent:
    """Agent 3: Cash Flow Agent"""

    def analyze(self, db: Session, days: int = 30) -> Dict[str, Any]:
        kpis = get_financial_kpis(db, days=days)
        forecast = calculate_30d_cash_forecast(db)

        rev = kpis["revenue"]["value"]
        exp = kpis["expenses"]["value"]
        cash_balance = kpis["cash_balance"]["value"]

        # 30-day projected gap
        proj_rev = forecast["total_expected_revenue_30d"]
        proj_exp = forecast["total_expected_expenses_30d"]
        proj_ref = forecast["total_expected_refunds_30d"]
        net_proj_burn = proj_exp + proj_ref - proj_rev

        if forecast["reserve_breach_expected"]:
            summary = (
                f"Cash runway under pressure: Reserve threshold (₹{forecast['minimum_cash_reserve']:,.0f}) "
                f"may be breached around Day {forecast['reserve_breach_day']}. Projected 30-day net burn is ₹{net_proj_burn:,.2f}."
            )
        else:
            summary = (
                f"Healthy cash liquidity: Current balance of ₹{cash_balance:,.2f} provides an estimated "
                f"{forecast['runway_days']} days of operational runway with net positive projection."
            )

        equation = {
            "opening_cash": round(forecast["opening_cash"], 2),
            "projected_revenue": round(proj_rev, 2),
            "projected_expenses": round(proj_exp, 2),
            "projected_refunds": round(proj_ref, 2),
            "projected_closing_cash": round(forecast["projected_closing_cash_30d"], 2),
            "formula": "Opening Cash + Revenue - Expenses - Refunds = Closing Cash"
        }

        findings = [
            f"Current Cash Position: ₹{cash_balance:,.2f}",
            f"Projected 30-Day Inflow: ₹{proj_rev:,.2f} vs Projected Outflow: ₹{proj_exp:,.2f}",
            f"Estimated Runway: {forecast['runway_days']} days at current operating velocity"
        ]

        if forecast["reserve_breach_expected"]:
            findings.append(f"⚠️ Minimum Reserve Warning: Cash projected to touch ₹{forecast['projected_closing_cash_30d']:,.2f} (below ₹{forecast['minimum_cash_reserve']:,.0f} limit)")

        recommendations = [
            "Accelerate invoicing cycle for enterprise accounts from Net-30 to Net-15.",
            "Establish daily reconciliation for UPI settlement batches.",
            "Maintain a reserve buffer of at least 3 months operating expenses."
        ]

        return {
            "agent": "Cash Flow Agent",
            "summary": summary,
            "cash_equation": equation,
            "forecast_summary": {
                "runway_days": forecast["runway_days"],
                "reserve_breach_expected": forecast["reserve_breach_expected"],
                "reserve_breach_day": forecast["reserve_breach_day"],
                "minimum_cash_reserve": forecast["minimum_cash_reserve"]
            },
            "key_findings": findings,
            "recommendations": recommendations,
            "ai_engine": "Deterministic Financial Engine"
        }

cashflow_agent = CashFlowAgent()
