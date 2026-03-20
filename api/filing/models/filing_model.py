"""
Filing Model — ITR-1 (SAHAJ)
=============================

Complete filing model for ITR-1 containing all tax return sections.
"""

from .api_base_model import ApiBaseModel
from typing import List

# Chapter VIA Deductions
from .chapter_via_deduction import ChapterVIADeductions
from .deduction_80c_model import Deduction80CModel
from .deduction_80ccc_model import Deduction80CCCModel
from .deduction_80ccd1_model import Deduction80CCD1Model
from .deduction_80ccd1b_model import Deduction80CCD1BModel
from .deduction_80ccd2_model import Deduction80CCD2Model
from .deduction_80g_model import Deduction80GModel
from .deduction_80gga_model import Deduction80GGAModel
from .deduction_80ggc_model import Deduction80GGCModel
from .deduction_80e_model import Deduction80EModel
from .deduction_80ee_model import Deduction80EEModel
from .deduction_80eea_model import Deduction80EEAModel
from .deduction_80eeb_model import Deduction80EEBModel
from .deduction_80d_model import Deduction80DModel
from .deduction_80dd_model import Deduction80DDModel
from .deduction_80ddb_model import Deduction80DDBModel
from .deduction_80u_model import Deduction80UModel
from .deduction_80cch_model import Deduction80CCHModel
from .deduction_80gg_model import Deduction80GGModel
from .deduction_80qqb_model import Deduction80QQBModel
from .deduction_80rrb_model import Deduction80RRBModel
from .deduction_80tta_model import Deduction80TTAModel
from .deduction_80ttb_model import Deduction80TTBModel
from .other_deduction_model import OtherDeductionModel

# Income Sections
from .salary_model import SalaryModel
from .property_model import PropertyModel
from .interest_income_model import InterestIncomeModel
from .dividend_income_model import DividendIncomeModel
from .agricultural_income_model import AgriculturalIncomeModel
from .equity_compensation_income_model import EquityCompensationIncomeModel
from .foreign_income_model import ForeignIncomeModel
from .capital_gains_securities_model import CapitalGainsSecuritiesModel

# Personal Details
from .person_model import PersonModel
from .address_model import AddressModel
from .bank_account_model import BankAccountModel

# Tax Credits
from filing.tax_calculation.models.tax_calculation_response import TaxCalculationResponseModel
from .tds_model import TDSModel
from .tcs_model import TCSModel
from .tax_paid_self_model import TaxPaidSelfModel

# Validation
from filing.itr.validations.models.validation import ValidationError

# Form16 Metadata
from .form16_metadata import Form16Metadata

# Assets & Liabilities
from .immovable_assets_model import ImmovableAssetsModel
from .financial_assets_model import FinancialAssetsModel
from .other_assets_model import OtherAssetsModel
from .liabilities_model import LiabilitiesModel
from .investment_firm_llp_aop_model import InvestmentFirmLlpAopModel


class FilingModel(ApiBaseModel):
    """Complete filing model for ITR-1 (SAHAJ)."""
    
    # Filing metadata
    filing_id: int
    assessment_year: str | None = None
    regime: str | None = None
    
    ############# Personal Details #############
    
    person: PersonModel | None = None
    person_address: AddressModel | None = None
    bank_account: List[BankAccountModel] = []

    ############# Deduction Sections #############
    
    # Popular Sections
    section_80c: List[Deduction80CModel] = []
    section_80ccc: List[Deduction80CCCModel] = []
    section_80ccd1: List[Deduction80CCD1Model] = []
    section_80ccd1b: List[Deduction80CCD1BModel] = []
    section_80ccd2: List[Deduction80CCD2Model] = []
    
    # Donations
    section_80g: List[Deduction80GModel] = []
    section_80gga: List[Deduction80GGAModel] = []
    section_80ggc: List[Deduction80GGCModel] = []
    
    # Loans
    section_80e: List[Deduction80EModel] = []
    section_80ee: Deduction80EEModel | None = None
    section_80eea: Deduction80EEAModel | None = None
    section_80eeb: Deduction80EEBModel | None = None
    
    # Medical
    section_80d: Deduction80DModel | None = None
    section_80dd: Deduction80DDModel | None = None
    section_80ddb: Deduction80DDBModel | None = None
    section_80u: Deduction80UModel | None = None
    
    # Other Deductions
    section_80cch: Deduction80CCHModel | None = None
    section_80gg: Deduction80GGModel | None = None
    section_80qqb: Deduction80QQBModel | None = None
    section_80rrb: Deduction80RRBModel | None = None
    section_80tta: Deduction80TTAModel | None = None
    section_80ttb: Deduction80TTBModel | None = None
    other_deductions: OtherDeductionModel | None = None

    ############# Income Sections (ITR-1) #############
    
    salary: List[SalaryModel] = []
    house_property: List[PropertyModel] = []

    # Other Income
    interest_income: List[InterestIncomeModel] = []
    dividend_income: DividendIncomeModel | None = None
    equity_compensation_income: EquityCompensationIncomeModel | None = None
    foreign_income: ForeignIncomeModel | None = None
    capital_gains_securities: CapitalGainsSecuritiesModel | None = None

    # Agricultural Income
    agricultural_income: AgriculturalIncomeModel | None = None
    
    ############# Tax Credits #############
    
    tds: List[TDSModel] = []
    tcs: List[TCSModel] = []
    advance_tax: List[TaxPaidSelfModel] = []  
    
    ############# Form16 Metadata #############
    
    form16_metadata: List[Form16Metadata] = []

    ############# Tax Calculation #############
    tax_computation: TaxCalculationResponseModel | None = None

    ############# Assets & Liabilities #############

    immovable_assets: List[ImmovableAssetsModel] = []
    financial_assets: List[FinancialAssetsModel] = []
    other_assets: List[OtherAssetsModel] = []
    liabilities: List[LiabilitiesModel] = []
    investment_firm_llp_aop: List[InvestmentFirmLlpAopModel] = []

    # Total penal interest + late fee (234A/234B/234C/234F) computed during ITR build
    tax_intrest: int = 0
    # User validation errors - for left panel (incomplete/invalid user input)
    user_validation_errors: List[ValidationError] = []

    # -----------------------------
    # Computed views for ITR mappers
    # -----------------------------
    
    chapterVIADeductions: ChapterVIADeductions = ChapterVIADeductions()
    
    def has_income(self) -> bool:
        """Check if filing has any actual income data."""
        if self.salary:
            return True
        if self.house_property:
            return True
        if self.interest_income:
            return True
        if self.dividend_income is not None:
            return True
        return False
    
# FilingModel