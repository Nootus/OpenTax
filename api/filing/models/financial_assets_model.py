"""Financial Assets model - Pydantic models for financial assets management."""
from datetime import datetime
from .api_base_model import ApiBaseModel


class FinancialAssetsModel(ApiBaseModel):
    """Model for financial asset - maps to al_financial_assets table."""
    financial_asset_id: int | None = None
    filing_id: int
    deposits_in_bank: float = 0.0
    shares_and_securities: float = 0.0
    insurance_policies: float = 0.0
    cash_in_hand: float = 0.0
    loans_and_advances_given: float = 0.0
    created_at: datetime | None = None
    updated_at: datetime | None = None
# FinancialAssetsModel
