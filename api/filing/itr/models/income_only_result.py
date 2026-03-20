from typing import Any, Optional

from pydantic import BaseModel, Field


class IncomeOnlyResult(BaseModel):
    """Result of Phase 1 (income-only) build for ITR1/ITR2."""

    gross_income: int = Field(..., description="Gross total income across all heads")
    new_regime_deductions: int = Field(..., description="Total Chapter VIA deductions under new regime")
    old_regime_deductions: int = Field(..., description="Total Chapter VIA deductions under old regime")
    income_breakdown: Optional[Any] = Field(None, description="Per-head income breakdown for tax computation")
