/**
 * Deemed Capital Gains Model - UI model + re-exports
 * 
 * Standalone model for the capitalDeemed widget.
 * API: capitalDeemedApi (capital-deemed-api.ts)
 * Widget: DeemedCapitalGainsWidget.tsx
 * 
 * Imports from individual table models:
 * - deemed-capital-gains-base-model: DeemedCapitalGainsBase (deemed_capital_gains table)
 * - deemed-stcg-model: DeemedStcgDetails (deemed_stcg_details table)
 * - deemed-ltcg-model: DeemedLtcgDetails (deemed_ltcg_details table)
 * - deemed-capital-gains-wrapper-model: DeemedCapitalGainsWrapper (POST payload)
 */

import type { DeemedCapitalGainsBase } from './deemed-capital-gains-base-model'
import type { DeemedStcgDetails, DeemedSTCG } from './deemed-stcg-model'
import type { DeemedLtcgDetails, DeemedLTCG } from './deemed-ltcg-model'

/**
 * UI-facing model used for AppContext / filingSummary cache.
 * This combines the wrapper response with summary data.
 */
export interface DeemedCapitalGainsModel {
  filingId?: number | null
  
  // Base deemed gains records
  baseGains?: DeemedCapitalGainsBase[] | null
  
  // Deemed STCG detail records
  stcgDetails?: DeemedStcgDetails[] | null
  
  // Deemed LTCG detail records
  ltcgDetails?: DeemedLtcgDetails[] | null
  
  // Summary records
  summaries?: DeemedPropertySummary[] | null
  
  // Calculated fields from backend
  baseGainsCount?: number
  stcgDetailsCount?: number
  ltcgDetailsCount?: number
  totalStcgDeemed?: number
  totalLtcgDeemed?: number
  totalDeemedGains?: number
  totalUnutilizedGain?: number
  totalAmountUtilizedFromCgas?: number
  totalAmountNotUtilized?: number
}

/**
 * Summary entry for a single deemed capital gain record
 * Backend model: DeemedPropertySummary (deemed_summary_model.py)
 */
export interface DeemedPropertySummary {
  deemedGainId: number
  deemedStcgId?: number | null
  deemedLtcgId?: number | null
  filingId: number
  capitalGainType: string          // "stcg" or "ltcg"
  deemedDescription?: string | null
  totalDeemed: number
}

/**
 * Summary model for deemed capital gains
 * Backend model: DeemedSummaryModel (deemed_summary_model.py)
 */
export interface DeemedSummaryResponse {
  filingId: number
  entries: DeemedPropertySummary[]
  totalGain: number
}

// Re-export the combined view types for UI usage
export type { DeemedSTCG, DeemedLTCG }
