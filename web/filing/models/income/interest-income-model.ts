/**
 * Interest Income Model
 * Mirrors: interest_income in FilingModel
 */

export interface InterestIncomeModel {
  interestId?: number | null
  filingId: number | null
  interestTypeId?: number | null
  interestTypeName?: string | null  // Display name from lookup
  providentFundType?: string | null
  amount?: number | null
  description?: string | null
}

// ==================== Widget Types ====================

/**
 * Master Data
 */
export interface InterestIncomeMasterData {
  interestTypes?: Array<{ value: string; label: string }>
  providentFundTypes?: Array<{ value: string; label: string }>
}




/**
 * Component Props
 */
export interface InterestIncomeWidgetProps {
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
  export const INITIAL_INTEREST_INCOME_FORM_DATA: InterestIncomeModel = {
  filingId: null,
  interestTypeId: null,
  providentFundType: '',
  amount: 0,
  description: null,
}
