/**
 * Movable Asset Model - Multiple assets container
 * Maps to the MovableAssetSummaryModel on the backend
 *
 * Used as the wrapper response when fetching all movable capital gains for a filing.
 * Analogous to ForeignAssetModel for foreign assets.
 *
 * API: capitalMovableApi (capital-movable-api.ts)
 * Widget: MovableAssetsWidget.tsx
 */

import type { MovableCapitalGains } from '../capital-movable/models/movable-capital-gains-model'

export interface MovableAssetModel {
  filingId: number
  assets: MovableCapitalGains[]
  totalGainLoss: number
}
