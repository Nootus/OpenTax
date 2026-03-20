/**
 * Currency formatting utilities
 */

/**
 * Format a number as Indian Rupees currency
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "₹1,00,000")
 */
export function formatCurrency(value: number): string {
  if (value == null || isNaN(value)) value = 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format a number or string as Indian number system with commas
 * Handles both string and number inputs, useful for form inputs
 * @param value - The numeric value (string or number) to format
 * @returns Formatted number string (e.g., "1,00,000")
 */
export function formatCurrencyNumber(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value
  return num.toLocaleString('en-IN')
}

