/**
 * Deduction 80GGC Summary Interface
 * Based on models/summary/deduction_80ggc_summary.py
 */
export interface Deduction80GGCSummaryModel {
  deductionId: number
  doneeName: string | null
  politicalPartyName: string | null
  transactionId: string | null
  totalContribution: number
}

