from .api_base_model import ApiBaseModel


class Deduction80RRBModel(ApiBaseModel):
    deduction_id: int | None = None
    filing_id: int
    royalty_amount: float
# Deduction80RRBModel