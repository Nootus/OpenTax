/**
 * Filing Model - Root Level
 * Complete hierarchical structure of the FilingModel
 * All field names use camelCase convention
 */

// Personal Details
import { PersonDetailsModel } from './person/person-details-model'
import { AddressModel } from './person/person-address-model'
import { BankAccountModel } from './person/bank-account-model'

// Deductions - Popular
import { Deduction80CModel } from './deductions/popular/deduction-80c-model'
import { Deduction80CCCModel } from './deductions/popular/deduction-80ccc-model'
import { Deduction80CCD1Model } from './deductions/popular/deduction-80ccd1-model'
import { Deduction80CCD1BModel } from './deductions/popular/deduction-80ccd1b-model'
import { Deduction80CCD2Model } from './deductions/popular/deduction-80ccd2-model'

// Deductions - Donations
import { Deduction80GModel } from './deductions/donation/deduction-80g-model'
import { Deduction80GGAModel } from './deductions/donation/deduction-80gga-model'
import { Deduction80GGCModel } from './deductions/donation/deduction-80ggc-model'

// Deductions - Loans
import { Deduction80EModel } from './deductions/loan/deduction-80e-model'
import { Deduction80EEModel } from './deductions/loan/deduction-80ee-model'
import { Deduction80EEAModel } from './deductions/loan/deduction-80eea-model'
import { Deduction80EEBModel } from './deductions/loan/deduction-80eeb-model'

// Deductions - Medical
import { Deduction80DModel } from './deductions/medical/deduction-80d-model'
import { Deduction80DDModel } from './deductions/medical/deduction-80dd-model'
import { Deduction80DDBModel } from './deductions/medical/deduction-80ddb-model'
import { Deduction80UModel } from './deductions/medical/deduction-80u-model'

// Deductions - Other
import { Deduction80CCHModel } from './deductions/other/deduction-80cch-model'
import { Deduction80GGModel } from './deductions/other/deduction-80gg-model'
import { Deduction80QQBModel } from './deductions/other/deduction-80qqb-model'
import { Deduction80RRBModel } from './deductions/other/deduction-80rrb-model'
import { Deduction80TTAModel } from './deductions/other/deduction-80tta-model'
import { Deduction80TTBModel } from './deductions/other/deduction-80ttb-model'
import { OtherDeductionModel } from './deductions/other/other-deduction-model'

// Income
import { SalaryModel } from './income/salary/salary-model'
import { PropertyModel } from './income/house-property/property-model'
import { CapitalGainsSecuritiesModel } from './income/capital-gains/capital-gains-securities-model'
import { CapitalGainsRealEstateModel } from './income/capital-gains/cg-real-estate-property-model'
import { ForeignCapitalGains } from './income/capital-gains/foreign-capital-gains-model'
import { MovableCapitalGainsWithImprovements } from './income/capital-gains/movable-capital-gains-wrapper-model'
import { DeemedCapitalGainsModel } from './income/capital-gains/deemed-capital-gains-model'

// Tax Credits
import { TDSModel } from './tax-credits/tds-model'
import { TCSModel } from './tax-credits/tcs-model'
import { TaxPaidSelfModel } from './tax-credits/tax-paid-self-model'
import { TaxComputationModel } from './tax-computation-model'
import type { ImmovableAsset } from './assets/immovable-asset-model'
import type { OtherAsset } from './assets/other-asset-model'
import type { FinancialAsset } from './assets/financial-asset-model'
import type { Liability } from './assets/liability-model'
import type { PartnershipInvestment } from './assets/partnership-investment-model'
import { InterestIncomeModel } from './income/interest-income-model'
import { EquityCompensationIncomeModel } from './income/dividend/equity-compensation-income-model'
import { DividendIncomeModel } from './income/dividend/dividend-income-model'
import { ExemptIncomeModel } from './income/exempt-income-model'
import { LotteryOnlineGamingAggregatedModel as LotteryOnlineGamingModel } from './income/lottery-online-gaming-wrapper-model'
import { AgriculturalIncomeModel } from './income/agricultural-income-model'
import { ForeignIncomeModel } from './income/foreign-income-model'

// Form16 Metadata
export interface Form16Metadata {
  filingId: number
  form16UploadId?: number | null
  certificateNumber?: string | null
  processingDate?: string | null
  assessmentYear?: string | null
  citName?: string | null
  citAddressLine1?: string | null
  citAddressLine2?: string | null
  partATotalTaxDeposited: number
  verificationAuthorizedPerson?: string | null
  verificationFatherName?: string | null
  verificationDesignation?: string | null
  verificationPlace?: string | null
  verificationDate?: string | null
  verificationFullName?: string | null
}


/**
 * Validation Error Model - for backend validation errors
 */
export interface ValidationErrorModel {
  field: string
  message: string
  entityId?: number
}

