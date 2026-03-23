/**
 * Deduction 80TTB Interface - Interest on Deposits (Senior Citizens)
 * Mirrors: section_80ttb in FilingModel
 */

export interface Deduction80TTBModel {
  deductionId?: number | null
  filingId: number | null
  interestAmount: number
}

