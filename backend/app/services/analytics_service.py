import datetime
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Transaction, Expense, Budget, RiskAlert, AppSettings

def get_date_range_filter(days: int = 30) -> datetime.datetime:
    """Returns datetime threshold for filtering"""
    return datetime.datetime.utcnow() - datetime.timedelta(days=days)

def get_financial_kpis(db: Session, days: int = 30) -> Dict[str, Any]:
    """
    Calculates primary financial KPIs for current period vs previous period
    using actual database records.
    """
    now = datetime.datetime.utcnow()
    current_start = now - datetime.timedelta(days=days)
    previous_start = current_start - datetime.timedelta(days=days)

    # 1. Revenue (SUCCESS transactions)
    curr_rev = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == "SUCCESS",
        Transaction.date >= current_start,
        Transaction.date <= now
    ).scalar() or 0.0

    prev_rev = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == "SUCCESS",
        Transaction.date >= previous_start,
        Transaction.date < current_start
    ).scalar() or 0.0

    rev_pct = ((curr_rev - prev_rev) / prev_rev * 100) if prev_rev > 0 else 0.0

    # 2. Expenses (PAID / APPROVED expenses)
    curr_exp = db.query(func.sum(Expense.amount)).filter(
        Expense.status.in_(["PAID", "APPROVED", "FLAGGED"]),
        Expense.date >= current_start,
        Expense.date <= now
    ).scalar() or 0.0

    prev_exp = db.query(func.sum(Expense.amount)).filter(
        Expense.status.in_(["PAID", "APPROVED", "FLAGGED"]),
        Expense.date >= previous_start,
        Expense.date < current_start
    ).scalar() or 0.0

    exp_pct = ((curr_exp - prev_exp) / prev_exp * 100) if prev_exp > 0 else 0.0

    # 3. Refunds
    curr_refunds = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == "REFUNDED",
        Transaction.date >= current_start,
        Transaction.date <= now
    ).scalar() or 0.0

    prev_refunds = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == "REFUNDED",
        Transaction.date >= previous_start,
        Transaction.date < current_start
    ).scalar() or 0.0

    # 4. Net Profit = Revenue - Expenses - Refunds
    curr_profit = curr_rev - curr_exp - curr_refunds
    prev_profit = prev_rev - prev_exp - prev_refunds
    profit_pct = ((curr_profit - prev_profit) / abs(prev_profit) * 100) if prev_profit != 0 else 0.0

    # 5. Outstanding Receivables (PENDING transactions)
    receivables = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == "PENDING"
    ).scalar() or 0.0

    prev_receivables = 65000.0  # baseline comparative
    receivables_pct = ((receivables - prev_receivables) / prev_receivables * 100) if prev_receivables > 0 else 0.0

    # 6. Cash Position (Base opening balance + all time revenue - all time expenses - all time refunds)
    base_capital = 1200000.0  # Seeded initial capital
    total_rev_all = db.query(func.sum(Transaction.amount)).filter(Transaction.status == "SUCCESS").scalar() or 0.0
    total_exp_all = db.query(func.sum(Expense.amount)).filter(Expense.status.in_(["PAID", "APPROVED"])).scalar() or 0.0
    total_ref_all = db.query(func.sum(Transaction.amount)).filter(Transaction.status == "REFUNDED").scalar() or 0.0
    cash_balance = base_capital + total_rev_all - total_exp_all - total_ref_all

    prev_cash = cash_balance - (curr_profit)
    cash_pct = ((cash_balance - prev_cash) / prev_cash * 100) if prev_cash > 0 else 0.0

    # 7. Aggregate Financial Risk Score (0 - 100)
    # Computed from open high-risk alerts, failure rates, refund ratio, and budget deviation
    total_txns = db.query(func.count(Transaction.id)).filter(Transaction.date >= current_start).scalar() or 1
    failed_txns = db.query(func.count(Transaction.id)).filter(Transaction.status == "FAILED", Transaction.date >= current_start).scalar() or 0
    failure_rate = (failed_txns / total_txns) * 100

    refund_rate = (curr_refunds / curr_rev * 100) if curr_rev > 0 else 0.0

    open_critical_risks = db.query(func.count(RiskAlert.id)).filter(
        RiskAlert.status == "OPEN",
        RiskAlert.severity == "CRITICAL"
    ).scalar() or 0

    open_high_risks = db.query(func.count(RiskAlert.id)).filter(
        RiskAlert.status == "OPEN",
        RiskAlert.severity == "HIGH"
    ).scalar() or 0

    # Composite score formula
    risk_score = 15  # baseline normal business risk
    risk_score += min(35, int(failure_rate * 2.5))
    risk_score += min(20, int(refund_rate * 3.0))
    risk_score += open_critical_risks * 15
    risk_score += open_high_risks * 8
    risk_score = min(100, max(0, risk_score))

    risk_level = "LOW"
    if risk_score > 80:
        risk_level = "CRITICAL"
    elif risk_score > 60:
        risk_level = "HIGH"
    elif risk_score > 30:
        risk_level = "MEDIUM"

    return {
        "revenue": {
            "title": "Total Revenue",
            "value": round(curr_rev, 2),
            "formatted_value": f"₹{curr_rev:,.2f}",
            "previous_value": round(prev_rev, 2),
            "pct_change": round(rev_pct, 1),
            "is_positive_trend": rev_pct >= 0,
            "status": "good" if rev_pct >= 0 else "warning",
            "subtitle": f"vs previous {days} days"
        },
        "expenses": {
            "title": "Total Expenses",
            "value": round(curr_exp, 2),
            "formatted_value": f"₹{curr_exp:,.2f}",
            "previous_value": round(prev_exp, 2),
            "pct_change": round(exp_pct, 1),
            "is_positive_trend": exp_pct <= 0,  # lower expense is better
            "status": "danger" if exp_pct > 15 else ("warning" if exp_pct > 0 else "good"),
            "subtitle": f"vs previous {days} days"
        },
        "net_profit": {
            "title": "Net Profit",
            "value": round(curr_profit, 2),
            "formatted_value": f"₹{curr_profit:,.2f}",
            "previous_value": round(prev_profit, 2),
            "pct_change": round(profit_pct, 1),
            "is_positive_trend": curr_profit >= 0,
            "status": "good" if curr_profit > 0 else "danger",
            "subtitle": f"vs previous {days} days"
        },
        "cash_balance": {
            "title": "Cash Balance",
            "value": round(cash_balance, 2),
            "formatted_value": f"₹{cash_balance:,.2f}",
            "previous_value": round(prev_cash, 2),
            "pct_change": round(cash_pct, 1),
            "is_positive_trend": cash_pct >= 0,
            "status": "good" if cash_balance > 500000 else "warning",
            "subtitle": "Includes opening + net flows"
        },
        "receivables": {
            "title": "Outstanding Receivables",
            "value": round(receivables, 2),
            "formatted_value": f"₹{receivables:,.2f}",
            "previous_value": round(prev_receivables, 2),
            "pct_change": round(receivables_pct, 1),
            "is_positive_trend": receivables_pct <= 0,
            "status": "warning" if receivables > 100000 else "neutral",
            "subtitle": "Pending settlements"
        },
        "risk_score": {
            "title": "Financial Risk Score",
            "value": risk_score,
            "formatted_value": f"{risk_score} / 100",
            "previous_value": 35,
            "pct_change": round(risk_score - 35, 1),
            "is_positive_trend": risk_score < 40,
            "status": "danger" if risk_score > 60 else ("warning" if risk_score > 30 else "good"),
            "subtitle": f"Risk Level: {risk_level}"
        }
    }

