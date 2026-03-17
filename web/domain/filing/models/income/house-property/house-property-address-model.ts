export interface HousePropertyAddressModel {
    propertyAddressId?: number | null
    filingId: number | null
    propertyId?: number | null
    addressLine1: string
    addressLine2?: string | null
    city: string
    district: string
    state: string
    postalCode: string
    country: string
  }