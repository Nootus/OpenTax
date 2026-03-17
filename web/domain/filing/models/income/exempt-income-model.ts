/**
 * Exempt Income Model
 * Handles exempt income sections under Interest & Other Income
 */

export interface ExemptIncomeEntry {
  exemptIncomeId?: number | null
  tempId?: string
  filingId: number | null
  source?: string | null
  narration?: string | null
  amount?: number | null
}

export interface ExemptIncomeModel {
  filingId: number | null
  ppfInterest?: ExemptIncomeEntry[] | null
  nreInterest?: ExemptIncomeEntry[] | null
  otherExemptIncome?: ExemptIncomeEntry[] | null
}

export interface ExemptIncomeMasterData {
  otherSourceValues?: Array<{ value: string; label: string }>
}

export interface ExemptIncomeWidgetProps {
  isOpen: boolean
  onClose: () => void
  filingId: number | null
  entityId?: number | string
  initialData?: Record<string, any> | null
  onSuccess?: (action: 'created' | 'updated', data: any) => void
  errorField?: string | null
  errorMessage?: string | null
}

export const INITIAL_EXEMPT_INCOME_ENTRY: ExemptIncomeEntry = {
  filingId: null,
  source: '',
  narration: '',
  amount: 0,
}

export const INITIAL_EXEMPT_INCOME_FORM_DATA: ExemptIncomeModel = {
  filingId: null,
  ppfInterest: [{ ...INITIAL_EXEMPT_INCOME_ENTRY }],
  nreInterest: [{ ...INITIAL_EXEMPT_INCOME_ENTRY }],
  otherExemptIncome: [{ ...INITIAL_EXEMPT_INCOME_ENTRY }],
}