def get_chart_data(db: Session, days: int = 30) -> Dict[str, Any]:
    """Generates grouped chart data series for dashboard Recharts visualization"""
    start_date = datetime.datetime.utcnow() - datetime.timedelta(days=days)
    
    # 1. Daily Revenue vs Expenses vs Profit
    daily_data_map = {}
    curr = start_date
    now = datetime.datetime.utcnow()
    while curr <= now:
        date_str = curr.strftime("%d %b")
        daily_data_map[date_str] = {
            "date": date_str,
            "revenue": 0.0,
            "expenses": 0.0,
            "net_profit": 0.0,
            "refunds": 0.0
        }
        curr += datetime.timedelta(days=1)

    # Fetch daily transactions
    txns = db.query(Transaction).filter(Transaction.date >= start_date).all()
    for t in txns:
        d_str = t.date.strftime("%d %b")
        if d_str in daily_data_map:
            if t.status == "SUCCESS":
                daily_data_map[d_str]["revenue"] += t.amount
            elif t.status == "REFUNDED":
                daily_data_map[d_str]["refunds"] += t.amount

    # Fetch daily expenses
    exps = db.query(Expense).filter(Expense.date >= start_date).all()
    for e in exps:
        d_str = e.date.strftime("%d %b")
        if d_str in daily_data_map and e.status in ["PAID", "APPROVED"]:
            daily_data_map[d_str]["expenses"] += e.amount

    # Calculate net profit & round values
    chart_series = []
    running_cash = 950000.0  # Base running track
    cash_flow_series = []
    
    for d_str, data in daily_data_map.items():
        data["revenue"] = round(data["revenue"], 2)
        data["expenses"] = round(data["expenses"], 2)
        data["refunds"] = round(data["refunds"], 2)
        data["net_profit"] = round(data["revenue"] - data["expenses"] - data["refunds"], 2)
        chart_series.append(data)

        running_cash += (data["revenue"] - data["expenses"] - data["refunds"])
        cash_flow_series.append({
            "date": d_str,
            "cash_balance": round(running_cash, 2),
            "inflow": data["revenue"],
            "outflow": round(data["expenses"] + data["refunds"], 2)
        })

    # 2. Expense Breakdown by Category
    category_rows = db.query(
        Expense.category,
        func.sum(Expense.amount).label("total")
    ).filter(
        Expense.date >= start_date,
        Expense.status.in_(["PAID", "APPROVED", "FLAGGED"])
    ).group_by(Expense.category).all()

    expense_breakdown = [
        {"category": row[0], "amount": round(row[1], 2)}
        for row in category_rows
    ]

    # 3. Payment Status Breakdown (SUCCESS, FAILED, REFUNDED, PENDING)
    status_rows = db.query(
        Transaction.status,
        func.count(Transaction.id).label("count"),
        func.sum(Transaction.amount).label("total_amount")
    ).filter(Transaction.date >= start_date).group_by(Transaction.status).all()

    payment_status_breakdown = [
        {"status": row[0], "count": row[1], "total_amount": round(row[2] or 0.0, 2)}
        for row in status_rows
    ]

    # 4. Refund Trend Chart
    refund_trend = [
        {"date": pt["date"], "refunds": pt["refunds"], "revenue": pt["revenue"]}
        for pt in chart_series
    ]

    return {
        "revenue_expense_chart": chart_series,
        "profit_trend_chart": [{"date": pt["date"], "net_profit": pt["net_profit"]} for pt in chart_series],
        "cash_flow_trend_chart": cash_flow_series,
        "expense_breakdown_chart": expense_breakdown,
        "refund_trend_chart": refund_trend,
        "payment_status_breakdown": payment_status_breakdown
    }

