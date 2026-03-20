/**
 * Static master data — previously fetched from API, now shipped as constants.
 */

export const STATES = [
  { value: 'AN', label: 'Andaman & Nicobar Islands' },
  { value: 'AP', label: 'Andhra Pradesh' },
  { value: 'AR', label: 'Arunachal Pradesh' },
  { value: 'AS', label: 'Assam' },
  { value: 'BR', label: 'Bihar' },
  { value: 'CH', label: 'Chandigarh' },
  { value: 'CT', label: 'Chhattisgarh' },
  { value: 'DN', label: 'Dadra & Nagar Haveli and Daman & Diu' },
  { value: 'DL', label: 'Delhi' },
  { value: 'GA', label: 'Goa' },
  { value: 'GJ', label: 'Gujarat' },
  { value: 'HR', label: 'Haryana' },
  { value: 'HP', label: 'Himachal Pradesh' },
  { value: 'JK', label: 'Jammu & Kashmir' },
  { value: 'JH', label: 'Jharkhand' },
  { value: 'KA', label: 'Karnataka' },
  { value: 'KL', label: 'Kerala' },
  { value: 'LA', label: 'Ladakh' },
  { value: 'LD', label: 'Lakshadweep' },
  { value: 'MP', label: 'Madhya Pradesh' },
  { value: 'MH', label: 'Maharashtra' },
  { value: 'MN', label: 'Manipur' },
  { value: 'ML', label: 'Meghalaya' },
  { value: 'MZ', label: 'Mizoram' },
  { value: 'NL', label: 'Nagaland' },
  { value: 'OR', label: 'Odisha' },
  { value: 'PY', label: 'Puducherry' },
  { value: 'PB', label: 'Punjab' },
  { value: 'RJ', label: 'Rajasthan' },
  { value: 'SK', label: 'Sikkim' },
  { value: 'TN', label: 'Tamil Nadu' },
  { value: 'TG', label: 'Telangana' },
  { value: 'TR', label: 'Tripura' },
  { value: 'UP', label: 'Uttar Pradesh' },
  { value: 'UT', label: 'Uttarakhand' },
  { value: 'WB', label: 'West Bengal' },
]

export const COUNTRIES = [
  { value: 'IN', label: 'India' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'SG', label: 'Singapore' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'OT', label: 'Other' },
]

export const RESIDENTIAL_STATUSES = [
  { value: 'RES', label: 'Resident' },
  { value: 'RNOR', label: 'Resident but Not Ordinarily Resident' },
  { value: 'NR', label: 'Non-Resident' },
]

export const ACCOUNT_TYPES = [
  { value: 'SB', label: 'Savings Account' },
  { value: 'CA', label: 'Current Account' },
  { value: 'NRE', label: 'NRE Account' },
  { value: 'NRO', label: 'NRO Account' },
  { value: 'OT', label: 'Others' },
]

export const PROPERTY_TYPES = [
  { value: 'S', label: 'Self Occupied' },
  { value: 'L', label: 'Let Out' },
  { value: 'D', label: 'Deemed Let Out' },
]

export const LENDER_TYPES = [
  { value: 'B', label: 'Bank' },
  { value: 'HFC', label: 'Housing Finance Company' },
  { value: 'E', label: 'Employer' },
  { value: 'O', label: 'Others' },
]

export const TENANT_IDENTIFIER_TYPES = [
  { value: 'PAN', label: 'PAN' },
  { value: 'Aadhaar', label: 'Aadhaar' },
  { value: 'Other', label: 'Other' },
]

