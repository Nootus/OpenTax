"""Foreign income models."""
from typing import List, Any
from .api_base_model import ApiBaseModel


class ForeignDividendModel(ApiBaseModel):
    """Model for foreign dividend income."""
    foreign_dividend_id: int | None = None
    filing_id: int | None = None
    country_code: str | None = None
    country_name: str | None = None
    description: str | None = None
    period1: float = 0  # Upto 15-Jun
    period2: float = 0  # 16-Jun to 15-Sep
    period3: float = 0  # 16-Sep to 15-Dec
    period4: float = 0  # 16-Dec to 15-Mar
    period5: float = 0  # 16-Mar to 31-Mar
    total_amount: float | None = None
    currency_type: str = "INR"
    created_at: Any | None = None
    updated_at: Any | None = None


class ForeignInterestModel(ApiBaseModel):
    """Model for foreign interest income."""
    foreign_interest_id: int | None = None
    filing_id: int | None = None
    country_code: str | None = None
    country_name: str | None = None
    description: str | None = None
    amount: float = 0.0
    currency_type: str = "INR"
    created_at: Any | None = None
    updated_at: Any | None = None


class Section89AModel(ApiBaseModel):
    """Income from retirement benefit account u/s 89A."""
    section_89a_id: int | None = None
    filing_id: int | None = None
    period1: float = 0  # Upto 15-Jun
    period2: float = 0  # 16-Jun to 15-Sep
    period3: float = 0  # 16-Sep to 15-Dec
    period4: float = 0  # 16-Dec to 15-Mar
    period5: float = 0  # 16-Mar to 31-Mar
    usa_amount: float = 0
    uk_amount: float = 0
    canada_amount: float = 0
    created_at: Any | None = None
    updated_at: Any | None = None


class ForeignIncomeModel(ApiBaseModel):
    """Combined model for all foreign income types."""
    filing_id: int | None = None
    foreign_dividend: List[ForeignDividendModel] = []
    foreign_interest: List[ForeignInterestModel] = []
    section_89a: Section89AModel | None = None
