/**
 * ITR-1 (SAHAJ) TypeScript Model
 * Mirrors itr_api/domain/filing/itr/itr1/models/itr1_model.py
 * Schema: ITR-1_2025_Main_V1.2.json
 */

// ─── Enums ───────────────────────────────────────────────

export type EmployerCategory = 'CGOV' | 'SGOV' | 'PSU' | 'PE' | 'PESG' | 'PEPS' | 'PEO' | 'OTH' | 'NA'
export type AccountType = 'SB' | 'CA' | 'CC' | 'OD' | 'NRO' | 'OTH'
export type LoanTknFrom = 'B' | 'I'
export type Capacity = 'S' | 'R'
export type ReturnFileSec = 11 | 12 | 13 | 14 | 16 | 17 | 18 | 20 | 21

// ─── Creation & Form Info ────────────────────────────────

export interface CreationInfo {
  SWVersionNo: string
  SWCreatedBy: string
  JSONCreatedBy: string
  JSONCreationDate: string
  IntermediaryCity: string
  Digest: string
}

export interface FormITR1 {
  FormName: string
  Description: string
  AssessmentYear: string
  SchemaVer: string
  FormVer: string
}

// ─── Personal Info ───────────────────────────────────────

export interface AssesseeName {
  FirstName?: string | null
  MiddleName?: string | null
  SurNameOrOrgName: string
}

export interface ITR1Address {
  ResidenceNo: string
  ResidenceName?: string | null
  RoadOrStreet?: string | null
  LocalityOrArea: string
  CityOrTownOrDistrict: string
  StateCode: string
  CountryCode: string
  PinCode?: number | null
  ZipCode?: string | null
  CountryCodeMobile: number
  MobileNo: number
  EmailAddress: string
}

export interface PersonalInfo {
  AssesseeName: AssesseeName
  PAN: string
  Address: ITR1Address
  DOB: string
  EmployerCategory: EmployerCategory
  AadhaarCardNo?: string | null
}

// ─── Filing Status ───────────────────────────────────────

export interface Clauseiv7provisio139iType {
  clauseiv7provisio139iNature: '1' | '2'
  clauseiv7provisio139iAmount: number
}

export interface FilingStatus {
  ReturnFileSec: ReturnFileSec
  OptOutNewTaxRegime: string
  SeventhProvisio139?: string | null
  IncrExpAggAmt2LkTrvFrgnCntryFlg?: string | null
  AmtSeventhProvisio139ii?: number | null
  IncrExpAggAmt1LkElctrctyPrYrFlg?: string | null
  AmtSeventhProvisio139iii?: number | null
  clauseiv7provisio139i?: string | null
  clauseiv7provisio139iDtls?: Clauseiv7provisio139iType[] | null
  ReceiptNo?: string | null
  NoticeNo?: string | null
  OrigRetFiledDate?: string | null
  NoticeDateUnderSec?: string | null
  ItrFilingDueDate: string
}

// ─── Allowances & Exempt Income ──────────────────────────

export interface AllwncExemptUs10Dtl {
  SalNatureDesc: string
  SalOthNatOfInc?: string | null
  SalOthAmount: number
}

export interface AllwncExemptUs10 {
  AllwncExemptUs10Dtls?: AllwncExemptUs10Dtl[] | null
  TotalAllwncExemptUs10: number
}

export interface NOT89AType {
  NOT89ACountrycode: 'US' | 'UK' | 'CA'
  NOT89AAmount: number
}

// ─── Date Range (Dividend / NOT89A breakdowns) ───────────

export interface DateRangeModel {
  Upto15Of6: number
  Upto15Of9: number
  Up16Of9To15Of12: number
  Up16Of12To15Of3: number
  Up16Of3To31Of3: number
}

export interface DateRangeType {
  DateRange: DateRangeModel
}

export interface OtherSourceIncome {
  OthSrcNatureDesc: string
  NOT89A?: NOT89AType[] | null
  OthSrcOthNatOfInc?: string | null
  OthSrcOthAmount: number
  DividendInc?: DateRangeType | null
  NOT89AInc?: DateRangeType | null
}

export interface OthersInc {
  OthersIncDtlsOthSrc?: OtherSourceIncome[] | null
}

