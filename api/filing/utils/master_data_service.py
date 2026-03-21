"""MasterDataService for OpenTax — hardcoded constants (no database dependency).

All values sourced from the itr_api production database to ensure correctness.
"""

from typing import List, Dict, Union
from filing.models.master_data_model import MasterDataModel


# ==================== States ====================
_STATES: List[Dict[str, str]] = [
    {"value": "35", "label": "Andaman and Nicobar Islands"},
    {"value": "28", "label": "Andhra Pradesh"},
    {"value": "12", "label": "Arunachal Pradesh"},
    {"value": "18", "label": "Assam"},
    {"value": "10", "label": "Bihar"},
    {"value": "04", "label": "Chandigarh"},
    {"value": "22", "label": "Chhattisgarh"},
    {"value": "26", "label": "Dadra and Nagar Haveli"},
    {"value": "25", "label": "Daman and Diu"},
    {"value": "07", "label": "Delhi"},
    {"value": "30", "label": "Goa"},
    {"value": "24", "label": "Gujarat"},
    {"value": "06", "label": "Haryana"},
    {"value": "02", "label": "Himachal Pradesh"},
    {"value": "01", "label": "Jammu and Kashmir"},
    {"value": "20", "label": "Jharkhand"},
    {"value": "29", "label": "Karnataka"},
    {"value": "32", "label": "Kerala"},
    {"value": "37", "label": "Ladakh"},
    {"value": "31", "label": "Lakshadweep"},
    {"value": "23", "label": "Madhya Pradesh"},
    {"value": "27", "label": "Maharashtra"},
    {"value": "14", "label": "Manipur"},
    {"value": "17", "label": "Meghalaya"},
    {"value": "15", "label": "Mizoram"},
    {"value": "13", "label": "Nagaland"},
    {"value": "21", "label": "Odisha"},
    {"value": "99", "label": "Other"},
    {"value": "34", "label": "Puducherry"},
    {"value": "03", "label": "Punjab"},
    {"value": "08", "label": "Rajasthan"},
    {"value": "11", "label": "Sikkim"},
    {"value": "33", "label": "Tamil Nadu"},
    {"value": "36", "label": "Telangana"},
    {"value": "16", "label": "Tripura"},
    {"value": "09", "label": "Uttar Pradesh"},
    {"value": "05", "label": "Uttarakhand"},
    {"value": "19", "label": "West Bengal"},
]

# ==================== Countries ====================
_COUNTRIES: List[Dict[str, str]] = [
    {"value": "61", "label": "Australia"},
    {"value": "880", "label": "Bangladesh"},
    {"value": "975", "label": "Bhutan"},
    {"value": "55", "label": "Brazil"},
    {"value": "86", "label": "China"},
    {"value": "20", "label": "Egypt"},
    {"value": "33", "label": "France"},
    {"value": "49", "label": "Germany"},
    {"value": "91", "label": "India"},
    {"value": "62", "label": "Indonesia"},
    {"value": "39", "label": "Italy"},
    {"value": "81", "label": "Japan"},
    {"value": "60", "label": "Malaysia"},
    {"value": "52", "label": "Mexico"},
    {"value": "977", "label": "Nepal"},
    {"value": "92", "label": "Pakistan"},
    {"value": "63", "label": "Philippines"},
    {"value": "7", "label": "Russia"},
    {"value": "966", "label": "Saudi Arabia"},
    {"value": "65", "label": "Singapore"},
    {"value": "27", "label": "South Africa"},
    {"value": "82", "label": "South Korea"},
    {"value": "34", "label": "Spain"},
    {"value": "94", "label": "Sri Lanka"},
    {"value": "66", "label": "Thailand"},
    {"value": "90", "label": "Turkey"},
    {"value": "971", "label": "UAE"},
    {"value": "44", "label": "United Kingdom"},
    {"value": "1", "label": "United States"},
    {"value": "84", "label": "Vietnam"},
]

# ==================== Residential Status ====================
_RESIDENTIAL_STATUSES: List[Dict[str, str]] = [
    {"value": "Resident", "label": "Resident"},
    {"value": "Non-Resident", "label": "Non-Resident"},
]

