/**
 * Deduction 80E Summary Interface
 * Based on models/summary/deduction_80e_summary.py
 */
export interface Deduction80ESummaryModel {
  deductionId: number
  lenderType: string | null
  lenderName: string | null
  loanAccountNumber: string | null
  totalLoanAmount: number
  interestOnLoan: number
}

