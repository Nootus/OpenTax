/**
 * TDS Model
 * Tax Deducted at Source
 */
export interface TDSModel {
  tdsId?: number | null
  filingId: number
  deductorName: string
  tan: string
  pan:string |null
  incomeSource?: string | null
  tdsSection?: string | null
  amountPaid?: number | null
  taxDeducted?: number | null
  tdsCertificateNumber?: string | null
  quarter?: string | null
}
export interface TDSEntryWidgetProps {
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


export interface TDSResponse {
  data: TDSModel
  message?: string
}

export interface TDSListResponse {
  data: TDSModel[]
  message?: string
}