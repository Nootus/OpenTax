"""
Filing Model
===========

Complete filing model that contains all tax return data organized by section.
"""

from .api_base_model import ApiBaseModel
from typing import List

# Chapter VIA Deductions - Popular
from domain.filing.deductions.chapter_via_deduction import ChapterVIADeductions
from domain.filing.deductions.popular.models.deduction_80c_model import Deduction80CModel
from domain.filing.deductions.popular.models.deduction_80ccc_model import Deduction80CCCModel
from domain.filing.deductions.popular.models.deduction_80ccd1_model import Deduction80CCD1Model
from domain.filing.deductions.popular.models.deduction_80ccd1b_model import Deduction80CCD1BModel
from domain.filing.deductions.popular.models.deduction_80ccd2_model import Deduction80CCD2Model

# Chapter VIA Deductions - Donations
from domain.filing.deductions.donation.models.deduction_80g_model import Deduction80GModel
from domain.filing.deductions.donation.models.deduction_80gga_model import Deduction80GGAModel
from domain.filing.deductions.donation.models.deduction_80ggc_model import Deduction80GGCModel

# Chapter VIA Deductions - Loans
from domain.filing.deductions.loan.models.deduction_80e_model import Deduction80EModel
from domain.filing.deductions.loan.models.deduction_80ee_model import Deduction80EEModel
from domain.filing.deductions.loan.models.deduction_80eea_model import Deduction80EEAModel
from domain.filing.deductions.loan.models.deduction_80eeb_model import Deduction80EEBModel

# Chapter VIA Deductions - Medical
from domain.filing.deductions.medical.models.deduction_80d_model import Deduction80DModel
from domain.filing.deductions.medical.models.deduction_80dd_model import Deduction80DDModel
from domain.filing.deductions.medical.models.deduction_80ddb_model import Deduction80DDBModel
from domain.filing.deductions.medical.models.deduction_80u_model import Deduction80UModel

# Chapter VIA Deductions - Other
from domain.filing.deductions.other.models.deduction_80cch_model import Deduction80CCHModel
from domain.filing.deductions.other.models.deduction_80gg_model import Deduction80GGModel
from domain.filing.deductions.other.models.deduction_80qqb_model import Deduction80QQBModel
from domain.filing.deductions.other.models.deduction_80rrb_model import Deduction80RRBModel
from domain.filing.deductions.other.models.deduction_80tta_model import Deduction80TTAModel
from domain.filing.deductions.other.models.deduction_80ttb_model import Deduction80TTBModel
from domain.filing.deductions.other.models.other_deduction_model import OtherDeductionModel
# Income Sections
from domain.filing.income.salary.models.salary_model import SalaryModel
from domain.filing.income.house_property.models.property_model import PropertyModel
from domain.filing.income.other.interest_income.models.interest_income_model import InterestIncomeModel
from domain.filing.income.other.equity_compensation_income.models.equity_compensation_income_model import EquityCompensationIncomeModel
from domain.filing.income.other.dividend.models.dividend_income_model import DividendIncomeModel
from domain.filing.income.other.foreign_income.models.foreign_income_model import ForeignIncomeModel
from domain.filing.income.other.capital_gains.capital_gains_securities.models.cg_securities_model import CapitalGainsSecuritiesModel
from domain.filing.income.other.capital_gains.capital_gains_real_estate.models.realestate_model import RealEstateModel
from domain.filing.income.other.capital_gains.capital_gains_foreign.models.foreign_assets_model import ForeignCapitalGains
from domain.filing.income.other.capital_gains.capital_gains_movable.models.movable_capital_gains_wrapper_model import MovableCapitalGainsWithImprovements
from domain.filing.income.other.capital_gains.capital_deemed.models.deemed_capital_gains_wrapper_model import DeemedCapitalGainsWrapper
from domain.filing.income.professional_income.models import ProfessionalIncomeModel
from domain.filing.income.other.agricultural_income.models.agricultural_income_model import AgriculturalIncomeModel
from domain.filing.income.other.crypto_vda_income.models.crypto_vda_income_model import CryptoVDAIncomeModel
from domain.filing.income.other.lottery_online_gaming_income.models.lottery_online_gaming_income_model import LotteryOnlineGamingIncomeModel

# Personal Details
from domain.filing.person.personal_details.models.person_model import PersonModel
from domain.filing.person.person_address.models.address_model import AddressModel
from domain.filing.person.bank_account_details.models.bank_account_model import BankAccountModel 

# Tax Credits
from domain.filing.tax_calculation.models.tax_calculation_response import TaxCalculationResponseModel
from domain.filing.tax_credit.models.tds_model import TDSModel
from domain.filing.tax_credit.models.tcs_model import TCSModel
from domain.filing.tax_credit.models.tax_paid_self_model import TaxPaidSelfModel

# Validation
from domain.filing.itr.validations.models.validation import ValidationError

# Form16 Metadata
from domain.filing.income.form16.models.form16_metadata import Form16Metadata

# Assets & Liabilities
from domain.filing.assets_and_liabilities.immovable_assets.models.immovable_assets_model import ImmovableAssetsModel
from domain.filing.assets_and_liabilities.financial_assets.models.financial_assets_model import FinancialAssetsModel
from domain.filing.assets_and_liabilities.other_assets.models.other_assets_model import OtherAssetsModel
from domain.filing.assets_and_liabilities.liabilities.models.liabilities_model import LiabilitiesModel
from domain.filing.assets_and_liabilities.investment_firm_llp_aop.models.investment_firm_llp_aop_model import InvestmentFirmLlpAopModel


class FilingModel(ApiBaseModel):
    """Complete filing model containing all tax return sections."""
    
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
    ############# Income Sections #############
    
    salary: List[SalaryModel] = []
    house_property: List[PropertyModel] = []
    professional_income: ProfessionalIncomeModel | None = None
    equity_compensation_income: EquityCompensationIncomeModel | None = None

    # Other Income
    interest_income: List[InterestIncomeModel] = []
    dividend_income: DividendIncomeModel | None = None
    foreign_income: ForeignIncomeModel | None = None
    capital_gains_securities: CapitalGainsSecuritiesModel | None = None
    capital_gains_real_estate: RealEstateModel | None = None
    
    # Separated capital gains - each type independently managed
    capital_gains_foreign: List[ForeignCapitalGains] = []
    capital_gains_movable: MovableCapitalGainsWithImprovements | None = None
    capital_gains_deemed: DeemedCapitalGainsWrapper | None = None
    
    
    # Special income buckets (generally Schedule OS / special rates)
    crypto_vda_income: CryptoVDAIncomeModel | None = None
    lottery_online_gaming_income: LotteryOnlineGamingIncomeModel | None = None

    # Agricultural Income
    agricultural_income: AgriculturalIncomeModel | None = None
    
    ############# Tax Credits #############
    
    tds: List[TDSModel] = []
    tcs: List[TCSModel] = []
    advance_tax: List[TaxPaidSelfModel] = []  
    
    ############# Form16 Metadata #############
    
    form16_metadata: List[Form16Metadata] = []

    ############# tax Calculation #############
    tax_computation: TaxCalculationResponseModel | None = None

    ############# User Validation Errors #############
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
        """Check if filing has any actual income data (salary, house property, etc.)."""
        if self.salary:
            return True
        if self.house_property:
            return True
        if self.professional_income is not None:
            return True
        if self.equity_compensation_income is not None:
            return True
        if self.interest_income:
            return True
        if self.dividend_income is not None:
            return True
        if self.foreign_income is not None:
            return True
        return False
    
# FilingModel