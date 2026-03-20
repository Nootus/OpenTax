from .api_base_model import ApiBaseModel


class EmployerModel(ApiBaseModel):
    employer_id: int | None = None
    filing_id: int
    employer_name: str
    employer_type: str | None = None
    tan_number: str | None = None
    pan_number: str | None = None
    telephone: str | None = None
    email: str | None = None
# EmployerModel