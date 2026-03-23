from filing.models.api_base_model import ApiBaseModel


class TaxInterestBreakdownModel(ApiBaseModel):
    interest_234a: int = 0
    interest_234b: int = 0
    interest_234c: int = 0
    late_fee_234f: int = 0
    total: int = 0
