/**
 * Lottery Online Gaming Wrapper Model - Aggregated data for all lottery and gaming income types
 * Includes lottery, online gaming, and invoice discounting income with aggregated totals
 */

import type { LotteryGiftsIncome } from './lottery-gifts-model'
import type { OnlineGamingIncome } from './online-gaming-model'
import type { InvoiceDiscountingIncome } from './invoice-discounting-model'
import type { LotteryGiftsSummaryModel } from './lottery-gifts-summary-model'
import type { OnlineGamingSummaryModel } from './online-gaming-summary-model'
import type { InvoiceDiscountingSummaryModel } from './invoice-discounting-summary-model'

/**
 * Wrapper model for lottery, online gaming, and invoice discounting income types
 * Used by FilingSummary to store aggregated transaction and summary data.
 * Contains both individual transaction arrays and pre-calculated totals from backend.
 * Used by widgets and display components to render aggregated income across all gaming and lottery sources.
 * Field names use camelCase to match the actual API JSON response.
 */
export interface LotteryOnlineGamingAggregatedModel {
  filingId: number
  lotteryIncome?: LotteryGiftsIncome[] | null
  onlineGamingIncome?: OnlineGamingIncome[] | null
  invoiceDiscountingIncome?: InvoiceDiscountingIncome[] | null
  lotteryCount?: number
  lotteryTotal?: number
  onlineGamingCount?: number
  onlineGamingTotal?: number
  invoiceDiscountingCount?: number
  invoiceDiscountingTotal?: number
  combinedIncome?: number
}
