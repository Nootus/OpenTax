from .api_base_model import ApiBaseModel


class HousePropertyTenantModel(ApiBaseModel):
    tenant_id: int | None = None
    filing_id: int
    property_id: int | None = None
    tenant_name: str
    identifier_type: str | None = None
    identifier_value: str | None = None
# HousePropertyTenantModel
