from datetime import date
from .api_base_model import ApiBaseModel


class Deduction80GGCModel(ApiBaseModel):
    deduction_id: int | None = None
    filing_id: int
    donee_name: str | None = None
    political_party_name: str | None = None
    transaction_id: str | None = None
    donor_bank_ifsc: str | None = None
    date_of_donation: date | None = None
    contribution_amount_cash: float = 0.0
    contribution_amount_non_cash: float = 0.0
    total_contribution: float = 0.0

    @property
    def itr_donation_date(self) -> str:
        d: date | None = self.date_of_donation
        return d.strftime("%Y-%m-%d") if d else "2024-04-01"

    @property
    def itr_donation_amt_cash(self) -> int:
        return int(self.contribution_amount_cash or 0)

    @property
    def itr_donation_amt_other_mode(self) -> int:
        return int(self.contribution_amount_non_cash or 0)

    @property
    def itr_transaction_ref_num(self) -> str | None:
        ref = (self.transaction_id or "").strip()
        return ref[:50] if ref else None

    @property
    def itr_ifsc_code(self) -> str | None:
        ifsc = (self.donor_bank_ifsc or "").strip()
        return ifsc[:11] if ifsc else None

    @property
    def itr_donation_amt(self) -> int:
        return int(self.total_contribution or 0)

    @property
    def itr_eligible_donation_amt(self) -> int:
        return int(self.total_contribution or 0)
# Deduction80GGCModel
