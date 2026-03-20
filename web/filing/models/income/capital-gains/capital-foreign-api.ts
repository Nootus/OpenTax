/**
 * Capital Foreign API Module
 * Handles Capital Gains from Foreign Assets
 * 
 * API Endpoints (prefix: /api/foreign-capital-gains):
 *   GET    /api/foreign-capital-gains/{filing_id}                    - Get summary of all assets
 *   GET    /api/foreign-capital-gains/{filing_id}/{foreign_sale_id}  - Get single asset details
 *   POST   /api/foreign-capital-gains                               - Add new foreign asset
 *   POST   /api/foreign-capital-gains/{foreign_sale_id}             - Update existing asset
 *   DELETE /api/foreign-capital-gains/{filing_id}                    - Delete all assets for filing
 *   DELETE /api/foreign-capital-gains/{filing_id}/{foreign_sale_id}  - Delete single asset
 */

import { apiClient, ApiResponse } from '@/filing/core/api/client'
import type { ForeignCapitalGains } from '@/filing/widgets/income/capital-gains/capital-foreign/models/foreign-capital-gains-model'
import type { ForeignAssetModel } from '@/filing/widgets/income/capital-gains/models/foreign-asset-model'
import type { ForeignAssetSummaryModel } from '@/filing/widgets/income/capital-gains/capital-foreign/models/foreign-asset-summary-model'

// ==================== Types ====================

/** Payload for creating a new foreign asset (POST) */
export interface ForeignCapitalGainsCreatePayload {
  filing_id: number
  asset_description?: string | null
  date_of_purchase?: string | Date | null
  date_of_sale?: string | Date | null
  total_purchase_price?: number | null
  total_sale_price?: number | null
  transfer_expenses?: number | null
}

/** Payload for updating an existing foreign asset (POST) */
export interface ForeignCapitalGainsUpdatePayload extends ForeignCapitalGainsCreatePayload {
  foreign_sale_id: number
}

// ==================== API Functions ====================

/**
 * Foreign Capital Gains API
 * Manages capital gains from foreign assets
 */
export const capitalForeignApi = {
  /**
   * Get summary of all foreign capital gains for a filing
   * @param filingId - Filing ID to retrieve foreign capital gains for
   * @returns ForeignAssetSummaryModel with assets array and total_gain
   */
  getForeignCapitalGains: async (
    filingId?: number | null
  ): Promise<ApiResponse<ForeignAssetSummaryModel>> => {
    if (!filingId) {
      return Promise.resolve({
        ok: false,
        error: 'Filing ID is required',
      } as any)
    }
    return apiClient.get<ForeignAssetSummaryModel>(
      `/api/foreign-capital-gains/${filingId}`
    )
  },

  /**
   * Get a single foreign asset entry details
   * @param filingId - Filing ID
   * @param foreignSaleId - Foreign sale transaction ID
   * @returns ForeignCapitalGains single entry
   */
  getForeignCapitalGainsById: async (
    filingId: number,
    foreignSaleId: number
  ): Promise<ApiResponse<ForeignCapitalGains>> => {
    return apiClient.get<ForeignCapitalGains>(
      `/api/foreign-capital-gains/${filingId}/${foreignSaleId}`
    )
  },

  /**
   * Create a new foreign capital gains record
   * @param data - ForeignCapitalGainsCreatePayload
   * @returns Created ForeignCapitalGains entry
   */
  createForeignCapitalGains: async (
    data: ForeignCapitalGainsCreatePayload
  ): Promise<ApiResponse<ForeignCapitalGains>> => {
    return apiClient.post<ForeignCapitalGains>('/api/foreign-capital-gains', data)
  },

  /**
   * Update an existing foreign capital gains record
   * @param foreignSaleId - ID of the foreign sale to update
   * @param data - ForeignCapitalGainsUpdatePayload
   * @returns Updated ForeignCapitalGains entry
   */
  updateForeignCapitalGains: async (
    foreignSaleId: number,
    data: ForeignCapitalGainsUpdatePayload
  ): Promise<ApiResponse<ForeignCapitalGains>> => {
    return apiClient.post<ForeignCapitalGains>(
      `/api/foreign-capital-gains/${foreignSaleId}`,
      data
    )
  },

  /**
   * Delete all foreign capital gains for a filing
   * @param filingId - Filing ID to delete all foreign capital gains for
   */
  deleteForeignCapitalGains: async (filingId: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/api/foreign-capital-gains/${filingId}`)
  },

  /**
   * Delete a single foreign capital gains entry
   * @param filingId - Filing ID
   * @param foreignSaleId - Foreign sale transaction ID to delete
   */
  deleteForeignCapitalGainsById: async (
    filingId: number,
    foreignSaleId: number
  ): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(
      `/api/foreign-capital-gains/${filingId}/${foreignSaleId}`
    )
  },
}
