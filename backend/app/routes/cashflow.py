from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import CashFlowForecastResponse
from app.services.analytics_service import calculate_30d_cash_forecast

router = APIRouter(prefix="/api/cashflow", tags=["Cash Flow"])

@router.get("/forecast", response_model=CashFlowForecastResponse)
def get_cash_flow_forecast(db: Session = Depends(get_db)):
    """
    Computes a 30-day cash flow projection using historical transaction
    and expense velocity. Flags if projected balance breaches minimum cash reserve.
    """
    return calculate_30d_cash_forecast(db)
