export interface HousePropertyTenantModel {
    tenantId?: number | null
    filingId: number | null
    propertyId?: number | null
    tenantName: string
    identifierType?: string | null
    identifierValue?: string | null
  }