/**
 * Online Gaming Income Transaction Model
 *
 * This is the transaction model used by widgets and forms for editing
 * online gaming income entries. It represents a single transaction/income
 * event from online gaming platforms.
 */
export interface OnlineGamingIncome {
  onlineGamingId?: number;
  tempId?: string;
  filingId?: number | null;
  platformName?: string | null;
  description?: string | null;
  amount?: number | null;
  transactionDate?: string | null;
}
