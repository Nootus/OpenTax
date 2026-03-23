/**
 * Capital Gains Deemed Summary Model
 * 
 * Summary model for deemed capital gains display.
 * Data comes from capitalDeemed widget (DeemedCapitalGainsWidget)
 */

export interface CapitalGainsDeemedSummary {
  filingId?: number
  deemedCount: number
  deemedTotal: number
}
