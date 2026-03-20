/**
 * Invoice Discounting Income Transaction Model
 *
 * Transaction model used by widgets/forms for editing and detailed views of invoice discounting income entries.
 * This model maps to the backend transaction storage for edit operations.
 */
export interface InvoiceDiscountingIncome {
  invoiceDiscountId?: number;
  tempId?: string;
  filingId?: number | null;
  platformName?: string | null;
  invoiceNumber?: string | null;
  description?: string | null;
  amount?: number | null;
  discountingDate?: string | null;
}
