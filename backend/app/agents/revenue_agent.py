import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Transaction
from app.agents.ai_service import ai_service

SYSTEM_PROMPT = """
You are the Revenue Intelligence Agent for FinPilot AI.
Your role is to analyze revenue streams, growth rates, top categories, and short-term trends.
CRITICAL RULE: Never fabricate numbers. Base all explanations directly on the provided database facts.
Return your analysis in valid JSON with fields:
{
  "summary": "...",
  "growth_pct": float,
  "top_category": "...",
  "key_findings": ["..."],
  "recommendations": ["..."]
}
"""

class RevenueAgent:
    """Agent 1: Revenue Intelligence Agent"""

    def analyze(self, db: Session, days: int = 30) -> Dict[str, Any]:
        now = datetime.datetime.utcnow()
        current_start = now - datetime.timedelta(days=days)
        previous_start = current_start - datetime.timedelta(days=days)

        curr_rev = db.query(func.sum(Transaction.amount)).filter(
            Transaction.status == "SUCCESS",
            Transaction.date >= current_start
        ).scalar() or 0.0

        prev_rev = db.query(func.sum(Transaction.amount)).filter(
            Transaction.status == "SUCCESS",
            Transaction.date >= previous_start,
            Transaction.date < current_start
        ).scalar() or 0.0

        growth_pct = ((curr_rev - prev_rev) / prev_rev * 100) if prev_rev > 0 else 0.0

        # Top revenue category
        top_cats = db.query(
            Transaction.category,
            func.sum(Transaction.amount).label("cat_total"),
            func.count(Transaction.id).label("count")
        ).filter(
            Transaction.status == "SUCCESS",
            Transaction.date >= current_start
        ).group_by(Transaction.category).order_by(func.sum(Transaction.amount).desc()).all()

        top_cat_name = top_cats[0][0] if top_cats else "Subscription"
        top_cat_amt = top_cats[0][1] if top_cats else 0.0
        top_cat_share = (top_cat_amt / curr_rev * 100) if curr_rev > 0 else 0.0

        # Top customer volume
        top_cust = db.query(
            Transaction.customer_name,
            func.sum(Transaction.amount).label("total")
        ).filter(
            Transaction.status == "SUCCESS",
            Transaction.date >= current_start
        ).group_by(Transaction.customer_name).order_by(func.sum(Transaction.amount).desc()).first()

        cust_str = f"top customer {top_cust[0]} (₹{top_cust[1]:,.2f})" if top_cust else "steady enterprise accounts"

        # Deterministic analysis
        if growth_pct >= 10:
            summary = f"Revenue expanded robustly by {growth_pct:.1f}% over the last {days} days, reaching ₹{curr_rev:,.2f}, driven primarily by high-ticket {top_cat_name} contracts."
        elif growth_pct >= 0:
            summary = f"Revenue demonstrated steady growth of {growth_pct:.1f}% (₹{curr_rev:,.2f}), with stable recurring inflows across {top_cat_name}."
        else:
            summary = f"Revenue experienced a {abs(growth_pct):.1f}% contraction compared to the prior period, closing at ₹{curr_rev:,.2f}."

        findings = [
            f"Total successful revenue: ₹{curr_rev:,.2f} vs ₹{prev_rev:,.2f} in previous window ({growth_pct:+.1f}% change).",
            f"Leading revenue category: '{top_cat_name}' contributed ₹{top_cat_amt:,.2f} ({top_cat_share:.1f}% of total).",
            f"Key account contribution: {cust_str} accounted for strong volume."
        ]

        recommendations = [
            f"Capitalize on high momentum in {top_cat_name} through targeted upsell incentives.",
            "Establish recurring retention checkpoints for high-value enterprise accounts.",
            "Maintain proactive settlement monitoring on high-ticket receivables."
        ]

        return {
            "agent": "Revenue Intelligence Agent",
            "summary": summary,
            "growth_pct": round(growth_pct, 1),
            "current_revenue": round(curr_rev, 2),
            "previous_revenue": round(prev_rev, 2),
            "top_category": top_cat_name,
            "top_category_amount": round(top_cat_amt, 2),
            "top_category_share_pct": round(top_cat_share, 1),
            "key_findings": findings,
            "recommendations": recommendations,
            "ai_engine": "Deterministic Financial Engine"
        }

revenue_agent = RevenueAgent()