export interface ExemptIncAgriOthUs10Dtl {
  NatureDesc: string
  OthNatOfInc?: string | null
  OthAmount: number
}

export interface ExemptIncAgriOthUs10 {
  ExemptIncAgriOthUs10Dtls?: ExemptIncAgriOthUs10Dtl[] | null
  ExemptIncAgriOthUs10Total: number
}

// ─── Deductions (Chapter VI-A) ───────────────────────────

export interface DeductUndChapVIA {
  Section80C: number
  Section80CCC: number
  Section80CCDEmployeeOrSE: number
  Section80CCD1B: number
  Section80CCDEmployer: number
  Section80D: number
  Section80DD: number
  Section80DDB: number
  Section80E: number
  Section80EE: number
  Section80EEA: number
  Section80EEB: number
  Section80G: number
  Section80GG: number
  Section80GGA: number
  Section80GGC: number
  Section80U: number
  Section80TTA: number
  Section80TTB: number
  AnyOthSec80CCH: number
  TotalChapVIADeductions: number
}

export interface UsrDeductUndChapVIA extends DeductUndChapVIA {
  PRANNum?: string | null
  Section80DDBUsrType?: string | null
  NameOfSpecDisease80DDB?: string | null
  Form10BAAckNum?: string | null
}

// ─── Income & Deductions (Part B) ────────────────────────

export interface ITR1IncomeDeductions {
  GrossSalary: number
  Salary?: number | null
  PerquisitesValue?: number | null
  ProfitsInSalary?: number | null
  IncomeNotified89A: number
  IncomeNotified89AType?: NOT89AType[] | null
  IncomeNotifiedOther89A?: number | null
  AllwncExemptUs10?: AllwncExemptUs10 | null
  Increliefus89A?: number | null
  NetSalary: number
  DeductionUs16: number
  DeductionUs16ia?: number | null
  EntertainmentAlw16ii?: number | null
  ProfessionalTaxUs16iii?: number | null
  IncomeFromSal: number
  TypeOfHP?: string | null
  GrossRentReceived?: number | null
  TaxPaidlocalAuth?: number | null
  AnnualValue: number
  StandardDeduction: number
  InterestPayable?: number | null
  ArrearsUnrealizedRentRcvd?: number | null
  TotalIncomeOfHP: number
  IncomeOthSrc: number
  OthersInc?: OthersInc | null
  DeductionUs57iia?: number | null
  Increliefus89AOS?: number | null
  GrossTotIncome: number
  GrossTotIncomeIncLTCG112A: number
  UsrDeductUndChapVIA: UsrDeductUndChapVIA
  DeductUndChapVIA: DeductUndChapVIA
  TotalIncome: number
  ExemptIncAgriOthUs10?: ExemptIncAgriOthUs10 | null
}

// ─── Tax Computation (Part D) ────────────────────────────

export interface IntrstPay {
  IntrstPayUs234A: number
  IntrstPayUs234B: number
  IntrstPayUs234C: number
  LateFilingFee234F: number
}

export interface ITR1TaxComputation {
  TotalTaxPayable: number
  Rebate87A: number
  TaxPayableOnRebate: number
  EducationCess: number
  GrossTaxLiability: number
  Section89: number
  NetTaxLiability: number
  TotalIntrstPay: number
  IntrstPay: IntrstPay
  TotTaxPlusIntrstPay: number
}

// ─── Tax Paid (Part E) ──────────────────────────────────

export interface TaxesPaid {
  AdvanceTax: number
  TDS: number
  TCS: number
  SelfAssessmentTax: number
  TotalTaxesPaid: number
}

export interface TaxPaid {
  TaxesPaid: TaxesPaid
  BalTaxPayable: number
}

// ─── Refund ──────────────────────────────────────────────

export interface BankDetailType {
  IFSCCode: string
  BankName: string
  BankAccountNo: string
  AccountType: AccountType
  UseForRefund: 'true' | 'false'
}

export interface BankAccountDtls {
  AddtnlBankDetails?: BankDetailType[] | null
}

export interface Refund {
  RefundDue: number
  BankAccountDtls: BankAccountDtls
}

