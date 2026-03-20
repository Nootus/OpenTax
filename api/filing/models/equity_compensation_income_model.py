"""Equity compensation income model."""
from typing import Any
from datetime import date
from .api_base_model import ApiBaseModel


class EquityCompensationIncomeModel(ApiBaseModel):
    """Model for equity compensation income (ESOP/RSU salary component)."""
    equity_compensation_id: int | None = None
    filing_id: int | None = None
    investment_type: str | None = None
    narration: str | None = None
    amount: float = 0.0
    date_of_receipt: date | None = None
    created_at: Any | None = None
    updated_at: Any | None = None
