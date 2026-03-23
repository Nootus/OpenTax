/**
 * Capital Gains (Securities) Summary Model
 * Field names use camelCase to match the actual API JSON response.
 */

export interface CapitalGainsSecuritiesSummary {
  filingId?: number
  stocksCount: number
  stocksTotal: number
  bondsCount: number
  bondsTotal: number
  mutualFundsCount: number
  mutualFundsTotal: number
  rsusCount: number
  rsusTotal: number
  totalNetGain: number
  stcgCount?: number
  stcgTotal?: number
  ltcgCount?: number
  ltcgTotal?: number
}