// ─── TDS Schedules ───────────────────────────────────────

export interface EmployerOrDeductorOrCollectDetl {
  TAN: string
  EmployerOrDeductorOrCollecterName: string
}

export interface TDSonSalary {
  EmployerOrDeductorOrCollectDetl: EmployerOrDeductorOrCollectDetl
  IncChrgSal: number
  TotalTDSSal: number
}

export interface TDSonOthThanSal {
  EmployerOrDeductorOrCollectDetl: EmployerOrDeductorOrCollectDetl
  TDSSection: string
  AmtForTaxDeduct: number
  DeductedYr: string
  TotTDSOnAmtPaid: number
  ClaimOutOfTotTDSOnAmtPaid: number
}

export interface TDS3Details {
  PANofTenant: string
  AadhaarofTenant?: string | null
  TDSSection: string
  NameOfTenant: string
  GrsRcptToTaxDeduct: number
  DeductedYr: string
  TDSDeducted: number
  TDSClaimed: number
}

export interface TC {
  EmployerOrDeductorOrCollectDetl: EmployerOrDeductorOrCollectDetl
  AmtTaxCollected: number
  CollectedYr: string
  TotalTCS: number
  AmtTCSClaimedThisYear: number
}

export interface TaxPayment {
  BSRCode: string
  DateDep: string
  SrlNoOfChaln: number
  Amt: number
}

// ─── Schedule 80C ────────────────────────────────────────

export interface Schedule80CDtl {
  Amount: number
  IdentificationNo: string
}

export interface Schedule80C {
  Schedule80CDtls: Schedule80CDtl[]
  TotalAmt: number
}

// ─── Schedule 80D (Health Insurance) ─────────────────────

export interface Sch80DInsDtls {
  InsurerName?: string | null
  PolicyNo?: string | null
  HealthInsAmt: number
}

export interface Sec80DSelfFamSrCtznHealth {
  SeniorCitizenFlag: string
  SelfAndFamily?: number | null
  HealthInsPremSlfFam?: number | null
  Sec80DSelfFamHIDtls?: { Sch80DInsDtls: Sch80DInsDtls[]; TotalPayments: number } | null
  PrevHlthChckUpSlfFam?: number | null
  SelfAndFamilySeniorCitizen?: number | null
  HlthInsPremSlfFamSrCtzn?: number | null
  Sec80DSelfFamSrCtznHIDtls?: { Sch80DInsDtls: Sch80DInsDtls[]; TotalPayments: number } | null
  PrevHlthChckUpSlfFamSrCtzn?: number | null
  MedicalExpSlfFamSrCtzn?: number | null
  ParentsSeniorCitizenFlag: string
  Parents?: number | null
  HlthInsPremParents?: number | null
  Sec80DParentsHIDtls?: { Sch80DInsDtls: Sch80DInsDtls[]; TotalPayments: number } | null
  PrevHlthChckUpParents?: number | null
  ParentsSeniorCitizen?: number | null
  HlthInsPremParentsSrCtzn?: number | null
  Sec80DParentsSrCtznHIDtls?: { Sch80DInsDtls: Sch80DInsDtls[]; TotalPayments: number } | null
  PrevHlthChckUpParentsSrCtzn?: number | null
  MedicalExpParentsSrCtzn?: number | null
  EligibleAmountOfDedn: number
}

export interface Schedule80D {
  Sec80DSelfFamSrCtznHealth: Sec80DSelfFamSrCtznHealth
}

// ─── Schedule 80DD (Disabled Dependent) ──────────────────

export interface Schedule80DD {
  NatureOfDisability: string
  TypeOfDisability: string
  DeductionAmount: number
  DependentType: string
  DependentPan?: string | null
  DependentAadhaar?: string | null
  Form10IAAckNum?: string | null
  UDIDNum?: string | null
}

// ─── Schedule 80U (Disability Self) ──────────────────────

export interface Schedule80U {
  NatureOfDisability: string
  TypeOfDisability: string
  DeductionAmount: number
  Form10IAAckNum?: string | null
  UDIDNum?: string | null
}

// ─── Schedule 80E (Education Loan) ───────────────────────

