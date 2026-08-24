import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.agents.revenue_agent import revenue_agent
from app.agents.expense_agent import expense_agent
from app.agents.cashflow_agent import cashflow_agent
from app.agents.risk_agent import risk_agent
from app.agents.audit_agent import audit_agent
from app.agents.reconciliation_agent import reconciliation_agent
from app.agents.ai_service import ai_service
from app.services.analytics_service import get_financial_kpis, get_budget_comparisons

SYSTEM_CONTROLLER_PROMPT = """
You are FinPilot Controller — the Chief Autonomous AI Finance Controller for the business.
You coordinate specialized financial agents: Revenue Agent, Expense Agent, Cash Flow Agent, Risk Agent, Audit Agent, and Multi-Source Reconciliation Agent.

CRITICAL INSTRUCTIONS:
1. Ground every single claim in the provided database facts. DO NOT hallucinate numbers or stats.
2. Structure your answers clearly with:
   - Direct concise answer
   - Key supporting numbers (formatted in INR ₹)
   - Diagnostic reasoning
   - Actionable recommendations
3. If profit decreased, correlate both revenue changes and expense drivers.
4. If cash flow is under pressure, cite exact burn rates and reserve thresholds.
5. If asked about reconciliation or match rates, cite exact match rate %, reconciled volume, and exception counts.
"""

