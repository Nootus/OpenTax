import { EmployerAddressModel } from "./employer-address-model"
import { EmploymentPeriodModel } from "./employment-period-model"
import { SalarySection172Model } from "./salary-section-172-model"
import { EmployerModel } from "./employer-model"
import { SalarySection171Model } from "./salary-section-171-model"
import { SalaryDeduction16Model } from "./salary-deduction-16-model"
import { SalarySection173Model } from "./salary-section-173-model"

export interface SalaryModel {
    employer: EmployerModel
    employerAddress: EmployerAddressModel
    employmentPeriod: EmploymentPeriodModel
    salaryDeduction16: SalaryDeduction16Model
    salarySection171: SalarySection171Model[]
    salarySection172: SalarySection172Model[]
    salarySection173: SalarySection173Model[]
  }

  // Props for SalaryIncomeWidget component
  export interface SalaryIncomeWidgetProps {
    isOpen: boolean
    onClose: () => void
    filingId: number | null
    entityId?: number | string
    initialData?: Record<string, any> | null
    onSuccess?: (action: 'created' | 'updated', data: any) => void
    errorField?: string | null
    errorMessage?: string | null  // Error message to display for the field
    fieldErrors?: Record<string, string> | null  // Multiple field errors: { fieldName: errorMessage }
  }
  

  
  export interface SalaryMasterData {
    states?: Array<{ value: string; label: string }>
    countries?: Array<{ value: string; label: string }>
    employerTypes?: Array<{ value: string; label: string }>
    salarySection16Components?: Array<{ id: string | number; label: string }>
    salarySection171Components?: Array<{ // New grouped format
      group: string
      options: Array<{ id: string | number; label: string }>
    }>
    salarySection172Components?: Array<{ id: string | number; label: string }>
    salarySection173Components?: Array<{ id: string | number; label: string }>
  }