export interface Schedule80EDtl {
  LoanTknFrom: LoanTknFrom
  BankOrInstnName: string
  LoanAccNoOfBankOrInstnRefNo: string
  DateofLoan?: string | null
  TotalLoanAmt: number
  LoanOutstndngAmt: number
  Interest80E: number
}

export interface Schedule80E {
  Schedule80EDtls: Schedule80EDtl[]
  TotalInterest80E: number
}

// ─── Schedule 80EE (Home Loan Interest) ──────────────────

export interface Schedule80EEDtl {
  LoanTknFrom: LoanTknFrom
  BankOrInstnName: string
  LoanAccNoOfBankOrInstnRefNo: string
  DateofLoan?: string | null
  TotalLoanAmt: number
  LoanOutstndngAmt: number
  Interest80EE: number
}

export interface Schedule80EE {
  Schedule80EEDtls: Schedule80EEDtl[]
  TotalInterest80EE: number
}

// ─── Schedule 80EEA (Affordable Housing) ─────────────────

export interface Schedule80EEADtl {
  LoanTknFrom: LoanTknFrom
  BankOrInstnName: string
  LoanAccNoOfBankOrInstnRefNo: string
  DateofLoan?: string | null
  TotalLoanAmt: number
  LoanOutstndngAmt: number
  Interest80EEA: number
}

export interface Schedule80EEA {
  PropStmpDtyVal: number
  Schedule80EEADtls: Schedule80EEADtl[]
  TotalInterest80EEA: number
}

// ─── Schedule 80EEB (Electric Vehicle) ───────────────────

export interface Schedule80EEBDtl {
  LoanTknFrom: LoanTknFrom
  BankOrInstnName: string
  LoanAccNoOfBankOrInstnRefNo: string
  DateofLoan?: string | null
  TotalLoanAmt: number
  LoanOutstndngAmt: number
  VehicleRegNo: string
  Interest80EEB: number
}

export interface Schedule80EEB {
  Schedule80EEBDtls: Schedule80EEBDtl[]
  TotalInterest80EEB: number
}

// ─── Schedule Us24B (Housing Loan Interest) ──────────────

export interface ScheduleUs24BDtl {
  LoanTknFrom: LoanTknFrom
  BankOrInstnName: string
  LoanAccNoOfBankOrInstnRefNo: string
  DateofLoan: string
  TotalLoanAmt: number
  LoanOutstndngAmt: number
  InterestUs24B: number
}

export interface ScheduleUs24B {
  ScheduleUs24BDtls: ScheduleUs24BDtl[]
  TotalInterestUs24B: number
}

// ─── Schedule EA 10/13A (HRA Exemption) ──────────────────

export interface ScheduleEA1013A {
  Placeofwork: '1' | '2'
  ActlHRARecv: number
  ActlRentPaid: number
  DtlsSalUsSec171: number
  BasicSalary: number
  DearnessAllwnc?: number | null
  ActlRentPaid10Per: number
  Sal40Or50Per: number
  EligbleExmpAllwncUs13A: number
}

// ─── Schedule 80G (Donations) ────────────────────────────

export interface AddressDetail {
  AddrDetail: string
  CityOrTownOrDistrict: string
  StateCode: string
  PinCode?: number | null
}

export interface DoneeWithPan {
  DoneeWithPanName: string
  DoneePAN: string
  ArnNbr?: string | null
  AddressDetail: AddressDetail
  DonationAmtCash: number
  DonationAmtOtherMode: number
  DonationAmt: number
  EligibleDonationAmt: number
}

export interface Don100Percent {
  DoneeWithPan?: DoneeWithPan[] | null
  TotDon100PercentCash: number
  TotDon100PercentOtherMode: number
  TotDon100Percent: number
  TotEligibleDon100Percent: number
}

export interface Don50PercentNoApprReqd {
  DoneeWithPan?: DoneeWithPan[] | null
  TotDon50PercentNoApprReqdCash: number
  TotDon50PercentNoApprReqdOtherMode: number
  TotDon50PercentNoApprReqd: number
  TotEligibleDon50Percent: number
}

export interface Don100PercentApprReqd {
  DoneeWithPan?: DoneeWithPan[] | null
  TotDon100PercentApprReqdCash: number
  TotDon100PercentApprReqdOtherMode: number
  TotDon100PercentApprReqd: number
  TotEligibleDon100PercentApprReqd: number
}

