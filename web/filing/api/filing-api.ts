import { FilingModel } from '../models/filing-model'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

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
  return post<FilingModel>('/api/filing/calculate_tax', filing)
}

export async function getItr1(filing: FilingModel): Promise<unknown> {
  return post<unknown>('/api/filing/get_itr1', filing)
}
