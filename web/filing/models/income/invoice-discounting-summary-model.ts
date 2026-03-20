/**
 * Summary model for Invoice Discounting Income
 * Lightweight structure for list/table views
 * Represents a single invoice discounting transaction
 */
export interface InvoiceDiscountingSummary {
  invoiceDiscountId: number
  filingId: number
  platformName?: string | null
  invoiceNumber?: string | null
  description?: string | null
  amount?: number | null
  discountingDate?: string | null
}

/**
 * Summary wrapper model for list view
 * Contains collection of invoice discounting entries with aggregated total income
 */
export interface InvoiceDiscountingSummaryModel {
  filingId: number
  entries: InvoiceDiscountingSummary[]
  totalIncome: number
}
