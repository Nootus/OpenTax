/**
 * Foreign Asset Summary Model - Lightweight summary
 * Maps to the ForeignAssetSummaryModel on the backend
 *
 * Used for list views where only key fields are needed.
 */

export interface ForeignAssetSummaryItem {
  foreignSaleId: number
  filingId: number
  assetDescription?: string | null
  netGain?: number | null
  totalSalePrice?: number | null
  dateOfSale?: string | null
  dateOfPurchase?: string | null
  gainType?: string | null              // STCG or LTCG
  broker?: string | null
}

export interface ForeignAssetSummaryModel {
  filingId: number
  assets: ForeignAssetSummaryItem[]
  totalGain: number
}
