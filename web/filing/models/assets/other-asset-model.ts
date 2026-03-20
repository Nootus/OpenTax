/**
 * Other Asset Model - For jewellery/bullion, vehicles, artwork
 * Backend table: al_other_assets
 * API returns camelCase field names
 */

export interface OtherAsset {
  otherAssetId?: number | null
  filingId: number
  jewelleryBullion?: number   // defaults to 0.0
  vehicles?: number           // defaults to 0.0
  artwork?: number            // defaults to 0.0
  createdAt?: string | null
  updatedAt?: string | null
}

/**
 * API Response types for Other Assets
 */
export interface OtherAssetResponse {
  data: OtherAsset
  message?: string
}

export interface OtherAssetListResponse {
  data: OtherAsset[]
  message?: string
}