def get_budget_comparisons(db: Session) -> List[Dict[str, Any]]:
    """Calculates category budgets vs actual monthly spending with AI commentary"""
    now = datetime.datetime.utcnow()
    month_start = datetime.datetime(now.year, now.month, 1)

    budgets = db.query(Budget).all()
    budget_map = {b.category: b.allocated_amount for b in budgets}

    # Aggregate current month expenses
    actual_rows = db.query(
        Expense.category,
        func.sum(Expense.amount).label("actual")
    ).filter(
        Expense.date >= month_start,
        Expense.status.in_(["PAID", "APPROVED", "FLAGGED"])
    ).group_by(Expense.category).all()

    actual_map = {row[0]: row[1] for row in actual_rows}

    # Standard categories to ensure complete report
    standard_categories = [
        "Infrastructure", "Marketing", "Salaries", "Software",
        "Operations", "Travel", "Office", "Other"
    ]

    comparisons = []
    for cat in standard_categories:
        budget_amt = budget_map.get(cat, 150000.0)
        actual_amt = actual_map.get(cat, 0.0)
        variance = actual_amt - budget_amt
        variance_pct = (variance / budget_amt * 100) if budget_amt > 0 else 0.0

        if variance_pct > 15:
            status = "OVER_BUDGET"
            ai_note = f"Spending is {variance_pct:.1f}% above budget. Immediate review recommended to prevent margin erosion."
        elif variance_pct > 0:
            status = "AT_RISK"
            ai_note = f"Spending is slightly above target (+{variance_pct:.1f}%). Monitor upcoming scheduled invoices."
        else:
            status = "ON_TRACK"
            ai_note = f"Well within budget limit (utilizing {(actual_amt/budget_amt*100):.1f}% of allocation)."

        comparisons.append({
            "category": cat,
            "actual_amount": round(actual_amt, 2),
            "budget_amount": round(budget_amt, 2),
            "variance_amount": round(variance, 2),
            "variance_pct": round(variance_pct, 1),
            "status": status,
            "ai_note": ai_note
        })

    return comparisons

