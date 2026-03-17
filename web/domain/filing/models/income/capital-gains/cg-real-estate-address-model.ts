/**
 * Address model for Capital Gains Real Estate
 * Nested within CgRealEstateProperty
 * Maps to backend property_address table
 */
export interface CgRealEstateAddress {
  filingId?: number | null
  addressId?: number | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  pinCode?: string | null
}
