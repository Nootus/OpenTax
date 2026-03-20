"""Immovable asset list wrapper model - contains list of all immovable assets for a filing.
Similar to ForeignAssetModel pattern."""
from typing import List
from .api_base_model import ApiBaseModel
from .immovable_assets_model import ImmovableAssetsModel


class ImmovableAssetListModel(ApiBaseModel):
    """Wrapper model containing list of full immovable asset models and aggregated totals."""
    filing_id: int
    assets: List[ImmovableAssetsModel] = []
    total_purchase_cost: float = 0.0
