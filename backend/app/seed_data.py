import datetime
import random
import json
from sqlalchemy.orm import Session
from app.models import (
    User, Customer, Transaction, Expense, Budget,
    RiskAlert, AIInsight, Approval, AuditLog, AppSettings,
    BankStatementRecord, GatewaySettlementRecord,
    ReconciliationException, ReconciliationBatch
)

def seed_database(db: Session):
    """
    Seeds database with a complete, coherent, realistic Indian fintech dataset
    for 'Saroha Cloud Innovations Pvt Ltd'.
    Includes realistic revenue growth, marketing budget overrun, repeated failed payments,
    one unusually large enterprise anomaly transaction, refund spikes,
    and multi-source 3-way reconciliation data (Ledger, Gateway, Bank).
    """
    # 1. Clear existing records
    db.query(AuditLog).delete()
    db.query(Approval).delete()
    db.query(AIInsight).delete()
    db.query(RiskAlert).delete()
    db.query(Expense).delete()
    db.query(Transaction).delete()
    db.query(Customer).delete()
    db.query(Budget).delete()
    db.query(User).delete()
    db.query(AppSettings).delete()
    db.query(ReconciliationException).delete()
    db.query(ReconciliationBatch).delete()
    db.query(GatewaySettlementRecord).delete()
    db.query(BankStatementRecord).delete()
    db.commit()

    # 2. Seed Default User & Settings
    user = User(
        id="usr_admin_01",
        name="Aarav Saroha",
        email="controller@sarohacloud.in",
        role="Head of Finance & Controller",
        avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
    )
    db.add(user)

    settings = AppSettings(
        id=1,
        business_name="Saroha Cloud Innovations Pvt Ltd",
        currency="INR",
        currency_symbol="₹",
        minimum_cash_reserve=500000.0,
        monthly_expense_limit=1800000.0,
        monthly_revenue_target=2500000.0,
        risk_threshold_high=60,
        risk_threshold_critical=80,
        ai_mode="AUTO"
    )
    db.add(settings)

    # 3. Seed Budgets
    category_budgets = [
        ("Salaries", 800000.0),
        ("Marketing", 200000.0),  # Overrun
        ("Infrastructure", 250000.0),
        ("Software", 120000.0),
        ("Operations", 150000.0),
        ("Travel", 80000.0),
        ("Office", 100000.0),
        ("Other", 100000.0)
    ]
    for cat, alloc in category_budgets:
        b = Budget(
            category=cat,
            allocated_amount=alloc,
            monthly_revenue_target=2500000.0,
            monthly_expense_budget=1800000.0,
            min_cash_reserve=500000.0,
            period="2026-03"
        )
        db.add(b)

    # 4. Seed Customers
    customers_data = [
        ("cust_101", "Infosys Digital Solutions", "billing@infosys-digi.com", "Infosys Ltd", "LOW", 1250000.0, 125000.0),
        ("cust_102", "Razorpay RazorX Merchant", "fin@razorx-client.com", "RazorX Tech", "LOW", 850000.0, 85000.0),
        ("cust_103", "Zomato Logistics Hub", "ap@zomatologistics.in", "Eternal Tech", "LOW", 620000.0, 62000.0),
        ("cust_104", "Swiggy Cloud Kitchens", "finance@bundl.in", "Swiggy Ltd", "MEDIUM", 450000.0, 45000.0),
        ("cust_105", "Credshield Cyber Security", "accounts@credshield.io", "Credshield Ltd", "LOW", 390000.0, 39000.0),
        ("cust_106", "Zepto Express Hubs", "treasury@zeptonow.com", "Kiranakart Tech", "LOW", 510000.0, 51000.0),
        ("cust_107", "Urban Company Pro", "vendor-desk@urbanclap.com", "UrbanClap Ltd", "MEDIUM", 280000.0, 28000.0),
        ("cust_108", "Vortex Digital Agency", "rahul@vortexdigital.co", "Vortex Media", "HIGH", 140000.0, 14000.0),
        ("cust_109", "Nexus Global Exports", "payments@nexusglobal.org", "Nexus Exports", "CRITICAL", 80000.0, 15000.0),
        ("cust_110", "Bengaluru Tech Incubator", "admin@bti-startup.in", "BTI Labs", "LOW", 310000.0, 31000.0),
    ]

    for cid, name, email, company, risk_tier, ltv, aov in customers_data:
        c = Customer(
            id=cid,
            name=name,
            email=email,
            company=company,
            risk_tier=risk_tier,
            lifetime_value=ltv,
            avg_order_value=aov
        )
        db.add(c)
    db.commit()

    now = datetime.datetime.utcnow()
    transactions = []
    
    pay_methods = ["UPI", "Corporate Card", "NetBanking", "Bank Transfer"]
    categories = ["Subscription", "Enterprise", "Services", "Usage"]

    random.seed(42)  # Deterministic seed

    for i in range(1, 125):
        days_ago = random.randint(1, 58)
        txn_date = now - datetime.timedelta(days=days_ago, hours=random.randint(1, 23), minutes=random.randint(1, 59))
        
        cust_tuple = random.choice(customers_data[:7])
        base_amt = cust_tuple[6]
        variation = random.uniform(0.85, 1.25)
        amount = round(base_amt * variation, 2)
        
        rand_stat = random.random()
        if rand_stat < 0.88:
            status = "SUCCESS"
            risk_score = random.randint(5, 25)
            risk_level = "LOW"
            ai_flag = "NORMAL"
            sim_action = "ALLOW"
            signals = ["Standard subscription transaction within baseline parameters."]
            explanation = "Transaction conforms with customer spend frequency and historical ticket size."
        elif rand_stat < 0.94:
            status = "FAILED"
            risk_score = random.randint(35, 55)
            risk_level = "MEDIUM"
            ai_flag = "FAILURE_BURST"
            sim_action = "MONITOR"
            signals = ["Authorization failure at bank switch / UPI network timeout."]
            explanation = "Payment failed during mandate charge. Automated re-attempt scheduled."
        elif rand_stat < 0.98:
            status = "REFUNDED"
            risk_score = random.randint(45, 65)
            risk_level = "HIGH"
            ai_flag = "REFUND_RISK"
            sim_action = "MONITOR"
            signals = ["Voluntary customer refund / service SLA adjustment."]
            explanation = "Post-settlement credit adjustment issued."
        else:
            status = "PENDING"
            risk_score = random.randint(15, 30)
            risk_level = "LOW"
            ai_flag = "NORMAL"
            sim_action = "ALLOW"
            signals = ["Awaiting inter-bank RTGS clearing."]
            explanation = "Enterprise wire transfer in queue for bank reconciliation."

        t = Transaction(
            id=f"txn_{1000 + i}",
            date=txn_date,
            customer_id=cust_tuple[0],
            customer_name=cust_tuple[1],
            amount=amount,
            payment_method=random.choice(pay_methods),
            status=status,
            category=random.choice(categories),
            risk_score=risk_score,
            risk_level=risk_level,
            ai_flag=ai_flag,
            simulated_action=sim_action,
            signals=json.dumps(signals),
            ai_explanation=explanation,
            notes=f"Auto-captured via FinPilot Payment Ingestion Service."
        )
        transactions.append(t)

    # Planted Anomaly 1: Critical High-Value Anomaly
    t_anom1 = Transaction(
        id="txn_9901_CRITICAL",
        date=now - datetime.timedelta(days=2, hours=3),
        customer_id="cust_109",
        customer_name="Nexus Global Exports",
        amount=385000.0,
        payment_method="Corporate Card",
        status="SUCCESS",
        category="Enterprise",
        risk_score=88,
        risk_level="CRITICAL",
        ai_flag="HIGH_VALUE_ANOMALY",
        simulated_action="MANUAL_REVIEW",
        signals=json.dumps([
            "Transaction amount is 5.8x higher than customer historical average (₹15,000).",
            "Multiple failed payment attempts detected prior to authorization.",
            "Refund frequency on customer entity increased by 42% in last 30 days.",
            "Unusual midnight authorization timestamp (02:47 AM IST)."
        ]),
        ai_explanation="CRITICAL RISK (Score 88/100): Anomaly score driven by massive ticket size deviation (+480%), prior velocity failures, and high customer refund profile. Pre-settlement manual sign-off required.",
        notes="FLAGGED FOR CONTROLLER REVIEW: High ticket volume anomaly."
    )
    transactions.append(t_anom1)

    # Planted Anomaly 2: Repeated payment failure loop
    for f_idx in range(1, 4):
        t_fail = Transaction(
            id=f"txn_fail_loop_{f_idx}",
            date=now - datetime.timedelta(days=1, hours=f_idx * 2),
            customer_id="cust_108",
            customer_name="Vortex Digital Agency",
            amount=140000.0,
            payment_method="UPI",
            status="FAILED",
            category="Subscription",
            risk_score=72,
            risk_level="HIGH",
            ai_flag="FAILURE_BURST",
            simulated_action="MONITOR",
            signals=json.dumps([
                f"Repeated mandate debit failure #{f_idx} within 6 hours.",
                "Bank code: EXCEEDS_MANDATE_LIMIT"
            ]),
            ai_explanation="HIGH RISK: Customer account is triggering continuous mandate rejections indicating insufficient balance or expired card token.",
            notes="Mandate failure auto-alert generated."
        )
        transactions.append(t_fail)

    # Planted Anomaly 3: Large Refund Spike
    t_ref_spike = Transaction(
        id="txn_9905_REFUND",
        date=now - datetime.timedelta(days=3, hours=5),
        customer_id="cust_104",
        customer_name="Swiggy Cloud Kitchens",
        amount=150000.0,
        payment_method="NetBanking",
        status="REFUNDED",
        category="Enterprise",
        risk_score=68,
        risk_level="HIGH",
        ai_flag="REFUND_RISK",
        simulated_action="MONITOR",
        signals=json.dumps([
            "Significant revenue clawback: ₹1,50,000 refunded in single batch.",
            "Dispute type: SLA delivery discrepancy."
        ]),
        ai_explanation="Elevated refund alert: Outlier enterprise refund impacting current month gross margin.",
        notes="Approved credit adjustment SLA #882."
    )
    transactions.append(t_ref_spike)

    db.add_all(transactions)
    db.commit()

    # 6. Generate 60 Realistic Expenses
    expenses = []
    vendors_map = {
        "Infrastructure": [("Amazon Web Services India", 95000.0), ("Google Cloud India", 65000.0), ("Cloudflare Inc", 22000.0)],
        "Marketing": [("Google Ads Performance", 120000.0), ("LinkedIn B2B Campaign", 88000.0), ("Meta Business Ads", 40000.0)],
        "Salaries": [("Engineering Payroll (RazorpayX)", 550000.0), ("Product & Ops Payroll", 250000.0)],
        "Software": [("Slack Technologies", 18000.0), ("Notion Labs", 12000.0), ("GitHub Enterprise", 25000.0), ("Datadog Monitoring", 35000.0)],
        "Operations": [("WeWork Co-working Hub", 90000.0), ("Internet Leased Line (Airtel)", 15000.0), ("Legal & Compliance Advisory", 45000.0)],
        "Travel": [("MakeMyTrip Corporate", 35000.0), ("Uber for Business", 18000.0), ("Taj Business Hotels", 27000.0)],
        "Office": [("Urban Company Office Sanitization", 14000.0), ("Blue Tokai Coffee & Pantry", 22000.0), ("Ergonomic Office Furniture", 45000.0)],
        "Other": [("Conference Sponsorship", 35000.0), ("Employee Wellness Stipend", 40000.0)]
    }

    exp_counter = 2001
    for cat, vendor_list in vendors_map.items():
        for vendor_name, base_amt in vendor_list:
            d1 = now - datetime.timedelta(days=random.randint(35, 55))
            e1 = Expense(
                id=f"exp_{exp_counter}",
                date=d1,
                vendor=vendor_name,
                category=cat,
                amount=round(base_amt * random.uniform(0.9, 1.05), 2),
                payment_method="Corporate Card",
                status="PAID",
                ai_risk="NORMAL",
                description=f"Monthly recurring {cat.lower()} disbursement to {vendor_name}."
            )
            expenses.append(e1)
            exp_counter += 1

            d2 = now - datetime.timedelta(days=random.randint(2, 25))
            mult = 1.35 if cat == "Marketing" else random.uniform(0.95, 1.1)
            e2 = Expense(
                id=f"exp_{exp_counter}",
                date=d2,
                vendor=vendor_name,
                category=cat,
                amount=round(base_amt * mult, 2),
                payment_method="Corporate Card",
                status="PAID",
                ai_risk="ABOVE_BUDGET" if cat == "Marketing" else "NORMAL",
                description=f"Current cycle invoice settlement for {vendor_name}."
            )
            expenses.append(e2)
            exp_counter += 1

    # Duplicate Expense Anomaly
    e_dup1 = Expense(
        id=f"exp_{exp_counter}",
        date=now - datetime.timedelta(days=4, hours=2),
        vendor="Datadog Monitoring",
        category="Software",
        amount=35000.0,
        payment_method="Corporate Card",
        status="PAID",
        ai_risk="NORMAL",
        description="Datadog Enterprise APM Subscription Cycle"
    )
    expenses.append(e_dup1)
    exp_counter += 1

    e_dup2 = Expense(
        id=f"exp_{exp_counter}",
        date=now - datetime.timedelta(days=3, hours=14),
        vendor="Datadog Monitoring",
        category="Software",
        amount=35000.0,
        payment_method="Corporate Card",
        status="FLAGGED",
        ai_risk="DUPLICATE_SUSPECT",
        description="DUPLICATE ALERT: Matching ₹35,000 charge billed twice within 36 hours."
    )
    expenses.append(e_dup2)
    exp_counter += 1

    db.add_all(expenses)
    db.commit()

    # ============================================================================
    # 7. Seed Multi-Source Reconciliation Feeds (Bank, Gateway, Exceptions)
    # ============================================================================
    bank_records = []
    gateway_records = []
    running_balance = 2850000.0

    # Generate Gateway & Bank matching records for successful transactions
    for idx, txn in enumerate(transactions[:40]):
        if txn.status == "SUCCESS":
            utr_num = f"HDFC{random.randint(1000000000, 9999999999)}"
            fee = round(txn.amount * 0.02, 2)  # 2% MDR
            tax = round(fee * 0.18, 2)         # 18% GST on MDR
            net_amt = round(txn.amount - fee - tax, 2)

            # Gateway Record
            gw = GatewaySettlementRecord(
                id=f"setl_rzp_{1000 + idx}",
                date=txn.date + datetime.timedelta(hours=12),
                batch_id=f"batch_rzp_{(idx // 5) + 1}",
                payment_id=txn.id,
                gross_amount=txn.amount,
                fee_deducted=fee,
                tax_deducted=tax,
                net_settlement=net_amt,
                utr=utr_num,
                status="SETTLED",
                reconciliation_status="MATCHED"
            )
            gateway_records.append(gw)

            # Bank Statement Credit
            running_balance += net_amt
            bk = BankStatementRecord(
                id=f"bnk_tx_{2000 + idx}",
                date=txn.date + datetime.timedelta(days=1, hours=2),
                utr_reference=utr_num,
                description=f"ACH CR - RAZORPAY SETTLEMENT BATCH {(idx // 5) + 1} / {txn.customer_name}",
                credit_amount=net_amt,
                debit_amount=0.0,
                balance=running_balance,
                account_number="HDFC-****4921",
                reconciliation_status="MATCHED"
            )
            bank_records.append(bk)

    # Planted Multi-Source Exceptions
    exceptions = [
        ReconciliationException(
            id="rec_exp_701",
            batch_id="batch_rec_live",
            exception_type="AMOUNT_MISMATCH",
            severity="HIGH",
            ledger_reference="txn_1015",
            gateway_reference="pay_N8s928df",
            bank_reference="HDFC8912384910",
            ledger_amount=50000.0,
            gateway_amount=48820.0,
            bank_amount=48820.0,
            discrepancy_amount=1180.0,
            detected_date=now - datetime.timedelta(days=1, hours=4),
            ai_diagnosis="AMOUNT MISMATCH: Ledger booked gross invoice value of ₹50,000.00, while Razorpay settled ₹48,820.00 after deducting ₹1,000 MDR fee + ₹180 GST. The ₹1,180.00 payment processing fee was not posted to the software expenses ledger.",
            recommended_action="AUTO_MATCH_WITH_FEE_ADJUSTMENT",
            status="UNRESOLVED"
        ),
        ReconciliationException(
            id="rec_exp_702",
            batch_id="batch_rec_live",
            exception_type="TIMING_DIFFERENCE",
            severity="MEDIUM",
            ledger_reference="txn_1028",
            gateway_reference="pay_K910238a",
            bank_reference="PENDING_SETTLEMENT_CLEARANCE",
            ledger_amount=125000.0,
            gateway_amount=125000.0,
            bank_amount=0.0,
            discrepancy_amount=125000.0,
            detected_date=now - datetime.timedelta(hours=14),
            ai_diagnosis="TIMING CUTOFF DELAY: Enterprise contract payment of ₹1,25,000.00 was authorized on Friday evening. Gateway settlement batch #12 is queued for Monday T+2 bank payout window.",
            recommended_action="MONITOR_T2_CLEARANCE",
            status="UNRESOLVED"
        ),
        ReconciliationException(
            id="rec_exp_703",
            batch_id="batch_rec_live",
            exception_type="MISSING_IN_LEDGER",
            severity="HIGH",
            ledger_reference=None,
            gateway_reference=None,
            bank_reference="HDFC0004918239",
            ledger_amount=0.0,
            gateway_amount=0.0,
            bank_amount=85000.0,
            discrepancy_amount=85000.0,
            detected_date=now - datetime.timedelta(days=2),
            ai_diagnosis="MISSING IN LEDGER: Direct customer RTGS transfer of ₹85,000.00 credited to HDFC bank account from 'Bengaluru Tech Incubator' with no corresponding invoice entry created in internal ERP.",
            recommended_action="CREATE_LEDGER_ADJUSTMENT",
            status="UNRESOLVED"
        ),
        ReconciliationException(
            id="rec_exp_704",
            batch_id="batch_rec_live",
            exception_type="STATUS_MISMATCH",
            severity="CRITICAL",
            ledger_reference="txn_1042",
            gateway_reference="pay_D718293c",
            bank_reference="HDFC9918237461",
            ledger_amount=42000.0,
            gateway_amount=0.0,
            bank_amount=0.0,
            discrepancy_amount=42000.0,
            detected_date=now - datetime.timedelta(days=3),
            ai_diagnosis="STATUS CONFLICT: Transaction txn_1042 is marked as 'SUCCESS' in internal ledger, but Razorpay settlement feed reflects a customer chargeback dispute with settlement withheld.",
            recommended_action="ESCALATE_TO_APPROVAL",
            status="UNRESOLVED"
        )
    ]
    db.add_all(bank_records)
    db.add_all(gateway_records)
    db.add_all(exceptions)

    # Seed Initial Reconciliation Batch
    recon_batch = ReconciliationBatch(
        id="batch_rec_live",
        timestamp=now - datetime.timedelta(hours=1),
        period="Trailing 30-Day Fiscal Cycle",
        total_records_processed=129,
        matched_count=125,
        partial_matched_count=2,
        exception_count=4,
        match_rate_pct=94.2,
        total_volume_reconciled=5155679.49,
        total_discrepancy_volume=253180.0,
        status="COMPLETED"
    )
    db.add(recon_batch)

    # 8. Seed Initial Risk Alerts
    risk_alerts = [
        RiskAlert(
            id="risk_alert_401",
            risk_type="UNUSUAL_TRANSACTION",
            risk_score=88,
            severity="CRITICAL",
            detected_date=now - datetime.timedelta(days=2, hours=3),
            amount=385000.0,
            entity_type="transaction",
            entity_id="txn_9901_CRITICAL",
            reason="Transaction amount is 5.8x higher than customer average ticket (₹15,000) with preceding authorization failures.",
            signals=json.dumps([
                "5.8x ticket size outlier",
                "Preceding failed auth attempts",
                "42% customer refund history spike"
            ]),
            recommended_action="MANUAL_REVIEW",
            status="OPEN",
            resolution_notes=""
        ),
        RiskAlert(
            id="risk_alert_402",
            risk_type="BUDGET_OVERRUN",
            risk_score=74,
            severity="HIGH",
            detected_date=now - datetime.timedelta(days=3),
            amount=248000.0,
            entity_type="budget",
            entity_id="Marketing",
            reason="Marketing spending is 24% above the monthly budget allocation of ₹2,00,000.",
            signals=json.dumps([
                "24% overrun on Google Ads and LinkedIn campaigns",
                "Projected monthly overrun: +₹62,000"
            ]),
            recommended_action="REDUCE_SPEND",
            status="OPEN",
            resolution_notes=""
        ),
        RiskAlert(
            id="risk_alert_403",
            risk_type="PAYMENT_FAILURES",
            risk_score=72,
            severity="HIGH",
            detected_date=now - datetime.timedelta(days=1),
            amount=140000.0,
            entity_type="transaction",
            entity_id="txn_fail_loop_1",
            reason="Repeated mandate failure loop (3 consecutive failed debits) for Vortex Digital Agency.",
            signals=json.dumps([
                "3 consecutive UPI/Card debit rejections",
                "Bank code: EXCEEDS_MANDATE_LIMIT"
            ]),
            recommended_action="MONITOR",
            status="OPEN",
            resolution_notes=""
        ),
        RiskAlert(
            id="risk_alert_404",
            risk_type="REFUND_SPIKE",
            risk_score=68,
            severity="MEDIUM",
            detected_date=now - datetime.timedelta(days=3),
            amount=150000.0,
            entity_type="transaction",
            entity_id="txn_9905_REFUND",
            reason="Large single refund settlement (₹1,50,000) on Swiggy Cloud Kitchens enterprise agreement.",
            signals=json.dumps([
                "Enterprise SLA dispute settlement",
                "Margin compression on enterprise line"
            ]),
            recommended_action="MONITOR",
            status="RESOLVED",
            resolution_notes="Reviewed and approved under Enterprise SLA dispute resolution protocol #882."
        )
    ]
    db.add_all(risk_alerts)

    # 9. Seed AI Insights
    insights = [
        AIInsight(
            id="ins_300",
            created_at=now - datetime.timedelta(minutes=45),
            agent_name="Multi-Source Reconciliation Agent",
            category="Reconciliation",
            severity="HIGH",
            title="Multi-source match rate is 94.2% with 4 active exceptions",
            explanation="3-way reconciliation across Internal Ledger, Razorpay, and HDFC Bank identified ₹2,53,180.00 in variance across 4 items (MDR fee deduction, bank cutoff delay, and direct credit).",
            recommended_action="Run auto-match to adjust gateway MDR processing fees and clear pending settlements.",
            metrics=json.dumps({"match_rate_pct": 94.2, "discrepancy_vol": 253180.0}),
            is_active=True
        ),
        AIInsight(
            id="ins_301",
            created_at=now - datetime.timedelta(hours=2),
            agent_name="Expense Controller Agent",
            category="Expense",
            severity="HIGH",
            title="Marketing spend is 24% above monthly budget",
            explanation="Marketing expenditure has touched ₹2,48,000 against the ₹2,00,000 monthly ceiling, primarily driven by LinkedIn and Google Ads campaigns. Projected to exceed cap by ₹62,000 at current burn rate.",
            recommended_action="Pause unoptimized adsets and enforce controller pre-approval for campaign top-ups.",
            metrics=json.dumps({"budget": 200000, "actual": 248000, "variance_pct": 24.0}),
            is_active=True
        ),
        AIInsight(
            id="ins_302",
            created_at=now - datetime.timedelta(hours=6),
            agent_name="Financial Risk Agent",
            category="Risk",
            severity="CRITICAL",
            title="High-value anomalous transaction detected (₹3,85,000)",
            explanation="Transaction txn_9901_CRITICAL from Nexus Global Exports represents a 5.8x deviation from their historical average ticket (₹15,000) with recent authorization failure signals.",
            recommended_action="Escalate to Approval Center for pre-settlement verification before releasing product entitlements.",
            metrics=json.dumps({"risk_score": 88, "amount": 385000, "ticket_multiple": 5.8}),
            is_active=True
        ),
        AIInsight(
            id="ins_303",
            created_at=now - datetime.timedelta(hours=12),
            agent_name="Revenue Intelligence Agent",
            category="Revenue",
            severity="LOW",
            title="Enterprise subscriptions expanded by 18.4%",
            explanation="Enterprise recurring contracts grew by 18.4% month-over-month, led by account expansions across Infosys and RazorX accounts.",
            recommended_action="Introduce multi-year upfront discount incentives to lock in cash liquidity.",
            metrics=json.dumps({"growth_pct": 18.4, "top_category": "Enterprise"}),
            is_active=True
        ),
        AIInsight(
            id="ins_304",
            created_at=now - datetime.timedelta(hours=18),
            agent_name="Cash Flow Agent",
            category="Cash Flow",
            severity="MEDIUM",
            title="Cash reserve may compress toward minimum threshold in 18 days",
            explanation="Projected cash flow models indicate that elevated marketing disbursements and recent enterprise refund settlements may compress cash reserves close to the ₹5,00,000 minimum reserve threshold around Day 18.",
            recommended_action="Expedite pending receivables collection and defer discretionary software upgrades.",
            metrics=json.dumps({"min_reserve": 500000, "breach_day": 18}),
            is_active=True
        ),
        AIInsight(
            id="ins_305",
            created_at=now - datetime.timedelta(hours=24),
            agent_name="Compliance & Audit Agent",
            category="Compliance",
            severity="MEDIUM",
            title="Suspected duplicate software invoice from Datadog (₹35,000)",
            explanation="Two identical charges of ₹35,000 were logged for Datadog Monitoring within a 36-hour interval. The second charge (exp_2016) has been automatically flagged.",
            recommended_action="Verify vendor billing portal and initiate credit request for redundant billing.",
            metrics=json.dumps({"amount": 35000, "vendor": "Datadog Monitoring"}),
            is_active=True
        )
    ]
    db.add_all(insights)

    # 10. Seed Initial Approval Requests (Human-in-the-Loop)
    approvals = [
        Approval(
            id="appr_501",
            requested_by="Financial Risk Agent",
            ai_agent="Financial Risk Agent",
            title="Pre-settlement Hold: txn_9901_CRITICAL (₹3,85,000)",
            reason="Transaction value is 5.8x higher than customer historical baseline with preceding payment failure flags. AI recommends pre-settlement hold.",
            risk_level="CRITICAL",
            entity_type="transaction",
            entity_id="txn_9901_CRITICAL",
            proposed_action="BLOCK_TRANSACTION",
            decision="PENDING",
            created_at=now - datetime.timedelta(hours=4)
        ),
        Approval(
            id="appr_502",
            requested_by="Expense Controller Agent",
            ai_agent="Expense Controller Agent",
            title="Marketing Budget Top-up Request (+₹50,000)",
            reason="Marketing spending is 24% above budget. Campaign manager requested supplementary allocation of ₹50,000 for quarterly lead gen.",
            risk_level="HIGH",
            entity_type="budget",
            entity_id="Marketing",
            proposed_action="APPROVE_BUDGET_OVERRUN",
            decision="PENDING",
            created_at=now - datetime.timedelta(hours=14)
        ),
        Approval(
            id="appr_503",
            requested_by="Multi-Source Reconciliation Agent",
            ai_agent="Multi-Source Reconciliation Agent",
            title="Reconciliation Dispute Hold: rec_exp_704 (₹42,000.00)",
            reason="STATUS CONFLICT: Transaction txn_1042 is marked as 'SUCCESS' in internal ledger, but Razorpay settlement feed reflects a customer chargeback dispute with settlement withheld.",
            risk_level="CRITICAL",
            entity_type="reconciliation_exception",
            entity_id="rec_exp_704",
            proposed_action="ESCALATE_TO_APPROVAL",
            decision="PENDING",
            created_at=now - datetime.timedelta(hours=2)
        )
    ]
    db.add_all(approvals)

    # 11. Seed Initial Audit Logs
    audit_logs = [
        AuditLog(
            timestamp=now - datetime.timedelta(days=5),
            user="Aarav Saroha",
            action="BUDGET_CONFIGURED",
            entity="budget",
            entity_id="Marketing",
            ai_agent="Expense Controller Agent",
            previous_value="₹1,50,000",
            new_value="₹2,00,000",
            details="Quarterly marketing ceiling established."
        ),
        AuditLog(
            timestamp=now - datetime.timedelta(days=3),
            user="Aarav Saroha",
            action="RISK_STATE_CHANGED",
            entity="risk_alert",
            entity_id="risk_alert_404",
            ai_agent="Financial Risk Agent",
            previous_value="OPEN",
            new_value="RESOLVED",
            details="Refund approved per Enterprise SLA settlement policy."
        ),
        AuditLog(
            timestamp=now - datetime.timedelta(days=2, hours=3),
            user="FinPilot AI Engine",
            action="ANOMALY_DETECTED",
            entity="transaction",
            entity_id="txn_9901_CRITICAL",
            ai_agent="Financial Risk Agent",
            previous_value="NORMAL",
            new_value="CRITICAL_RISK (88/100)",
            details="5.8x ticket size surge flagged by Risk Intelligence Agent."
        ),
        AuditLog(
            timestamp=now - datetime.timedelta(hours=1),
            user="FinPilot AI Engine",
            action="RECONCILIATION_BATCH_EXECUTED",
            entity="reconciliation_batch",
            entity_id="batch_rec_live",
            ai_agent="Multi-Source Reconciliation Agent",
            previous_value="",
            new_value="Match Rate: 94.2%",
            details="Automated 3-way multi-source reconciliation batch executed."
        )
    ]
    db.add_all(audit_logs)
    db.commit()

    return len(transactions), len(expenses)
