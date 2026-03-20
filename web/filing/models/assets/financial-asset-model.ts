/**
 * Financial Asset Model - For deposits, shares, securities, insurance, cash, and loans
 * Backend table: al_financial_assets
 * API returns camelCase field names
 */

export interface FinancialAsset {
  financialAssetId?: number | null
  filingId: number
  depositsInBank?: number         // defaults to 0.0
  sharesAndSecurities?: number    // defaults to 0.0
  insurancePolicies?: number       // defaults to 0.0
  cashInHand?: number             // defaults to 0.0
  loansAndAdvancesGiven?: number  // defaults to 0.0
  createdAt?: string | null
  updatedAt?: string | null
}

/**
 * API Response types for Financial Assets
 */
export interface FinancialAssetResponse {
  data: FinancialAsset
  message?: string
}

export interface FinancialAssetListResponse {
  data: FinancialAsset[]
  message?: string
}
