
export interface EquityCompensationIncomeModel {
  equityCompensationId?: number | null
  filingId: number
  investmentType: string
  narration: string
  amount: number
  dateOfReceipt: Date
  createdAt?: string | null
  updatedAt?: string | null
}
