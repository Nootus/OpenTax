

export interface Deduction80GGAModel {
  deductionId?: number | null
  filingId: number | null
  clauseUnderDonation?: string | null
  doneeName: string
  donationAmountCash: number
  donationAmountNonCash: number
  totalDonationAmount: number
  doneePan?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
}

/**
 * Widget Master Data Interface for 80GGA
 */
export interface Deduction80GGAMasterData {
  clauseTypes?: { value: string; label: string }[]
  states?: { value: string; label: string }[]
}

