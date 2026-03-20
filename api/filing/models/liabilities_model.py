"""Liabilities model - Pydantic models for liabilities management."""
from datetime import datetime
from .api_base_model import ApiBaseModel


class LiabilitiesModel(ApiBaseModel):
    """Model for liability - maps to al_liabilities table."""
    liability_id: int | None = None
    filing_id: int
    amount: float = 0.0
    description: str = ""
    type: str = ""
    created_at: datetime | None = None
    updated_at: datetime | None = None
# LiabilitiesModel
