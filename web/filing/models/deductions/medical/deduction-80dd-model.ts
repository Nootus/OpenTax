/**
 * Section 80DD Deduction Interface (Disabled Dependant)
 * Mirrors: section_80dd in FilingModel
 */

export interface Deduction80DDModel {
  deductionId?: number | null
  filingId?: number | null
  dependantName: string
  disabilityType: string  // "Disabled" / "Severely Disabled"
  natureOfDisability?: string | null
  relationToDependant: string
  dependantPan?: string | null
  expenditureIncurred: number
  form101aFilingDate?: Date | null
  form101aAckNo?: string | null
  udidNo?: string | null
}


export const INITIAL_80DD_FORM_DATA: Deduction80DDModel = {
  deductionId: null,
  filingId: null,
  dependantName: '',
  dependantPan: '',
  relationToDependant: '',
  disabilityType: '',
  natureOfDisability: null,
  expenditureIncurred: 0,
  form101aFilingDate: null,
  form101aAckNo: null,
  udidNo: null,
}
