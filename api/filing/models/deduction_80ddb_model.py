from .api_base_model import ApiBaseModel


class Deduction80DDBModel(ApiBaseModel):
    deduction_id: int | None = None
    filing_id: int
    treatment_for: str | None = None  # "Self" or "Dependant"
    senior_citizen_type: str | None = None  # "Self" or "Dependant"
    disease: str | None = None
    expenditure_incurred: float
# Deduction80DDBModel