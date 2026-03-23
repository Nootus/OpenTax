/**
 * Deduction 80CCC Summary Interface
 * Based on models/summary/deduction_80ccc_summary.py
 */
export interface Deduction80CCCSummaryModel {
  deductionId: number
  pranNumber: string | null
  amount: number
  action?: string
}

