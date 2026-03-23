/**
 * Section 80CCD(1B) Deduction Interface - Additional NPS contribution
 * Mirrors: section_80ccd1b in FilingModel
 * Inherits from Deduction80CCCModel structure
 */

export interface Deduction80CCD1BModel {
  deductionId?: number | null
  filingId: number | null
  pranNumber: string
  amount: number
}

/**
 * Widget Record for API
 */
export interface Deduction80CCD1BRecord {
  deductionId?: number
  filingId?: number
  pranNumber?: string | null
  amount: number
}



/**
 * Widget Props
 */
export interface Deduction80CCD1BWidgetProps {
  isOpen: boolean
  onClose: () => void
  filingId?: number | null
  entityId?: number | string
  initialData?: Record<string, any> | null
  onSuccess?: (action: 'created' | 'updated', data: any) => void
  currentClaimed?: number
  errorField?: string | null
  errorMessage?: string | null  // Error message to display for the field
  fieldErrors?: Record<string, string> | null  // Multiple field errors: { fieldName: errorMessage }
}

/**
 * Initial Form Data
 */
export const INITIAL_DEDUCTION_80CCD1B_FORM_DATA: Deduction80CCD1BModel = {
  deductionId: null,
  filingId: null,
  pranNumber: '',
  amount: 0,
}

/**
 * 80CCD(1B) separate limit
 */
export const DEDUCTION_80CCD1B_LIMIT = 50000
