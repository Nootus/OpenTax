export interface TaxComputationModel {

    // convert to camel case
    salaryIncome: number
    housePropertyIncome: number
    otherIncome: number
    grossTotalIncome: number
    totalDeductions: number
    totalIncome: number
    regimeUsed: string
    taxBeforeRebate: number
    rebate87a: number
    taxAfterRebate: number
    healthEducationCess: number
    totalTaxLiability: number
    oldTax: number
    newTax: number
    currentRegime: TaxRegimeBreakdownModel
    oldRegime: TaxRegimeBreakdownModel
    newRegime: TaxRegimeBreakdownModel
    tds: number
    tcs: number
    advanceTax: number
    totalTaxesPaid: number
    taxPayable: number
    refund: number
}

export interface AllwncExemptUs10DtlsType {
    SalNatureDesc: string
    SalOthNatOfInc?: string | null
    SalOthAmount: number
}

export interface AllwncExemptUs10Model {
    AllwncExemptUs10Dtls?: AllwncExemptUs10DtlsType[] | null
    TotalAllwncExemptUs10: number
}

export interface SalaryIncomePartModel {
    GrossSalary: number
    Salary?: number | null
    PerquisitesValue?: number | null
    ProfitsInSalary?: number | null
    AllwncExemptUs10?: AllwncExemptUs10Model | null
    DeductionUs16: number
    DeductionUs16ia?: number | null
    EntertainmentAlw16ii?: number | null
    ProfessionalTaxUs16iii?: number | null
    NetSalary: number
    IncomeFromSal: number
}

export interface HousePropertyIncomePartModel {
    TypeOfHP?: string | null
    GrossRentReceived?: number | null
    TaxPaidlocalAuth?: number | null
    AnnualValue: number
    StandardDeduction: number
    InterestPayable?: number | null
    ArrearsUnrealizedRentRcvd?: number | null
    TotalIncomeOfHP: number
}

export interface OtherSourcesIncomePartModel {
    IncomeOthSrc: number
}

export interface CapitalGainsIncomePartModel {
    // Backward-compatible aggregates (older API fields)
    shortTermGains?: number | string | null
    longTermGains?: number | string | null
    totalCapitalGains?: number | string

    // Newer detailed aggregates (camelCase from backend)
    shortTerm?: number | string
    longTerm?: number | string
    total?: number | string

    // STCG rate buckets
    stcg15Pct?: number | string
    stcg20Pct?: number | string
    stcgApplicableRate?: number | string

    // LTCG rate buckets
    ltcg10Pct?: number | string
    // API uses ltcg125Pct / ltcg125PctOther; keep older names too for compatibility
    ltcg125Pct?: number | string
    ltcg125PctOther?: number | string
    ltcg12_5Pct?: number | string
    ltcg12_5PctOther?: number | string
    ltcg20Pct?: number | string
    ltcg112ProvisoCredit?: number | string

    // Special-rate OS income buckets
    lottery30Pct?: number | string
    vda30Pct?: number | string
    onlineGaming30Pct?: number | string
    unexplained60Pct?: number | string
}

export interface IncomeBreakdown {
    salary?: SalaryIncomePartModel | null
    house?: HousePropertyIncomePartModel | null
    capitalGains?: CapitalGainsIncomePartModel | null
    others?: OtherSourcesIncomePartModel | null
    grossTotal: number
}

export interface CessBreakdown {
    rate: string
    baseAmount: string
    cess: string
}

// Interest u/s 234A/234B/234C and late fee u/s 234F
export interface TaxInterestBreakdownModel {
    // Preferred camelCase (if backend converts)
    interest234A?: number | string | null
    interest234B?: number | string | null
    interest234C?: number | string | null
    lateFee234F?: number | string | null
    total?: number | string | null

    // Common legacy / ITR-style keys
    IntrstPayUs234A?: number | string | null
    IntrstPayUs234B?: number | string | null
    IntrstPayUs234C?: number | string | null
    LateFilingFee234F?: number | string | null
    TotalIntrstPay?: number | string | null

    // snake_case variants
    interest_234a?: number | string | null
    interest_234b?: number | string | null
    interest_234c?: number | string | null
    late_fee_234f?: number | string | null
}

export interface SurchargeBreakdown {
    rate: string
    surchargeBeforeRelief: string
    marginalRelief: string
    netSurcharge: string
}

export interface SpecialRateTaxEntry {
    section: string
    description: string
    rate: string
    income: string
    taxableIncome: string
    tax: string
}

export interface SlabBreakdownItem {
    fromAmount: string
    toAmount: string | null
    rate: string
    taxableAmount: string
    tax: string
}

export interface TaxRegimeBreakdownModel {
    regime: string
    grossTotalIncome: number
    totalDeductions: number
    totalIncome: number
    taxBeforeRebate: number
    rebate87a: number
    surcharge: number
    taxAfterRebate: number
    healthEducationCess: number
    totalTaxLiability: number
    tds: number
    tcs: number
    advanceTax: number
    totalTaxesPaid: number
    taxPayable: number
    refund: number

    // Interest & Fees (newer backend fields)
    taxInterest?: number | string
    taxInterestBreakdown?: TaxInterestBreakdownModel | null

    // snake_case + historic misspelling (as sent by some services)
    tax_intrest?: number | string
    tax_intrest_breakdown?: TaxInterestBreakdownModel | null

    // Basic Exemption Limit (BEL) details
    bel?: number | string
    belShortfall?: number | string

    // Special-rate taxes (capital gains flat rates, lottery/VDA, etc.)
    specialRateTax?: number
    specialRateTaxBreakdown?: SpecialRateTaxEntry[] | null

    incomeBreakdown?: IncomeBreakdown | null
    slabBreakdown?: SlabBreakdownItem[] | null
    surchargeBreakdown?: SurchargeBreakdown | null
    cessBreakdown?: CessBreakdown | null
}
