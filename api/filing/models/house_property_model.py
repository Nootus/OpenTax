from .api_base_model import ApiBaseModel


class HousePropertyModel(ApiBaseModel):
    property_id: int | None = None
    filing_id: int
    property_type: str
    ownership_share: float | None = None
    annual_rent_received: float | None = None
    municipal_taxes_paid: float | None = None
# HousePropertyModel
