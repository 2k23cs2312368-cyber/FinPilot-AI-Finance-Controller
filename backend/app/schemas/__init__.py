import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# --- User & Auth ---
class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    email: str
    role: str
    avatar: Optional[str] = None
    created_at: datetime.datetime

# --- Customer ---
class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    email: str
    company: Optional[str] = None
    risk_tier: str
    lifetime_value: float
    avg_order_value: float

# --- Transaction ---
class TransactionCreate(BaseModel):
    amount: float
    customer_id: Optional[str] = None
    customer_name: Optional[str] = "Walk-in Enterprise"
    payment_method: str = "UPI"
    status: str = "SUCCESS"
    category: str = "Subscription"
    notes: Optional[str] = ""

class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    date: datetime.datetime
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    amount: float
    payment_method: str
    status: str
    category: str
    risk_score: int
    risk_level: str
    ai_flag: str
    simulated_action: str
    signals: Optional[str] = "[]"
    ai_explanation: Optional[str] = ""
    notes: Optional[str] = ""

class TransactionAnalysisResult(BaseModel):
    transaction_id: str
    amount: float
    customer_name: Optional[str]
    date: str
    risk_score: int
    risk_level: str
    signals: List[str]
    explanation: str
    recommended_action: str
    anomaly_factors: Dict[str, Any]
    ai_engine: str

# --- Expense ---
class ExpenseCreate(BaseModel):
    vendor: str
    category: str
    amount: float
    payment_method: str = "Corporate Card"
    status: str = "PAID"
    description: Optional[str] = ""
    date: Optional[datetime.datetime] = None

class ExpenseUpdate(BaseModel):
    vendor: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    payment_method: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None

class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    date: datetime.datetime
    vendor: str
    category: str
    amount: float
    payment_method: str
    status: str
    ai_risk: str
    description: Optional[str] = ""

class CategoryExpenseSummary(BaseModel):
    category: str
    actual_amount: float
    budget_amount: float
    variance_amount: float
    variance_pct: float
    status: str  # ON_TRACK, AT_RISK, OVER_BUDGET
    ai_note: str

# --- Budget ---
class BudgetCreate(BaseModel):
    category: str
    allocated_amount: float
    monthly_revenue_target: Optional[float] = 2500000.0
    monthly_expense_budget: Optional[float] = 1800000.0
    min_cash_reserve: Optional[float] = 500000.0
    period: Optional[str] = "2026-03"

class BudgetUpdate(BaseModel):
    allocated_amount: float

class BudgetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    category: str
    allocated_amount: float
    period: str
    updated_at: datetime.datetime

class BudgetOverviewOut(BaseModel):
    monthly_revenue_target: float
    monthly_expense_budget: float
    min_cash_reserve: float
    current_revenue: float
    current_expense: float
    revenue_target_progress_pct: float
    expense_budget_used_pct: float
    overall_status: str
    category_comparisons: List[CategoryExpenseSummary]
    ai_budget_assessment: str

# --- Risk Center ---
class RiskAlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    risk_type: str
    risk_score: int
    severity: str
    detected_date: datetime.datetime
    amount: float
    entity_type: str
    entity_id: str
    reason: str
    signals: str
    recommended_action: str
    status: str
    resolution_notes: Optional[str] = ""

class RiskResolveRequest(BaseModel):
    status: str  # RESOLVED, DISMISSED, ESCALATED, UNDER_REVIEW
    resolution_notes: str
    action_taken: Optional[str] = None

# --- AI Insight ---
class AIInsightOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime.datetime
    agent_name: str
    category: str
    severity: str
    title: str
    explanation: str
    recommended_action: str
    metrics: Optional[str] = "{}"
    is_active: bool

# --- Approval Center ---
class ApprovalCreate(BaseModel):
    title: str
    reason: str
    risk_level: str
    entity_type: str
    entity_id: str
    proposed_action: str
    ai_agent: Optional[str] = "Financial Risk Agent"

class ApprovalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    requested_by: str
    ai_agent: str
    title: str
    reason: str
    risk_level: str
    entity_type: str
    entity_id: str
    proposed_action: str
    decision: str
    decision_by: Optional[str] = None
    decision_time: Optional[datetime.datetime] = None
    decision_notes: Optional[str] = ""
    created_at: datetime.datetime

class ApprovalDecisionRequest(BaseModel):
    decision: str  # APPROVED, REJECTED, REVIEW_REQUESTED
    decision_notes: Optional[str] = "Decision processed by Finance Controller"

# --- Audit Logs ---
class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    timestamp: datetime.datetime
    user: str
    action: str
    entity: str
    entity_id: str
    ai_agent: str
    previous_value: Optional[str] = ""
    new_value: Optional[str] = ""
    details: Optional[str] = ""

# --- Dashboard & Cash Flow ---
class KPICard(BaseModel):
    title: str
    value: float
    formatted_value: str
    previous_value: float
    pct_change: float
    is_positive_trend: bool
    status: str  # good, warning, danger, neutral
    subtitle: str

