from .api_base_model import ApiBaseModel


class SalarySection173Model(ApiBaseModel):
    salary_detail_id: int | None = None
    filing_id: int
    employer_id: int | None = None
    component_id: int
    amount: float
# SalarySection173Model
