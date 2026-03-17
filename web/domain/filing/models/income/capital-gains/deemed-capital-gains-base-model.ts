/**
 * Deemed Capital Gains Base Model
 * Maps to deemed_capital_gains table
 * Contains common fields for both STCG and LTCG deemed gains
 *
 * Backend model: DeemedCapitalGains (deemed_capital_gains_base_model.py)
 * Fields: deemed_gain_id, filing_id, capital_gain_type, unutilized_capital_gain,
 *         prev_year_transfer, deduction_section_claimed, new_asset_year,
 *         deemed_description, amount_utilized_from_cgas, amount_not_utilized
 */

export interface DeemedCapitalGainsBase {
  deemedGainId?: number | null
  tempId?: string
  filingId: number | null
  capitalGainType: 'stcg' | 'ltcg'
  
  // Common fields for both STCG and LTCG
  unutilizedCapitalGain?: number | null
  prevYearTransfer?: string | null
  deductionSectionClaimed?: string | null
  newAssetYear?: number | null                   // Year of new asset acquisition
  amountUtilizedFromCgas?: number | null         // Capital Gains Account Scheme
  amountNotUtilized?: number | null
  deemedDescription?: string | null
}
