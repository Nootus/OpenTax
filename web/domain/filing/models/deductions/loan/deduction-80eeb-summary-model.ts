/**
 * Deduction 80EEB Summary Interface
 * Based on models/summary/deduction_80eeb_summary.py
 */
export interface Deduction80EEBSummaryModel {
  deductionId: number
  vehicleMakeModel: string | null
  vehicleRegistrationNumber: string | null
  lenderType: string | null
  lenderName: string | null
  loanAccountNumber: string | null
  totalLoanAmount: number
  interestOnLoan: number
}

