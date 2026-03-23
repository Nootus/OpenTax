/**
 * Deemed STCG Details Model
 * Maps to deemed_stcg_details table
 * 
 * Used by capitalDeemed widget (DeemedCapitalGainsWidget.tsx)
 * API: capitalDeemedApi (capital-deemed-api.ts)
 * 
 * Backend model: DeemedStcgDetails (deemed_stcg_details_model.py)
 * Fields: deemed_stcg_id, deemed_gain_id, filing_id, amount_deemed_as_stcg, total_deemed_stcg
 */

export interface DeemedStcgDetails {
  deemedStcgId?: number | null
  tempId?: string
  filingId: number | null
  deemedGainId?: number | null                             // FK -> deemed_capital_gains.deemed_gain_id
  
  // STCG-specific fields
  amountDeemedAsStcg?: number | null
  totalDeemedStcg?: number | null
}

/**
 * Deemed STCG (Short-Term Capital Gains)
 * Combined view with base record and STCG-specific detail fields
 * Used for UI display and form handling
 */
export interface DeemedSTCG {
  deemedGainId?: number | null
  deemedStcgId?: number | null
  tempId?: string
  filingId: number | null
  capitalGainType: 'stcg'
  unutilizedCapitalGain?: number | null
  prevYearTransfer?: string | null
  deductionSectionClaimed?: string | null
  newAssetYear?: number | null
  amountUtilizedFromCgas?: number | null
  amountNotUtilized?: number | null
  deemedDescription?: string | null
  
  // STCG-specific fields
  amountDeemedAsStcg?: number | null
  totalDeemedStcg?: number | null
}
