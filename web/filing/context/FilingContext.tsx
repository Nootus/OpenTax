'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { FilingModel } from '../models/filing-model'

// ── Default empty FilingModel ──
const EMPTY_FILING: FilingModel = {
  filingId: 0,
  assessmentYear: '2026-27',
  regime: 'new',

  // Personal
  person: null,
  personAddress: null,
  bankAccount: [],

  // Deductions - Popular
  section80C: [],
  section80Ccc: [],
  section80Ccd1: [],
  section80Ccd1B: [],
  section80Ccd2: [],

  // Deductions - Donations
  section80G: [],
  section80Gga: [],
  section80Ggc: [],

  // Deductions - Loans
  section80E: [],
  section80Ee: null,
  section80Eea: null,
  section80Eeb: null,

  // Deductions - Medical
  section80D: null,
  section80Dd: null,
  section80Ddb: null,
  section80U: null,

  // Deductions - Other
  section80Cch: null,
  section80Gg: null,
  section80Qqb: null,
  section80Rrb: null,
  section80Tta: null,
  section80Ttb: null,
  otherDeductions: null,

  // Income
  salary: [],
  houseProperty: [],
  interestIncome: [],
  equityCompensationIncome: null,
  foreignIncome: null,
  capitalGainsSecurities: null,
  agriculturalIncome: null,
  capitalGainsRealEstate: null,
  capitalGainsForeign: null,
  capitalGainsMovable: null,
  capitalGainsDeemed: null,
  dividendIncome: null,
  exemptIncome: null,
  lotteryOnlineGaming: null,

  // Tax Credits
  tds: [],
  tcs: [],
  advanceTax: [],

  // Assets
  immovableAssets: null,
  otherAssets: null,
  financialAssets: null,
  liabilities: null,
  investmentFirmLlpAop: null,

  // Metadata
  form16Metadata: [],
  taxComputation: null,
  taxIntrest: 0,
  userValidationErrors: [],
  chapterVIADeductions: null,
}

// ── Context Types ──
interface FilingContextValue {
  filing: FilingModel
  updateFiling: (updates: Partial<FilingModel>) => void
  updateSection: <K extends keyof FilingModel>(key: K, value: FilingModel[K]) => void
  resetFiling: () => void
  isDirty: boolean
}

const FilingContext = createContext<FilingContextValue | null>(null)

// ── Provider ──
export function FilingProvider({ children }: { children: ReactNode }) {
  const [filing, setFiling] = useState<FilingModel>(EMPTY_FILING)
  const [isDirty, setIsDirty] = useState(false)

  const updateFiling = useCallback((updates: Partial<FilingModel>) => {
    setFiling(prev => ({ ...prev, ...updates }))
    setIsDirty(true)
  }, [])

  const updateSection = useCallback(<K extends keyof FilingModel>(key: K, value: FilingModel[K]) => {
    setFiling(prev => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }, [])

  const resetFiling = useCallback(() => {
    setFiling(EMPTY_FILING)
    setIsDirty(false)
  }, [])

  return (
    <FilingContext.Provider value={{ filing, updateFiling, updateSection, resetFiling, isDirty }}>
      {children}
    </FilingContext.Provider>
  )
}

// ── Hook ──
export function useFilingContext() {
  const ctx = useContext(FilingContext)
  if (!ctx) throw new Error('useFilingContext must be used within a FilingProvider')
  return ctx
}
