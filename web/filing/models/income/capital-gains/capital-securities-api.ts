/**
 * Capital Securities API Module
 * Handles Capital Gains from Securities (Stocks, Bonds, Mutual Funds, RSUs)
 *
 * API Endpoints (prefix: /api/securities-capital-gains):
 *   --- Summary ---
 *   GET    /api/securities-capital-gains/{filing_id}               - Securities summary (counts, totals, gain types)
 *
 *   --- Per-type GET individual ---
 *   GET    /api/securities-capital-gains/{filing_id}/stocks/{stock_sale_id}
 *   GET    /api/securities-capital-gains/{filing_id}/bonds/{bond_sale_id}
 *   GET    /api/securities-capital-gains/{filing_id}/mutual-funds/{mf_sale_id}
 *   GET    /api/securities-capital-gains/{filing_id}/rsus/{rsu_sale_id}
 *
 *   --- Per-type save (insert or update individually) ---
 *   POST   /api/securities-capital-gains/{filing_id}/stocks         - expects List[StocksCapitalGains]
 *   POST   /api/securities-capital-gains/{filing_id}/bonds          - expects List[BondsCapitalGains]
 *   POST   /api/securities-capital-gains/{filing_id}/mutual-funds   - expects List[MutualFundsCapitalGains]
 *   POST   /api/securities-capital-gains/{filing_id}/rsus           - expects List[RsusCapitalGains]
 *
 *   --- Per-type delete individual ---
 *   DELETE /api/securities-capital-gains/{filing_id}/stocks/{stock_sale_id}
 *   DELETE /api/securities-capital-gains/{filing_id}/bonds/{bond_sale_id}
 *   DELETE /api/securities-capital-gains/{filing_id}/mutual-funds/{mf_sale_id}
 *   DELETE /api/securities-capital-gains/{filing_id}/rsus/{rsu_sale_id}
 *
 *   --- Bulk delete all securities for filing ---
 *   DELETE /api/securities-capital-gains/filing/{filing_id}
 */

import { apiClient, ApiResponse } from '@/filing/core/api/client'
import type { BondsCapitalGains } from './models/bonds-capital-gains-model'
import type { StocksCapitalGains } from './models/stocks-capital-gains-model'
import type { MutualFundsCapitalGains } from './models/mutual-funds-capital-gains-model'
import type { RsusCapitalGains } from './models/rsus-capital-gains-model'
import type { CapitalGainsSecuritiesModel } from './models/capital-gains-securities-model'

// Re-export for convenience
export type { BondsCapitalGains, StocksCapitalGains, MutualFundsCapitalGains, RsusCapitalGains, CapitalGainsSecuritiesModel }

// ==================== API Functions ====================

/**
 * Capital Securities Gains API
 * Each POST endpoint inserts or updates records individually (upsert pattern).
 * net_gain is calculated server-side — frontend does NOT send it.
 */