export const COOWNER_RELATIONSHIPS = [
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Child', label: 'Child' },
  { value: 'Parent', label: 'Parent' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Other', label: 'Other' },
]

export const INTEREST_TYPES = [
  { value: '1', label: 'Savings Account Interest' },
  { value: '2', label: 'Fixed Deposit Interest' },
  { value: '3', label: 'Recurring Deposit Interest' },
  { value: '4', label: 'Income Tax Refund Interest' },
  { value: '5', label: 'NSC Interest' },
  { value: '6', label: 'Post Office Deposit Interest' },
  { value: '7', label: 'Other Interest Income' },
]

export const PROVIDENT_FUND_TYPES = [
  { value: 'RPFC', label: 'Recognized Provident Fund' },
  { value: 'URPF', label: 'Unrecognized Provident Fund' },
  { value: 'PPF', label: 'Public Provident Fund' },
  { value: 'SAF', label: 'Superannuation Fund' },
]

export const EMPLOYER_TYPES = [
  { value: 'G', label: 'Government' },
  { value: 'PA', label: 'Public Sector Undertaking' },
  { value: 'PE', label: 'Pensioners - Central Government' },
  { value: 'PES', label: 'Pensioners - State Government' },
  { value: 'PEP', label: 'Pensioners - PSU' },
  { value: 'PEO', label: 'Pensioners - Others' },
  { value: 'O', label: 'Others' },
]

export const DEDUCTION_80C_TYPES = [
  { value: 'LIC', label: 'Life Insurance Premium (LIC)' },
  { value: 'PPF', label: 'Public Provident Fund (PPF)' },
  { value: 'ELSS', label: 'Equity Linked Saving Scheme (ELSS)' },
  { value: 'NSC', label: 'National Savings Certificate (NSC)' },
  { value: 'SCSS', label: 'Senior Citizen Savings Scheme' },
  { value: 'EPF', label: 'Employee Provident Fund (EPF)' },
  { value: 'SUK', label: 'Sukanya Samriddhi Account' },
  { value: 'FD', label: 'Tax Saving Fixed Deposit (5 Year)' },
  { value: 'HLP', label: 'Home Loan Principal Repayment' },
  { value: 'TF', label: 'Tuition Fees' },
  { value: 'INFRA', label: 'Infrastructure Bonds' },
  { value: 'NHB', label: 'National Housing Bank Bonds' },
  { value: 'OTH', label: 'Others' },
]

export const INCOME_SOURCES_TDS = [
  { value: 'SAL', label: 'Salary' },
  { value: 'INT', label: 'Interest on Securities' },
  { value: 'DIV', label: 'Dividend' },
  { value: 'WIN', label: 'Winnings from Lottery' },
  { value: 'COM', label: 'Commission' },
  { value: 'RNT', label: 'Rent' },
  { value: 'NSEC', label: 'Non-Salary Income' },
  { value: 'OTH', label: 'Others' },
]

export const TDS_SECTIONS = [
  { value: '192', label: 'Section 192 - Salary' },
  { value: '194', label: 'Section 194 - Dividend' },
  { value: '194A', label: 'Section 194A - Interest' },
  { value: '194B', label: 'Section 194B - Lottery Winnings' },
  { value: '194C', label: 'Section 194C - Contractor Payments' },
  { value: '194D', label: 'Section 194D - Insurance Commission' },
  { value: '194H', label: 'Section 194H - Commission/Brokerage' },
  { value: '194I', label: 'Section 194I - Rent' },
  { value: '194J', label: 'Section 194J - Professional/Technical Fees' },
  { value: '194Q', label: 'Section 194Q - Purchase of Goods' },
  { value: 'OTH', label: 'Others' },
]

export const QUARTERS = [
  { value: 'Q1', label: 'Q1 (April-June)' },
  { value: 'Q2', label: 'Q2 (July-September)' },
  { value: 'Q3', label: 'Q3 (October-December)' },
  { value: 'Q4', label: 'Q4 (January-March)' },
]

export const PAYMENT_MODES = [
  { value: 'ONLINE', label: 'Online (Challan ITNS 280)' },
  { value: 'OFFLINE', label: 'Offline (Bank Challan)' },
]

export const HEALTH_INSURANCE_TAKEN_FOR = [
  { value: 'S', label: 'Self' },
  { value: 'SF', label: 'Self & Family' },
  { value: 'P', label: 'Parents' },
]

export const PREVENTIVE_MEDICAL_TAKEN_FOR = [
  { value: 'S', label: 'Self' },
  { value: 'SF', label: 'Self & Family' },
  { value: 'P', label: 'Parents' },
]

export const RELATION_TO_DEPENDANT = [
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Child', label: 'Child' },
  { value: 'Parent', label: 'Parent' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Other', label: 'Other' },
]

export const DISABILITY_TYPES = [
  { value: 'D', label: 'Disabled (40%-79%)' },
  { value: 'SD', label: 'Severely Disabled (80% or more)' },
]

export const TREATMENT_FOR = [
  { value: 'SELF', label: 'Self' },
  { value: 'DEP', label: 'Dependent' },
]

export const SENIOR_CITIZEN_TYPES = [
  { value: 'SC', label: 'Senior Citizen (60-79 years)' },
  { value: 'SSC', label: 'Super Senior Citizen (80+ years)' },
]

export const DISEASES_80DDB = [
  { value: 'N', label: 'Neurological Diseases (40%+ disability)' },
  { value: 'M', label: 'Malignant Cancers' },
  { value: 'F', label: 'Full Blown AIDS' },
  { value: 'C', label: 'Chronic Renal Failure' },
  { value: 'H', label: 'Haematological Disorders' },
]

export const DONATION_TYPES = [
  { value: '100NC', label: '100% without limit' },
  { value: '50NC', label: '50% without limit' },
  { value: '100WL', label: '100% with limit' },
  { value: '50WL', label: '50% with limit' },
]

export const CLAUSE_TYPES_80GGA = [
  { value: '35(1)(i)', label: '35(1)(i) - Research Association (Scientific Research)' },
  { value: '35(1)(ii)', label: '35(1)(ii) - University/College (Scientific Research)' },
  { value: '35(1)(iii)', label: '35(1)(iii) - Research Association (Social Science)' },
  { value: '35(1)(iia)', label: '35(1)(iia) - Indian Company (Scientific Research)' },
  { value: '35(2AA)', label: '35(2AA) - National Laboratory/IIT' },
  { value: '35(2AB)', label: '35(2AB) - In-house Scientific Research' },
  { value: '80GGA(2)(a)', label: '80GGA(2)(a) - Rural Development' },
  { value: '80GGA(2)(b)', label: '80GGA(2)(b) - Afforestation' },
  { value: '80GGA(2)(bb)', label: '80GGA(2)(bb) - National Urban Poverty Fund' },
  { value: '80GGA(2)(c)', label: '80GGA(2)(c) - Rural Development Fund' },
]

export const QUALIFYING_PERCENTAGES = [
  { value: '100', label: '100%' },
  { value: '50', label: '50%' },
]

export const LIMIT_ON_DEDUCTION = [
  { value: 'NL', label: 'No Limit' },
  { value: 'TGI', label: '10% of Gross Total Income' },
]

// Aggregate master data object (same shape as expertApi.getMasterdata() response)
export const MASTER_DATA = {
  states: STATES,
  countries: COUNTRIES,
  residentialStatuses: RESIDENTIAL_STATUSES,
  accountTypes: ACCOUNT_TYPES,
  propertyTypes: PROPERTY_TYPES,
  lenderTypes: LENDER_TYPES,
  tenantIdentifierTypes: TENANT_IDENTIFIER_TYPES,
  coownerRelationships: COOWNER_RELATIONSHIPS,
  interestTypes: INTEREST_TYPES,
  providentFundTypes: PROVIDENT_FUND_TYPES,
  employerTypes: EMPLOYER_TYPES,
  deduction80CTypes: DEDUCTION_80C_TYPES,
  incomeSourcesTds: INCOME_SOURCES_TDS,
  tdsSections: TDS_SECTIONS,
  quarters: QUARTERS,
  paymentModes: PAYMENT_MODES,
  disabilityTypes: DISABILITY_TYPES,
  healthInsuranceTakenFor: HEALTH_INSURANCE_TAKEN_FOR,
  preventiveMedicalTakenFor: PREVENTIVE_MEDICAL_TAKEN_FOR,
  relationToDependant: RELATION_TO_DEPENDANT,
  treatmentFor: TREATMENT_FOR,
  seniorCitizenTypes: SENIOR_CITIZEN_TYPES,
  diseases80DDB: DISEASES_80DDB,
  donationTypes: DONATION_TYPES,
  clauseTypes80GGA: CLAUSE_TYPES_80GGA,
  qualifyingPercentages: QUALIFYING_PERCENTAGES,
  limitOnDeduction: LIMIT_ON_DEDUCTION,
}
