"""Dividend income models for dividend income management."""
from typing import List, Any
from datetime import date
from .api_base_model import ApiBaseModel


class EquityDividendModel(ApiBaseModel):
    """Model for equity dividend - maps to dividend_income table."""
    dividend_id: int | None = None
    filing_id: int | None = None
    dividend_type: str = "equity"
    currency: str = "INR"
    narration: str | None = None  # Optional - ERI doesn't provide
    amount: float = 0.0
    date_of_receipt: date | None = None  # Optional - ERI doesn't provide
    created_at: Any | None = None
    updated_at: Any | None = None


class RSUDividendModel(ApiBaseModel):
    """Model for RSU dividend - maps to equity_compensation_income table."""
    dividend_id: int | None = None  # Alias for equity_comp_income_id (for frontend consistency)
    equity_comp_income_id: int | None = None
    filing_id: int | None = None
    dividend_type: str = "rsu"
    currency: str = "INR"
    description: str | None = None
    amount: float = 0.0
    amount_received: float = 0.0
    amount_received_currency_type: str = "INR"
    date_of_receipt: date | None = None
    received_date: date | None = None
    tax_paid_foreign_currency_type: str | None = None
    tax_paid_outside_india: float = 0.0
    created_at: Any | None = None
    updated_at: Any | None = None


class DividendIncomeModel(ApiBaseModel):
    """Combined model for all dividend income types."""
    filing_id: int | None = None
    equity: List[EquityDividendModel] = []
    rsu: List[RSUDividendModel] = []
