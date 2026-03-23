/**
 * Foreign Asset Model - Multiple assets container
 * Maps to the ForeignAssetModel on the backend
 *
 * Used as the wrapper response when fetching all foreign capital gains for a filing.
 */

import type { ForeignCapitalGains } from '../capital-foreign/models/foreign-capital-gains-model'

export interface ForeignAssetModel {
  filingId: number
  assets: ForeignCapitalGains[]
  totalGainLoss: number
}
