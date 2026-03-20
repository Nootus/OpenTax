"""Investment Firm LLP AOP model - Pydantic models for investment firm/LLP/AOP management."""
from datetime import datetime
from .api_base_model import ApiBaseModel


class InvestmentFirmLlpAopModel(ApiBaseModel):
    """Model for investment firm/LLP/AOP - maps to al_investment_firm_llp_aop table."""
    investment_id: int | None = None
    filing_id: int
    firm_name: str
    firm_pan: str
    investment_amount: float = 0.0
    address_line1: str
    address_line2: str | None = None
    city: str
    state: str
    country: str
    pin_code: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
# InvestmentFirmLlpAopModel