export interface Don50PercentApprReqd {
  DoneeWithPan?: DoneeWithPan[] | null
  TotDon50PercentApprReqdCash: number
  TotDon50PercentApprReqdOtherMode: number
  TotDon50PercentApprReqd: number
  TotEligibleDon50PercentApprReqd: number
}

export interface Schedule80G {
  Don100Percent?: Don100Percent | null
  Don50PercentNoApprReqd?: Don50PercentNoApprReqd | null
  Don100PercentApprReqd?: Don100PercentApprReqd | null
  Don50PercentApprReqd?: Don50PercentApprReqd | null
  TotalDonationsUs80GCash: number
  TotalDonationsUs80GOtherMode: number
  TotalDonationsUs80G: number
  TotalEligibleDonationsUs80G: number
}

// ─── Schedule 80GGA (Scientific Research) ────────────────

export interface DonationDtlsSciRsrchRuralDevItem {
  RelevantClauseUndrDedClaimed: string
  NameOfDonee?: string | null
  AddressDetail: AddressDetail
  DoneePAN?: string | null
  DonationAmtCash: number
  DonationAmtOtherMode: number
  DonationAmt: number
  EligibleDonationAmt: number
}

export interface Schedule80GGA {
  DonationDtlsSciRsrchRuralDev?: DonationDtlsSciRsrchRuralDevItem[] | null
  TotalDonationAmtCash80GGA: number
  TotalDonationAmtOtherMode80GGA: number
  TotalDonationsUs80GGA: number
  TotalEligibleDonationAmt80GGA: number
}

// ─── Schedule 80GGC (Political Party) ────────────────────

export interface Schedule80GGCDetail {
  DonationDate?: string | null
  DonationAmtCash: number
  DonationAmtOtherMode: number
  TransactionRefNum?: string | null
  IFSCCode?: string | null
  DonationAmt: number
  EligibleDonationAmt: number
}

export interface Schedule80GGC {
  Schedule80GGCDetails?: Schedule80GGCDetail[] | null
  TotalDonationAmtCash80GGC: number
  TotalDonationAmtOtherMode80GGC: number
  TotalDonationsUs80GGC: number
  TotalEligibleDonationAmt80GGC: number
}

// ─── LTCG u/s 112A ──────────────────────────────────────

export interface LTCG112A {
  TotSaleCnsdrn: number
  TotCstAcqisn: number
  LongCap112A: number
}

// ─── Verification ────────────────────────────────────────

export interface Declaration {
  AssesseeVerName: string
  FatherName: string
  AssesseeVerPAN: string
}

export interface Verification {
  Declaration: Declaration
  Capacity: Capacity
  Place: string
}

// ─── Tax Return Preparer ─────────────────────────────────

export interface TaxReturnPreparer {
  IdentificationNoOfTRP: string
  NameOfTRP: string
  ReImbFrmGov?: number | null
}

// ─── TDS/TCS Schedule Wrappers ───────────────────────────

export interface TDSonSalaries {
  TDSonSalary?: TDSonSalary[] | null
  TotalTDSonSalaries: number
}

export interface TDSonOthThanSals {
  TDSonOthThanSal?: TDSonOthThanSal[] | null
  TotalTDSonOthThanSals: number
}

export interface ScheduleTDS3Dtls {
  TDS3Details?: TDS3Details[] | null
  TotalTDS3Details: number
}

export interface ScheduleTCS {
  TCS?: TC[] | null
  TotalSchTCS: number
}

export interface TaxPayments {
  TaxPayment?: TaxPayment[] | null
  TotalTaxPayments: number
}

// ─── PartA 139(8A) — Updated Return ─────────────────────

export interface Applicable1398A {
  ITRForm?: string | null
  AcknowledgementNo: string
  OrigRetFiledDate: string
}

export interface ReasonsForUpdatingIncDtl {
  ReasonsForUpdatingIncome: string
}

export interface UpdatingInc {
  ReasonsForUpdatingIncDtls?: ReasonsForUpdatingIncDtl[] | null
}