# ==================== Account Types ====================
_ACCOUNT_TYPES: List[Dict[str, str]] = [
    {"value": "SB", "label": "Savings"},
    {"value": "CA", "label": "Current"},
    {"value": "CC", "label": "Cash Credit Account"},
    {"value": "OD", "label": "Over draft account"},
    {"value": "NRO", "label": "Non Resident Account"},
    {"value": "OTH", "label": "Other"},
]

# ==================== Employer Types ====================
_EMPLOYER_TYPES: List[Dict[str, str]] = [
    {"value": "CGOV", "label": "Central Government", "code": "CGOV"},
    {"value": "SGOV", "label": "State Government", "code": "SGOV"},
    {"value": "PSU", "label": "Public Sector", "code": "PSU"},
    {"value": "PE", "label": "Pensioners - Central Government", "code": "PE"},
    {"value": "PESG", "label": "Pensioners - State Government", "code": "PESG"},
    {"value": "PEPS", "label": "Pensioners - Public sector undertaking", "code": "PEPS"},
    {"value": "PEO", "label": "Pensioners - Others", "code": "PEO"},
    {"value": "OTH", "label": "Private", "code": "OTH"},
    {"value": "NA", "label": "Not Applicable", "code": "NA"},
]

# ==================== Interest Income Types ====================
_INTEREST_TYPES: List[Dict[str, str]] = [
    {"value": "1", "label": "Savings Account", "code": "SAV"},
    {"value": "2", "label": "Fixed Deposit", "code": "IFD"},
    {"value": "3", "label": "Provident Fund", "code": "PFINT"},
    {"value": "4", "label": "IT Refund", "code": "TAX"},
    {"value": "5", "label": "Public Provident Fund", "code": "PPF"},
    {"value": "9", "label": "Family Pension", "code": "FAP"},
    {"value": "11", "label": "Taxable PF Interest (\u20b92.5L Limit - Sec 10(11))", "code": "10(11)(iP)"},
    {"value": "12", "label": "Taxable PF Interest (\u20b95L Limit - Sec 10(11))", "code": "10(11)(iiP)"},
    {"value": "13", "label": "Taxable EPF Interest (\u20b92.5L Limit - Sec 10(12))", "code": "10(12)(iP)"},
    {"value": "14", "label": "Taxable EPF Interest (\u20b95L Limit - Sec 10(12))", "code": "10(12)(iiP)"},
    {"value": "15", "label": "Retirement Benefit Account (Notified Country)", "code": "NOT89A"},
    {"value": "16", "label": "Retirement Benefit Account (Other Country)", "code": "OTHNOT89A"},
    {"value": "17", "label": "Other Income", "code": "OTH"},
]

# ==================== Salary 17(1) Components (grouped) ====================
_SALARY_171_COMPONENTS: List[Dict[str, Union[str, List[Dict[str, str]]]]] = [
    {
        "group": "Allowances",
        "options": [
            {"id": "22", "label": "Commuted Pension"},
            {"id": "34", "label": "Compensation (CG Limit)"},
            {"id": "35", "label": "Compensation (Scheme)"},
            {"id": "10", "label": "Conveyance Allowance"},
            {"id": "38", "label": "Duty Allowances"},
            {"id": "31", "label": "Embassy Remuneration"},
            {"id": "37", "label": "Employer Tax on Perquisite"},
            {"id": "21", "label": "Gratuity"},
            {"id": "11", "label": "House Rent Allowance"},
            {"id": "42", "label": "Judge Exempt Income"},
            {"id": "33", "label": "Leave Encashment"},
            {"id": "13", "label": "LTA"},
            {"id": "12", "label": "Medical Allowance"},
            {"id": "14", "label": "Other Allowances"},
            {"id": "39", "label": "Personal Expense Allowances"},
            {"id": "40", "label": "Rule 2BB Allowances"},
            {"id": "32", "label": "Service Abroad Allowance"},
            {"id": "41", "label": "Transport (Handicapped)"},
            {"id": "36", "label": "VRS / Termination"},
        ],
    },
    {
        "group": "Salary Component",
        "options": [
            {"id": "8", "label": "Basic Salary"},
            {"id": "18", "label": "Commission"},
            {"id": "9", "label": "Dearness Allowance"},
            {"id": "16", "label": "Employer Contribution to Pension"},
            {"id": "15", "label": "Other Salary Components"},
            {"id": "19", "label": "Salary Advances"},
            {"id": "20", "label": "Salary Arrears"},
            {"id": "17", "label": "Uncommuted Pension"},
        ],
    },
]

