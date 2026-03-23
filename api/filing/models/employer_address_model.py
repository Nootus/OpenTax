from .api_base_model import ApiBaseModel


class EmployerAddressModel(ApiBaseModel):
    employer_address_id: int | None = None
    employer_id: int | None = None
    address_line1: str
    address_line2: str | None = None
    landmark: str | None = None
    city: str
    district: str | None = None
    state: str
    pincode: str
    country: str
# EmployerAddressModel
