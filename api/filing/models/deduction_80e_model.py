from datetime import date
from .api_base_model import ApiBaseModel


class Deduction80EModel(ApiBaseModel):
    deduction_id: int | None = None
    filing_id: int
    lender_type: str | None = None  # "Bank", "Financial Institution", "Approved Charitable Institution"
    lender_name: str | None = None
    loan_account_number: str | None = None
    loan_sanction_date: date | None = None
    total_loan_amount: float | None = None
    loan_outstanding: float | None = None
    interest_on_loan: float

    @property
    def itr_loan_tkn_from(self) -> str:
        lender_type = (self.lender_type or "").lower()
        return "B" if "bank" in lender_type else "I"

    @property
    def itr_bank_or_instn_name(self) -> str :
        return (self.lender_name or "Financial Institution")[:125] or "Financial Institution"

    @property
    def itr_loan_acc_ref(self) -> str:
        return (self.loan_account_number or "0").strip() or "0"

    @property
    def itr_dateofloan(self) -> str | None:
        d: date | None = self.loan_sanction_date
        return d.strftime("%Y-%m-%d") if d else None

    @property
    def itr_total_loan_amt(self) -> int:
        return int(self.total_loan_amount or 0)

    @property
    def itr_loan_outstanding_amt(self) -> int:
        return int(self.loan_outstanding or 0)

    @property
    def itr_interest_80e(self) -> int:
        return int(self.interest_on_loan or 0)
# Deduction80EModel
