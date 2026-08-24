import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Expense, Budget
from app.services.analytics_service import get_budget_comparisons

SYSTEM_PROMPT = """
You are the Expense Controller Agent for FinPilot AI.
Your role is to monitor operational expenses, detect budget overruns, flag suspicious duplicates, and identify cost-saving opportunities.
CRITICAL RULE: Base all reasoning on verified expense records and category budgets. Never hallucinate spending figures.
"""

class ExpenseAgent:
    """Agent 2: Expense Controller Agent"""

    def analyze(self, db: Session, days: int = 30) -> Dict[str, Any]:
        now = datetime.datetime.utcnow()
        current_start = now - datetime.timedelta(days=days)
        previous_start = current_start - datetime.timedelta(days=days)

        curr_exp = db.query(func.sum(Expense.amount)).filter(
            Expense.status.in_(["PAID", "APPROVED", "FLAGGED"]),
            Expense.date >= current_start
        ).scalar() or 0.0

        prev_exp = db.query(func.sum(Expense.amount)).filter(
            Expense.status.in_(["PAID", "APPROVED", "FLAGGED"]),
            Expense.date >= previous_start,
            Expense.date < current_start
        ).scalar() or 0.0

        growth_pct = ((curr_exp - prev_exp) / prev_exp * 100) if prev_exp > 0 else 0.0

        # Category comparisons
        comparisons = get_budget_comparisons(db)
        over_budget_cats = [c for c in comparisons if c["status"] == "OVER_BUDGET"]
        at_risk_cats = [c for c in comparisons if c["status"] == "AT_RISK"]

        # Duplicate detection (same vendor + exact amount within 48h)
        expenses_all = db.query(Expense).filter(Expense.date >= current_start).order_by(Expense.date.asc()).all()
        duplicates_found = []
        for i in range(len(expenses_all)):
            for j in range(i + 1, len(expenses_all)):
                e1 = expenses_all[i]
                e2 = expenses_all[j]
                time_diff = abs((e2.date - e1.date).total_seconds())
                if e1.vendor.lower() == e2.vendor.lower() and abs(e1.amount - e2.amount) < 0.01 and time_diff <= 172800:
                    duplicates_found.append({
                        "vendor": e1.vendor,
                        "amount": e1.amount,
                        "id_1": e1.id,
                        "id_2": e2.id,
                        "time_gap_hours": round(time_diff / 3600, 1)
                    })

        # Top burning category
        top_exp_cat = db.query(
            Expense.category,
            func.sum(Expense.amount).label("total")
        ).filter(
            Expense.status.in_(["PAID", "APPROVED", "FLAGGED"]),
            Expense.date >= current_start
        ).group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).first()

        top_cat_name = top_exp_cat[0] if top_exp_cat else "Salaries"
        top_cat_amt = top_exp_cat[1] if top_exp_cat else 0.0

        # Build analysis narrative
        findings = [
            f"Total operating spend: ₹{curr_exp:,.2f} ({growth_pct:+.1f}% change vs prior period).",
            f"Primary cost center: '{top_cat_name}' with ₹{top_cat_amt:,.2f} total expenditure."
        ]

        if over_budget_cats:
            for ob in over_budget_cats:
                findings.append(f"🚨 Budget Overrun in {ob['category']}: Spend is ₹{ob['actual_amount']:,.2f} vs ₹{ob['budget_amount']:,.2f} budget (+{ob['variance_pct']}%)")

        if duplicates_found:
            for dup in duplicates_found:
                findings.append(f"⚠️ Potential Duplicate Charge: ₹{dup['amount']:,.2f} billed twice by '{dup['vendor']}' within {dup['time_gap_hours']} hours.")

        recommendations = [
            "Implement mandatory approvals for non-essential software seat additions.",
            "Renegotiate tiered volume pricing with top cloud & marketing vendors.",
            "Establish vendor disbursement verification to eliminate double billing risks."
        ]

        if over_budget_cats:
            summary = f"Total expenses rose to ₹{curr_exp:,.2f} (+{growth_pct:.1f}%). Alert: '{over_budget_cats[0]['category']}' has exceeded its allocated limit by {over_budget_cats[0]['variance_pct']}%."
        else:
            summary = f"Expenses are managed within targets at ₹{curr_exp:,.2f} with {growth_pct:.1f}% growth."

        return {
            "agent": "Expense Controller Agent",
            "summary": summary,
            "growth_pct": round(growth_pct, 1),
            "current_expenses": round(curr_exp, 2),
            "previous_expenses": round(prev_exp, 2),
            "top_category": top_cat_name,
            "top_category_amount": round(top_cat_amt, 2),
            "over_budget_categories": over_budget_cats,
            "duplicates_detected": duplicates_found,
            "key_findings": findings,
            "recommendations": recommendations,
            "ai_engine": "Deterministic Financial Engine"
        }

expense_agent = ExpenseAgent()
