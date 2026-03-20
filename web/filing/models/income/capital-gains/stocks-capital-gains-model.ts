/**
 * Stocks/Equities Capital Gains
 * Represents equity/share sales with STT tracking
 */
export interface StocksCapitalGains {
  stock_sale_id?: number | null
  filing_id?: number
  share_type: string
  date_of_sale: Date | string
  date_of_purchase: Date | string
  description_of_asset_sold?: string | null
  total_sale_price: number
  total_purchase_price: number
  transfer_expenses?: number | null
  stt_paid?: boolean | null
  fair_market_value?: number | null
  net_gain?: number | null
  gain_type?: string | null
  broker?: string | null
}
