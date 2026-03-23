export interface EmployerAddressModel {
    employerAddressId?: number | null
    employerId?: number | null
    addressLine1: string
    addressLine2?: string | null
    landmark?: string | null
    city: string
    district?: string | null
    state: string
    pincode?: string | null
    country: string
  }