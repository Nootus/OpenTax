/**
 * Address Model
 * Mirrors: person_address in FilingModel
 */

export interface AddressModel {
  addressId?: number | null
  personId?: number | null
  flatDoorNo: string
  premiseName?: string | null
  street?: string | null
  areaLocality?: string | null
  city?: string | null
  pincode?: string | null
  state?: string | null
  country?: string | null
}

// ==================== Widget Types ====================

/**
 * Address Create Request
 */
export interface AddressCreateRequest {
  flatDoorNo: string
  premiseName?: string | null
  street?: string | null
  areaLocality?: string | null
  city?: string | null
  pincode?: string | null
  state?: string | null
  country?: string | null
}

/**
 * Address Update Request
 */
export interface AddressUpdateRequest {
  flatDoorNo?: string
  premiseName?: string | null
  street?: string | null
  areaLocality?: string | null
  city?: string | null
  pincode?: string | null
  state?: string | null
  country?: string | null
}

/**
 * Address API Response
 */
export interface AddressResponse {
  address: any
  message?: string
}
