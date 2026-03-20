export interface EquityDividendModel {
    dividendId?: number | null
    filingId: number
    dividendType: string // default: "equity"
    currency: string // default: "INR"
    narration: string
    amount: number
    dateOfReceipt: Date
    createdAt?: any | null
    updatedAt?: any | null
  }