# ==================== Salary 17(2) Components ====================
_SALARY_172_COMPONENTS: List[Dict[str, str]] = [
    {"id": "5", "label": "Rent Free Accommodation"},
    {"id": "6", "label": "Company Car"},
    {"id": "7", "label": "Utilities Paid"},
    {"id": "8", "label": "Domestic Help"},
    {"id": "9", "label": "Other Perquisites"},
]

# ==================== Salary 17(3) Components ====================
_SALARY_173_COMPONENTS: List[Dict[str, str]] = [
    {"id": "5", "label": "Termination Compensation"},
    {"id": "6", "label": "Contract Modification"},
    {"id": "7", "label": "Gratuity (Taxable)"},
    {"id": "8", "label": "Notice Pay"},
    {"id": "9", "label": "Other Profits in Lieu"},
]

# ==================== Property Types ====================
_PROPERTY_TYPES: List[Dict[str, str]] = [
    {"value": "S", "label": "Self Occupied"},
    {"value": "L", "label": "Let Out"},
    {"value": "D", "label": "Deemed Let Out"},
]

# ==================== Ownership Types ====================
_OWNERSHIP_TYPES: List[Dict[str, str]] = [
    {"value": "Sole Owner", "label": "Sole Owner"},
    {"value": "Co-owned", "label": "Co-owned"},
]

# ==================== Tenant Identifier Types ====================
_TENANT_IDENTIFIER_TYPES: List[Dict[str, str]] = [
    {"value": "PAN", "label": "PAN"},
    {"value": "Aadhaar", "label": "Aadhaar"},
]

# ==================== Co-owner Relationships ====================
_COOWNER_RELATIONSHIPS: List[Dict[str, str]] = [
    {"value": "Spouse", "label": "Spouse"},
    {"value": "Father", "label": "Father"},
    {"value": "Mother", "label": "Mother"},
    {"value": "Son", "label": "Son"},
    {"value": "Daughter", "label": "Daughter"},
    {"value": "Other", "label": "Other"},
]

# ==================== Provident Fund Types ====================
_PROVIDENT_FUND_TYPES: List[Dict[str, str]] = [
    {"value": "EPF", "label": "Employees Provident Fund (EPF)"},
    {"value": "GPF", "label": "General Provident Fund (GPF)"},
    {"value": "PPF", "label": "Public Provident Fund (PPF)"},
    {"value": "VPF", "label": "Voluntary Provident Fund (VPF)"},
]

# ==================== Section 80C Types ====================
_SECTION_80C_TYPES: List[Dict[str, str]] = [
    {"id": "1", "label": "Life Insurance Premium"},
    {"id": "2", "label": "PPF"},
    {"id": "3", "label": "ELSS"},
    {"id": "4", "label": "NSC"},
    {"id": "5", "label": "Tax Saving FD"},
    {"id": "6", "label": "Sukanya Samriddhi"},
    {"id": "7", "label": "Tuition Fees"},
    {"id": "8", "label": "Home Loan Principal"},
    {"id": "9", "label": "Other 80C Investments"},
]

# ==================== Lender Types ====================
_LENDER_TYPES: List[Dict[str, str]] = [
    {"value": "Bank", "label": "Bank"},
    {"value": "Financial Institution", "label": "Financial Institution"},
]

# ==================== Health Insurance Taken For ====================
_HEALTH_INSURANCE_TAKEN_FOR: List[Dict[str, str]] = [
    {"value": "Self", "label": "Self"},
    {"value": "Self & Family", "label": "Self & Family"},
    {"value": "Parents", "label": "Parents"},
]

# ==================== Preventive Medical Taken For ====================
_PREVENTIVE_MEDICAL_TAKEN_FOR: List[Dict[str, str]] = [
    {"value": "Self & Family", "label": "Self & Family"},
    {"value": "Parents", "label": "Parents"},
]

