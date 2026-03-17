/**
 * Deduction 80DDB Summary Interface
 * Based on models/summary/deduction_80ddb_summary.py
 */
export interface Deduction80DDBSummaryModel {
  deductionId: number
  treatmentFor: string | null
  seniorCitizenType: string | null
  disease: string | null
  expenditureIncurred: number
}

