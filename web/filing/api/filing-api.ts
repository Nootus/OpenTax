import { FilingModel, ValidationErrorModel } from '../models/filing-model'
import { ITR1Model } from '../models/itr1-model'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

export interface ValidationResponse {
  success: boolean
  validationErrors: ValidationErrorModel[]
  totalErrors: number
  arnNumber?: string | null
  itrSummary?: ITR1Model | null
}

/** Recursively fix the payload before sending to the backend:
 *  - `filingId: null` → `0` (Pydantic requires int)
 *  - `Date` objects → `"YYYY-MM-DD"` strings (Pydantic `date` type) */
function deepSanitize<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj
  if (obj instanceof Date) {
    const y = obj.getFullYear()
    const m = String(obj.getMonth() + 1).padStart(2, '0')
    const d = String(obj.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}` as unknown as T
  }
  if (Array.isArray(obj)) return obj.map(deepSanitize) as T
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    out[k] = k === 'filingId' && v === null ? 0 : deepSanitize(v)
  }
  return out as T
}

/** Ensure null list/object fields are safe for the backend */
function sanitizePayload(filing: FilingModel): FilingModel {
  const cleaned = {
    ...filing,
    immovableAssets: filing.immovableAssets ?? [],
    financialAssets: filing.financialAssets ?? [],
    otherAssets: filing.otherAssets ?? [],
    liabilities: filing.liabilities ?? [],
    investmentFirmLlpAop: filing.investmentFirmLlpAop ?? [],
    chapterVIADeductionsNew: filing.chapterVIADeductionsNew ?? undefined,
    chapterVIADeductionsOld: filing.chapterVIADeductionsOld ?? undefined,
  }
  return deepSanitize(cleaned)
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `Request failed: ${res.status}`)
  }
  return res.json()
}

export async function calculateTax(filing: FilingModel): Promise<FilingModel> {
  return post<FilingModel>('/api/filing/calculate_tax', sanitizePayload(filing))
}

export async function getItr1(filing: FilingModel): Promise<ValidationResponse> {
  return post<ValidationResponse>('/api/filing/get_itr1', sanitizePayload(filing))
}
