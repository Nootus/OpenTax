/**
 * Deduction 80GGC Interface - Donations to Political Parties
 * Mirrors: section_80ggc in FilingModel
 */

export interface Deduction80GGCModel {
  deductionId?: number | null
  filingId: number | null
  doneeName?: string | null
  politicalPartyName?: string | null
  transactionId?: string | null
  donorBankIfsc?: string | null
  dateOfDonation?: Date | null
  contributionAmountCash: number
  contributionAmountNonCash: number
  totalContribution: number
}




