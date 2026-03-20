/**
 * Capital Deemed API Module
 * Handles Deemed Capital Gains (STCG and LTCG)
 * 
 * Backend: CapitalGainsDeemedController (capital_gains_deemed_controller.py)
 * Route prefix: /api/deemed-capital-gains
 *
 * API Endpoints:
 *   GET    /api/deemed-capital-gains/{filing_id}                        - Get summary
 *   GET    /api/deemed-capital-gains/stcg/{filing_id}/{deemed_stcg_id}  - Get single STCG entry
 *   GET    /api/deemed-capital-gains/ltcg/{filing_id}/{deemed_ltcg_id}  - Get single LTCG entry
 *   POST   /api/deemed-capital-gains/stcg                              - Save STCG entry
 *   POST   /api/deemed-capital-gains/ltcg                              - Save LTCG entry
 *   DELETE /api/deemed-capital-gains/{filing_id}/{deemed_gain_id}       - Delete single entry
 *   DELETE /api/deemed-capital-gains/{filing_id}                        - Delete all for filing
 */

import { apiClient, ApiResponse } from '@/domain/filing/core/api/client'
import type { DeemedSummaryResponse } from '@/domain/filing/widgets/income/capital-gains/capital-deemed/models/deemed-capital-gains-model'
import type { DeemedCapitalGainsWrapperPayload } from './models/deemed-capital-gains-wrapper-model'

// ==================== API Functions ====================

/**
 * Deemed Capital Gains API
 * Manages deemed capital gains (STCG and LTCG)
 */
export const capitalDeemedApi = {
  /**
   * Get deemed capital gains summary for a filing
   * Backend: GET /{filing_id} -> DeemedSummaryModel
   * Returns: { data: { filingId, entries: [...], totalGain } }
   */
  getDeemedSummary: async (
    filingId?: number | null
  ): Promise<ApiResponse<DeemedSummaryResponse>> => {
    if (!filingId) {
      return Promise.resolve({
        ok: false,
        error: 'Filing ID is required',
      } as any)
    }
    return apiClient.get<DeemedSummaryResponse>(
      `/api/deemed-capital-gains/${filingId}`
    )
  },

  /**
   * Get a single deemed STCG entry
   * Backend: GET /stcg/{filing_id}/{deemed_stcg_id} -> DeemedStcgDetails
   */
  getDeemedStcgEntry: async (
    filingId: number,
    deemedStcgId: number
  ): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(
      `/api/deemed-capital-gains/stcg/${filingId}/${deemedStcgId}`
    )
  },

  /**
   * Get a single deemed LTCG entry
   * Backend: GET /ltcg/{filing_id}/{deemed_ltcg_id} -> DeemedLtcgDetails
   */
  getDeemedLtcgEntry: async (
    filingId: number,
    deemedLtcgId: number
  ): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(
      `/api/deemed-capital-gains/ltcg/${filingId}/${deemedLtcgId}`
    )
  },

  /**
   * Save (create or update) a deemed STCG entry
   * Backend: POST /stcg -> expects DeemedCapitalGainsWrapper with 1 base_gains + 1 stcg_details
   */
  saveDeemedStcg: async (
    data: DeemedCapitalGainsWrapperPayload
  ): Promise<ApiResponse<number>> => {
    return apiClient.post<number>('/api/deemed-capital-gains/stcg', data)
  },

  /**
   * Save (create or update) a deemed LTCG entry
   * Backend: POST /ltcg -> expects DeemedCapitalGainsWrapper with 1 base_gains + 1 ltcg_details
   */
  saveDeemedLtcg: async (
    data: DeemedCapitalGainsWrapperPayload
  ): Promise<ApiResponse<number>> => {
    return apiClient.post<number>('/api/deemed-capital-gains/ltcg', data)
  },

  /**
   * Delete a single deemed capital gain entry and its related details
   * Backend: DELETE /{filing_id}/{deemed_gain_id}
   */
  deleteDeemedGain: async (
    filingId: number,
    deemedGainId: number
  ): Promise<ApiResponse<number>> => {
    return apiClient.delete<number>(
      `/api/deemed-capital-gains/${filingId}/${deemedGainId}`
    )
  },

  /**
   * Delete all deemed capital gains for a filing
   * Backend: DELETE /{filing_id}
   */
  deleteDeemedCapitalGains: async (filingId: number): Promise<ApiResponse<number>> => {
    return apiClient.delete<number>(`/api/deemed-capital-gains/${filingId}`)
  },
}
