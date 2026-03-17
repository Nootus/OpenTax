/**
 * Section 80DDB Deduction Interface (Medical Treatment)
 * Mirrors: section_80ddb in FilingModel
 */

export interface Deduction80DDBModel {
  deductionId?: number | null
  filingId: number | null
  treatmentFor: string  // "Self" / "Dependant"
  seniorCitizenType?: string | null  // "Self" / "Dependant"
  disease?: string | null
  expenditureIncurred: number
}


export const INITIAL_80DDB_FORM_DATA: Deduction80DDBModel = {
  deductionId: null,
  filingId: null,
  treatmentFor: 'Self',
  seniorCitizenType: 'Self  ',
  disease: '',
  expenditureIncurred: 0,
}
