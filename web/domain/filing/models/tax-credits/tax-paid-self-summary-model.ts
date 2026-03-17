/**
 * Tax Paid Self Summary Interface
 * Based on models/summary/tax_paid_self_summary.py
 */
export interface TaxPaidSelfSummaryModel {
  taxPaidId: number
  challanNumber: string | null
  bsrCode: string | null
  taxType: string | null
  taxPaidAmount: number
}

