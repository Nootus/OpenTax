"""MasterDataService for OpenTax — hardcoded constants (no database dependency)."""

from typing import List, Dict

# Indian states as per ITR state codes
_STATES: List[Dict[str, str]] = [
    {"value": "01", "label": "Jammu and Kashmir"},
    {"value": "02", "label": "Himachal Pradesh"},
    {"value": "03", "label": "Punjab"},
    {"value": "04", "label": "Chandigarh"},
    {"value": "05", "label": "Uttarakhand"},
    {"value": "06", "label": "Haryana"},
    {"value": "07", "label": "Delhi"},
    {"value": "08", "label": "Rajasthan"},
    {"value": "09", "label": "Uttar Pradesh"},
    {"value": "10", "label": "Bihar"},
    {"value": "11", "label": "Sikkim"},
    {"value": "12", "label": "Arunachal Pradesh"},
    {"value": "13", "label": "Nagaland"},
    {"value": "14", "label": "Manipur"},
    {"value": "15", "label": "Mizoram"},
    {"value": "16", "label": "Tripura"},
    {"value": "17", "label": "Meghalaya"},
    {"value": "18", "label": "Assam"},
    {"value": "19", "label": "West Bengal"},
    {"value": "20", "label": "Jharkhand"},
    {"value": "21", "label": "Odisha"},
    {"value": "22", "label": "Chhattisgarh"},
    {"value": "23", "label": "Madhya Pradesh"},
    {"value": "24", "label": "Gujarat"},
    {"value": "25", "label": "Daman and Diu"},
    {"value": "26", "label": "Dadra and Nagar Haveli"},
    {"value": "27", "label": "Maharashtra"},
    {"value": "28", "label": "Andhra Pradesh"},
    {"value": "29", "label": "Karnataka"},
    {"value": "30", "label": "Goa"},
    {"value": "31", "label": "Lakshadweep"},
    {"value": "32", "label": "Kerala"},
    {"value": "33", "label": "Tamil Nadu"},
    {"value": "34", "label": "Puducherry"},
    {"value": "35", "label": "Andaman and Nicobar Islands"},
    {"value": "36", "label": "Telangana"},
    {"value": "37", "label": "Ladakh"},
    {"value": "99", "label": "Other"},
]

# Country calling codes used as ITR country codes
_COUNTRIES: List[Dict[str, str]] = [
    {"value": "91",  "label": "India"},
    {"value": "1",   "label": "United States"},
    {"value": "44",  "label": "United Kingdom"},
    {"value": "971", "label": "UAE"},
    {"value": "65",  "label": "Singapore"},
    {"value": "61",  "label": "Australia"},
    {"value": "81",  "label": "Japan"},
    {"value": "86",  "label": "China"},
    {"value": "49",  "label": "Germany"},
    {"value": "33",  "label": "France"},
    {"value": "39",  "label": "Italy"},
    {"value": "7",   "label": "Russia"},
    {"value": "34",  "label": "Spain"},
    {"value": "82",  "label": "South Korea"},
    {"value": "55",  "label": "Brazil"},
    {"value": "52",  "label": "Mexico"},
    {"value": "27",  "label": "South Africa"},
    {"value": "966", "label": "Saudi Arabia"},
    {"value": "20",  "label": "Egypt"},
    {"value": "90",  "label": "Turkey"},
    {"value": "62",  "label": "Indonesia"},
    {"value": "60",  "label": "Malaysia"},
    {"value": "66",  "label": "Thailand"},
    {"value": "63",  "label": "Philippines"},
    {"value": "84",  "label": "Vietnam"},
    {"value": "880", "label": "Bangladesh"},
    {"value": "92",  "label": "Pakistan"},
    {"value": "94",  "label": "Sri Lanka"},
    {"value": "977", "label": "Nepal"},
    {"value": "975", "label": "Bhutan"},
]

# Interest income types — value is the id used in interest_income.interest_type_id
# code is the ITR schedule code used by itr1_income_builder_service
_INTEREST_TYPES: List[Dict[str, str]] = [
    {"value": "1",  "label": "Savings Account",                                      "code": "SAV"},
    {"value": "2",  "label": "Fixed Deposit",                                        "code": "IFD"},
    {"value": "3",  "label": "Provident Fund",                                       "code": "PFINT"},
    {"value": "4",  "label": "IT Refund",                                            "code": "TAX"},
    {"value": "5",  "label": "Public Provident Fund",                                "code": "PPF"},
    {"value": "9",  "label": "Family Pension",                                       "code": "FAP"},
    {"value": "11", "label": "Taxable PF Interest (₹2.5L Limit - Sec 10(11))",      "code": "10(11)(iP)"},
    {"value": "12", "label": "Taxable PF Interest (₹5L Limit - Sec 10(11))",        "code": "10(11)(iiP)"},
    {"value": "13", "label": "Taxable EPF Interest (₹2.5L Limit - Sec 10(12))",     "code": "10(12)(iP)"},
    {"value": "14", "label": "Taxable EPF Interest (₹5L Limit - Sec 10(12))",       "code": "10(12)(iiP)"},
    {"value": "15", "label": "Retirement Benefit Account (Notified Country)",        "code": "NOT89A"},
    {"value": "16", "label": "Retirement Benefit Account (Other Country)",           "code": "OTHNOT89A"},
    {"value": "17", "label": "Other Income",                                         "code": "OTH"},
]


class MasterDataService:
    """Master data service — returns hardcoded constants (no DB required)."""

    async def fetch_states(self) -> List[Dict[str, str]]:
        return _STATES

    async def fetch_countries(self) -> List[Dict[str, str]]:
        return _COUNTRIES

    async def fetch_interest_types(self) -> List[Dict[str, str]]:
        return _INTEREST_TYPES
