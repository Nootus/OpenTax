"""Immovable Assets model - Pydantic models for immovable assets management."""
from datetime import datetime
from .api_base_model import ApiBaseModel


class ImmovableAssetsModel(ApiBaseModel):
    """Model for immovable asset - maps to al_immovable_assets table."""
    immovable_asset_id: int | None = None
    filing_id: int
    property_description: str
    purchase_cost: float
    address_line1: str
    address_line2: str | None = None
    city: str
    state: str
    country: str
    pin_code: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
# ImmovableAssetsModel