# ==================== Disability Relationships ====================
_DISABILITY_RELATIONSHIPS: List[Dict[str, str]] = [
    {"value": "Spouse", "label": "Spouse"},
    {"value": "Son", "label": "Son"},
    {"value": "Daughter", "label": "Daughter"},
    {"value": "Father", "label": "Father"},
    {"value": "Mother", "label": "Mother"},
    {"value": "Brother", "label": "Brother"},
    {"value": "Sister", "label": "Sister"},
]

# ==================== Disability Types ====================
_DISABILITY_TYPES: List[Dict[str, str]] = [
    {"value": "Disabled", "label": "Disabled (40-79%)"},
    {"value": "Severely Disabled", "label": "Severely Disabled (80%+)"},
]

# ==================== Treatment For (80DDB) ====================
_TREATMENT_FOR: List[Dict[str, str]] = [
    {"value": "1", "label": "Self or dependent"},
    {"value": "2", "label": "Self or Dependent - Senior Citizen"},
]

# ==================== Disease Types (80DDB) ====================
_DISEASE_TYPES: List[Dict[str, str]] = [
    {"value": "a", "label": "Dementia"},
    {"value": "b", "label": "Dystonia Musculorum Deformans"},
    {"value": "c", "label": "Motor Neuron Disease"},
    {"value": "d", "label": "Ataxia"},
    {"value": "e", "label": "Chorea"},
    {"value": "f", "label": "Hemiballismus"},
    {"value": "g", "label": "Aphasia"},
    {"value": "h", "label": "Parkinsons Disease"},
    {"value": "i", "label": "Malignant Cancers"},
    {"value": "j", "label": "Full Blown Acquired Immuno-Deficiency Syndrome (AIDS)"},
    {"value": "k", "label": "Chronic Renal failure"},
    {"value": "l", "label": "Hematological disorders"},
    {"value": "m", "label": "Hemophilia"},
    {"value": "n", "label": "Thalassaemia"},
]

# ==================== Senior Citizen Types ====================
_SENIOR_CITIZEN_TYPES: List[Dict[str, str]] = [
    {"value": "Self", "label": "Self"},
    {"value": "Dependant", "label": "Dependant"},
    {"value": "None", "label": "None"},
]

# ==================== Donation Types (80G) ====================
_DONATION_TYPES: List[Dict[str, str]] = [
    {"value": "PM National Relief Fund", "label": "PM National Relief Fund (100%)", "pan": "AACTP4637Q", "fullName": "Prime Minister's National Relief Fund"},
    {"value": "PM Citizen Assistance Fund", "label": "PM Citizen Assistance Fund (100%)", "pan": "AAETP3993P", "fullName": "Prime Minister's Citizen Assistance and Relief in Emergency Situations Fund (PM CARES Fund)"},
    {"value": "National Defence Fund", "label": "National Defence Fund (100%)", "pan": "AACTP5009F", "fullName": "National Defence Fund"},
    {"value": "Chief Minister Relief Fund", "label": "Chief Minister Relief Fund (100%)", "pan": "", "fullName": "Chief Minister's Relief Fund (specific to each state government)"},
    {"value": "Clean Ganga Fund", "label": "Clean Ganga Fund (100%)", "pan": "AABAN3769K", "fullName": "Clean Ganga Fund (National Mission for Clean Ganga)"},
    {"value": "Swachh Bharat Kosh", "label": "Swachh Bharat Kosh (100%)", "pan": "AAPTS3635L", "fullName": "Swachh Bharat Kosh"},
    {"value": "Charitable Trust 50%", "label": "Charitable Trust/Institution (50%)", "pan": "", "fullName": ""},
    {"value": "Other 80G", "label": "Other 80G Eligible Organization", "pan": "", "fullName": ""},
]

# ==================== Qualifying Percentages ====================
_QUALIFYING_PERCENTAGES: List[Dict[str, str]] = [
    {"value": "100", "label": "100% deduction"},
    {"value": "50", "label": "50% deduction"},
]

# ==================== Limit on Deductions ====================
_LIMIT_ON_DEDUCTIONS: List[Dict[str, str]] = [
    {"value": "Without Limit", "label": "Without Limit"},
    {"value": "Subject to 10% of Total Income", "label": "Subject to 10% of Total Income"},
]

