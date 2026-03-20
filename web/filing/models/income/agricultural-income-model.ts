/**
 * Agricultural Income Model
 */

export interface AgriculturalLandDetailModel {
  landId?: number | null
  filingId: number
  incomeId?: number | null
  districtName?: string | null
  pincode?: string | null
  measurementAcres?: number | null
  ownershipStatus?: string | null
  waterSource?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface AgriculturalIncomeModel {
  incomeId?: number | null
  filingId: number
  grossReceipt?: number | null
  expenditure?: number | null
  unabsorbedLoss?: number | null
  netAgriculturalIncome?: number | null
  landDetails: AgriculturalLandDetailModel[]
  createdAt?: string | null
}
