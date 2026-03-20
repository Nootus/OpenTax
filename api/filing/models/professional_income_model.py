"""Professional income model (Section 44ADA) – main record with revenue/expenses and professions."""
from typing import Any

from .api_base_model import ApiBaseModel

from .professional_income_profession_model import ProfessionalIncomeProfessionModel


class ProfessionalIncomeModel(ApiBaseModel):
    """Professional income (Section 44ADA) with revenue breakdown and list of professions."""

    professional_income_id: int | None = None
    filing_id: int | None = None
    revenue_via_cash: float = 0.0
    revenue_via_other_modes: float = 0.0
    revenue_via_digital_modes: float = 0.0
    gross_revenue: float = 0.0
    total_expenses: float = 0.0
    net_taxable_income: float = 0.0
    created_at: Any | None = None
    updated_at: Any | None = None
    professional_income_professions: list[ProfessionalIncomeProfessionModel] | None = None
