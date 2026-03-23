/**
 * Section 80D Deduction Interfaces (Health Insurance)
 * Mirrors: section_80d in FilingModel
 * 
 * API Response Structure:
 * {
 *   deduction_id, filing_id,
 *   health_insurance: [{ health_id, deduction_id, filing_id, taken_for, includes_senior_citizen, policy_number, health_insurance_premium, insurer_name }],
 *   preventive_checkup: [{ checkup_id, deduction_id, filing_id, taken_for, includes_senior_citizen, checkup_amount }],
 *   medical_expenditure: [{ expenditure_id, deduction_id, filing_id, taken_for, includes_senior_citizen, expenditure_amount }]
 * }
 */

/**
 * Health Insurance Model (Deduction80DHealthInsuranceModel)
 */
export interface Deduction80DHealthInsuranceModel {
  healthId?: number | null
  deductionId?: number | null
  filingId: number
  takenFor: string  // "Self" / "Self & Family" / "Parents"
  includesSeniorCitizen: boolean
  policyNumber?: string | null
  healthInsurancePremium: number
  insurerName?: string | null
}

/**
 * Preventive Checkup Model (Deduction80DPreventiveCheckupModel)
 */
export interface Deduction80DPreventiveCheckupModel {
  checkupId?: number | null
  deductionId?: number | null
  filingId: number
  takenFor: string  // "Self" / "Self & Family" / "Parents"
  includesSeniorCitizen: boolean
  checkupAmount: number
}

/**
 * Medical Expenditure Model (Deduction80DMedicalExpenditureModel)
 */
export interface Deduction80DMedicalExpenditureModel {
  expenditureId?: number | null
  deductionId?: number | null
  filingId: number
  takenFor: string  // "Self" / "Self & Family" / "Parents"
  includesSeniorCitizen: boolean
  expenditureAmount: number
}

/**
 * Complete 80D Model
 */
export interface Deduction80DModel {
  deductionId?: number | null
  filingId?: number | null
  healthInsurance?: Deduction80DHealthInsuranceModel[] | null
  preventiveCheckup?: Deduction80DPreventiveCheckupModel[] | null
  medicalExpenditure?: Deduction80DMedicalExpenditureModel[] | null
}




export const INITIAL_80D_FORM_DATA: Deduction80DModel = {
  deductionId: null,
  filingId: 0,
  healthInsurance: [],
  preventiveCheckup: [],
  medicalExpenditure: [],
}

export const INITIAL_HEALTH_INSURANCE_ITEM: Deduction80DHealthInsuranceModel = {
  healthId: null,
  deductionId: null,
  filingId: 0,
  takenFor: '',
  includesSeniorCitizen: false,
  policyNumber: null,
  healthInsurancePremium: 0,
  insurerName: null,
}

export const INITIAL_PREVENTIVE_CHECKUP_FORM_DATA: Deduction80DPreventiveCheckupModel = {
  checkupId: null,
  deductionId: null,
  filingId: 0,
  takenFor: '',
  includesSeniorCitizen: false,
  checkupAmount: 0,
}

export const INITIAL_MEDICAL_EXPENDITURE_FORM_DATA: Deduction80DMedicalExpenditureModel = {
  expenditureId: null,
  deductionId: null,
  filingId: 0,
  takenFor: '',
  includesSeniorCitizen: false,
  expenditureAmount: 0,
}
