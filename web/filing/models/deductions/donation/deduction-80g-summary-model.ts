/**
 * Deduction 80G Summary Interface
 * Based on models/summary/deduction_80g_summary.py
 */
export interface Deduction80GSummaryModel {
  deductionId: number
  doneeName: string | null
  doneePan: string | null
  donationType: string | null
  donationAmount: number
}

