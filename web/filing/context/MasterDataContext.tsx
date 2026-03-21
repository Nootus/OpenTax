'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

// ── Shape returned by GET /api/filing/master_data ──
export interface MasterDataOption {
  value: string
  label: string
  code?: string
  pan?: string
  fullName?: string
}

export interface MasterDataGroupedOption {
  group: string
  options: { id: string; label: string }[]
}

export interface MasterDataIdOption {
  id: string
  label: string
}

export interface MasterData {
  // Personal Details / Address
  states: MasterDataOption[]
  countries: MasterDataOption[]
  residentialStatuses: MasterDataOption[]
  accountTypes: MasterDataOption[]
  // Salary
  employerTypes: MasterDataOption[]
  salary171Components: MasterDataGroupedOption[]
  salary172Components: MasterDataIdOption[]
  salary173Components: MasterDataIdOption[]
  // House Property
  propertyTypes: MasterDataOption[]
  ownershipTypes: MasterDataOption[]
  tenantIdentifierTypes: MasterDataOption[]
  coownerRelationships: MasterDataOption[]
  // Interest Income
  interestTypes: MasterDataOption[]
  providentFundTypes: MasterDataOption[]
  // Deductions – 80C
  section80cTypes: MasterDataIdOption[]
  // Deductions – Loans
  lenderTypes: MasterDataOption[]
  // Deductions – Medical (80D)
  healthInsuranceTakenFor: MasterDataOption[]
  preventiveMedicalTakenFor: MasterDataOption[]
  // Deductions – Medical (80DD, 80U)
  disabilityRelationships: MasterDataOption[]
  disabilityTypes: MasterDataOption[]
  // Deductions – Medical (80DDB)
  treatmentFor: MasterDataOption[]
  diseaseTypes: MasterDataOption[]
  seniorCitizenTypes: MasterDataOption[]
  // Deductions – 80G
  donationTypes: MasterDataOption[]
  qualifyingPercentages: MasterDataOption[]
  limitOnDeductions: MasterDataOption[]
  // Deductions – 80GGA
  clauseTypes: MasterDataOption[]
  // Shared
  paymentModes: MasterDataOption[]
  quarters: MasterDataOption[]
  // Tax Credits – TDS
  tdsIncomeSources: MasterDataOption[]
  tdsSections: MasterDataOption[]
  // Tax Credits – TCS
  tcsNatureOfCollections: MasterDataOption[]
  // Tax Credits – Self / Advance
  taxPaymentTypes: MasterDataOption[]
  // ITR Preview
  returnFileSections: MasterDataOption[]
  // Assets & Liabilities
  liabilityTypes: MasterDataOption[]
}

// ── Empty default (all arrays empty) ──
const EMPTY: MasterData = {
  states: [],
  countries: [],
  residentialStatuses: [],
  accountTypes: [],
  employerTypes: [],
  salary171Components: [],
  salary172Components: [],
  salary173Components: [],
  propertyTypes: [],
  ownershipTypes: [],
  tenantIdentifierTypes: [],
  coownerRelationships: [],
  interestTypes: [],
  providentFundTypes: [],
  section80cTypes: [],
  lenderTypes: [],
  healthInsuranceTakenFor: [],
  preventiveMedicalTakenFor: [],
  disabilityRelationships: [],
  disabilityTypes: [],
  treatmentFor: [],
  diseaseTypes: [],
  seniorCitizenTypes: [],
  donationTypes: [],
  qualifyingPercentages: [],
  limitOnDeductions: [],
  clauseTypes: [],
  paymentModes: [],
  quarters: [],
  tdsIncomeSources: [],
  tdsSections: [],
  tcsNatureOfCollections: [],
  taxPaymentTypes: [],
  returnFileSections: [],
  liabilityTypes: [],
}

const MasterDataContext = createContext<MasterData>(EMPTY)

export function MasterDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<MasterData>(EMPTY)

  useEffect(() => {
    fetch(`${API_BASE}/api/filing/master_data`)
      .then((res) => {
        if (!res.ok) throw new Error(`master_data ${res.status}`)
        return res.json()
      })
      .then((json: MasterData) => setData(json))
      .catch((err) => console.error('[MasterData] fetch failed:', err))
  }, [])

  return (
    <MasterDataContext.Provider value={data}>
      {children}
    </MasterDataContext.Provider>
  )
}

export function useMasterData(): MasterData {
  return useContext(MasterDataContext)
}
