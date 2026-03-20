"""Agricultural income models - parent-child pattern with land details."""
from typing import List, Any
from decimal import Decimal
from .api_base_model import ApiBaseModel


class AgriculturalLandDetailModel(ApiBaseModel):
    """Child model for agricultural land details - maps to agricultural_land_details table."""
    land_id: int | None = None
    filing_id: int
    income_id: int | None = None
    district_name: str | None = None
    pincode: str | None = None
    measurement_acres: Decimal | None = None
    ownership_status: str | None = None
    water_source: str | None = None
    created_at: Any | None = None
    updated_at: Any | None = None


class AgriculturalIncomeModel(ApiBaseModel):
    """Parent model for agricultural income - maps to agricultural_income table."""
    income_id: int | None = None
    filing_id: int
    gross_receipt: Decimal | None = None
    expenditure: Decimal | None = None
    unabsorbed_loss: Decimal | None = None
    net_agricultural_income: float | None = None
    land_details: List[AgriculturalLandDetailModel] = []
    created_at: Any | None = None
    updated_at: Any | None = None
