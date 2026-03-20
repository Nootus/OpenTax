/**
 * Buyer Details model for Capital Gains Real Estate
 * Nested within CgRealEstateProperty.buyerDetailsList
 * Maps to backend property_buyer_details table
 */
export interface CgRealEstateBuyerDetails {
  filingId?: number | null
  buyerId?: number | null
  buyerName?: string | null
  ownershipPercentage: number
  aadhaarNumber?: string | null
  panNumber?: string | null
  amountPaid: number
}
