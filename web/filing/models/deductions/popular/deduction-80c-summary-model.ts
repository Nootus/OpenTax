/**
 * Deduction 80C Summary Interface
 * Based on models/summary/deduction_80c_summary.py
 */
export interface Deduction80CSummaryModel {
  deductionId: number
  description: string | null
  policyNumber: string | null
  amount: number
}

