/**
 * Deduction 80EEA Summary Interface
 * Based on models/summary/deduction_80ee_summary.py
 */
export interface Deduction80EEASummaryModel {
  deductionId: number
  lenderType: string | null
  lenderName: string | null
  loanAccountNumber: string | null
  totalLoanAmount: number
  interestOnLoan: number
}

