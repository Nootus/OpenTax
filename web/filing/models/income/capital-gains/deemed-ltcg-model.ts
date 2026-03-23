/**
 * Deemed LTCG Details Model
 * Maps to deemed_ltcg_details table
 * 
 * Used by capitalDeemed widget (DeemedCapitalGainsWidget.tsx)
 * API: capitalDeemedApi (capital-deemed-api.ts)
 * 
 * Backend model: DeemedLtcgDetails (deemed_ltcg_details_model.py)
 * Fields: deemed_ltcg_id, deemed_gain_id, filing_id, regulatory_cutoff_date,
 *         withdrawal_after_cutoff, amount_deemed_before_cutoff, amount_deemed_after_cutoff, total_deemed_ltcg
 */

export interface DeemedLtcgDetails {
  deemedLtcgId?: number | null
  tempId?: string
  filingId: number | null
  deemedGainId?: number | null                             // FK -> deemed_capital_gains.deemed_gain_id

  // Base fields now included in backend DeemedLtcgDetails
  capitalGainType?: 'ltcg'
  unutilizedCapitalGain?: number | null
  prevYearTransfer?: string | null
  deductionSectionClaimed?: string | null
  newAssetYear?: number | null
  deemedDescription?: string | null
  amountUtilizedFromCgas?: number | null
  amountNotUtilized?: number | null
  
  // LTCG-specific fields
  amountDeemedBeforeCutoff?: number | null
  amountDeemedAfterCutoff?: number | null
  totalDeemedLtcg?: number | null
}

/**
 * Deemed LTCG (Long-Term Capital Gains)
 * Combined view with base record and LTCG-specific detail fields
 * Used for UI display and form handling
 */
export interface DeemedLTCG {
  deemedGainId?: number | null
  deemedLtcgId?: number | null
  tempId?: string
  filingId: number | null
  capitalGainType: 'ltcg'
  unutilizedCapitalGain?: number | null
  prevYearTransfer?: string | null
  deductionSectionClaimed?: string | null
  newAssetYear?: number | null
  amountUtilizedFromCgas?: number | null
  amountNotUtilized?: number | null
  deemedDescription?: string | null
  
  // LTCG-specific fields
  amountDeemedBeforeCutoff?: number | null
  amountDeemedAfterCutoff?: number | null
  totalDeemedLtcg?: number | null
}
