import { HousePropertyLoanModel } from "./house-property-loan-model"
import { HousePropertyTenantModel } from "./house-property-tenent-model"
import { HousePropertyCoownerModel } from "./house-property-coowner-model"
import { HousePropertyAddressModel } from "./house-property-address-model"
import { HousePropertyModel } from "./house-property-model"

export interface PropertyModel {
    property: HousePropertyModel
    propertyAddress?: HousePropertyAddressModel | null
    propertyLoan?: HousePropertyLoanModel | null
    propertyTenants: HousePropertyTenantModel[]
    propertyCoowners: HousePropertyCoownerModel[]
  }
  export interface HousePropertyMasterData {
    states?: Array<{ value: string; label: string }>
    countries?: Array<{ value: string; label: string }>
    propertyTypes?: Array<{ value: string; label: string }>
    tenantIdentifierTypes?: Array<{ value: string; label: string }>
    coownerRelationships?: Array<{ value: string; label: string }>
    lenderTypes?: Array<{ value: string; label: string }> | null
  }
  
  /**
   * API Data Interfaces (camelCase)
   */
  export interface HousePropertyData {
    property: {
      propertyId?: number
      filingId?: number
      propertyType?: string
      ownershipShare?: number
      annualRentReceived?: number
      municipalTaxesPaid?: number
    }
    propertyAddress: {
      propertyAddressId?: number
      filingId?: number
      propertyId?: number
      addressLine1?: string
      addressLine2?: string
      city?: string
      district?: string
      state?: string
      postalCode?: string
      country?: string
    }
    propertyLoan?: {
      loanId?: number
      filingId?: number
      propertyId?: number
      vendorType?: string
      lenderName?: string
      loanAccountNumber?: string
      loanSanctionDate?: string  // YYYY-MM-DD
      totalLoanAmount?: number
      loanOutstanding?: number
      interestPaid?: number
      principalRepaid?: number
    }
    propertyTenants?: Array<{
      tenantId?: number
      filingId?: number
      propertyId?: number
      tenantName?: string
      identifierType?: string
      identifierValue?: string
    }>
    propertyCoowners?: Array<{
      coownerId?: number
      filingId?: number
      propertyId?: number
      coownerName?: string
      coownerPan?: string
      coownerRelationship?: string
      ownershipShare?: number
    }>
  }
  
  
  /**
   * Component Props
   */
  export interface HousePropertyWidgetProps {
    isOpen: boolean
    onClose: () => void
    filingId: number | null
    entityId?: number | string
    initialData?: Record<string, any> | null
    onSuccess?: (action: 'created' | 'updated', data: any) => void
    errorField?: string | null
    errorMessage?: string | null  // Error message to display for the field
    fieldErrors?: Record<string, string> | null  // Multiple field errors: { fieldName: errorMessage }
  }
  
  /**
   * Initial Form Data Constants
   */