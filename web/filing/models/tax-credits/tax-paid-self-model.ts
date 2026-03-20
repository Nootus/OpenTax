/**
 * Tax Paid Self Model
 * Advance Tax & Self Assessment Tax
 */
export interface TaxPaidSelfModel {
  taxPaidId?: number | null
  filingId: number | null
  challanNumber?: string | null
  bsrCode?: string | null
  dateOfPayment?: any | null
  taxPaidAmount?: number | null
  taxPaidDate?: any | null
  taxType?: string | null
}
export interface TaxPaidSelfResponse {
  data: TaxPaidSelfModel
  message?: string
}

export interface TaxPaidSelfListResponse {
  data: TaxPaidSelfModel[]
  message?: string
}
export interface TaxPaymentWidgetProps {
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