/**
 * Complete Filing Model
 */
export interface FilingModel {
  // ############# Metadata #############
  filingId: number
  assessmentYear?: string | null
  regime?: string | null

  // ############# Personal Details #############
  person?: PersonDetailsModel | null
  personAddress?: AddressModel | null
  bankAccount: BankAccountModel[]

  // ############# Deduction Sections - Popular #############
  section80C: Deduction80CModel[]
  section80Ccc: Deduction80CCCModel[]
  section80Ccd1: Deduction80CCD1Model[]
  section80Ccd1B: Deduction80CCD1BModel[]
  section80Ccd2: Deduction80CCD2Model[]

  // ############# Deduction Sections - Donations #############
  section80G: Deduction80GModel[]
  section80Gga: Deduction80GGAModel[]
  section80Ggc: Deduction80GGCModel[]

  // ############# Deduction Sections - Loans #############
  section80E: Deduction80EModel[]
  section80Ee?: Deduction80EEModel | null
  section80Eea?: Deduction80EEAModel | null
  section80Eeb?: Deduction80EEBModel | null

  // ############# Deduction Sections - Medical #############
  section80D?: Deduction80DModel | null
  section80Dd?: Deduction80DDModel | null
  section80Ddb?: Deduction80DDBModel | null
  section80U?: Deduction80UModel | null

  // ############# Deduction Sections - Other #############
  section80Cch?: Deduction80CCHModel | null
  section80Gg?: Deduction80GGModel | null
  section80Qqb?: Deduction80QQBModel | null
  section80Rrb?: Deduction80RRBModel | null
  section80Tta?: Deduction80TTAModel | null
  section80Ttb?: Deduction80TTBModel | null
  otherDeductions?: OtherDeductionModel | null
  // ############# Income Sections #############
  salary: SalaryModel[]
  houseProperty: PropertyModel[]
  interestIncome: InterestIncomeModel[]
  equityCompensationIncome?: EquityCompensationIncomeModel | null
  foreignIncome?: ForeignIncomeModel | null
  capitalGainsSecurities?: CapitalGainsSecuritiesModel | null
  agriculturalIncome?: AgriculturalIncomeModel | null
  capitalGainsRealEstate?: CapitalGainsRealEstateModel | null
  capitalGainsForeign?: ForeignCapitalGains[] | null
  capitalGainsMovable?: MovableCapitalGainsWithImprovements | null
  capitalGainsDeemed?: DeemedCapitalGainsModel | null

  // ############# Tax Credits #############
  tds: TDSModel[]
  tcs: TCSModel[]
  advanceTax: TaxPaidSelfModel[]

  // ############# Dividend Income #############
  dividendIncome?: DividendIncomeModel | null
  exemptIncome?: ExemptIncomeModel | null
  lotteryOnlineGaming?: LotteryOnlineGamingModel | null

  // ############# Assets and Liabilities #############
  immovableAssets?: ImmovableAsset[] | null
  otherAssets?: OtherAsset[] | null
  financialAssets?: FinancialAsset[] | null
  liabilities?: Liability[] | null
  investmentFirmLlpAop?: PartnershipInvestment[] | null

  // ############# Form16 Metadata #############
  form16Metadata: Form16Metadata[]
  taxComputation?: TaxComputationModel | null

  // Total penal interest + late fee (234A/234B/234C/234F) from ITR build
  taxIntrest?: number

  // ############# User Validation Errors #############
  // User validation errors - for left panel (incomplete/invalid user input)
  userValidationErrors?: ValidationErrorModel[]

  // ############# Chapter VIA Deductions Breakdown #############
  chapterVIADeductionsNew?: ChapterVIADeductions | null
  chapterVIADeductionsOld?: ChapterVIADeductions | null
}

export interface DeductionAmount {
  claimed: number
  maxAllowed: number
  allowed: number
}

export interface ChapterVIADeductions {
  section80C?: DeductionAmount
  section80Ccc?: DeductionAmount
  section80Ccd1?: DeductionAmount
  section80Ccd1B?: DeductionAmount
  section80Ccd2?: DeductionAmount
  section80D?: DeductionAmount
  section80Dd?: DeductionAmount
  section80Ddb?: DeductionAmount
  section80E?: DeductionAmount
  section80Ee?: DeductionAmount
  section80Eea?: DeductionAmount
  section80Eeb?: DeductionAmount
  section80Tta?: DeductionAmount
  section80Ttb?: DeductionAmount
  section80G?: DeductionAmount
  section80Gg?: DeductionAmount
  section80Gga?: DeductionAmount
  section80Ggc?: DeductionAmount
  section80U?: DeductionAmount
  section80Cch?: DeductionAmount
  section80Qqb?: DeductionAmount
  section80Rrb?: DeductionAmount
}
