/**
 * TDS Summary Interface
 * Based on models/summary/tds_summary.py
 */
export interface TDSSummary {
  tdsId: number
  deductorName: string | null
  tan: string | null
  incomeSource: string | null
  taxDeducted: number
}

