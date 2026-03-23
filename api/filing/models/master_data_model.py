"""MasterDataModel — typed return shape for MasterDataService.get_all_master_data()."""

from typing import List, Optional
from filing.models.api_base_model import ApiBaseModel


class MasterDataOption(ApiBaseModel):
    value: str
    label: str


class MasterDataOptionWithCode(ApiBaseModel):
    value: str
    label: str
    code: Optional[str] = None


class MasterDataOptionWithPan(ApiBaseModel):
    value: str
    label: str
    pan: Optional[str] = None
    full_name: Optional[str] = None


class MasterDataIdOption(ApiBaseModel):
    id: str
    label: str


class MasterDataGroupedOption(ApiBaseModel):
    group: str
    options: List[MasterDataIdOption]


class MasterDataModel(ApiBaseModel):
    # Personal Details / Address
    states: List[MasterDataOption]
    countries: List[MasterDataOption]
    residential_statuses: List[MasterDataOption]
    account_types: List[MasterDataOption]
    # Salary
    employer_types: List[MasterDataOptionWithCode]
    salary171_components: List[MasterDataGroupedOption]
    salary172_components: List[MasterDataIdOption]
    salary173_components: List[MasterDataIdOption]
    # House Property
    property_types: List[MasterDataOption]
    ownership_types: List[MasterDataOption]
    tenant_identifier_types: List[MasterDataOption]
    coowner_relationships: List[MasterDataOption]
    # Interest Income
    interest_types: List[MasterDataOptionWithCode]
    provident_fund_types: List[MasterDataOption]
    # Deductions - 80C
    section80c_types: List[MasterDataIdOption]
    # Deductions - Loans
    lender_types: List[MasterDataOption]
    # Deductions - Medical (80D)
    health_insurance_taken_for: List[MasterDataOption]
    preventive_medical_taken_for: List[MasterDataOption]
    # Deductions - Medical (80DD, 80U)
    disability_relationships: List[MasterDataOption]
    disability_types: List[MasterDataOption]
    # Deductions - Medical (80DDB)
    treatment_for: List[MasterDataOption]
    disease_types: List[MasterDataOption]
    senior_citizen_types: List[MasterDataOption]
    # Deductions - 80G
    donation_types: List[MasterDataOptionWithPan]
    qualifying_percentages: List[MasterDataOption]
    limit_on_deductions: List[MasterDataOption]
    # Deductions - 80GGA
    clause_types: List[MasterDataOptionWithCode]
    # Shared
    payment_modes: List[MasterDataOption]
    quarters: List[MasterDataOption]
    # Tax Credits - TDS
    tds_income_sources: List[MasterDataOption]
    tds_sections: List[MasterDataOption]
    # Tax Credits - TCS
    tcs_nature_of_collections: List[MasterDataOption]
    # Tax Credits - Self / Advance
    tax_payment_types: List[MasterDataOption]
    # ITR Preview
    return_file_sections: List[MasterDataOption]
    # Assets & Liabilities
    liability_types: List[MasterDataOption]
