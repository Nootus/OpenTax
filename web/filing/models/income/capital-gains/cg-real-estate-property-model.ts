/**
 * Main Capital Gains Real Estate Property model
 * Complete nested structure for API operations
 * Maps to backend RealEstateProperty
 */
import type { CgRealEstateAddress } from './cg-real-estate-address-model'
import type { CgRealEstateImprovement } from './cg-real-estate-improvement-model'
import type { CgRealEstateBuyerDetails } from './cg-real-estate-buyer-model'
import type { CgRealEstateBasicDetails } from './cg-real-estate-basic-details-model'
import type { CgRealEstateSummary, CgRealEstateSummaryModel, CgRealEstateModel } from './cg-real-estate-summary-model'

// Re-export all nested types for convenience
export type { CgRealEstateAddress } from './cg-real-estate-address-model'
export type { CgRealEstateImprovement } from './cg-real-estate-improvement-model'
export type { CgRealEstateBuyerDetails } from './cg-real-estate-buyer-model'
export type { CgRealEstateBasicDetails } from './cg-real-estate-basic-details-model'
export type { CgRealEstateSummary, CgRealEstateSummaryModel, CgRealEstateModel } from './cg-real-estate-summary-model'

/**
 * Main Capital Gains Real Estate Property Detail
 * Contains all 4 related tables: basic_details, improvements, address, buyer_details
 */
export interface CgRealEstateProperty {
  propertySaleId?: number | null
  filingId: number
  basicDetails?: CgRealEstateBasicDetails | null
  improvementsList?: CgRealEstateImprovement[] | null
  address?: CgRealEstateAddress | null
  buyerDetailsList?: CgRealEstateBuyerDetails[] | null
}

/**
 * Wrapper model matching the API response for capital gains real estate
 * Contains summaries for list views and aggregated totals
 */
export interface CapitalGainsRealEstateModel {
  filingId?: number
  properties?: CgRealEstateProperty[] | null
  totalNetGain?: number
  propertiesCount?: number
}
