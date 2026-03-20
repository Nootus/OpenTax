/**
 * Movable Asset Cost Improvement Model
 * Maps to movable_asset_cost_improvement table
 * 
 * Used by capitalMovable widget (MovableAssetsWidget.tsx)
 * API: capitalMovableApi (capital-movable-api.ts)
 * 
 * Represents cost improvements linked to movable asset transactions.
 * Backend (Python) uses snake_case; ApiBaseModel converts to camelCase for JSON.
 */

export interface MovableAssetCostImprovement {
  improvementId?: number | null           // PK - auto-generated, optional for new records
  tempId?: string                         // Client-side temp ID for new unsaved records
  filingId: number                        // Required FK to filing, default 0
  movableSaleId: number                   // Required FK to parent asset, default 0
  improvementDescription: string          // Required, default ""
  improvementAmount: number               // Required, default 0.0
  improvementDate?: Date | string | null  // Optional ISO date: "YYYY-MM-DD"
}
