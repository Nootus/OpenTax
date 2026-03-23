/**
 * Capital Real Estate API Module
 * Handles Capital Gains from Real Estate (Property Sales)
 * 
 * API Endpoints (prefix: /api/real-estate-capital-gains):
 *   GET    /api/real-estate-capital-gains/{filing_id}                    - Get all summaries for a filing
 *   GET    /api/real-estate-capital-gains/{filing_id}/{property_sale_id} - Get single property full details
 *   POST   /api/real-estate-capital-gains                               - Add new property
 *   POST   /api/real-estate-capital-gains/{property_sale_id}            - Update existing property
 *   DELETE /api/real-estate-capital-gains/{property_sale_id}            - Delete a property
 *   DELETE /api/real-estate-capital-gains/filing/{filing_id}            - Delete all properties for a filing
 */

import { apiClient, ApiResponse } from '@/filing/core/api/client'
import type { CgRealEstateProperty } from './cg-real-estate-property-model'
import type { CgRealEstateSummary } from './cg-real-estate-summary-model'

// ==================== API Functions ====================

/**
 * Capital Real Estate Gains API
 * Manages capital gains from real estate properties
 */
export const capitalRealEstateApi = {
  /**
   * Get all real estate property summaries for a filing
   * Returns a lightweight list for the table view
   * @param filingId - Filing ID to retrieve summaries for
   * @returns Array of CgRealEstateSummary
   */
  getAllRealEstate: async (
    filingId?: number | null
  ): Promise<ApiResponse<CgRealEstateSummary[]>> => {
    if (!filingId) {
      return Promise.resolve({
        ok: false,
        error: 'Filing ID is required',
      } as any)
    }
    return apiClient.get<CgRealEstateSummary[]>(
      `/api/real-estate-capital-gains/${filingId}`
    )
  },

  /**
   * Get full details for a single real estate property
   * @param filingId - Filing ID
   * @param propertySaleId - Property sale ID
   * @returns CgRealEstateProperty with all nested details
   */
  getRealEstate: async (
    filingId: number,
    propertySaleId: number
  ): Promise<ApiResponse<CgRealEstateProperty>> => {
    return apiClient.get<CgRealEstateProperty>(
      `/api/real-estate-capital-gains/${filingId}/${propertySaleId}`
    )
  },

  /**
   * Add a new real estate property
   * @param data - CgRealEstateProperty with all details
   * @returns Promise with property_sale_id after successful save
   */
  addRealEstate: async (
    data: CgRealEstateProperty
  ): Promise<ApiResponse<number>> => {
    return apiClient.post<number>('/api/real-estate-capital-gains', data)
  },

  /**
   * Update an existing real estate property
   * @param propertySaleId - Property sale ID to update
   * @param data - CgRealEstateProperty with updated details
   * @returns Promise with property_sale_id after successful update
   */
  updateRealEstate: async (
    propertySaleId: number,
    data: CgRealEstateProperty
  ): Promise<ApiResponse<number>> => {
    return apiClient.post<number>(`/api/real-estate-capital-gains/${propertySaleId}`, data)
  },

  /**
   * Delete a real estate property
   * @param propertySaleId - Property sale ID to delete
   */
  deleteRealEstate: async (propertySaleId: number): Promise<ApiResponse<number>> => {
    return apiClient.delete<number>(`/api/real-estate-capital-gains/${propertySaleId}`)
  },

  /**
   * Delete ALL real estate properties for a filing
   * @param filingId - Filing ID whose properties should all be deleted
   */
  deleteAllRealEstate: async (filingId: number): Promise<ApiResponse<number>> => {
    return apiClient.delete<number>(`/api/real-estate-capital-gains/filing/${filingId}`)
  },
}
