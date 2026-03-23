from .api_base_model import ApiBaseModel


class Deduction80GGAModel(ApiBaseModel):
    deduction_id: int | None = None
    filing_id: int
    clause_under_donation: str | None = None
    donee_name: str | None = None
    donation_amount_cash: float = 0.0
    donation_amount_non_cash: float = 0.0
    total_donation_amount: float = 0.0
    donee_pan: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None

    @property
    def itr_relevant_clause(self) -> str:
        raw = (self.clause_under_donation or "").strip()
        # Expected values look like: 80GGA2a, 80GGA2aa, ...
        if raw.startswith("80GGA2"):
            return raw
        return "80GGA2a"

    @property
    def itr_name_of_donee(self) -> str:
        return (self.donee_name or "Research Institution")[:125] or "Research Institution"

    @property
    def itr_donee_pan(self) -> str:
        return (self.donee_pan or "AAAAA0000A")[:10] or "AAAAA0000A"

    @property
    def itr_address_detail(self) -> dict:
        addr = (self.address_line1 or self.address_line2 or "NA").strip() or "NA"
        city = (self.city or "Delhi").strip() or "Delhi"
        state_code = "36"
        try:
            pin = int(self.pincode) if self.pincode else 100000
        except Exception:
            pin = 100000
        if pin < 100000 or pin > 999999:
            pin = 100000

        return {
            "AddrDetail": addr[:500],
            "CityOrTownOrDistrict": city[:50],
            "StateCode": state_code,
            "PinCode": pin,
        }

    @property
    def itr_donation_amt_cash(self) -> int:
        return int(self.donation_amount_cash or 0)

    @property
    def itr_donation_amt_other_mode(self) -> int:
        return int(self.donation_amount_non_cash or 0)

    @property
    def itr_donation_amt(self) -> int:
        return int(self.total_donation_amount or 0)

    @property
    def itr_eligible_donation_amt(self) -> int:
        return int(self.total_donation_amount or 0)
# Deduction80GGAModel