class AIController:
    """Central AI Controller & Orchestrator"""

    async def process_financial_query(
        self,
        db: Session,
        question: str,
        history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Orchestrates multi-agent analysis based on user financial query.
        Retrieves real ledger facts from sub-agents before synthesizing response.
        """
        q_lower = question.lower()
        active_agents = []
        data_sources = []
        supporting_numbers = {}

        # 1. Fetch live metrics
        kpis = get_financial_kpis(db, days=30)
        curr_rev = kpis["revenue"]["value"]
        curr_exp = kpis["expenses"]["value"]
        curr_profit = kpis["net_profit"]["value"]
        cash_balance = kpis["cash_balance"]["value"]
        risk_score = kpis["risk_score"]["value"]

        # Route to appropriate agents based on semantic intent
        if any(w in q_lower for w in ["reconcil", "match rate", "discrepancy", "bank statement", "settlement feed", "3-way", "gateway settlement"]):
            active_agents.append("Multi-Source Reconciliation Agent")
            data_sources.extend(["transactions", "gateway_settlement_records", "bank_statement_records", "reconciliation_exceptions"])

            recon_metrics = reconciliation_agent.get_reconciliation_metrics(db)
            supporting_numbers["reconciliation_match_rate"] = recon_metrics["formatted_match_rate"]
            supporting_numbers["reconciled_volume"] = recon_metrics["formatted_reconciled_volume"]
            supporting_numbers["discrepancy_volume"] = recon_metrics["formatted_discrepancy_volume"]
            supporting_numbers["unresolved_exceptions"] = recon_metrics["unresolved_exceptions_count"]
            supporting_numbers["total_records_analyzed"] = recon_metrics["total_records_count"]

            answer = (
                f"Multi-source financial reconciliation match rate stands at {recon_metrics['formatted_match_rate']}. "
                f"Total volume reconciled: {recon_metrics['formatted_reconciled_volume']} across ERP Ledger, Razorpay, and HDFC Bank statement feeds. "
                f"There are {recon_metrics['unresolved_exceptions_count']} active exceptions representing {recon_metrics['formatted_discrepancy_volume']} in variance."
            )
            reasoning = recon_metrics["ai_reconciliation_assessment"]
            recommendation = "Review open exception items in the Reconciliation Center to apply gateway MDR fee adjustments or trigger manual bank traces."

        elif any(w in q_lower for w in ["profit", "margin", "earnings", "net", "decrease", "increase"]):
            active_agents.extend(["Revenue Intelligence Agent", "Expense Controller Agent", "Cash Flow Agent"])
            data_sources.extend(["transactions", "expenses", "cashflow"])
            
            rev_analysis = revenue_agent.analyze(db, days=30)
            exp_analysis = expense_agent.analyze(db, days=30)
            
            supporting_numbers["current_revenue"] = f"₹{curr_rev:,.2f}"
            supporting_numbers["revenue_growth"] = f"{rev_analysis['growth_pct']:+.1f}%"
            supporting_numbers["current_expenses"] = f"₹{curr_exp:,.2f}"
            supporting_numbers["expense_growth"] = f"{exp_analysis['growth_pct']:+.1f}%"
            supporting_numbers["net_profit"] = f"₹{curr_profit:,.2f}"
            
            if curr_exp > curr_rev:
                reasoning = (
                    f"Net profit is negative (₹{curr_profit:,.2f}) because monthly operating expenses (₹{curr_exp:,.2f}) "
                    f"exceed total revenue inflows (₹{curr_rev:,.2f}). While revenue experienced a change of {rev_analysis['growth_pct']:+.1f}%, "
                    f"expenses shifted by {exp_analysis['growth_pct']:+.1f}% led by '{exp_analysis['top_category']}'."
                )
            else:
                reasoning = (
                    f"Net profit is currently ₹{curr_profit:,.2f}. Revenue of ₹{curr_rev:,.2f} ({rev_analysis['growth_pct']:+.1f}%) "
                    f"comfortably outpaced total expenses of ₹{curr_exp:,.2f} ({exp_analysis['growth_pct']:+.1f}%)."
                )

            answer = (
                f"Your net profit is currently ₹{curr_profit:,.2f}. "
                f"Analysis shows monthly revenue at ₹{curr_rev:,.2f} ({rev_analysis['growth_pct']:+.1f}%) "
                f"against expenses of ₹{curr_exp:,.2f} ({exp_analysis['growth_pct']:+.1f}%). "
                f"The highest spending category is '{exp_analysis['top_category']}'."
            )
            recommendation = "Review upcoming marketing outlays and optimize software license commitments to widen operating margin."

        elif any(w in q_lower for w in ["expense", "spending", "cost", "burn", "budget", "vendor"]):
            active_agents.append("Expense Controller Agent")
            data_sources.extend(["expenses", "budgets"])
            
            exp_analysis = expense_agent.analyze(db, days=30)
            comparisons = get_budget_comparisons(db)
            over_budget = [c for c in comparisons if c["status"] == "OVER_BUDGET"]
            
            supporting_numbers["total_expenses"] = f"₹{curr_exp:,.2f}"
            supporting_numbers["expense_growth"] = f"{exp_analysis['growth_pct']:+.1f}%"
            supporting_numbers["top_category"] = exp_analysis["top_category"]
            supporting_numbers["over_budget_count"] = len(over_budget)

            if over_budget:
                ob_names = ", ".join([f"{o['category']} (+{o['variance_pct']}%)" for o in over_budget])
                answer = f"Total expenses are ₹{curr_exp:,.2f} (+{exp_analysis['growth_pct']:+.1f}%). Alert: The following categories exceeded budget: {ob_names}."
                reasoning = f"Overrun driven by accelerated disbursements in {over_budget[0]['category']} (₹{over_budget[0]['actual_amount']:,.2f} actual vs ₹{over_budget[0]['budget_amount']:,.2f} allocated)."
                recommendation = f"Initiate expenditure cap in {over_budget[0]['category']} and review unapproved vendor invoices."
            else:
                answer = f"Total operational expenses stand at ₹{curr_exp:,.2f}, with '{exp_analysis['top_category']}' being the largest cost driver."
                reasoning = "All tracked expense categories remain compliant with assigned budget ceilings."
                recommendation = "Maintain current procurement review workflows."

        elif any(w in q_lower for w in ["cash", "runway", "reserve", "liquidity", "forecast", "pressure"]):
            active_agents.append("Cash Flow Agent")
            data_sources.extend(["cashflow", "transactions", "expenses"])
            
            cf_analysis = cashflow_agent.analyze(db, days=30)
            supporting_numbers["cash_balance"] = f"₹{cash_balance:,.2f}"
            supporting_numbers["estimated_runway"] = f"{cf_analysis['forecast_summary']['runway_days']} days"
            supporting_numbers["minimum_reserve"] = f"₹{cf_analysis['forecast_summary']['minimum_cash_reserve']:,.2f}"
            
            answer = cf_analysis["summary"]
            reasoning = (
                f"Formula: Opening Cash (₹{cf_analysis['cash_equation']['opening_cash']:,.2f}) + "
                f"Projected Revenue (₹{cf_analysis['cash_equation']['projected_revenue']:,.2f}) - "
                f"Projected Expenses (₹{cf_analysis['cash_equation']['projected_expenses']:,.2f}) - "
                f"Refunds (₹{cf_analysis['cash_equation']['projected_refunds']:,.2f}) = "
                f"Projected Closing Cash (₹{cf_analysis['cash_equation']['projected_closing_cash']:,.2f})."
            )
            recommendation = cf_analysis["recommendations"][0]

        elif any(w in q_lower for w in ["risk", "anomaly", "suspicious", "fail", "refund", "threat", "fraud", "review"]):
            active_agents.append("Financial Risk Agent")
            data_sources.extend(["transactions", "risk_alerts", "customers"])
            
            risk_summary = risk_agent.get_risk_summary(db)
            supporting_numbers["overall_risk_score"] = f"{risk_score} / 100"
            supporting_numbers["open_risks_total"] = risk_summary["total_open_risks"]
            supporting_numbers["critical_alerts"] = risk_summary["critical_count"]
            supporting_numbers["high_alerts"] = risk_summary["high_count"]

            answer = (
                f"Financial Risk Score is currently {risk_score}/100 ({kpis['risk_score']['subtitle']}). "
                f"There are {risk_summary['total_open_risks']} open risk flags ({risk_summary['critical_count']} Critical, {risk_summary['high_count']} High)."
            )
            reasoning = "Risk evaluation aggregates anomalous transaction tickets, repeated failed UPI/Card authorization bursts, and customer refund spikes."
            recommendation = "Navigate to the Risk Center to review high-risk transactions and submit approvals for pre-settlement blocks."

        elif any(w in q_lower for w in ["audit", "compliance", "integrity", "log", "trail"]):
            active_agents.append("Financial Compliance & Audit Agent")
            data_sources.extend(["audit_logs", "transactions", "expenses"])
            
            audit_res = audit_agent.perform_system_audit(db)
            supporting_numbers["integrity_score"] = f"{audit_res['integrity_score']} / 100"
            supporting_numbers["compliance_status"] = audit_res["compliance_status"]
            supporting_numbers["total_audit_events"] = audit_res["total_audit_events"]

            answer = audit_res["summary"]
            reasoning = f"Scanned ledger entries. Status: {audit_res['compliance_status']}. Key audit observation: {audit_res['findings'][0]}"
            recommendation = "Maintain complete customer linkage on high-value settlements."

        else:
            # General financial summary
            active_agents.extend(["Revenue Intelligence Agent", "Expense Controller Agent", "Cash Flow Agent", "Financial Risk Agent", "Multi-Source Reconciliation Agent"])
            data_sources.extend(["ledger_summary"])
            
            recon_summary = reconciliation_agent.get_reconciliation_metrics(db)
            supporting_numbers["revenue"] = f"₹{curr_rev:,.2f}"
            supporting_numbers["expenses"] = f"₹{curr_exp:,.2f}"
            supporting_numbers["net_profit"] = f"₹{curr_profit:,.2f}"
            supporting_numbers["cash_balance"] = f"₹{cash_balance:,.2f}"
            supporting_numbers["reconciliation_match_rate"] = recon_summary["formatted_match_rate"]
            supporting_numbers["risk_score"] = f"{risk_score} / 100"

            answer = (
                f"Executive Financial Overview: Total revenue stands at ₹{curr_rev:,.2f}, total expenses at ₹{curr_exp:,.2f}, "
                f"yielding net profit of ₹{curr_profit:,.2f}. Cash balance is ₹{cash_balance:,.2f}, reconciliation match rate is {recon_summary['formatted_match_rate']}, and risk score is {risk_score}/100."
            )
            reasoning = "Multi-agent engine synchronized all core ledger accounts across revenue, expenses, cash reserves, and 3-way reconciliation."
            recommendation = "Monitor marketing spend variance and review open reconciliation exceptions in the Reconciliation tab."

        fallback_result = {
            "question": question,
            "answer": answer,
            "supporting_numbers": supporting_numbers,
            "reasoning": reasoning,
            "recommended_action": recommendation,
            "active_agents": list(set(active_agents)),
            "data_sources_used": list(set(data_sources))
        }

        # If Gemini is enabled, enhance natural language reasoning with real DB facts injected
        if ai_service.is_gemini_active():
            user_prompt = f"User Question: {question}\nVerified Financial Data: {supporting_numbers}\nContext: {reasoning}"
            res = await ai_service.generate_response(
                system_prompt=SYSTEM_CONTROLLER_PROMPT,
                user_prompt=user_prompt,
                fallback_data=fallback_result
            )
            return {
                "question": question,
                "answer": res.get("answer", answer),
                "supporting_numbers": supporting_numbers,
                "reasoning": res.get("reasoning", reasoning),
                "recommended_action": res.get("recommended_action", recommendation),
                "active_agents": list(set(active_agents)),
                "data_sources_used": list(set(data_sources)),
                "ai_engine_used": res.get("ai_engine", "Google Gemini 1.5 Flash")
            }

        fallback_result["ai_engine_used"] = "Demo AI Mode (Deterministic Financial Engine)"
        return fallback_result

ai_controller = AIController()
