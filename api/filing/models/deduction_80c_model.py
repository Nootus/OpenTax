from .api_base_model import ApiBaseModel


class Deduction80CModel(ApiBaseModel):
    deduction_id: int | None = None
    filing_id: int
    description: str | None = None
    policy_number: str | None = None
    amount: float

    @property
    def itr_identification_no(self) -> str:
        return (self.description or "Investment")[:50] or "Investment"

    @property
    def itr_amount(self) -> int:
        return int(self.amount or 0)
# Deduction80CModel