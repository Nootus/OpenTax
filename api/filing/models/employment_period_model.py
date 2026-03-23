from datetime import date
from .api_base_model import ApiBaseModel


class EmploymentPeriodModel(ApiBaseModel):
    employment_period_id: int | None = None
    filing_id: int
    employer_id: int | None = None
    employment_from: date
    employment_to: date
# EmploymentPeriodModel
