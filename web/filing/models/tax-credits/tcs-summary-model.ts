/**
 * TCS Summary Interface
 * Based on models/summary/tcs_summary.py
 */
export interface TCSSummary {
  tcsId: number
  collectorName: string | null
  tan: string | null
  natureOfCollection: string | null
  taxCollected: number
}

