from .api_base_model import ApiBaseModel


class Deduction80TTBModel(ApiBaseModel):
    deduction_id: int | None = None
    filing_id: int
    interest_amount: float
# Deduction80TTBModel
