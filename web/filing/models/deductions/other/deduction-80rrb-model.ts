/**
 * Deduction 80RRB Interface - Royalty on Patents
 * Mirrors: section_80rrb in FilingModel
 */

export interface Deduction80RRBModel {
  deductionId?: number | null
  filingId: number
  royaltyAmount: number
}

