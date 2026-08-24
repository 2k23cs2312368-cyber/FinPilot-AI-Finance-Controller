import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True)
    role = Column(String(50), default="Finance Controller")
    avatar = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    company = Column(String(100), nullable=True)
    risk_tier = Column(String(20), default="LOW")
    lifetime_value = Column(Float, default=0.0)
    avg_order_value = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    transactions = relationship("Transaction", back_populates="customer")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(50), primary_key=True, index=True)
    date = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    customer_id = Column(String(50), ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String(100), nullable=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), default="UPI")  # UPI, Card, NetBanking, Corporate Card
    status = Column(String(20), default="SUCCESS", index=True)  # SUCCESS, FAILED, REFUNDED, PENDING
    category = Column(String(50), default="Subscription")  # Subscription, Enterprise, Services, Usage
    risk_score = Column(Integer, default=15)
    risk_level = Column(String(20), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    ai_flag = Column(String(100), default="NORMAL")
    simulated_action = Column(String(50), default="ALLOW")  # ALLOW, MONITOR, MANUAL_REVIEW, BLOCK
    signals = Column(Text, default="[]")  # JSON list
    ai_explanation = Column(Text, default="")
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="transactions")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String(50), primary_key=True, index=True)
    date = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    vendor = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False, index=True)  # Infrastructure, Marketing, Salaries, Software, Operations, Travel, Office, Other
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), default="Corporate Card")
    status = Column(String(20), default="PAID")  # PAID, PENDING, APPROVED, FLAGGED
    ai_risk = Column(String(50), default="NORMAL")  # NORMAL, ABOVE_BUDGET, DUPLICATE_SUSPECT, RAPID_INCREASE, ANOMALY
    description = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category = Column(String(50), unique=True, index=True)
    allocated_amount = Column(Float, nullable=False)
    monthly_revenue_target = Column(Float, default=2500000.0)
    monthly_expense_budget = Column(Float, default=1800000.0)
    min_cash_reserve = Column(Float, default=500000.0)
    period = Column(String(20), default="2026-03")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class RiskAlert(Base):
    __tablename__ = "risk_alerts"

    id = Column(String(50), primary_key=True, index=True)
    risk_type = Column(String(50), nullable=False)  # UNUSUAL_TRANSACTION, REFUND_SPIKE, PAYMENT_FAILURES, BUDGET_OVERRUN, CASH_RESERVE_BREACH
    risk_score = Column(Integer, default=50)
    severity = Column(String(20), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    detected_date = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    amount = Column(Float, default=0.0)
    entity_type = Column(String(50), default="transaction")
    entity_id = Column(String(50), default="")
    reason = Column(Text, nullable=False)
    signals = Column(Text, default="[]")  # JSON string
    recommended_action = Column(String(50), default="MANUAL_REVIEW")
    status = Column(String(20), default="OPEN")  # OPEN, UNDER_REVIEW, RESOLVED, DISMISSED, ESCALATED
    resolution_notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(String(50), primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    agent_name = Column(String(50), nullable=False)
    category = Column(String(50), nullable=False)  # Revenue, Expense, Cash Flow, Risk, Compliance, Reconciliation
    severity = Column(String(20), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    title = Column(String(200), nullable=False)
    explanation = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    metrics = Column(Text, default="{}")  # JSON
    is_active = Column(Boolean, default=True)

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(String(50), primary_key=True, index=True)
    requested_by = Column(String(100), default="FinPilot AI Engine")
    ai_agent = Column(String(50), default="Financial Risk Agent")
    title = Column(String(200), nullable=False)
    reason = Column(Text, nullable=False)
    risk_level = Column(String(20), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    entity_type = Column(String(50), default="transaction")
    entity_id = Column(String(50), default="")
    proposed_action = Column(String(100), default="BLOCK_TRANSACTION")
    decision = Column(String(20), default="PENDING")  # PENDING, APPROVED, REJECTED, REVIEW_REQUESTED
    decision_by = Column(String(100), nullable=True)
    decision_time = Column(DateTime, nullable=True)
    decision_notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    user = Column(String(100), default="System Controller")
    action = Column(String(100), nullable=False)
    entity = Column(String(50), nullable=False)
    entity_id = Column(String(50), nullable=False)
    ai_agent = Column(String(50), default="Compliance & Audit Agent")
    previous_value = Column(Text, default="")
    new_value = Column(Text, default="")
    details = Column(Text, default="")

class AppSettings(Base):
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, default=1)
    business_name = Column(String(100), default="Saroha Cloud Innovations Pvt Ltd")
    currency = Column(String(10), default="INR")
    currency_symbol = Column(String(5), default="₹")
    minimum_cash_reserve = Column(Float, default=500000.0)
    monthly_expense_limit = Column(Float, default=1800000.0)
    monthly_revenue_target = Column(Float, default=2500000.0)
    risk_threshold_high = Column(Integer, default=60)
    risk_threshold_critical = Column(Integer, default=80)
    ai_mode = Column(String(20), default="AUTO")

# ============================================================================
# MULTI-SOURCE RECONCILIATION MODELS
# ============================================================================

class BankStatementRecord(Base):
    """Source 3: Core Banking Feed (e.g. HDFC/ICICI Statement Feed)"""
    __tablename__ = "bank_statement_records"

    id = Column(String(50), primary_key=True, index=True)
    date = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    utr_reference = Column(String(100), index=True)
    description = Column(String(255), nullable=False)
    credit_amount = Column(Float, default=0.0)
    debit_amount = Column(Float, default=0.0)
    balance = Column(Float, default=0.0)
    account_number = Column(String(50), default="HDFC-****4921")
    reconciliation_status = Column(String(20), default="UNRECONCILED", index=True)  # MATCHED, EXCEPTION, UNRECONCILED, ADJUSTED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class GatewaySettlementRecord(Base):
    """Source 2: Payment Gateway Settlement Feed (e.g. Razorpay Settlement Batch)"""
    __tablename__ = "gateway_settlement_records"

    id = Column(String(50), primary_key=True, index=True)
    date = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    batch_id = Column(String(50), index=True)
    payment_id = Column(String(50), index=True)
    gross_amount = Column(Float, nullable=False)
    fee_deducted = Column(Float, default=0.0)
    tax_deducted = Column(Float, default=0.0)
    net_settlement = Column(Float, nullable=False)
    utr = Column(String(100), index=True, nullable=True)
    status = Column(String(30), default="SETTLED")  # SETTLED, DISPUTED, REFUND_ADJUSTED
    reconciliation_status = Column(String(20), default="UNRECONCILED", index=True)  # MATCHED, EXCEPTION, UNRECONCILED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ReconciliationException(Base):
    """Exception / Discrepancy item generated by Multi-Source Reconciliation Agent"""
    __tablename__ = "reconciliation_exceptions"

    id = Column(String(50), primary_key=True, index=True)
    batch_id = Column(String(50), default="batch_current", index=True)
    exception_type = Column(String(50), nullable=False, index=True)  # AMOUNT_MISMATCH, MISSING_IN_BANK, MISSING_IN_LEDGER, STATUS_MISMATCH, TIMING_DIFFERENCE, DUPLICATE_SETTLEMENT
    severity = Column(String(20), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    ledger_reference = Column(String(50), nullable=True)
    gateway_reference = Column(String(50), nullable=True)
    bank_reference = Column(String(100), nullable=True)
    ledger_amount = Column(Float, default=0.0)
    gateway_amount = Column(Float, default=0.0)
    bank_amount = Column(Float, default=0.0)
    discrepancy_amount = Column(Float, default=0.0)
    detected_date = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    ai_diagnosis = Column(Text, nullable=False)
    recommended_action = Column(String(100), default="AUTO_MATCH_WITH_FEE_ADJUSTMENT")
    status = Column(String(20), default="UNRESOLVED", index=True)  # UNRESOLVED, UNDER_REVIEW, RESOLVED, ESCALATED, DISMISSED
    resolution_notes = Column(Text, default="")
    resolved_by = Column(String(100), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ReconciliationBatch(Base):
    """Record of an automated or manual multi-source reconciliation batch run"""
    __tablename__ = "reconciliation_batches"

    id = Column(String(50), primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    period = Column(String(50), default="Trailing 30 Days")
    total_records_processed = Column(Integer, default=0)
    matched_count = Column(Integer, default=0)
    partial_matched_count = Column(Integer, default=0)
    exception_count = Column(Integer, default=0)
    match_rate_pct = Column(Float, default=94.2)
    total_volume_reconciled = Column(Float, default=0.0)
    total_discrepancy_volume = Column(Float, default=0.0)
    status = Column(String(20), default="COMPLETED")  # COMPLETED, RUNNING, NEEDS_ATTENTION
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
