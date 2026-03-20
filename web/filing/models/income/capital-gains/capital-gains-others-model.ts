/**
 * Capital Gains Others Model - Grouping for non-securities, non-real-estate capital gains
 * 
 * This model groups capital gains from:
 * - Foreign assets (separate widget: capitalForeign)
 * - Movable assets (separate widget: capitalMovable) 
 * - Deemed gains STCG/LTCG (separate widget: capitalDeemed)
 * 
 * Each type has its own standalone widget and API for independent management.
 * This model is used in FilingModel to aggregate data for display purposes.
 */

import type { ForeignCapitalGains } from '@/domain/filing/widgets/income/capital-gains/capital-foreign/models/foreign-capital-gains-model'
import type { MovableCapitalGainsWithImprovements } from '../capital-movable/models/movable-capital-gains-wrapper-model'
import type { DeemedCapitalGainsModel, DeemedSTCG, DeemedLTCG } from '../capital-deemed/models/deemed-capital-gains-model'

/**
 * Grouped model for foreign, movable, and deemed capital gains
 * Used for aggregating data in FilingModel summary
 */
export interface CapitalGainsOthersModel {
  filingId: number
  
  // Foreign assets
  foreign?: ForeignCapitalGains[] | null
  
  // Movable assets with nested improvements
  movable?: MovableCapitalGainsWithImprovements | null
  
  // Deemed gains - STCG and LTCG
  deemed?: DeemedCapitalGainsModel | null
  
  // Calculated totals (for display)
  foreignCount?: number
  foreignTotal?: number
  movableCount?: number
  movableTotal?: number
  deemedCount?: number
  deemedTotal?: number
  totalNetGain?: number
}

// Re-export types for convenience
export type {
  ForeignCapitalGains,
  MovableCapitalGainsWithImprovements,
  DeemedCapitalGainsModel,
  DeemedSTCG,
  DeemedLTCG
}
