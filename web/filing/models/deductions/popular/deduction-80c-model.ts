/**
 * Deduction 80C Deduction Interface
 * Mirrors: deduction_80c in FilingModel
 */

export interface Deduction80CModel {
  deductionId?: number | null
  filingId: number | null
  description: string
  policyNumber?: string | null
  amount: number
}

/**
 * Widget Master Data for 80C
 */
export interface Deduction80CMasterData {
  investment_types?: Array<{ value: string; label: string }>
  common_investments?: string[]
}

/**
 * Widget Record for API
 */
export interface Deduction80CRecord {
  deduction_id?: number
  deductionId?: number
  filing_id?: number | null
  filingId?: number
  description: string
  policy_number?: string | null
  policyNumber?: string | null
  amount: number
}

/**
 * Widget API Response
 */
export interface Deduction80CResponse {
  data: Deduction80CRecord
  message?: string
}

export interface Deduction80CData {
  data: Deduction80CRecord | null
  master_data?: Deduction80CMasterData
}


export interface Deduction80CWidgetProps {
  isOpen: boolean
  onClose: () => void
  filingId?: number | null
  entityId?: number | string
  initialData?: Record<string, any> | null
  onSuccess?: (action: 'created' | 'updated', data: any) => void
  currentTotal80C?: number
  errorField?: string | null
  errorMessage?: string | null  // Error message to display for the field
  fieldErrors?: Record<string, string> | null  // Multiple field errors: { fieldName: errorMessage }
}

/**
 * Initial Form Data
 */

