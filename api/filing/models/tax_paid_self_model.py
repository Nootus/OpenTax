"""Tax Paid Self model (Advance Tax / Self-Assessment Tax)."""
from typing import Any
from .api_base_model import ApiBaseModel


class TaxPaidSelfModel(ApiBaseModel):
    tax_paid_id: int | None = None
    filing_id: int | None = None
    challan_number: str | None = None
    bsr_code: str | None = None
    date_of_payment: Any | None = None
    tax_paid_amount: float | str | int | None = None
    tax_paid_date: Any | None = None
    tax_type: str | None = None
