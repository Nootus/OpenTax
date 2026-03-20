/**
 * Investment in Partnership Firm / LLP / AOP Model
 */

export interface PartnershipInvestment {
  investmentId?: number | null
  filingId?: number | null
  firmName?: string | null
  firmPan?: string | null
  investmentAmount?: number | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  pinCode?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

/**
 * API Response types for Partnership Investments
 */
export interface PartnershipInvestmentResponse {
  data: PartnershipInvestment
  message?: string
}

export interface PartnershipInvestmentListResponse {
  data: PartnershipInvestment[]
  message?: string
}
