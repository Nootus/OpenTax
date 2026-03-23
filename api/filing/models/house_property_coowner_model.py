from .api_base_model import ApiBaseModel


class HousePropertyCoownerModel(ApiBaseModel):
    coowner_id: int | None = None
    filing_id: int
    property_id: int | None = None
    coowner_name: str
    coowner_pan: str | None = None
    coowner_relationship: str | None = None
    ownership_share: float | None = None
# HousePropertyCoownerModel
