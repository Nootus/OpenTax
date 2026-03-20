"""TDS (Tax Deducted at Source) model."""
from .api_base_model import ApiBaseModel


class TDSModel(ApiBaseModel):
    tds_id: int | None = None
    filing_id: int | None = None
    deductor_name: str | None = None
    tan: str | None = None
    pan: str | None = None
    income_source: str | None = None
    tds_section: str | None = None
    amount_paid: float | str | int | None = None
    tax_deducted: float | str | int | None = None
    tds_certificate_number: str | None = None
    quarter: str | None = None
