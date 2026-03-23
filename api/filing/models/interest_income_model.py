"""Interest Income model matching database schema."""
from .api_base_model import ApiBaseModel


class InterestIncomeModel(ApiBaseModel):
    """Model for interest_income_details table."""
    interest_id: int | None = None
    filing_id: int
    interest_type_id: int | None = None
    provident_fund_type: str | None = None
    amount: float | str | int | None = None
    description: str | None = None

# InterestIncomeModel
