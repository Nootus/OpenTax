"""TCS (Tax Collected at Source) model."""
from datetime import date
from .api_base_model import ApiBaseModel


class TCSModel(ApiBaseModel):
    tcs_id: int | None = None
    filing_id: int | None = None
    collector_name: str | None = None
    tan: str | None = None
    nature_of_collection: str | None = None
    amount_collected: float | str | int | None = None
    tax_collected: float | str | int | None = None
    tcs_certificate_number: str | None = None
    quarter: str | None = None
    year_of_collection: date | None = None
    tax_credit_claimed: float | str | int | None = None
