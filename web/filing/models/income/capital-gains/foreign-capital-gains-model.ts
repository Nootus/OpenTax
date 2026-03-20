/**
 * Foreign Capital Gains Model
 * Maps to foreign_asset_sale_transaction table
 * 
 * Standalone model for the capitalForeign widget.
 * API: capitalForeignApi (capital-foreign-api.ts)
 * Widget: ForeignAssetsWidget.tsx
 */

export interface ForeignCapitalGains {
  foreignSaleId?: number | null
  filingId: number | null
  assetType?: 'foreign'
  assetDescription?: string | null
  dateOfSale?: Date | string | null
  dateOfPurchase?: Date | string | null
  totalSalePrice?: number | null
  totalPurchasePrice?: number | null
  transferExpenses?: number | null
  netGain?: number | null
  gainType?: string | null             // STCG (Short-term Capital Gain) or LTCG (Long-term Capital Gain)
  broker?: string | null
}
