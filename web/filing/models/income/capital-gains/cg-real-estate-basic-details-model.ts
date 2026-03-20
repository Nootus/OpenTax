/**
 * Basic Details section for Capital Gains Real Estate
 * Nested within CgRealEstateProperty
 * Maps to backend property_sale_transaction table
 */
export interface CgRealEstateBasicDetails {
  filingId?: number | null
  assetType: string // 'real_estate'
  assetDescription?: string | null
  dateOfSale?: string | null
  dateOfPurchase?: string | null
  totalSalePrice: number
  totalPurchasePrice: number
  transferExpenses: number
  stampDutyValue?: number | null
  isHouseProperty: boolean
  netGain:number
  // Section 54 - Investment in new house property
  costOfNewImprovementSec54?: number | null
  amountInCgasSec54?: number | null
  purchaseDateSec54?: string | null
  // Section 54F - Investment in new residential house property or long-term bonds
  costOfNewPropertySec54f?: number | null
  amountInCgasSec54f?: number | null
  purchaseDateSec54f?: string | null
  // Section 54EC - Investment in specified bonds
  amountInBondsSec54ec?: number | null
  investmentDateBondsSec54ec?: string | null
  broker?: string | null
}
