/**
 * Summary model for Online Gaming Income
 * Lightweight structure for list/table views
 * Maps to backend OnlineGamingSummary
 */
export interface OnlineGamingSummary {
  onlineGamingId: number
  filingId: number
  platformName?: string | null
  description?: string | null
  amount?: number | null
  transactionDate?: string | null
}

/**
 * Summary wrapper model for list view
 * Maps to backend OnlineGamingSummaryModel
 */
export interface OnlineGamingSummaryModel {
  filingId: number
  entries: OnlineGamingSummary[]
  totalIncome: number
}
