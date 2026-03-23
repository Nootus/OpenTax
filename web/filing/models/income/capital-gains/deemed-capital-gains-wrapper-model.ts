/**
 * Deemed Capital Gains Wrapper Model
 * 
 * Maps exactly to backend: DeemedCapitalGainsWrapper (deemed_capital_gains_wrapper_model.py)
 * Used as the POST payload body for:
 *   POST /api/deemed-capital-gains/stcg  - Save STCG entry
 *   POST /api/deemed-capital-gains/ltcg  - Save LTCG entry
 *
 * Backend expects: wrapper with ONE base_gains entry + ONE detail entry (stcg_details or ltcg_details)
 *
 * Related backend models:
 *   - DeemedCapitalGains      (deemed_capital_gains_base_model.py)  -> base_gains[]
 *   - DeemedStcgDetails       (deemed_stcg_details_model.py)       -> stcg_details[]
 *   - DeemedLtcgDetails       (deemed_ltcg_details_model.py)       -> ltcg_details[]
 *   - DeemedPropertySummary   (deemed_summary_model.py)            -> summaries[]
 */

import type { DeemedPropertySummary } from './deemed-capital-gains-model'

// ==================== Base gains payload (snake_case for API) ====================

/**
 * Base gains record sent to backend.
 * Maps to: deemed_capital_gains table
 */
export interface DeemedBaseGainsPayload {
  deemed_gain_id?: number | null       // null for new, present for update
  filing_id: number
  capital_gain_type: 'stcg' | 'ltcg'
  unutilized_capital_gain: number
  prev_year_transfer: string
  deduction_section_claimed: string
  new_asset_year: number
  deemed_description: string
  amount_utilized_from_cgas: number
  amount_not_utilized: number
}

// ==================== STCG details payload (snake_case for API) ====================

/**
 * STCG detail record sent to backend.
 * Maps to: deemed_stcg_details table
 */
export interface DeemedStcgPayload {
  deemed_stcg_id?: number | null       // null for new, present for update
  deemed_gain_id?: number | null       // FK, set by backend on insert
  filing_id: number
  amount_deemed_as_stcg: number
  total_deemed_stcg: number
}

// ==================== LTCG details payload (snake_case for API) ====================

/**
 * LTCG detail record sent to backend.
 * Maps to: deemed_ltcg_details table
 */
export interface DeemedLtcgPayload {
  deemed_ltcg_id?: number | null       // null for new, present for update
  deemed_gain_id?: number | null       // FK, set by backend on insert
  filing_id: number

  // Base fields now also accepted on DeemedLtcgDetails
  capital_gain_type?: 'ltcg'
  unutilized_capital_gain?: number
  prev_year_transfer?: string
  deduction_section_claimed?: string
  new_asset_year?: number
  deemed_description?: string
  amount_utilized_from_cgas?: number
  amount_not_utilized?: number

  regulatory_cutoff_date?: string | null   // ISO date "YYYY-MM-DD"
  withdrawal_after_cutoff: boolean
  amount_deemed_before_cutoff: number
  amount_deemed_after_cutoff: number
  total_deemed_ltcg: number
}

// ==================== Wrapper payload ====================

/**
 * Full wrapper payload sent to POST /stcg or POST /ltcg.
 * Backend: DeemedCapitalGainsWrapper
 *
 * For STCG save: send 1 base_gains entry + 1 stcg_details entry (ltcg_details = [])
 * For LTCG save: send 1 base_gains entry + 1 ltcg_details entry (stcg_details = [])
 */
export interface DeemedCapitalGainsWrapperPayload {
  filing_id: number
  base_gains: DeemedBaseGainsPayload[]
  stcg_details: DeemedStcgPayload[]
  ltcg_details: DeemedLtcgPayload[]
  summaries?: DeemedPropertySummary[]
  
  // Read-only calculated fields (ignored by backend on POST, included in GET)
  base_gains_count?: number
  stcg_details_count?: number
  ltcg_details_count?: number
  total_stcg_deemed?: number
  total_ltcg_deemed?: number
  total_deemed_gains?: number
  total_unutilized_gain?: number
  total_amount_utilized_from_cgas?: number
  total_amount_not_utilized?: number
}