# ==================== Payment Modes ====================
_PAYMENT_MODES: List[Dict[str, str]] = [
    {"value": "Cash", "label": "Cash"},
    {"value": "Cheque", "label": "Cheque"},
    {"value": "Online", "label": "Online Transfer"},
]

# ==================== Clause Types (80GGA) ====================
_CLAUSE_TYPES: List[Dict[str, str]] = [
    {"code": "1", "label": "Scientific Research", "value": "80GGA2a"},
    {"code": "2", "label": "Social Science/Statistical Research", "value": "80GGA2aa"},
    {"code": "3", "label": "Rural Development Programs", "value": "80GGA2b"},
    {"code": "4", "label": "University/IIT/College for Research", "value": "80GGA2bb"},
    {"code": "5", "label": "Conservation of Natural Resources or Afforestation", "value": "80GGA2c"},
    {"code": "6", "label": "Afforestation (Central Govt. notified funds)", "value": "80GGA2cc"},
    {"code": "7", "label": "Rural Development (Central Govt. notified funds)", "value": "80GGA2d"},
    {"code": "8", "label": "National Urban Poverty Eradication Fund", "value": "80GGA2e"},
]

# ==================== TDS Income Sources ====================
_TDS_INCOME_SOURCES: List[Dict[str, str]] = [
    {"value": "salary", "label": "Salary (Section 192)"},
    {"value": "interest", "label": "Interest (Section 194A)"},
    {"value": "dividend", "label": "Dividend (Section 194)"},
    {"value": "commission", "label": "Commission (Section 194H)"},
    {"value": "rent", "label": "Rent (Section 194I)"},
    {"value": "professional", "label": "Professional Fees (Section 194J)"},
    {"value": "contractor", "label": "Contractor (Section 194C)"},
    {"value": "other", "label": "Other TDS"},
]

