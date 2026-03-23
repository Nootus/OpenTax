/**
 * Deduction 80QQB Interface - Royalty Income from Books
 * Mirrors: section_80qqb in FilingModel
 */

export interface Deduction80QQBModel {
  deductionId?: number | null
  filingId: number
  royaltyAmount: number
}

