/**
 * TCS Model
 * Tax Collected at Source
 */
export interface TCSModel {
  tcsId?: number | null
  filingId: number | null
  collectorName: string
  tan: string
  natureOfCollection?: string | null
  amountCollected?: number | null
  taxCollected?: number | null
  tcsCertificateNumber?: string | null
  quarter?: string | null
  yearOfCollection?: Date | null
  taxCreditClaimed?: number | null
}

export interface TCSResponse {
  data: TCSModel
  message?: string
}

export interface TCSListResponse {
  data: TCSModel[]
  message?: string
}

export interface TCSEntryWidgetProps {
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
