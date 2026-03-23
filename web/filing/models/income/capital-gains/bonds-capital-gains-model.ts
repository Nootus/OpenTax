/**
 * Bonds/Debentures Capital Gains
 * Represents bonds and debentures sales
 */
export interface BondsCapitalGains {
  bond_sale_id?: number | null
  filing_id?: number
  asset_type: string
  asset_description?: string | null
  date_of_purchase: Date | string
  date_of_sale: Date | string
  total_purchase_price: number
  total_sale_price: number
  transfer_expenses?: number | null
  net_gain?: number | null
  broker?: string | null
  gain_type?: string | null
}