class DashboardOverviewResponse(BaseModel):
    kpis: Dict[str, KPICard]
    revenue_expense_chart: List[Dict[str, Any]]
    profit_trend_chart: List[Dict[str, Any]]
    cash_flow_trend_chart: List[Dict[str, Any]]
    expense_breakdown_chart: List[Dict[str, Any]]
    refund_trend_chart: List[Dict[str, Any]]
    payment_status_breakdown: List[Dict[str, Any]]
    recent_insights: List[AIInsightOut]
    critical_risks_count: int
    pending_approvals_count: int
    ai_engine_status: str

class CashFlowForecastPoint(BaseModel):
    date: str
    day_number: int
    projected_inflow: float
    projected_outflow: float
    net_daily_flow: float
    closing_cash: float
    is_reserve_breached: bool

class CashFlowForecastResponse(BaseModel):
    opening_cash: float
    current_cash: float
    total_expected_revenue_30d: float
    total_expected_expenses_30d: float
    total_expected_refunds_30d: float
    projected_closing_cash_30d: float
    minimum_cash_reserve: float
    runway_days: int
    reserve_breach_expected: bool
    reserve_breach_day: Optional[int] = None
    forecast_points: List[CashFlowForecastPoint]
    ai_recommendation: str
    disclaimer: str = "AI Forecast — Based on historical application data"

# --- Copilot ---
class CopilotQueryRequest(BaseModel):
    question: str
    conversation_history: Optional[List[Dict[str, str]]] = []

class CopilotQueryResponse(BaseModel):
    question: str
    answer: str
    supporting_numbers: Dict[str, Any]
    reasoning: str
    recommended_action: Optional[str] = None
    active_agents: List[str]
    data_sources_used: List[str]
    ai_engine_used: str

# --- Executive Report ---
class FinancialReportResponse(BaseModel):
    generated_at: str
    period: str
    business_name: str
    executive_summary: str
    revenue_analysis: Dict[str, Any]
    expense_analysis: Dict[str, Any]
    profitability_analysis: Dict[str, Any]
    cash_flow_analysis: Dict[str, Any]
    risk_compliance_summary: Dict[str, Any]
    budget_variance_summary: List[Dict[str, Any]]
    strategic_ai_recommendations: List[str]
    author: str = "FinPilot AI Multi-Agent Controller"

# --- App Settings ---
class AppSettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    business_name: str
    currency: str
    currency_symbol: str
    minimum_cash_reserve: float
    monthly_expense_limit: float
    monthly_revenue_target: float
    risk_threshold_high: int
    risk_threshold_critical: int
    ai_mode: str
    has_gemini_key: bool

class AppSettingsUpdate(BaseModel):
    business_name: Optional[str] = None
    currency_symbol: Optional[str] = None
    minimum_cash_reserve: Optional[float] = None
    monthly_expense_limit: Optional[float] = None
    monthly_revenue_target: Optional[float] = None
    risk_threshold_high: Optional[int] = None
    risk_threshold_critical: Optional[int] = None
    ai_mode: Optional[str] = None

# ============================================================================
# MULTI-SOURCE RECONCILIATION SCHEMAS
# ============================================================================

class BankStatementRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    date: datetime.datetime
    utr_reference: Optional[str] = None
    description: str
    credit_amount: float
    debit_amount: float
    balance: float
    account_number: str
    reconciliation_status: str

class GatewaySettlementRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    date: datetime.datetime
    batch_id: str
    payment_id: str
    gross_amount: float
    fee_deducted: float
    tax_deducted: float
    net_settlement: float
    utr: Optional[str] = None
    status: str
    reconciliation_status: str

class ReconciliationExceptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    batch_id: str
    exception_type: str
    severity: str
    ledger_reference: Optional[str] = None
    gateway_reference: Optional[str] = None
    bank_reference: Optional[str] = None
    ledger_amount: float
    gateway_amount: float
    bank_amount: float
    discrepancy_amount: float
    detected_date: datetime.datetime
    ai_diagnosis: str
    recommended_action: str
    status: str
    resolution_notes: Optional[str] = ""
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime.datetime] = None

class ReconciliationBatchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    timestamp: datetime.datetime
    period: str
    total_records_processed: int
    matched_count: int
    partial_matched_count: int
    exception_count: int
    match_rate_pct: float
    total_volume_reconciled: float
    total_discrepancy_volume: float
    status: str

class ReconciliationOverviewResponse(BaseModel):
    match_rate_pct: float
    formatted_match_rate: str
    total_volume_processed: float
    formatted_total_volume: str
    total_volume_reconciled: float
    formatted_reconciled_volume: str
    total_discrepancy_volume: float
    formatted_discrepancy_volume: str
    total_records_count: int
    matched_records_count: int
    exceptions_count: int
    unresolved_exceptions_count: int
    critical_exceptions_count: int
    latest_batch_id: str
    latest_batch_time: str
    three_way_source_summary: Dict[str, Any]
    ai_reconciliation_assessment: str
    recent_exceptions: List[ReconciliationExceptionOut]

class ReconciliationResolveRequest(BaseModel):
    action: str  # AUTO_MATCH, ADJUST_FEE, MANUAL_RECONCILE, DISMISS
    resolution_notes: Optional[str] = "Resolved by Finance Controller via Reconciliation Workflow"
