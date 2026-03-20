from pydantic import Field
from filing.models.api_base_model import ApiBaseModel
from filing.tax_calculation.models.tax_regime_breakdown import TaxRegimeBreakdownModel


class TaxCalculationResponseModel(ApiBaseModel):

    # Regime breakdowns
    current_regime: TaxRegimeBreakdownModel = Field(
        ..., description="Breakdown for the regime actually applied (selected/optimal)"
    )
    old_regime: TaxRegimeBreakdownModel | None = Field(
        None, description="Full breakdown as per old regime"
    )
    new_regime: TaxRegimeBreakdownModel | None = Field(
        None, description="Full breakdown as per new regime"
    )
