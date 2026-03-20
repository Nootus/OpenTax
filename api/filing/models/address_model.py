from .api_base_model import ApiBaseModel


class AddressModel(ApiBaseModel):
    address_id: int | None = None
    person_id: int | None = None
    flat_door_no: str | None = None
    premise_name: str | None = None
    street: str | None = None
    area_locality: str | None = None
    city: str | None = None
    pincode: str | None = None
    state: str | None = None
    country: str | None = None
