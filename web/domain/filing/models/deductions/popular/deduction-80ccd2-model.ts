/**
 * Section 80CCD(2) Deduction Interface - Employer contribution to NPS
 * Mirrors: section_80ccd2 in FilingModel
 * Inherits from Deduction80CCCModel structure
 */

export interface Deduction80CCD2Model {
  deductionId?: number | null
  filingId: number | null
  pranNumber: string
  amount: number
}

/**
 * Widget Record for API
 */
export interface Deduction80CCD2Record {
  deductionId?: number
  filingId?: number
  pranNumber?: string | null
  amount: number
}


/**
 * Widget Props
 */
export interface Deduction80CCD2WidgetProps {
  isOpen: boolean
  onClose: () => void
  filingId?: number | null
  entityId?: number | string
  initialData?: Record<string, any> | null
  onSuccess?: (action: 'created' | 'updated', data: any) => void
  grossSalary?: number
  errorField?: string | null
  errorMessage?: string | null  // Error message to display for the field
  fieldErrors?: Record<string, string> | null  // Multiple field errors: { fieldName: errorMessage }
}

/**
 * Initial Form Data
 */
export const INITIAL_DEDUCTION_80CCD2_FORM_DATA: Deduction80CCD2Model = {
  deductionId: null,
  filingId: null,
  pranNumber: '',
  amount: 0,
}
