import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base, get_db
from app.main import app
from app.seed_data import seed_database
from app.services.analytics_service import get_financial_kpis, get_budget_comparisons, calculate_30d_cash_forecast
from app.agents.risk_agent import risk_agent
from app.agents.revenue_agent import revenue_agent
from app.agents.expense_agent import expense_agent
from app.agents.cashflow_agent import cashflow_agent
from app.agents.audit_agent import audit_agent

# Use StaticPool with in-memory SQLite database for shared connections during test suite
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_database(db)
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="session")
def client(db_session):
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_financial_kpis_calculation(db_session):
    """Test KPI calculation accuracy"""
    kpis = get_financial_kpis(db_session, days=30)
    assert "revenue" in kpis
    assert "expenses" in kpis
    assert "net_profit" in kpis
    assert "cash_balance" in kpis
    assert "risk_score" in kpis
    assert kpis["revenue"]["value"] > 0
    assert kpis["expenses"]["value"] > 0
    assert kpis["risk_score"]["value"] >= 0 and kpis["risk_score"]["value"] <= 100

def test_risk_scoring_engine(db_session):
    """Test single transaction deep AI risk analyzer on anomalous record"""
    result = risk_agent.analyze_transaction(db_session, "txn_9901_CRITICAL")
    assert result["risk_score"] >= 80
    assert result["risk_level"] == "CRITICAL"
    assert result["recommended_action"] in ["BLOCK", "MANUAL_REVIEW"]
    assert len(result["signals"]) > 0

def test_budget_variance_calculation(db_session):
    """Test expense budget overrun detection"""
    comparisons = get_budget_comparisons(db_session)
    marketing = next((c for c in comparisons if c["category"] == "Marketing"), None)
    assert marketing is not None
    assert marketing["actual_amount"] > 0
    assert "variance_pct" in marketing

def test_cash_flow_forecast(db_session):
    """Test 30-day forward cash projection and reserve limits"""
    forecast = calculate_30d_cash_forecast(db_session)
    assert forecast["opening_cash"] > 0
    assert len(forecast["forecast_points"]) == 30
    assert forecast["minimum_cash_reserve"] == 500000.0

def test_specialized_agents(db_session):
    """Test individual domain agents execute deterministically"""
    rev = revenue_agent.analyze(db_session, days=30)
    assert rev["agent"] == "Revenue Intelligence Agent"
    assert rev["current_revenue"] > 0

    exp = expense_agent.analyze(db_session, days=30)
    assert exp["agent"] == "Expense Controller Agent"
    assert exp["current_expenses"] > 0

    cf = cashflow_agent.analyze(db_session, days=30)
    assert cf["agent"] == "Cash Flow Agent"

    audit = audit_agent.perform_system_audit(db_session)
    assert audit["integrity_score"] >= 80

def test_api_dashboard_endpoint(client):
    """Test GET /api/dashboard"""
    response = client.get("/api/dashboard?days=30")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert "revenue_expense_chart" in data
    assert "profit_trend_chart" in data
    assert len(data["revenue_expense_chart"]) > 0

def test_api_transactions_endpoint(client):
    """Test GET /api/transactions and search filter"""
    response = client.get("/api/transactions?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 100
    assert len(data["items"]) == 10

def test_api_expenses_endpoint(client):
    """Test GET /api/expenses"""
    response = client.get("/api/expenses?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 40

def test_api_copilot_endpoint(client):
    """Test POST /api/copilot returns data-grounded answer"""
    payload = {"question": "Why did profit decrease this month?"}
    response = client.post("/api/copilot", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "supporting_numbers" in data
    assert len(data["active_agents"]) > 0
    assert len(data["answer"]) > 10

def test_api_reports_endpoint(client):
    """Test POST /api/reports/generate"""
    response = client.post("/api/reports/generate")
    assert response.status_code == 200
    data = response.json()
    assert "executive_summary" in data
    assert "revenue_analysis" in data
    assert "strategic_ai_recommendations" in data
