/**
 * Deduction 80DD Summary Interface
 * Based on models/summary/deduction_80dd_summary.py
 */
export interface Deduction80DDSummaryModel {
  deductionId: number
  dependantName: string | null
  disabilityType: string | null
  natureOfDisability: string | null
  expenditureIncurred: number
}