export interface UnabsorbedDepreciationYearDtl {
  UnabsorbedDepreciationYear: string
  RevisedReturnFile?: string | null
  UpdatedReturnFile?: string | null
}

export interface UDYear {
  UnabsorbedDepreciationYearDtls?: UnabsorbedDepreciationYearDtl[] | null
}

export interface RetrntoRedCarriedFL {
  UnabsorbedDepreciation: string
  UDYear?: UDYear | null
}

export interface PartA1398A {
  PAN: string
  Name: string
  AadhaarCardNo?: string | null
  AssessmentYear: string
  PreviouslyFiledForThisAY: string
  PreviouslyFiledForThisAY_139_8A?: string | null
  Applicable_139_8A?: Applicable1398A | null
  LaidOutIn_139_8A: string
  ITRFormUpdatingInc: string
  UpdatingInc?: UpdatingInc | null
  UpdatedReturnDuringPeriod: string
  RetrntoRedCarriedFL?: RetrntoRedCarriedFL | null
}

// ─── PartB-ATI — Additional Tax Info (Updated Return) ────

export interface HeadOfInc {
  Salaries?: number | null
  IncomeFromHP?: number | null
  IncomeFromBP?: number | null
  IncomeFromCG?: number | null
  IncomeFromOS?: number | null
  Total?: number | null
}

export interface ITTaxPayment {
  slno?: number | null
  BSRCode: string
  DateDep: string
  SrlNoOfChaln: number
  Amt: number
}

export interface ITTaxPaymentsInfo {
  ITTaxPayments?: ITTaxPayment[] | null
}

export interface ScheduleIT1 {
  TaxPayment1?: ITTaxPaymentsInfo | null
  Total: number
}

export interface ScheduleIT2 {
  TaxPayment2?: ITTaxPaymentsInfo | null
  Total: number
}

export interface PartBATI {
  HeadOfInc?: HeadOfInc | null
  LatestTotInc?: number | null
  UpdatedTotInc: number
  AmtPayable: number
  AmtRefundable?: number | null
  LastAmtPayable?: number | null
  Refund?: number | null
  TotRefund?: number | null
  FeeIncUS234F: number
  RegAssessementTAX?: number | null
  AggrLiabilityRefund: number
  AggrLiabilityNoRefund: number
  AddtnlIncTax: number
  NetPayable: number
  TaxUS140B: number
  TaxDue10_11: number
  ScheduleIT1?: ScheduleIT1 | null
  ScheduleIT2?: ScheduleIT2 | null
  ReleifUS89: number
}

// ─── Root ITR1 Model ─────────────────────────────────────

export interface ITR1Model {
  CreationInfo: CreationInfo
  Form_ITR1: FormITR1
  PartA_139_8A?: PartA1398A | null
  PartB_ATI?: PartBATI | null
  PersonalInfo: PersonalInfo
  FilingStatus: FilingStatus
  ITR1_IncomeDeductions: ITR1IncomeDeductions
  ITR1_TaxComputation?: ITR1TaxComputation | null
  TaxPaid: TaxPaid
  Refund: Refund
  Schedule80G?: Schedule80G | null
  Schedule80GGA?: Schedule80GGA | null
  Schedule80GGC?: Schedule80GGC | null
  Schedule80D?: Schedule80D | null
  Schedule80DD?: Schedule80DD | null
  Schedule80U?: Schedule80U | null
  Schedule80E?: Schedule80E | null
  Schedule80EE?: Schedule80EE | null
  Schedule80EEA?: Schedule80EEA | null
  Schedule80EEB?: Schedule80EEB | null
  Schedule80C?: Schedule80C | null
  ScheduleUs24B?: ScheduleUs24B | null
  ScheduleEA10_13A?: ScheduleEA1013A | null
  TDSonSalaries?: TDSonSalaries | null
  TDSonOthThanSals?: TDSonOthThanSals | null
  ScheduleTDS3Dtls?: ScheduleTDS3Dtls | null
  ScheduleTCS?: ScheduleTCS | null
  TaxPayments?: TaxPayments | null
  LTCG112A?: LTCG112A | null
  Verification: Verification
  TaxReturnPreparer?: TaxReturnPreparer | null
}