# ==================== TDS Sections ====================
_TDS_SECTIONS: List[Dict[str, str]] = [
    {"value": "92A", "label": "192-Salary-Payment to Government employees other than Indian Government employees"},
    {"value": "92B", "label": "192-Salary-Payment to employees other than Government employees"},
    {"value": "92C", "label": "192-Salary-Payment to Indian Government employees"},
    {"value": "2AA", "label": "192A-TDS on PF withdrawal"},
    {"value": "193", "label": "193-Interest on Securities"},
    {"value": "194", "label": "194-Dividends"},
    {"value": "94A", "label": "194A-Interest other than 'Interest on securities'"},
    {"value": "94B", "label": "194B-Winning from lottery or crossword puzzle"},
    {"value": "9BA", "label": "194BA-Winnings from online games"},
    {"value": "4BB", "label": "194BB-Winning from horse race"},
    {"value": "94C", "label": "194C-Payments to contractors and sub-contractors"},
    {"value": "94D", "label": "194D-Insurance commission"},
    {"value": "4DA", "label": "194DA-Payment in respect of life insurance policy"},
    {"value": "94E", "label": "194E-Payments to non-resident sportsmen or sports associations"},
    {"value": "4EE", "label": "194EE-Payments in respect of deposits under National Savings"},
    {"value": "94F", "label": "194F-Payments on account of repurchase of units by Mutual Fund or Unit Trust of India"},
    {"value": "94G", "label": "194G-Commission, price, etc. on sale of lottery tickets"},
    {"value": "94H", "label": "194H-Commission or brokerage"},
    {"value": "4IA", "label": "194I(a)-Rent on hiring of plant and machinery"},
    {"value": "4IB", "label": "194I(b)-Rent on other than plant and machinery"},
    {"value": "9IA", "label": "194IA-TDS on Sale of immovable property"},
    {"value": "9IB", "label": "194IB-Payment of rent by certain individuals or Hindu undivided"},
    {"value": "4IC", "label": "194IC-Payment under specified agreement"},
    {"value": "4JA", "label": "194J(a)-Fees for technical services"},
    {"value": "4JB", "label": "194J(b)-Fees for professional services or royalty etc"},
    {"value": "94K", "label": "194K-Income payable to a resident assessee in respect of units of a specified mutual fund or of the units of the Unit Trust of India"},
    {"value": "4LA", "label": "194LA-Payment of compensation on acquisition of certain immovable"},
    {"value": "4LB", "label": "194LB-Income by way of Interest from Infrastructure Debt fund"},
    {"value": "LC1", "label": "194LC (2)(i) and (ia)-Income under clause (i) and (ia) of sub-section (2) of section 194LC"},
    {"value": "LC2", "label": "194LC (2)(ib)-Income under clause (ib) of sub-section (2) of section 194LC"},
    {"value": "LC3", "label": "194LC (2)(ic)-Income under clause (ic) of sub-section (2) of section 194LC"},
    {"value": "BA3", "label": "194LBA(c)-Income referred to in section 10(23FCA) from units of a business trust-NR"},
    {"value": "LBB", "label": "194LBB-Income in respect of units of investment fund"},
    {"value": "LBC", "label": "194LBC-Income in respect of investment in securitization trust"},
    {"value": "4LD", "label": "194LD-TDS on interest on bonds / government securities"},
    {"value": "94M", "label": "194M-Payment of certain sums by certain individuals or HUF"},
    {"value": "94N", "label": "194N-Payment of certain amounts in cash other than cases covered by first proviso or third proviso"},
    {"value": "4NF", "label": "194N-First Proviso Payment of certain amounts in cash to non-filers except in case of co-operative societies"},
    {"value": "4NC", "label": "194N-Third Proviso Payment of certain amounts in cash to co-operative societies not covered by first proviso"},
    {"value": "NFT", "label": "194N-First Proviso read with Third Proviso Payment of certain amount in cash to non-filers being co-operative societies"},
    {"value": "94O", "label": "194O-Payment of certain sums by e-commerce operator to e-commerce participant"},
    {"value": "94P", "label": "194P-Deduction of tax in case of specified senior citizen"},
    {"value": "94Q", "label": "194Q-Deduction of tax at source on payment of certain sum for purchase of goods"},
    {"value": "94R", "label": "194R-Benefits or perquisites of business or profession"},
    {"value": "94S", "label": "194S-Payment of consideration for transfer of virtual digital asset by persons other than specified persons"},
    {"value": "4BP", "label": "Proviso to section 194B-Winnings from lotteries and crossword puzzles where consideration is made in kind or cash is not sufficient to meet the tax liability and tax has been paid before such winnings are released"},
    {"value": "4RP", "label": "First Proviso to sub-section(1) of section 194R-Benefits or perquisites of business or profession where such benefit is provided in kind or where part in cash is not sufficient to meet tax liability and tax required to be deducted is paid before such benefit is released"},
    {"value": "4SP", "label": "Proviso to sub-section(1) of section 194S-Payment for transfer of virtual digital asset where payment is in kind or in exchange of another virtual digital asset and tax required to be deducted is paid before such payment is released"},
    {"value": "195", "label": "195-Other sums payable to a non-resident"},
    {"value": "96A", "label": "196A-Income in respect of units of non-residents"},
    {"value": "96B", "label": "196B-Payments in respect of units to an offshore fund"},
    {"value": "96C", "label": "196C-Income from foreign currency bonds or shares of Indian"},
    {"value": "96D", "label": "196D-Income of foreign institutional investors from securities"},
    {"value": "6DA", "label": "196D(1A)-Income of specified fund from securities"},
    {"value": "BAP", "label": "194BA(2)-Sub-section (2) of section 194BA Net Winnings from online games where the net winnings are made in kind or cash is not sufficient to meet the tax liability and tax has been paid before such net winnings are released"},
]

# ==================== TCS Nature of Collection ====================
_TCS_NATURE_OF_COLLECTIONS: List[Dict[str, str]] = [
    {"value": "foreign_remittance", "label": "Foreign Remittance (LRS)"},
    {"value": "sale_of_goods", "label": "Sale of Goods (above \u20b950L)"},
    {"value": "motor_vehicle", "label": "Sale of Motor Vehicle (above \u20b910L)"},
    {"value": "overseas_tour", "label": "Overseas Tour Package"},
    {"value": "scrap", "label": "Sale of Scrap"},
    {"value": "timber", "label": "Sale of Timber/Forest Produce"},
    {"value": "alcoholic_liquor", "label": "Alcoholic Liquor for Human Consumption"},
    {"value": "other", "label": "Other TCS"},
]

