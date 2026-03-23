/**
 * Stock Options / RSUs Capital Gains
 * Represents stock options and RSUs sales
 */
export interface RsusCapitalGains {
  rsu_sale_id?: number | null
  filing_id?: number
  share_type: string
  description_of_asset_sold?: string | null
  date_of_purchase: Date | string
  date_of_sale: Date | string
  total_purchase_price: number
  total_sale_price: number
  transfer_expenses?: number | null
  stt_paid?: boolean | null
  fair_market_value?: number | null
  net_gain?: number | null
  broker?: string | null
}
