/**
 * Deduction 80EE Summary Interface
 * Based on models/summary/deduction_80ee_summary.py
 */
export interface Deduction80EESummaryModel {
  deductionId: number
  lenderType: string | null
  lenderName: string | null
  loanAccountNumber: string | null
  totalLoanAmount: number
  interestOnLoan: number
}

