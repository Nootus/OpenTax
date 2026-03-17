/**
 * Capital Movable API Module
 * Handles Capital Gains from Movable Assets (Gold, Silver, Crypto, Other)
 * 
 * API Endpoints (prefix: /api/movable-capital-gains):
 *   GET    /api/movable-capital-gains/{filing_id}                    - Get summary of all assets
 *   GET    /api/movable-capital-gains/{filing_id}/{movable_sale_id}  - Get single asset details
 *   POST   /api/movable-capital-gains                               - Add new movable asset
 *   PUT    /api/movable-capital-gains/{movable_sale_id}             - Update existing asset
 *   DELETE /api/movable-capital-gains/{filing_id}                    - Delete all assets for filing
 *   DELETE /api/movable-capital-gains/{filing_id}/{movable_sale_id}  - Delete single asset
 */

import { apiClient, ApiResponse } from '@/domain/filing/core/api/client'
import type { MovableCapitalGains } from './models/movable-capital-gains-model'
import type { MovableAssetModel } from './models/movable-asset-model'
import type { MovableAssetSummaryModel } from './models/movable-asset-summary-model.ts'

// ==================== Types ====================

/** Payload for cost improvements (embedded in movable asset save) */
export interface MovableCapitalGainsImprovementPayload {
  improvement_id?: number | null
  improvement_description: string
  improvement_amount: number
  improvement_date?: string | null
}

/** Payload for creating a new movable asset (POST) */
export interface MovableCapitalGainsCreatePayload {
  filing_id: number
  asset_category?: string | null
  asset_description?: string | null
  date_of_purchase?: string | Date | null
  date_of_sale?: string | Date | null
  total_purchase_price?: number | null
  total_sale_price?: number | null
  transfer_expenses?: number | null
  improvements?: MovableCapitalGainsImprovementPayload[] | null
}

/** Payload for updating an existing movable asset (PUT) */
export interface MovableCapitalGainsUpdatePayload extends MovableCapitalGainsCreatePayload {
  movable_sale_id: number
}

// Re-export model types for convenience
export type { MovableAssetModel, MovableAssetSummaryModel }

// ==================== API Functions ====================

/**
 * Movable Capital Gains API
 * Manages capital gains from movable assets (gold, silver, crypto, other)
 */
export const capitalMovableApi = {
  /**
   * Get summary of all movable capital gains for a filing
   * @param filingId - Filing ID to retrieve movable capital gains for
   * @returns MovableAssetSummaryModel with assets array and total_gain
   */
  getMovableCapitalGains: async (
    filingId?: number | null
  ): Promise<ApiResponse<MovableAssetSummaryModel>> => {
    if (!filingId) {
      return Promise.resolve({
        ok: false,
        error: 'Filing ID is required',
      } as any)
    }
    return apiClient.get<MovableAssetSummaryModel>(
      `/api/movable-capital-gains/${filingId}`
    )
  },

  /**
   * Get a single movable asset entry details
   * @param filingId - Filing ID
   * @param movableSaleId - Movable sale transaction ID
   * @returns MovableCapitalGains single entry
   */
  getMovableCapitalGainsById: async (
    filingId: number,
    movableSaleId: number
  ): Promise<ApiResponse<MovableCapitalGains>> => {
    return apiClient.get<MovableCapitalGains>(
      `/api/movable-capital-gains/${filingId}/${movableSaleId}`
    )
  },

  /**
   * Create a new movable capital gains record
   * @param data - MovableCapitalGainsCreatePayload
   * @returns Created MovableCapitalGains entry
   */
  createMovableCapitalGains: async (
    data: MovableCapitalGainsCreatePayload
  ): Promise<ApiResponse<MovableCapitalGains>> => {
    return apiClient.post<MovableCapitalGains>('/api/movable-capital-gains', data)
  },

  /**
   * Update an existing movable capital gains record
   * @param movableSaleId - ID of the movable sale to update
   * @param data - MovableCapitalGainsUpdatePayload
   * @returns Updated MovableCapitalGains entry
   */
  updateMovableCapitalGains: async (
    movableSaleId: number,
    data: MovableCapitalGainsUpdatePayload
  ): Promise<ApiResponse<MovableCapitalGains>> => {
    return apiClient.post<MovableCapitalGains>(
      `/api/movable-capital-gains/${movableSaleId}`,
      data
    )
  },

  /**
   * Delete all movable capital gains for a filing
   * @param filingId - Filing ID to delete all movable capital gains for
   */
  deleteMovableCapitalGains: async (filingId: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/api/movable-capital-gains/${filingId}`)
  },

  /**
   * Delete a single movable capital gains entry
   * @param filingId - Filing ID
   * @param movableSaleId - Movable sale transaction ID to delete
   */
  deleteMovableCapitalGainsById: async (
    filingId: number,
    movableSaleId: number
  ): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(
      `/api/movable-capital-gains/${filingId}/${movableSaleId}`
    )
  },
}