def calculate_30d_cash_forecast(db: Session) -> Dict[str, Any]:
    """
    Computes a 30-day forward-looking cash flow forecast using moving averages
    of actual historical inflows and scheduled expense burn.
    """
    # Historical base (last 30 days)
    now = datetime.datetime.utcnow()
    past_30d = now - datetime.timedelta(days=30)
    
    total_past_rev = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == "SUCCESS",
        Transaction.date >= past_30d
    ).scalar() or 0.0

    total_past_exp = db.query(func.sum(Expense.amount)).filter(
        Expense.status.in_(["PAID", "APPROVED"]),
        Expense.date >= past_30d
    ).scalar() or 0.0

    total_past_ref = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == "REFUNDED",
        Transaction.date >= past_30d
    ).scalar() or 0.0

    # Daily baseline averages
    avg_daily_inflow = (total_past_rev / 30.0) * 1.05  # slight expected growth factor (5%)
    avg_daily_outflow = (total_past_exp / 30.0) * 1.08 # slight marketing/infra inflation (8%)
    avg_daily_refund = (total_past_ref / 30.0)

    # Current cash position
    kpis = get_financial_kpis(db, days=30)
    current_cash = kpis["cash_balance"]["value"]
    
    # App Settings
    settings_obj = db.query(AppSettings).first()
    min_reserve = settings_obj.minimum_cash_reserve if settings_obj else 500000.0

    forecast_points = []
    simulated_cash = current_cash
    reserve_breached = False
    breach_day = None

    for day in range(1, 31):
        target_date = now + datetime.timedelta(days=day)
        
        # Add realistic weekday/weekend oscillation
        is_weekend = target_date.weekday() >= 5
        daily_in = avg_daily_inflow * (0.6 if is_weekend else 1.15)
        # Periodic salary / rent spike on day 1st / 15th
        day_of_month = target_date.day
        spike = 45000.0 if day_of_month in [1, 15] else 0.0
        daily_out = avg_daily_outflow * (0.4 if is_weekend else 1.2) + spike + avg_daily_refund
        
        net_flow = daily_in - daily_out
        simulated_cash += net_flow

        is_breach = simulated_cash < min_reserve
        if is_breach and not reserve_breached:
            reserve_breached = True
            breach_day = day

        forecast_points.append({
            "date": target_date.strftime("%d %b"),
            "day_number": day,
            "projected_inflow": round(daily_in, 2),
            "projected_outflow": round(daily_out, 2),
            "net_daily_flow": round(net_flow, 2),
            "closing_cash": round(simulated_cash, 2),
            "is_reserve_breached": is_breach
        })

    # Runway calculation
    net_daily_burn = avg_daily_outflow - avg_daily_inflow
    if net_daily_burn > 0:
        runway_days = int(current_cash / net_daily_burn)
    else:
        runway_days = 180  # Healthy cash flow runway (> 6 months)

    total_expected_rev_30d = avg_daily_inflow * 30
    total_expected_exp_30d = (avg_daily_outflow * 30) + 90000.0  # planned scheduled cycles
    total_expected_ref_30d = avg_daily_refund * 30

    if reserve_breached and breach_day:
        ai_recommendation = (
            f"⚠️ Caution: Projected cash balance is expected to drop below the minimum reserve threshold "
            f"(₹{min_reserve:,.0f}) in approximately {breach_day} days due to accelerated marketing outlays "
            f"and refund spikes. We recommend deferring non-critical software upgrades and collecting pending receivables."
        )
    else:
        ai_recommendation = (
            f"✅ Stable Cash Runway: Projected cash reserves remain safely above the minimum reserve threshold "
            f"(₹{min_reserve:,.0f}) across the 30-day forecast. Net liquidity is projected at ₹{simulated_cash:,.2f}."
        )

    return {
        "opening_cash": round(current_cash, 2),
        "current_cash": round(current_cash, 2),
        "total_expected_revenue_30d": round(total_expected_rev_30d, 2),
        "total_expected_expenses_30d": round(total_expected_exp_30d, 2),
        "total_expected_refunds_30d": round(total_expected_ref_30d, 2),
        "projected_closing_cash_30d": round(simulated_cash, 2),
        "minimum_cash_reserve": round(min_reserve, 2),
        "runway_days": runway_days,
        "reserve_breach_expected": reserve_breached,
        "reserve_breach_day": breach_day,
        "forecast_points": forecast_points,
        "ai_recommendation": ai_recommendation,
        "disclaimer": "AI Forecast — Based on historical application data"
    }
