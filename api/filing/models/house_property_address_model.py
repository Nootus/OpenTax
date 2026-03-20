from .api_base_model import ApiBaseModel


class HousePropertyAddressModel(ApiBaseModel):
    property_address_id: int | None = None
    filing_id: int
    property_id: int | None = None
    address_line1: str
    address_line2: str | None = None
    city: str
    district: str
    state: str
    postal_code: str
    country: str = "India"
# HousePropertyAddressModel
