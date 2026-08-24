# FinPilot AI — REST API Documentation

Base URL: `http://localhost:8000/api`

---

## 1. Dashboard & Analytics

### `GET /dashboard`
Returns live financial KPIs, Recharts series, recent AI insights, and pending action counts.

- **Query Parameters**: `days` (int, default: 30)
- **Response**:
```json
{
  "kpis": {
    "revenue": { "title": "Total Revenue", "value": 1845000.0, "formatted_value": "₹18,45,000.00", "pct_change": 18.4, "status": "good" },
    "expenses": { "title": "Total Expenses", "value": 1420000.0, "formatted_value": "₹14,20,000.00", "pct_change": 12.1, "status": "warning" },
    "net_profit": { "title": "Net Profit", "value": 425000.0, "formatted_value": "₹4,25,000.00", "pct_change": 24.5, "status": "good" },
    "cash_balance": { "title": "Cash Balance", "value": 1625000.0, "formatted_value": "₹16,25,000.00", "pct_change": 8.2, "status": "good" },
    "receivables": { "title": "Outstanding Receivables", "value": 85000.0, "formatted_value": "₹85,000.00", "pct_change": -4.2, "status": "neutral" },
    "risk_score": { "title": "Financial Risk Score", "value": 42, "formatted_value": "42 / 100", "pct_change": 7.0, "status": "warning" }
  },
  "revenue_expense_chart": [ { "date": "15 Feb", "revenue": 65000, "expenses": 42000, "net_profit": 23000 } ],
  "recent_insights": [],
  "critical_risks_count": 1,
  "pending_approvals_count": 2,
  "ai_engine_status": "Demo AI Mode (Deterministic Engine)"
}
```

---

## 2. Transactions

### `GET /transactions`
Returns paginated list of transactions with search, sorting, and filtering.

- **Query Parameters**: `page`, `limit`, `search`, `status`, `risk_level`, `category`, `sort_by`, `sort_order`

### `POST /transactions/{id}/analyze`
Triggers forensic AI risk analysis on a single transaction.

- **Response**:
```json
{
  "transaction_id": "txn_9901_CRITICAL",
  "amount": 385000.0,
  "customer_name": "Nexus Global Exports",
  "risk_score": 88,
  "risk_level": "CRITICAL",
  "signals": [
    "Transaction amount is 5.8x higher than customer historical average (₹15,000).",
    "Multiple failed payment attempts detected prior to authorization."
  ],
  "explanation": "CRITICAL RISK (Score 88/100): High ticket size surge with prior velocity failures.",
  "recommended_action": "BLOCK",
  "ai_engine": "Deterministic Risk Engine"
}
```

### `POST /transactions/{id}/action`
Updates simulated protection action (`ALLOW`, `MONITOR`, `MANUAL_REVIEW`, `BLOCK`).

- **Request Body**: `{ "action": "BLOCK" }`

---

## 3. Expenses & Budgets

### `GET /expenses`
Lists operating expenses with filters and pagination.

### `POST /expenses`
Logs an expense and automatically runs budget overrun & duplicate charge checks.

- **Request Body**:
```json
{
  "vendor": "Datadog Monitoring",
  "category": "Software",
  "amount": 35000.0,
  "payment_method": "Corporate Card",
  "description": "Monthly APM cycle"
}
```

### `GET /budgets/overview`
Returns revenue targets, expense limits, category budget utilization, and AI overrun commentary.

---

## 4. Cash Flow & Forecast

### `GET /cashflow/forecast`
Computes 30-day forward predictive cash flow with minimum reserve boundary alerts.

- **Response**:
```json
{
  "opening_cash": 1625000.0,
  "total_expected_revenue_30d": 1950000.0,
  "total_expected_expenses_30d": 1510000.0,
  "projected_closing_cash_30d": 2065000.0,
  "minimum_cash_reserve": 500000.0,
  "runway_days": 180,
  "reserve_breach_expected": false,
  "ai_recommendation": "✅ Stable Cash Runway: Projected cash reserves remain safely above threshold."
}
```

---

## 5. Risk Center & Approvals

### `GET /risks`
Returns all open anomaly alerts.

### `POST /risks/{id}/resolve`
Marks a risk alert as `RESOLVED`, `DISMISSED`, or `UNDER_REVIEW` with resolution notes.

### `POST /risks/{id}/escalate`
Escalates a risk alert to a human approval ticket in the **Approval Center**.

### `GET /approvals`
Lists pending and historical human sign-off tickets.

### `POST /approvals/{id}/decision`
Processes human decision (`APPROVED`, `REJECTED`, `REVIEW_REQUESTED`).

---

## 6. FinPilot Copilot & Reports

### `POST /copilot`
Submits a conversational financial question to the multi-agent orchestrator.

- **Request Body**: `{ "question": "Why did profit decrease this month?" }`
- **Response**:
```json
{
  "question": "Why did profit decrease this month?",
  "answer": "Net profit is currently ₹4,25,000.00. Revenue shifted by +18.4% against expense growth of +12.1%...",
  "supporting_numbers": { "current_revenue": "₹18,45,000.00", "net_profit": "₹4,25,000.00" },
  "reasoning": "Correlated both revenue inflows and marketing expense surges.",
  "recommended_action": "Enforce procurement discipline on Marketing.",
  "active_agents": ["Revenue Intelligence Agent", "Expense Controller Agent"],
  "ai_engine_used": "Deterministic Financial Engine"
}
```

### `POST /reports/generate`
Generates a comprehensive executive financial dossier synthesizing all 5 agents.

### `POST /settings/seed-demo-data`
Resets the SQLite database and seeds 120+ realistic transactions and 60+ expenses with planted anomalies.
