/**
 * Section 80U Deduction Interface (Person with Disability)
 * Mirrors: section_80u in FilingModel
 */

export interface Deduction80UModel {
  deductionId?: number | null
  filingId: number
  disabilityType: string  // "Disabled" / "Severely Disabled"
  expenditureIncurred: number
}



export const INITIAL_80U_FORM_DATA: Deduction80UModel = {
  deductionId: null,
  filingId: 0,
  disabilityType: '',
  expenditureIncurred: 0,
}
