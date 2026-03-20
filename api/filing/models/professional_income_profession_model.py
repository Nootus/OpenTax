"""Professional income profession model (Section 44ADA) – each profession entry."""
from typing import Any

from .api_base_model import ApiBaseModel


class ProfessionalIncomeProfessionModel(ApiBaseModel):
    """Single profession under a professional income record."""

    profession_id: int | None = None
    professional_income_id: int | None = None
    filing_id: int | None = None
    profession_value: int | None = None  # value from professions_44ada_master
    company_name: str | None = None
    description: str | None = None
    created_at: Any | None = None
    updated_at: Any | None = None
