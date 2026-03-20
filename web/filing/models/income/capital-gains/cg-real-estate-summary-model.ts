/**
 * Summary model for Capital Gains Real Estate
 * Lightweight structure for list/table views
 * Maps to backend RealEstatepropertySummary
 */
export interface CgRealEstateSummary {
  propertySaleId: number
  filingId: number
  assetDescription?: string | null
  totalPurchasePrice?: number | null
  totalSalePrice?: number | null
  netGain: number
  gainType?: string | null // 'STCG' or 'LTCG'
  city?: string | null
  dateOfSale?: string | null
  dateOfPurchase?: string | null
  indexPurchasePrice?: number | null
  indexedPurchasePrice?: number | null
  broker?: string | null
}

/**
 * Summary wrapper model for list view
 * Maps to backend RealEstateSummaryModel
 */
export interface CgRealEstateSummaryModel {
  filingId: number
  properties: CgRealEstateSummary[]
  totalGain: number
}

/**
 * Full model wrapper containing list of properties
 * Maps to backend RealEstateModel
 */
import type { CgRealEstateProperty } from './cg-real-estate-property-model'

export interface CgRealEstateModel {
  filingId: number
  properties: CgRealEstateProperty[]
  totalGainLoss: number
}
