from .api_base_model import ApiBaseModel


class Deduction80CCHModel(ApiBaseModel):
    deduction_id: int | None = None
    filing_id: int
    contribution_amount: float
# Deduction80CCHModel