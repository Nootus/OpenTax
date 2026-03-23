from .api_base_model import ApiBaseModel


class Deduction80GModel(ApiBaseModel):
    deduction_id: int | None = None
    filing_id: int
    donee_name: str | None = None
    donee_pan: str | None = None
    donation_type: str | None = None  # "Cash", "Cheque", "Online", "Other"
    donation_amount_cash: float = 0.0
    donation_amount_non_cash: float = 0.0
    donation_amount: float | None = None
    limit_on_deduction: str | None = None
    qualifying_percentage: str | None = None
    approval_reference_number: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None

    @property
    def itr_donee_with_pan_name(self) -> str:
        return (self.donee_name or "Charitable Trust")[:125] or "Charitable Trust"

    @property
    def itr_donee_pan(self) -> str:
        return (self.donee_pan or "AAAAA0000A")[:10] or "AAAAA0000A"

    @property
    def itr_arn_nbr(self) -> str | None:
        arn = (self.approval_reference_number or "").strip()
        return arn[:50] if arn else None

    @property
    def itr_address_detail(self) -> dict:
        addr = (self.address_line1 or self.address_line2 or "NA").strip() or "NA"
        city = (self.city or "Delhi").strip() or "Delhi"
        # TODO: map state to official StateCode values; defaulting to Telangana (36)
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
        return int(self.donation_amount or 0)

    @property
    def itr_eligible_donation_amt(self) -> int:
        return int(self.donation_amount or 0)
# Deduction80GModel  