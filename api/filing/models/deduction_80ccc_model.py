from .api_base_model import ApiBaseModel


class Deduction80CCCModel(ApiBaseModel):
    deduction_id: int | None = None
    filing_id: int
    pran_number: str | None = None
    amount: float
# Deduction80CModel