# ==================== Tax Payment Types ====================
_TAX_PAYMENT_TYPES: List[Dict[str, str]] = [
    {"value": "Self Assessment", "label": "Self Assessment Tax"},
    {"value": "Advance Tax", "label": "Advance Tax"},
]

# ==================== Quarters ====================
_QUARTERS: List[Dict[str, str]] = [
    {"value": "Q1", "label": "Q1 (Apr-Jun)"},
    {"value": "Q2", "label": "Q2 (Jul-Sep)"},
    {"value": "Q3", "label": "Q3 (Oct-Dec)"},
    {"value": "Q4", "label": "Q4 (Jan-Mar)"},
]

# ==================== Return File Sections (ITR Preview) ====================
_RETURN_FILE_SECTIONS: List[Dict[str, str]] = [
    {"value": "11", "label": "Original (u/s 139(1))"},
    {"value": "12", "label": "Revised (u/s 139(5))"},
    {"value": "13", "label": "Belated (u/s 139(4))"},
    {"value": "14", "label": "Defective (u/s 139(9))"},
    {"value": "16", "label": "Modified (u/s 92CD)"},
    {"value": "17", "label": "Updated (u/s 139(8A))"},
    {"value": "18", "label": "After condonation of delay (u/s 119(2)(b))"},
    {"value": "20", "label": "In response to notice (u/s 142(1))"},
    {"value": "21", "label": "In response to notice (u/s 148)"},
]

# ==================== Liability Types ====================
_LIABILITY_TYPES: List[Dict[str, str]] = [
    {"value": "Loan", "label": "Loan"},
    {"value": "Mortgage", "label": "Mortgage"},
    {"value": "Credit Card", "label": "Credit Card"},
    {"value": "Overdraft", "label": "Overdraft"},
    {"value": "Other", "label": "Other"},
]


