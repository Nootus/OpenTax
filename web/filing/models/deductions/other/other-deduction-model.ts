import { Deduction80CCHModel } from "./deduction-80cch-model"
import { Deduction80GGModel } from "./deduction-80gg-model"

import { Deduction80TTAModel } from "./deduction-80tta-model"
import { Deduction80TTBModel } from "./deduction-80ttb-model"

export interface OtherDeductionModel {
    filingId: number | null
    deduction80Cch: Deduction80CCHModel
    deduction80Gg: Deduction80GGModel

    deduction80Tta: Deduction80TTAModel
    deduction80Ttb: Deduction80TTBModel
}
export const INITIAL_OTHER_DEDUCTION_FORM_DATA: OtherDeductionModel = {
    filingId: null,
    deduction80Cch: {
        deductionId: null,
        filingId: null,
        contributionAmount: 0,
    },
    deduction80Gg: {
        deductionId: null,
        filingId: null,
        rentPaidAmount: 0,
    },
    deduction80Tta: {
        deductionId: null,
        filingId: null,
        interestAmount: 0,
    },
    deduction80Ttb: {
        deductionId: null,
        filingId: null,
        interestAmount: 0,
    },
}
export interface OtherDeductionWidgetProps {
    isOpen: boolean
    onClose: () => void
    filingId: number | null
    entityId: number | null
    initialData: OtherDeductionModel | null
    onSuccess: () => void
    errorField?: string | null
    errorMessage?: string | null  // Error message to display for the field
    fieldErrors?: Record<string, string> | null  // Multiple field errors: { fieldName: errorMessage }
}
