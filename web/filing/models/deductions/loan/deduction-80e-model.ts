/**
 * Deduction 80E Interface - Education Loan
 * Mirrors: section_80e in FilingModel
 */

export interface Deduction80EModel {
  deductionId?: number | null
  filingId: number | null
  lenderType: string
  lenderName: string
  loanAccountNumber?: string | null
  loanSanctionDate?: Date | null
  totalLoanAmount?: number | null
  loanOutstanding?: number | null
  interestOnLoan: number
}

