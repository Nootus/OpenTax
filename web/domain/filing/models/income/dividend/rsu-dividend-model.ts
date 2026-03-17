export interface RSUDividendModel {
  dividendId?: number | null
  equityCompIncomeId?: number | null
  filingId: number
  dividendType: string // default: "rsu"
  description: string
  amount: number
  amountReceived: number
  amountReceivedCurrencyType: string // default: "INR"
  dateOfReceipt: Date
  receivedDate: Date
  taxPaidForeignCurrencyType?: string | null
  taxPaidOutsideIndia: number
  createdAt?: any | null
  updatedAt?: any | null
}
