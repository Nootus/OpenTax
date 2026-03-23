import { RSUDividendModel } from "./rsu-dividend-model"
import { EquityDividendModel } from "./equity-dividend-model"


export interface DividendIncomeModel {
  filingId: number
  equity?: EquityDividendModel[] | null
  rsu?: RSUDividendModel[] | null
}

// ==================== Widget Types ====================

/**
 * Master data from API response (camelCase)
 */
export interface DividendIncomeMasterData {
  currencyTypes?: Array<{ value: string; label: string }>
  dividendTypes?: Array<{ value: string; label: string }>
}

/**
 * Dividend income record (API format)
 */
export interface DividendIncomeRecord {
  dividendId?: number
  filingId?: number
  dividendType: 'equity' | 'rsu' // 'equity' for Equities/Stocks/Mutual Funds, 'rsu' for RSUs/ESOPs/ESSPs
  narration?: string // For equity type
  description?: string // For RSU type
  amount: number
  amountReceived?: number // For RSU type (alias for amount)
  dateOfReceipt: Date | string | null
  receivedDate?: Date | string | null // For RSU type (alias for dateOfReceipt)
  taxPaidOutsideIndia?: number // For RSU type
  amountReceivedCurrencyType?: string // Default: 'INR'
  taxPaidForeignCurrencyType?: string // Default: 'INR'
}

/**
 * API Response types
 */
export interface DividendIncomeResponse {
  data: DividendIncomeRecord
  message?: string
}

export interface DividendIncomeListResponse {
  data: DividendIncomeRecord[]
  message?: string
}

export interface DividendIncomeGetResponse {
  filing_id: number
  equity?: DividendIncomeRecord[]
  rsu?: DividendIncomeRecord[]
}

/**
 * API response structure (snake_case from backend)
 */
export interface DividendIncomeData {
  data: DividendIncomeGetResponse | null
  master_data?: DividendIncomeMasterData
}

export interface DividendIncomeBulkCreate {
  filingId: number
  equity?: DividendIncomeRecord[] | null // Array for equities/stocks/mutual funds
  rsu?: DividendIncomeRecord[] | null // Array for RSUs/ESOPs/ESSPs
}

/**
 * Entry interface for widget state
 */
export interface DividendEntry {
  tempId?: string // For new entries not yet saved
  dividendId?: number
  dividendType: 'equity' | 'rsu'
  // Equity fields
  narration?: string
  amount?: number
  dateOfReceipt?: Date | null
  // RSU fields
  description?: string
  amountReceived?: number
  receivedDate?: Date | null
  taxPaidOutsideIndia?: number
  amountReceivedCurrencyType?: string
  taxPaidForeignCurrencyType?: string
}

/**
 * Form data structure for DividendIncomeWidget
 */
export interface DividendIncomeFormData {
  dividendType: 'equity' | 'rsu'
  // Equity fields
  narration: string
  amount: string
  dateOfReceipt: Date | null
  // RSU fields
  description: string
  amountReceived: string
  receivedDate: Date | null
  taxPaidOutsideIndia: string
  editingIndex?: number // Index of entry being edited
  taxPaidForeignCurrencyType: string
  amountReceivedCurrencyType: string
}

/**
 * Props for DividendIncomeWidget component
 */
export interface DividendIncomeWidgetProps {
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
