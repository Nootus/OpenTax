/**
 * Immovable Asset Model - For real estate properties and land
 */

export interface ImmovableAsset {
  assetId?: number | null
  filingId: number
  propertyDescription: string
  purchaseCost: number
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  country: string
  pinCode: string
  createdAt?: Date | null
  updatedAt?: Date | null
}

/**
 * Immovable Asset Property Summary - Used in summary views
 */
export interface ImmovableAssetPropertySummary {
  immovableAssetId: number
  filingId: number
  propertyDescription?: string | null
  purchaseCost: number
  city?: string | null
  state?: string | null
  country?: string | null
}

/**
 * Immovable Asset Summary Model - Contains all assets and totals
 */
export interface ImmovableAssetSummaryModel {
  filingId: number
  assets: ImmovableAssetPropertySummary[]
  totalPurchaseCost: number
}

/**
 * API Response types for Immovable Assets
 */
export interface ImmovableAssetResponse {
  data: ImmovableAsset
  message?: string
}

export interface ImmovableAssetListResponse {
  data: ImmovableAsset[]
  message?: string
}

export interface ImmovableAssetSummaryResponse {
  data: ImmovableAssetSummaryModel
  message?: string
}
