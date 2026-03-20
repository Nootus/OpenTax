/**
 * Lottery, Online Gaming & Invoice Discounting Income Models
 * Barrel export for all transaction, summary, and aggregated models
 *
 * Transaction models (for editing/detail views - minimal data fields only):
 * - lottery-gifts-model: LotteryGiftsIncome
 * - online-gaming-model: OnlineGamingIncome
 * - invoice-discounting-model: InvoiceDiscountingIncome
 *
 * Summary models (for display/list views - lightweight):
 * - lottery-gifts-summary-model: LotteryGiftsSummary, LotteryGiftsSummaryModel
 * - online-gaming-summary-model: OnlineGamingSummary, OnlineGamingSummaryModel
 * - invoice-discounting-summary-model: InvoiceDiscountingSummary, InvoiceDiscountingSummaryModel
 *
 * Aggregated model (combines all transaction and summary data):
 * - lottery-online-gaming-wrapper-model: LotteryOnlineGamingAggregatedModel
 *   Contains transaction arrays + pre-calculated counts and totals from backend
 *   Used by FilingSummary and display components
 */

// Re-export transaction models
export * from './lottery-gifts-model'
export * from './online-gaming-model'
export * from './invoice-discounting-model'

// Re-export summary models
export * from './lottery-gifts-summary-model'
export * from './online-gaming-summary-model'
export * from './invoice-discounting-summary-model'

// Re-export aggregated wrapper model
export * from './lottery-online-gaming-wrapper-model'
