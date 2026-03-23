from datetime import date
from .api_base_model import ApiBaseModel


class HousePropertyLoanModel(ApiBaseModel):
    loan_id: int | None = None
    filing_id: int
    property_id: int | None = None
    vendor_type: str | None = None
    lender_name: str | None = None
    loan_account_number: str | None = None
    loan_sanction_date: date | None = None
    total_loan_amount: float | None = None
    loan_outstanding: float | None = None
    interest_paid: float | None = None
    principal_repaid: float | None = None
# HousePropertyLoanModel
