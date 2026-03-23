"""Other Assets model - Pydantic models for other assets management."""
from datetime import datetime
from .api_base_model import ApiBaseModel


class OtherAssetsModel(ApiBaseModel):
    """Model for other asset - maps to al_other_assets table."""
    other_asset_id: int | None = None
    filing_id: int
    jewellery_bullion: float = 0.0
    vehicles: float = 0.0
    artwork: float = 0.0
    created_at: datetime | None = None
    updated_at: datetime | None = None
# OtherAssetsModel
