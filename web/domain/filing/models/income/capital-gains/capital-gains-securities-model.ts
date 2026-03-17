/**
 * Capital Gains Securities Model - Wrapper for all securities capital gains types
 * Includes stocks, bonds, debentures, and mutual funds with aggregated totals
 */

import type { StocksCapitalGains } from './stocks-capital-gains-model'
import type { BondsCapitalGains } from './bonds-capital-gains-model'
import type { MutualFundsCapitalGains } from './mutual-funds-capital-gains-model'
import type { RsusCapitalGains } from './rsus-capital-gains-model'

/**
 * Master data for capital gains securities dropdowns (returned by API alongside data)
 */
export interface CapitalGainsMasterData {
  equitySharesTypes?: Array<{ value: string; label: string }>
  mutualFundEquityTypes?: Array<{ value: string; label: string }>
  rsuTypes?: Array<{ value: string; label: string }>
  debentureTypes?: Array<{ value: string; label: string }>
}

/**
 * Wrapper model for all securities capital gains types
 * Includes stocks, bonds, mutual funds, and RSUs with pre-calculated totals from backend.
 * Field names use camelCase to match the actual API JSON response.
 */
export interface CapitalGainsSecuritiesModel {
  filingId: number
  stocks?: StocksCapitalGains[] | null
  bonds?: BondsCapitalGains[] | null
  mutualFunds?: MutualFundsCapitalGains[] | null
  rsus?: RsusCapitalGains[] | null
  stocksCount?: number
  stocksTotal?: number
  bondsCount?: number
  bondsTotal?: number
  mutualFundsCount?: number
  mutualFundsTotal?: number
  rsusCount?: number
  rsusTotal?: number
  totalNetGain?: number
}
