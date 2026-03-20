"""Filing view model for displaying user filings."""
from datetime import datetime
from .api_base_model import ApiBaseModel


class FilingViewModel(ApiBaseModel):
    user_id: int
    full_name: str | None = None
    person_id: int | None = None
    first_name: str | None = None
    last_name: str | None = None
    filing_id: int | None = None
    assessment_year: str | None = None
    active_filing_id: int | None = None
    active: int = 0
    regime_opted: str | None = None
    arn_number: str | None = None
    filed_on: datetime | None = None
    filing_status: str | None = None
    verified_on: datetime | None = None
