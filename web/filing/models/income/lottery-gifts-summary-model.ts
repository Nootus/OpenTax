/**
 * Summary model for Lottery Gifts Income
 * Lightweight structure for list/table views
 * Maps to backend LotteryGiftsSummary
 */
export interface LotteryGiftsSummary {
  lotteryGiftId: number
  filingId: number
  source?: string | null
  description?: string | null
  amount: number
  receivedDate?: string | null
}

/**
 * Summary wrapper model for list view
 * Maps to backend LotteryGiftsSummaryModel
 */
export interface LotteryGiftsSummaryModel {
  filingId: number
  entries: LotteryGiftsSummary[]
  totalIncome: number
}
