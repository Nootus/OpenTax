"""Capital gains securities models (stocks, bonds, mutual funds, RSUs)."""
from typing import List, Optional
from datetime import date
from .api_base_model import ApiBaseModel


class StocksCapitalGains(ApiBaseModel):
    """Model for stocks/equity shares capital gains."""
    stock_sale_id: int | None = None
    filing_id: int | None = None
    share_type: str | None = None
    date_of_sale: date | None = None
    date_of_purchase: date | None = None
    description_of_asset_sold: str | None = None
    total_sale_price: float = 0.0
    total_purchase_price: float = 0.0
    transfer_expenses: float | None = None
    stt_paid: bool | None = None
    fair_market_value: float | None = None
    net_gain: float | None = None
    broker: str | None = None


class BondsCapitalGains(ApiBaseModel):
    """Model for bonds and debentures capital gains."""
    bond_sale_id: int | None = None
    filing_id: int | None = None
    asset_type: str | None = None
    asset_description: str | None = None
    date_of_purchase: date | None = None
    date_of_sale: date | None = None
    total_purchase_price: float = 0.0
    total_sale_price: float = 0.0
    transfer_expenses: float | None = None
    net_gain: float | None = None
    broker: str | None = None

    @property
    def bond_type(self) -> str | None:
        return self.asset_type


class MutualFundsCapitalGains(ApiBaseModel):
    """Model for mutual funds capital gains."""
    mutual_fund_sale_id: int | None = None
    filing_id: int | None = None
    equity_type: str | None = None
    date_of_sale: date | None = None
    date_of_purchase: date | None = None
    description_of_asset_sold: str | None = None
    total_sale_price: float = 0.0
    total_purchase_price: float = 0.0
    transfer_expenses: float | None = None
    stt_paid: bool | None = None
    fair_market_value: float | None = None
    net_gain: float | None = None
    broker: str | None = None


class RsusCapitalGains(ApiBaseModel):
    """Model for RSU/Stock Options capital gains."""
    rsu_sale_id: int | None = None
    filing_id: int | None = None
    share_type: str | None = None
    description_of_asset_sold: str | None = None
    date_of_purchase: date | None = None
    date_of_sale: date | None = None
    total_purchase_price: float = 0.0
    total_sale_price: float = 0.0
    transfer_expenses: float | None = None
    fair_market_value: float | None = None
    net_gain: float | None = None
    broker: str | None = None
    stt_paid: bool | None = None


class CapitalGainsSecuritiesModel(ApiBaseModel):
    """Wrapper model for all securities capital gains types."""
    filing_id: int | None = None
    stocks: Optional[List[StocksCapitalGains]] = None
    bonds: Optional[List[BondsCapitalGains]] = None
    mutual_funds: Optional[List[MutualFundsCapitalGains]] = None
    rsus: Optional[List[RsusCapitalGains]] = None

    # Calculated totals
    stocks_count: int = 0
    stocks_total: float = 0.0
    bonds_count: int = 0
    bonds_total: float = 0.0
    mutual_funds_count: int = 0
    mutual_funds_total: float = 0.0
    rsus_count: int = 0
    rsus_total: float = 0.0
    total_net_gain: float = 0.0
