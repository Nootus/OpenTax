/**
 * Movable Capital Gains Wrapper Model
 * Combines movable assets summary with calculated totals
 * 
 * Used by capitalMovable widget context and filing-model aggregation.
 * Widget: MovableAssetsWidget.tsx
 * 
 * Backend GET response shape: { filingId, assets: [...], totalGain }
 */

import type { MovableCapitalGains } from './movable-capital-gains-model'

/**
 * Wrapper model for movable capital gains stored in AppContext / FilingSummary.
 * The `assets` array holds either full MovableCapitalGains entries (from detail fetch)
 * or lightweight summary items (from list fetch).
 */
export interface MovableCapitalGainsWithImprovements {
  filingId?: number
  
  // Movable asset entries
  assets?: MovableCapitalGains[] | null
  
  // Calculated fields
  movableCount?: number
  movableTotal?: number
  totalGain?: number
}
