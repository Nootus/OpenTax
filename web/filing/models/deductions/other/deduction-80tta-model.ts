/**
 * Deduction 80TTA Interface - Interest on Savings Account
 * Mirrors: section_80tta in FilingModel
 */

export interface Deduction80TTAModel {
  deductionId?: number | null
  filingId: number | null
  interestAmount: number
}

