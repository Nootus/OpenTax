/**
 * Investment Firm LLP AOP summary and payload types.
 * Extracted from investment-firm-llp-aop-api for use in widgets and API layer.
 */

export interface InvestmentFirmCreatePayload {
  filingId: number
  firmName: string
  firmPan: string
  investmentAmount?: number
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  country: string
  pinCode: string
}

export interface InvestmentFirmUpdatePayload extends InvestmentFirmCreatePayload {}

export interface InvestmentFirmPropertySummary {
  investmentId: number
  filingId: number
  firmName?: string | null
  firmPan?: string | null
  investmentAmount: number
  city?: string | null
  state?: string | null
  country?: string | null
}

export interface InvestmentFirmSummaryModel {
  filingId: number
  assets: InvestmentFirmPropertySummary[]
  totalInvestmentAmount: number
}
