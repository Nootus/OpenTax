from .api_base_model import ApiBaseModel


class Deduction80GGModel(ApiBaseModel):
    deduction_id: int | None = None
    filing_id: int
    rent_paid_amount: float
    acknowledgement_no_10_ba: str | None = None

# Deduction80GGModel