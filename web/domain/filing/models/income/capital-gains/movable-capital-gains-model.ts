/**
 * Movable Asset Sale Transaction Model
 * Maps to movable_asset_sale_transaction table
 * 
 * Standalone model for the capitalMovable widget.
 * API: capitalMovableApi (capital-movable-api.ts)
 * Widget: MovableAssetsWidget.tsx
 * 
 * Represents sales of movable assets (gold, silver, crypto, etc.)
 * 
 * Backend (Python) uses snake_case; ApiBaseModel converts to camelCase for JSON.
 * Frontend uses camelCase throughout.
 */

import type { MovableAssetCostImprovement } from './movable-asset-cost-improvement-model'

export interface MovableCapitalGains {
  movableSaleId?: number | null       // PK - auto-generated, optional for new records
  tempId?: string                     // Client-side temp ID for new unsaved entries
  filingId: number | null             // Required FK to filing
  assetCategory?: string | null       // e.g., "gold", "silver", "crypto", "other"
  assetDescription?: string | null    // Detailed description of the asset
  dateOfSale?: Date | string | null   // ISO date: "YYYY-MM-DD"
  dateOfPurchase?: Date | string | null // ISO date: "YYYY-MM-DD"
  totalSalePrice?: number | null      // Sale proceeds
  totalPurchasePrice?: number | null   // Purchase cost
  transferExpenses?: number | null     // Brokerage, legal fees, etc.
  netGain?: number | null              // Calculated: salePrice - (purchasePrice + transferExpenses)
  gainType?: string | null             // STCG (Short-term Capital Gain) or LTCG (Long-term Capital Gain)
  broker?: string | null                // Broker/Intermediary name
  // Embedded cost improvements for this asset (camelCase from backend ApiBaseModel)
  improvementsList?: MovableAssetCostImprovement[] | null
}
