"""Financial asset list wrapper model - contains list of all financial assets for a filing.
Similar to ForeignAssetModel pattern."""
from typing import List
from .api_base_model import ApiBaseModel
from .financial_assets_model import FinancialAssetsModel


class FinancialAssetListModel(ApiBaseModel):
    """Wrapper model containing list of full financial asset models and aggregated totals."""
    filing_id: int
    assets: List[FinancialAssetsModel] = []
    total_deposits: float = 0.0
    total_shares_and_securities: float = 0.0
    total_insurance_policies: float = 0.0
    total_cash_in_hand: float = 0.0
    total_loans_and_advances: float = 0.0
    grand_total: float = 0.0
