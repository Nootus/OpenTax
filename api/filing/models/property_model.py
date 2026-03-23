from .api_base_model import ApiBaseModel
from .house_property_model import HousePropertyModel
from .house_property_address_model import HousePropertyAddressModel
from .house_property_loan_model import HousePropertyLoanModel
from .house_property_tenant_model import HousePropertyTenantModel
from .house_property_coowner_model import HousePropertyCoownerModel


class PropertyModel(ApiBaseModel):
    property: HousePropertyModel
    property_address: HousePropertyAddressModel | None = None
    property_loan: HousePropertyLoanModel | None = None
    property_tenants: list[HousePropertyTenantModel] = []
    property_coowners: list[HousePropertyCoownerModel] = []

    @property
    def itr_loan_tkn_from(self) -> str:
        loan = self.property_loan
        vendor_type = (loan.vendor_type or "").lower() if loan else ""
        return "B" if "bank" in vendor_type else "I"

    @property
    def itr_bank_or_instn_name(self) -> str:
        loan = self.property_loan
        return ((loan.lender_name if loan else None) or "Bank")[:125] or "Bank"

    @property
    def itr_loan_acc_ref(self) -> dict:
        return {}

    @property
    def itr_dateofloan(self) -> str:
        loan = self.property_loan
        d = loan.loan_sanction_date if loan else None
        return d.strftime("%Y-%m-%d") if d else "2024-04-01"

    @property
    def itr_total_loan_amt(self) -> int:
        loan = self.property_loan
        return int(loan.total_loan_amount or 0) if loan else 0

    @property
    def itr_loan_outstanding_amt(self) -> int:
        loan = self.property_loan
        return int(loan.loan_outstanding or 0) if loan else 0

    @property
    def itr_interest_us24b(self) -> int:
        loan = self.property_loan
        return int(loan.interest_paid or 0) if loan else 0
# PropertyModel