export const capitalSecuritiesApi = {
  // ──────────────────────────────── Summary ────────────────────────────────

  /**
   * Get summary of all securities capital gains (counts, totals, gain_type STCG/LTCG per entry)
   */
  getCapitalSecurities: async (
    filingId?: number | null
  ): Promise<ApiResponse<CapitalGainsSecuritiesModel>> => {
    if (!filingId) {
      return Promise.resolve({
        ok: false,
        error: 'Filing ID is required',
      } as any)
    }
    return apiClient.get<CapitalGainsSecuritiesModel>(
      `/api/securities-capital-gains/${filingId}`
    )
  },

  // ──────────────────────────────── Stocks ────────────────────────────────

  /**
   * Save stocks — inserts or updates each stock record individually.
   * Records with stock_sale_id will be updated; records without will be inserted.
   */
  saveStocks: async (
    filingId: number,
    data: StocksCapitalGains[]
  ): Promise<ApiResponse<StocksCapitalGains[]>> => {
    return apiClient.post<StocksCapitalGains[]>(
      `/api/securities-capital-gains/${filingId}/stocks`,
      data
    )
  },

  /** Get a single stock by ID */
  getStockById: async (filingId: number, stockSaleId: number): Promise<ApiResponse<StocksCapitalGains>> => {
    return apiClient.get<StocksCapitalGains>(
      `/api/securities-capital-gains/${filingId}/stocks/${stockSaleId}`
    )
  },

  /** Delete a single stock record by ID */
  deleteStockById: async (filingId: number, stockSaleId: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(
      `/api/securities-capital-gains/${filingId}/stocks/${stockSaleId}`
    )
  },

  // ──────────────────────────────── Bonds ────────────────────────────────

  /**
   * Save bonds — inserts or updates each bond record individually.
   * Records with bond_sale_id will be updated; records without will be inserted.
   */
  saveBonds: async (
    filingId: number,
    data: BondsCapitalGains[]
  ): Promise<ApiResponse<BondsCapitalGains[]>> => {
    return apiClient.post<BondsCapitalGains[]>(
      `/api/securities-capital-gains/${filingId}/bonds`,
      data
    )
  },

  /** Get a single bond by ID */
  getBondById: async (filingId: number, bondSaleId: number): Promise<ApiResponse<BondsCapitalGains>> => {
    return apiClient.get<BondsCapitalGains>(
      `/api/securities-capital-gains/${filingId}/bonds/${bondSaleId}`
    )
  },

  /** Delete a single bond record by ID */
  deleteBondById: async (filingId: number, bondSaleId: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(
      `/api/securities-capital-gains/${filingId}/bonds/${bondSaleId}`
    )
  },

  // ──────────────────────────────── Mutual Funds ────────────────────────────────

  /**
   * Save mutual funds — inserts or updates each mutual fund record individually.
   * Records with mutual_fund_sale_id will be updated; records without will be inserted.
   */
  saveMutualFunds: async (
    filingId: number,
    data: MutualFundsCapitalGains[]
  ): Promise<ApiResponse<MutualFundsCapitalGains[]>> => {
    return apiClient.post<MutualFundsCapitalGains[]>(
      `/api/securities-capital-gains/${filingId}/mutual-funds`,
      data
    )
  },

  /** Get a single mutual fund by ID */
  getMutualFundById: async (filingId: number, mfSaleId: number): Promise<ApiResponse<MutualFundsCapitalGains>> => {
    return apiClient.get<MutualFundsCapitalGains>(
      `/api/securities-capital-gains/${filingId}/mutual-funds/${mfSaleId}`
    )
  },

  /** Delete a single mutual fund record by ID */
  deleteMutualFundById: async (filingId: number, mfSaleId: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(
      `/api/securities-capital-gains/${filingId}/mutual-funds/${mfSaleId}`
    )
  },

  // ──────────────────────────────── RSUs ────────────────────────────────

  /**
   * Save RSUs — inserts or updates each RSU record individually.
   * Records with rsu_sale_id will be updated; records without will be inserted.
   */
  saveRsus: async (
    filingId: number,
    data: RsusCapitalGains[]
  ): Promise<ApiResponse<RsusCapitalGains[]>> => {
    return apiClient.post<RsusCapitalGains[]>(
      `/api/securities-capital-gains/${filingId}/rsus`,
      data
    )
  },

  /** Get a single RSU by ID */
  getRsuById: async (filingId: number, rsuSaleId: number): Promise<ApiResponse<RsusCapitalGains>> => {
    return apiClient.get<RsusCapitalGains>(
      `/api/securities-capital-gains/${filingId}/rsus/${rsuSaleId}`
    )
  },

  /** Delete a single RSU record by ID */
  deleteRsuById: async (filingId: number, rsuSaleId: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(
      `/api/securities-capital-gains/${filingId}/rsus/${rsuSaleId}`
    )
  },

  // ──────────────────────────────── Bulk Delete ────────────────────────────────

  /** Delete ALL securities capital gains for a filing (stocks + bonds + mutual funds + rsus) using bulk endpoint */
  deleteCapitalSecurities: async (filingId: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(
      `/api/securities-capital-gains/filing/${filingId}`
    )
  },

  // ──────────────────────────────── Excel Import (Backend-Mapped) ────────────────────────────────

  /**
   * Upload a broker Excel file for capital gains. The backend parses the file,
   * auto-detects asset types present, and returns grouped transactions.
   *
   * POST /api/excel/capital-gains/{broker}
   */
  uploadCapitalGainsExcel: async (
    broker: string,
    filingId: number,
    file: File,
  ): Promise<ApiResponse<CapitalGainsExcelResponse>> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('filing_id', filingId.toString())
    return apiClient.upload<CapitalGainsExcelResponse>(
      `/api/excel/capital-gains/${encodeURIComponent(broker)}`,
      formData,
    )
  },
}

// ==================== Excel Import Response Type ====================

/** Per-asset-type group returned by the backend */
export interface AssetTypeGroup {
  transactions: BondsCapitalGains[] | StocksCapitalGains[] | MutualFundsCapitalGains[] | RsusCapitalGains[]
  total_entries: number
}

/** Response from backend-mapped Excel import */
export interface CapitalGainsExcelResponse {
  groups: Record<string, AssetTypeGroup>
  broker: string
  total_entries: number
}

