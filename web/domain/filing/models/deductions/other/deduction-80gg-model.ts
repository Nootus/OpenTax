/**
 * Deduction 80GG Interface - Rent Paid (No HRA)
 * Mirrors: section_80gg in FilingModel
 */

export interface Deduction80GGModel {
  deductionId?: number | null
  filingId: number | null
  rentPaidAmount: number
  acknowledgementNo10Ba?: string | null
} 

