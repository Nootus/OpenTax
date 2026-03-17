/**
 * Liability Model - For liabilities related to assets
 */

export interface Liability {
  liabilityId?: number | null
  filingId?: number | null
  type?: string | null  // Type: mortgage, car_loan, personal_loan, home_loan, other
  description?: string | null
  amount?: number | null
  createdAt?: string | null
  updatedAt?: string | null
}

/**
 * API Response types for Liabilities
 */
export interface LiabilityResponse {
  data: Liability
  message?: string
}

export interface LiabilityListResponse {
  data: Liability[]
  message?: string
}
