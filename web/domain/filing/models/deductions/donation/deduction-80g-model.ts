/**
 * Deduction 80G Interface - Donations to Charitable Organizations
 * Mirrors: section_80g in FilingModel
 */

export interface Deduction80GModel {
  deductionId?: number | null
  filingId: number | null
  doneeName: string
  doneePan?: string | null
  donationType?: string | null
  donationAmountCash: number
  donationAmountNonCash: number
  donationAmount: number
  limitOnDeduction?: string | null
  qualifyingPercentage?: string | null
  approvalReferenceNumber?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
}


/**
 * Widget Master Data Interface for 80G
 */
export interface Deduction80GMasterData {
  donationTypes?: { value: string; label: string; pan?: string; fullName?: string }[]
  qualifyingPercentages?: { value: string; label: string }[]
  limitOnDeductions?: { value: string; label: string }[]
  states?: { value: string; label: string }[]
}