class MasterDataService:
    """Master data service — returns hardcoded constants (no DB required)."""

    # ── Database-sourced (hardcoded snapshots) ──

    def get_states(self) -> List[Dict[str, str]]:
        return _STATES

    def get_countries(self) -> List[Dict[str, str]]:
        return _COUNTRIES

    def get_residential_statuses(self) -> List[Dict[str, str]]:
        return _RESIDENTIAL_STATUSES

    def get_account_types(self) -> List[Dict[str, str]]:
        return _ACCOUNT_TYPES

    def get_interest_types(self) -> List[Dict[str, str]]:
        return _INTEREST_TYPES

    def get_salary_171_components(self) -> List[Dict[str, Union[str, List[Dict[str, str]]]]]:
        return _SALARY_171_COMPONENTS

    def get_salary_172_components(self) -> List[Dict[str, str]]:
        return _SALARY_172_COMPONENTS

    def get_salary_173_components(self) -> List[Dict[str, str]]:
        return _SALARY_173_COMPONENTS

    # ── Static lookups ──

    def get_employer_types(self) -> List[Dict[str, str]]:
        return _EMPLOYER_TYPES

    def get_property_types(self) -> List[Dict[str, str]]:
        return _PROPERTY_TYPES

    def get_ownership_types(self) -> List[Dict[str, str]]:
        return _OWNERSHIP_TYPES

    def get_tenant_identifier_types(self) -> List[Dict[str, str]]:
        return _TENANT_IDENTIFIER_TYPES

    def get_coowner_relationships(self) -> List[Dict[str, str]]:
        return _COOWNER_RELATIONSHIPS

    def get_provident_fund_types(self) -> List[Dict[str, str]]:
        return _PROVIDENT_FUND_TYPES

    def get_section_80c_types(self) -> List[Dict[str, str]]:
        return _SECTION_80C_TYPES

    def get_lender_types(self) -> List[Dict[str, str]]:
        return _LENDER_TYPES

    def get_health_insurance_taken_for(self) -> List[Dict[str, str]]:
        return _HEALTH_INSURANCE_TAKEN_FOR

    def get_preventive_medical_taken_for(self) -> List[Dict[str, str]]:
        return _PREVENTIVE_MEDICAL_TAKEN_FOR

    def get_disability_relationships(self) -> List[Dict[str, str]]:
        return _DISABILITY_RELATIONSHIPS

    def get_disability_types(self) -> List[Dict[str, str]]:
        return _DISABILITY_TYPES

    def get_treatment_for(self) -> List[Dict[str, str]]:
        return _TREATMENT_FOR

    def get_disease_types(self) -> List[Dict[str, str]]:
        return _DISEASE_TYPES

    def get_senior_citizen_types(self) -> List[Dict[str, str]]:
        return _SENIOR_CITIZEN_TYPES

    def get_donation_types(self) -> List[Dict[str, str]]:
        return _DONATION_TYPES

    def get_qualifying_percentages(self) -> List[Dict[str, str]]:
        return _QUALIFYING_PERCENTAGES

    def get_limit_on_deductions(self) -> List[Dict[str, str]]:
        return _LIMIT_ON_DEDUCTIONS

    def get_payment_modes(self) -> List[Dict[str, str]]:
        return _PAYMENT_MODES

    def get_clause_types(self) -> List[Dict[str, str]]:
        return _CLAUSE_TYPES

    def get_tds_income_sources(self) -> List[Dict[str, str]]:
        return _TDS_INCOME_SOURCES

    def get_tds_sections(self) -> List[Dict[str, str]]:
        return _TDS_SECTIONS

    def get_tcs_nature_of_collections(self) -> List[Dict[str, str]]:
        return _TCS_NATURE_OF_COLLECTIONS

    def get_tax_payment_types(self) -> List[Dict[str, str]]:
        return _TAX_PAYMENT_TYPES

    def get_quarters(self) -> List[Dict[str, str]]:
        return _QUARTERS

    def get_return_file_sections(self) -> List[Dict[str, str]]:
        return _RETURN_FILE_SECTIONS

    def get_liability_types(self) -> List[Dict[str, str]]:
        return _LIABILITY_TYPES

    # ── Aggregate ──

    def get_all_master_data(self) -> MasterDataModel:
        """Return all master data in a single dict — one API call for the frontend."""
        return MasterDataModel(
            # Personal Details / Address
            states=self.get_states(),
            countries=self.get_countries(),
            residential_statuses=self.get_residential_statuses(),
            account_types=self.get_account_types(),
            # Salary
            employer_types=self.get_employer_types(),
            salary171_components=self.get_salary_171_components(),
            salary172_components=self.get_salary_172_components(),
            salary173_components=self.get_salary_173_components(),
            # House Property
            property_types=self.get_property_types(),
            ownership_types=self.get_ownership_types(),
            tenant_identifier_types=self.get_tenant_identifier_types(),
            coowner_relationships=self.get_coowner_relationships(),
            # Interest Income
            interest_types=self.get_interest_types(),
            provident_fund_types=self.get_provident_fund_types(),
            # Deductions - 80C
            section80c_types=self.get_section_80c_types(),
            # Deductions - Loans
            lender_types=self.get_lender_types(),
            # Deductions - Medical (80D)
            health_insurance_taken_for=self.get_health_insurance_taken_for(),
            preventive_medical_taken_for=self.get_preventive_medical_taken_for(),
            # Deductions - Medical (80DD, 80U)
            disability_relationships=self.get_disability_relationships(),
            disability_types=self.get_disability_types(),
            # Deductions - Medical (80DDB)
            treatment_for=self.get_treatment_for(),
            disease_types=self.get_disease_types(),
            senior_citizen_types=self.get_senior_citizen_types(),
            # Deductions - 80G
            donation_types=self.get_donation_types(),
            qualifying_percentages=self.get_qualifying_percentages(),
            limit_on_deductions=self.get_limit_on_deductions(),
            # Deductions - 80GGA
            clause_types=self.get_clause_types(),
            # Shared
            payment_modes=self.get_payment_modes(),
            quarters=self.get_quarters(),
            # Tax Credits - TDS
            tds_income_sources=self.get_tds_income_sources(),
            tds_sections=self.get_tds_sections(),
            # Tax Credits - TCS
            tcs_nature_of_collections=self.get_tcs_nature_of_collections(),
            # Tax Credits - Self / Advance
            tax_payment_types=self.get_tax_payment_types(),
            # ITR Preview
            return_file_sections=self.get_return_file_sections(),
            # Assets & Liabilities
            liability_types=self.get_liability_types(),
        )
