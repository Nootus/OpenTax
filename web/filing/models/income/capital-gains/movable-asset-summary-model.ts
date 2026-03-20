/**
 * Movable Asset Summary Model - Lightweight summary
 * Maps to the MovableAssetSummaryModel / MovableAssetPropertySummary on the backend
 *
 * Used for list views where only key fields are needed.
 * Analogous to ForeignAssetSummaryModel / ForeignAssetSummaryItem for foreign assets.
 *
 * API: capitalMovableApi (capital-movable-api.ts)
 * Widget: MovableAssetsWidget.tsx
 */

/** Per-asset summary item (lightweight, for list views) */
export interface MovableAssetSummaryItem {
  movableSaleId: number
  filingId: number
  assetDescription?: string | null
  netGain?: number | null
  totalSalePrice?: number | null
  dateOfSale?: string | null
  dateOfPurchase?: string | null
  gainType?: string | null              // STCG or LTCG
  broker?: string | null
}

/** Collection summary with per-asset items and total */
export interface MovableAssetSummaryModel {
  filingId: number
  assets: MovableAssetSummaryItem[]
  totalGain: number
}
