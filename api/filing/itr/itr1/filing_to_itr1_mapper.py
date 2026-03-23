"""
FilingModel to ITR1 Mapper - Handles only mapping rules.
Building/transformation logic moved to Itr1BuildingService.
"""
import logging
from typing import Optional

from filing.itr.auto_mapper import AutoMapper

logger = logging.getLogger(__name__)

# Chap VIA keys for generated default rules (Usr + Deduct)
_VIA_KEYS = [
    "Section80C", "Section80CCC", "Section80CCDEmployeeOrSE", "Section80CCD1B", "Section80CCDEmployer",
    "Section80D", "Section80DD", "Section80DDB", "Section80E", "Section80EE", "Section80EEA", "Section80EEB",
    "Section80G", "Section80GG", "Section80GGA", "Section80GGC", "Section80U", "Section80TTA", "Section80TTB",
    "AnyOthSec80CCH", "TotalChapVIADeductions",
]


class FilingToItr1Mapper:
    """Maps FilingModel to ITR1: AutoMapper rules only. Building logic in Itr1BuildingService."""

    RULES: list[str] = []

    _mapper = AutoMapper(rules=RULES, ignore_missing=True)

   

    # ==========================================================================
    # PUBLIC API
    # ==========================================================================
   
    # ITR1 path -> FilingModel field name (used by frontend field-widget-mapping)
    _ITR_TO_FILING_FIELD_MAP: dict[str, str] = {
        # ===== Personal Info =====
        "ITR.ITR1.PersonalInfo.PAN": "person.panNumber",
        "ITR.ITR1.PersonalInfo.DOB": "person.dateOfBirth",
        "ITR.ITR1.PersonalInfo.AadhaarCardNo": "person.aadhaarNumber",
        "ITR.ITR1.PersonalInfo.AssesseeName": "person.firstName",
        "ITR.ITR1.PersonalInfo.AssesseeName.FirstName": "person.firstName",
        "ITR.ITR1.PersonalInfo.AssesseeName.MiddleName": "person.middleName",
        "ITR.ITR1.PersonalInfo.AssesseeName.SurNameOrOrgName": "person.lastName",
        "ITR.ITR1.PersonalInfo.AssesseeName.FatherName": "person.fatherName",
        "ITR.ITR1.PersonalInfo.EmployerCategory": "filingStatus.employerType",

        # ===== Address =====
        "ITR.ITR1.PersonalInfo.Address": "person_address.flatDoorNo",
        "ITR.ITR1.PersonalInfo.Address.ResidenceNo": "person_address.flatDoorNo",
        "ITR.ITR1.PersonalInfo.Address.ResidenceName": "person_address.premiseName",
        "ITR.ITR1.PersonalInfo.Address.RoadOrStreet": "person_address.street",
        "ITR.ITR1.PersonalInfo.Address.LocalityOrArea": "person_address.area",
        "ITR.ITR1.PersonalInfo.Address.CityOrTownOrDistrict": "person_address.city",
        "ITR.ITR1.PersonalInfo.Address.StateCode": "person_address.state",
        "ITR.ITR1.PersonalInfo.Address.PinCode": "person_address.pincode",
        "ITR.ITR1.PersonalInfo.Address.CountryCode": "person_address.country",
        "ITR.ITR1.PersonalInfo.Address.MobileNo": "person.mobileNumber",
        "ITR.ITR1.PersonalInfo.Address.EmailAddress": "person.email",

        # ===== Filing Status =====
        "ITR.ITR1.FilingStatus": "filingStatus.returnFileSection",
        "ITR.ITR1.FilingStatus.ReturnFileSec": "filingStatus.returnFileSection",
        "ITR.ITR1.FilingStatus.OptOutNewTaxRegime": "filingStatus.taxRegime",

        # ===== Income & Deductions =====
        "ITR.ITR1.ITR1_IncomeDeductions": "salaryIncome",
        "ITR.ITR1.ITR1_IncomeDeductions.GrossSalary": "salaryIncome.grossSalary",
        "ITR.ITR1.ITR1_IncomeDeductions.Salary": "salaryIncome.salary",
        "ITR.ITR1.ITR1_IncomeDeductions.PerquisitesValue": "salaryIncome.perquisitesValue",
        "ITR.ITR1.ITR1_IncomeDeductions.ProfitsInSalary": "salaryIncome.profitsInLieu",
        "ITR.ITR1.ITR1_IncomeDeductions.IncomeFromSal": "salaryIncome.netSalary",
        "ITR.ITR1.ITR1_IncomeDeductions.IncomeOthSrc": "interestIncome",
        "ITR.ITR1.ITR1_IncomeDeductions.GrossRentReceived": "propertyIncome",
        "ITR.ITR1.ITR1_IncomeDeductions.TotalIncomeOfHP": "propertyIncome",

        # ===== Deductions (Chapter VI-A) =====
        "ITR.ITR1.ITR1_IncomeDeductions.DeductUndChapVIA.Section80C": "section80C",
        "ITR.ITR1.ITR1_IncomeDeductions.DeductUndChapVIA.Section80CCC": "section80CCC",
        "ITR.ITR1.ITR1_IncomeDeductions.DeductUndChapVIA.Section80CCD1": "section80CCD1",
        "ITR.ITR1.ITR1_IncomeDeductions.DeductUndChapVIA.Section80CCD1B": "section80CCD1B",
        "ITR.ITR1.ITR1_IncomeDeductions.DeductUndChapVIA.Section80CCD2": "section80CCD2",
        "ITR.ITR1.ITR1_IncomeDeductions.DeductUndChapVIA.Section80D": "healthInsurance",
        "ITR.ITR1.ITR1_IncomeDeductions.DeductUndChapVIA.Section80DD": "disabilityDependant",
        "ITR.ITR1.ITR1_IncomeDeductions.DeductUndChapVIA.Section80DDB": "medicalTreatment",
        "ITR.ITR1.ITR1_IncomeDeductions.DeductUndChapVIA.Section80E": "educationLoan",
        "ITR.ITR1.ITR1_IncomeDeductions.DeductUndChapVIA.Section80EE": "homeLoan80EE",
        "ITR.ITR1.ITR1_IncomeDeductions.DeductUndChapVIA.Section80EEA": "homeLoan80EEA",
        "ITR.ITR1.ITR1_IncomeDeductions.DeductUndChapVIA.Section80EEB": "evLoan",
        "ITR.ITR1.ITR1_IncomeDeductions.DeductUndChapVIA.Section80G": "charityDonation",
        "ITR.ITR1.ITR1_IncomeDeductions.DeductUndChapVIA.Section80GGA": "researchDonation",
        "ITR.ITR1.ITR1_IncomeDeductions.DeductUndChapVIA.Section80GGC": "politicalDonation",
        "ITR.ITR1.ITR1_IncomeDeductions.DeductUndChapVIA.Section80U": "personDisability",

        # ===== Tax Computation =====
        "ITR.ITR1.ITR1_TaxComputation": "taxComputation",

        # ===== Tax Paid =====
        "ITR.ITR1.TaxPaid": "tdsEntry",
        "ITR.ITR1.TaxPaid.TaxesPaid.AdvanceTax": "taxPayment",
        "ITR.ITR1.TaxPaid.TaxesPaid.TDS": "tdsEntry",
        "ITR.ITR1.TaxPaid.TaxesPaid.TCS": "tcsEntry",
        "ITR.ITR1.TaxPaid.TaxesPaid.SelfAssessmentTax": "taxPayment",

        # ===== Bank Details =====
        "ITR.ITR1.Refund": "bankDetails",
        "ITR.ITR1.Refund.BankAccountDtls": "bankDetails",
        "ITR.ITR1.Refund.BankAccountDtls.BankName": "bankDetails.bankName",
        "ITR.ITR1.Refund.BankAccountDtls.IFSCCode": "bankDetails.ifscCode",
        "ITR.ITR1.Refund.BankAccountDtls.BankAccountNo": "bankDetails.accountNumber",

        # ===== Form metadata (header-level, map to general) =====
        "ITR.ITR1.Form_ITR1": "filingStatus.returnFileSection",
        "ITR.ITR1.Form_ITR1.FormName": "filingStatus.returnFileSection",
        "ITR.ITR1.Form_ITR1.AssessmentYear": "filingStatus.assessmentYear",
        "ITR.ITR1.Form_ITR1.Description": "filingStatus.returnFileSection",
        "ITR.ITR1.Form_ITR1.SchemaVer": "filingStatus.returnFileSection",
        "ITR.ITR1.Form_ITR1.FormVer": "filingStatus.returnFileSection",

        # ===== Structural required fields (top-level containers) =====
        "ITR": "filingStatus.returnFileSection",
        "ITR.ITR1": "filingStatus.returnFileSection",
    }

    @staticmethod
    def map_itr_path_to_filing_field(itr_path: Optional[str]) -> Optional[str]:
        """
        Map ITR1 field path back to FilingModel field name for error reporting.
        
        This is a reverse mapping used when ERI validation errors reference ITR1 fields
        and we need to map them back to FilingModel fields for UI display.
        
        Args:
            itr_path: ITR1 field path (e.g., "ITR.ITR1.PersonalInfo.DOB")
            
        Returns:
            FilingModel field name if mapping exists, None otherwise
        """
        if not itr_path:
            return None
        return FilingToItr1Mapper._ITR_TO_FILING_FIELD_MAP.get(itr_path)
    
