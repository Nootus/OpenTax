/**
 * Deduction 80GGA Summary Interface
 * Based on models/summary/deduction_80gga_summary.py
 */
export interface Deduction80GGASummaryModel {
  deductionId: number
  doneeName: string | null
  doneePan: string | null
  clauseUnderDonation: string | null
  totalDonationAmount: number
}

