/**
 * Bank Account Model
 * Mirrors: bank_account in FilingModel
 */

export interface BankAccountModel {
  bankAccountId?: number | null
  personId?: number | null
  accountNumber: string
  ifscCode: string
  bankName: string
  accountType: string
  isPrimary: boolean
}

// ==================== Widget Types ====================

/**
 * Bank Account API Response
 */
export interface BankAccountResponse {
  bankAccount: any
  message?: string
}
