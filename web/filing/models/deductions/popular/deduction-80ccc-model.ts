/**
 * Section 80CCC Deduction Interface (Pension Fund)
 * Mirrors: section_80ccc in FilingModel
 */

export interface Deduction80CCCModel {
  deductionId?: number | null
  filingId: number | null
  pranNumber: string
  amount: number
}

/**
 * Widget Master Data for 80CCC
 */
export interface Deduction80CCCMasterData {
  // Add any master data fields if needed
}

/**
 * Widget Record for API
 */
export interface Deduction80CCCRecord {
  deductionId?: number
  filingId?: number
  pranNumber?: string | null
  amount: number
}

/**
 * Widget Props
 */
export interface Deduction80CCCWidgetProps {
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
export const INITIAL_DEDUCTION_80CCC_FORM_DATA: Deduction80CCCModel = {
  deductionId: null,
  filingId: null,
  pranNumber: '',
  amount: 0,
}

/**
 * 80CCC limit (part of combined 80C limit)
 */
export const DEDUCTION_80CCC_LIMIT = 150000

