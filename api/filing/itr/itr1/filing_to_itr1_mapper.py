"""
FilingModel to ITR1 Mapper - Handles only mapping rules.
Building/transformation logic moved to Itr1BuildingService.
"""
import logging
from datetime import date
from typing import Any, Dict, Optional, cast

from domain.filing.itr.auto_mapper import AutoMapper
from domain.filing.models.filing_model import FilingModel

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

    RULES = [
        "assessment_year <=> Form_ITR1.AssessmentYear",
        "default(\"2026\") => Form_ITR1.AssessmentYear",
        "default(\"ITR-1\") => Form_ITR1.FormName",
        "default(\"For Indls having Income from Salary, Pension, family pension and Interest\") => Form_ITR1.Description",
        "default(\"Ver1.0\") => Form_ITR1.SchemaVer",
        "default(\"Ver1.0\") => Form_ITR1.FormVer",
        "default(\"NA\") => PersonalInfo.AssesseeName.FirstName",
        "default(\"NA\") => PersonalInfo.AssesseeName.SurNameOrOrgName",
        "default(\"NA\") => PersonalInfo.PAN",
        "default(\"NA\") => PersonalInfo.EmployerCategory",
        "default(\"\") => PersonalInfo.DOB",
        "default(\"NA\") => PersonalInfo.Address.ResidenceNo",
        "default(\"NA\") => PersonalInfo.Address.LocalityOrArea",
        "default(\"Delhi\") => PersonalInfo.Address.CityOrTownOrDistrict",
        "default(\"36\") => PersonalInfo.Address.StateCode",
        "default(\"91\") => PersonalInfo.Address.CountryCode",
        "default(91) => PersonalInfo.Address.CountryCodeMobile",
        "default(0) => PersonalInfo.Address.MobileNo",
        "default(\"na@na.com\") => PersonalInfo.Address.EmailAddress",
        "default(0) => ITR1_IncomeDeductions.GrossSalary",
        "default(0) => ITR1_IncomeDeductions.IncomeNotified89A",
        "default(0) => ITR1_IncomeDeductions.NetSalary",
        "default(0) => ITR1_IncomeDeductions.DeductionUs16",
        "default(0) => ITR1_IncomeDeductions.IncomeFromSal",
        "default(0) => ITR1_IncomeDeductions.AnnualValue",
        "default(0) => ITR1_IncomeDeductions.StandardDeduction",
        "default(0) => ITR1_IncomeDeductions.TotalIncomeOfHP",
        "default(0) => ITR1_IncomeDeductions.IncomeOthSrc",
        "default(0) => ITR1_IncomeDeductions.GrossTotIncome",
        "default(0) => ITR1_IncomeDeductions.GrossTotIncomeIncLTCG112A",
        "default(0) => ITR1_IncomeDeductions.TotalIncome",
        
        "default(0) => TaxPaid.TaxesPaid.AdvanceTax",
        "default(0) => TaxPaid.TaxesPaid.TDS",
        "default(0) => TaxPaid.TaxesPaid.TCS",
        "default(0) => TaxPaid.TaxesPaid.SelfAssessmentTax",
        "default(0) => TaxPaid.TaxesPaid.TotalTaxesPaid",
        "default(0) => TaxPaid.BalTaxPayable",

        "default(0) => ITR1_IncomeDeductions.TotalIncome",
        
        # Chapter VI-A Deductions - UsrDeductUndChapVIA defaults
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.Section80C",
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.Section80CCC",
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.Section80CCDEmployeeOrSE",
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.Section80CCD1B",
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.Section80CCDEmployer",
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.Section80D",
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.Section80DD",
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.Section80DDB",
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.Section80E",
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.Section80EE",
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.Section80EEA",
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.Section80EEB",
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.Section80G",
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.Section80GG",
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.Section80GGA",
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.Section80GGC",
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.Section80U",
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.Section80TTA",
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.Section80TTB",
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.AnyOthSec80CCH",
        "default(0) => ITR1_IncomeDeductions.UsrDeductUndChapVIA.TotalChapVIADeductions",
        
        # Chapter VI-A Deductions - DeductUndChapVIA defaults
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.Section80C",
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.Section80CCC",
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.Section80CCDEmployeeOrSE",
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.Section80CCD1B",
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.Section80CCDEmployer",
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.Section80D",
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.Section80DD",
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.Section80DDB",
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.Section80E",
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.Section80EE",
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.Section80EEA",
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.Section80EEB",
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.Section80G",
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.Section80GG",
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.Section80GGA",
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.Section80GGC",
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.Section80U",
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.Section80TTA",
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.Section80TTB",
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.AnyOthSec80CCH",
        "default(0) => ITR1_IncomeDeductions.DeductUndChapVIA.TotalChapVIADeductions",
        
        "default(0) => TaxPaid.TaxesPaid.AdvanceTax",

        # CreationInfo (runtime-only: JSONCreationDate + IntermediaryCity)
        "default(\"R7\") => CreationInfo.SWVersionNo",
        "default(\"SW90002526\") => CreationInfo.SWCreatedBy",
        "default(\"SW90002526\") => CreationInfo.JSONCreatedBy",
        "default(\"Delhi\") => CreationInfo.IntermediaryCity",
        "default(\"TB9CCDnaxqAZje2xvfUGosU8zaWlL7axHLR2GM8ktv8=\") => CreationInfo.Digest",
    
        # FilingStatus (runtime-only: OptOutNewTaxRegime)
        "default(11) => FilingStatus.ReturnFileSec",
        "default(\"N\") => FilingStatus.OptOutNewTaxRegime",
        "default(\"2025-07-31\") => FilingStatus.ItrFilingDueDate",

        "default(0) => TaxPaid.TaxesPaid.TotalTaxesPaid",
        "default(0) => TaxPaid.BalTaxPayable",
        
        # Schedule80E defaults
        "default(0) => Schedule80E.TotalInterest80E",
        
        # Schedule80EE defaults
        "default([]) => Schedule80EE.Schedule80EEDtls",
        
        # Schedule80EEA defaults
        "default(0) => Schedule80EEA.PropStmpDtyVal",
        "default([]) => Schedule80EEA.Schedule80EEADtls",
        
        # Schedule80EEB defaults
        "default([]) => Schedule80EEB.Schedule80EEBDtls",
        
        # Schedule80GGA defaults
        "default(0) => Schedule80GGA.TotalDonationAmtCash80GGA",
        "default(0) => Schedule80GGA.TotalDonationAmtOtherMode80GGA",
        "default(0) => Schedule80GGA.TotalDonationsUs80GGA",
        "default(0) => Schedule80GGA.TotalEligibleDonationAmt80GGA",
        
        # Schedule80GGC defaults
        "default(0) => Schedule80GGC.TotalDonationAmtCash80GGC",
        "default(0) => Schedule80GGC.TotalDonationAmtOtherMode80GGC",
        "default(0) => Schedule80GGC.TotalDonationsUs80GGC",
        "default(0) => Schedule80GGC.TotalEligibleDonationAmt80GGC",


        # CreationInfo (runtime-only: JSONCreationDate + IntermediaryCity)



        # Personal Info - Name
        "person.first_name <=> PersonalInfo.AssesseeName.FirstName",
        "person.middle_name <=> PersonalInfo.AssesseeName.MiddleName",
        "person.last_name <=> PersonalInfo.AssesseeName.SurNameOrOrgName",
        "person.pan_number <=> PersonalInfo.PAN",
        "person.date_of_birth <=> PersonalInfo.DOB",
        "person.aadhaar_number <=> PersonalInfo.AadhaarCardNo",
        "person.email <=> PersonalInfo.Address.EmailAddress",
        "person.mobile_number <=> PersonalInfo.Address.MobileNo",
         # employer type
        "salary.employer.employer_type <=> PersonalInfo.EmployerCategory",
        
        # Address
        "person_address.flat_door_no <=> PersonalInfo.Address.ResidenceNo",
        "person_address.premise_name <=> PersonalInfo.Address.ResidenceName",
        "person_address.street <=> PersonalInfo.Address.RoadOrStreet",
        "person_address.area_locality <=> PersonalInfo.Address.LocalityOrArea",
        "person_address.city <=> PersonalInfo.Address.CityOrTownOrDistrict",
        "person_address.state <=> PersonalInfo.Address.StateCode",
        "person_address.pincode <=> PersonalInfo.Address.PinCode",


        # Schedule80E (uses itr_* computed properties on Deduction80EModel)
        "section_80e[].itr_loan_tkn_from <=> Schedule80E.Schedule80EDtls[].LoanTknFrom",
        "section_80e[].itr_bank_or_instn_name <=> Schedule80E.Schedule80EDtls[].BankOrInstnName",
        "section_80e[].itr_loan_acc_ref <=> Schedule80E.Schedule80EDtls[].LoanAccNoOfBankOrInstnRefNo",
        "section_80e[].itr_dateofloan <=> Schedule80E.Schedule80EDtls[].DateofLoan",
        "section_80e[].itr_total_loan_amt <=> Schedule80E.Schedule80EDtls[].TotalLoanAmt",
        "section_80e[].itr_loan_outstanding_amt <=> Schedule80E.Schedule80EDtls[].LoanOutstndngAmt",
        "section_80e[].itr_interest_80e <=> Schedule80E.Schedule80EDtls[].Interest80E",

        # Schedule80G (uses section_80g_100/section_80g_50 on FilingModel)
        "section_80g_100[].itr_donee_with_pan_name <=> Schedule80G.Don100Percent.DoneeWithPan[].DoneeWithPanName",
        "section_80g_100[].itr_donee_pan <=> Schedule80G.Don100Percent.DoneeWithPan[].DoneePAN",
        "section_80g_100[].itr_arn_nbr <=> Schedule80G.Don100Percent.DoneeWithPan[].ArnNbr",
        "section_80g_100[].itr_address_detail <=> Schedule80G.Don100Percent.DoneeWithPan[].AddressDetail",
        "section_80g_100[].itr_donation_amt_cash <=> Schedule80G.Don100Percent.DoneeWithPan[].DonationAmtCash",
        "section_80g_100[].itr_donation_amt_other_mode <=> Schedule80G.Don100Percent.DoneeWithPan[].DonationAmtOtherMode",
        "section_80g_100[].itr_donation_amt <=> Schedule80G.Don100Percent.DoneeWithPan[].DonationAmt",
        "section_80g_100[].itr_eligible_donation_amt <=> Schedule80G.Don100Percent.DoneeWithPan[].EligibleDonationAmt",

        "section_80g_50[].itr_donee_with_pan_name <=> Schedule80G.Don50PercentNoApprReqd.DoneeWithPan[].DoneeWithPanName",
        "section_80g_50[].itr_donee_pan <=> Schedule80G.Don50PercentNoApprReqd.DoneeWithPan[].DoneePAN",
        "section_80g_50[].itr_arn_nbr <=> Schedule80G.Don50PercentNoApprReqd.DoneeWithPan[].ArnNbr",
        "section_80g_50[].itr_address_detail <=> Schedule80G.Don50PercentNoApprReqd.DoneeWithPan[].AddressDetail",
        "section_80g_50[].itr_donation_amt_cash <=> Schedule80G.Don50PercentNoApprReqd.DoneeWithPan[].DonationAmtCash",
        "section_80g_50[].itr_donation_amt_other_mode <=> Schedule80G.Don50PercentNoApprReqd.DoneeWithPan[].DonationAmtOtherMode",
        "section_80g_50[].itr_donation_amt <=> Schedule80G.Don50PercentNoApprReqd.DoneeWithPan[].DonationAmt",
        "section_80g_50[].itr_eligible_donation_amt <=> Schedule80G.Don50PercentNoApprReqd.DoneeWithPan[].EligibleDonationAmt",

        # Schedule80GGA (uses itr_* computed properties on Deduction80GGAModel)
        "section_80gga[].itr_relevant_clause <=> Schedule80GGA.DonationDtlsSciRsrchRuralDev[].RelevantClauseUndrDedClaimed",
        "section_80gga[].itr_name_of_donee <=> Schedule80GGA.DonationDtlsSciRsrchRuralDev[].NameOfDonee",
        "section_80gga[].itr_address_detail <=> Schedule80GGA.DonationDtlsSciRsrchRuralDev[].AddressDetail",
        "section_80gga[].itr_donee_pan <=> Schedule80GGA.DonationDtlsSciRsrchRuralDev[].DoneePAN",
        "section_80gga[].itr_donation_amt_cash <=> Schedule80GGA.DonationDtlsSciRsrchRuralDev[].DonationAmtCash",
        "section_80gga[].itr_donation_amt_other_mode <=> Schedule80GGA.DonationDtlsSciRsrchRuralDev[].DonationAmtOtherMode",
        "section_80gga[].itr_donation_amt <=> Schedule80GGA.DonationDtlsSciRsrchRuralDev[].DonationAmt",
        "section_80gga[].itr_eligible_donation_amt <=> Schedule80GGA.DonationDtlsSciRsrchRuralDev[].EligibleDonationAmt",

        # Schedule80GGC (uses itr_* computed properties on Deduction80GGCModel)
        "section_80ggc[].itr_donation_date <=> Schedule80GGC.Schedule80GGCDetails[].DonationDate",
        "section_80ggc[].itr_donation_amt_cash <=> Schedule80GGC.Schedule80GGCDetails[].DonationAmtCash",
        "section_80ggc[].itr_donation_amt_other_mode <=> Schedule80GGC.Schedule80GGCDetails[].DonationAmtOtherMode",
        "section_80ggc[].itr_transaction_ref_num <=> Schedule80GGC.Schedule80GGCDetails[].TransactionRefNum",
        "section_80ggc[].itr_ifsc_code <=> Schedule80GGC.Schedule80GGCDetails[].IFSCCode",
        "section_80ggc[].itr_donation_amt <=> Schedule80GGC.Schedule80GGCDetails[].DonationAmt",
        "section_80ggc[].itr_eligible_donation_amt <=> Schedule80GGC.Schedule80GGCDetails[].EligibleDonationAmt",

        # ScheduleUs24B (uses house_property_with_loan on FilingModel and itr_* properties on PropertyModel)
        "house_property_with_loan[].itr_loan_tkn_from <=> ScheduleUs24B.ScheduleUs24BDtls[].LoanTknFrom",
        "house_property_with_loan[].itr_bank_or_instn_name <=> ScheduleUs24B.ScheduleUs24BDtls[].BankOrInstnName",
        "house_property_with_loan[].itr_loan_acc_ref <=> ScheduleUs24B.ScheduleUs24BDtls[].LoanAccNoOfBankOrInstnRefNo",
        "house_property_with_loan[].itr_dateofloan <=> ScheduleUs24B.ScheduleUs24BDtls[].DateofLoan",
        "house_property_with_loan[].itr_total_loan_amt <=> ScheduleUs24B.ScheduleUs24BDtls[].TotalLoanAmt",
        "house_property_with_loan[].itr_loan_outstanding_amt <=> ScheduleUs24B.ScheduleUs24BDtls[].LoanOutstndngAmt",
        "house_property_with_loan[].itr_interest_us24b <=> ScheduleUs24B.ScheduleUs24BDtls[].InterestUs24B",

        # Schedule80DD (single object from section_80dd)
        "section_80dd.itr_nature_of_disability => Schedule80DD.NatureOfDisability",
        "section_80dd.itr_type_of_disability => Schedule80DD.TypeOfDisability",
        "section_80dd.itr_deduction_amount => Schedule80DD.DeductionAmount",
        "section_80dd.itr_dependent_type => Schedule80DD.DependentType",
        "section_80dd.itr_dependent_pan => Schedule80DD.DependentPan",
        "section_80dd.itr_form10ia_ack_num => Schedule80DD.Form10IAAckNum",
        "section_80dd.itr_udid_num => Schedule80DD.UDIDNum",

        # Schedule80U (single object from section_80u)
        "section_80u.itr_nature_of_disability => Schedule80U.NatureOfDisability",
        "section_80u.itr_type_of_disability => Schedule80U.TypeOfDisability",
        "section_80u.itr_deduction_amount => Schedule80U.DeductionAmount",
        "section_80u.itr_form10ia_ack_num => Schedule80U.Form10IAAckNum",
        "section_80u.itr_udid_num => Schedule80U.UDIDNum",

        # Schedule80EE/80EEA/80EEB totals (detail rows built in transforms)
        "section_80ee.interest_on_loan => Schedule80EE.TotalInterest80EE",
        "section_80eea.interest_on_loan => Schedule80EEA.TotalInterest80EEA",
        "section_80eeb.interest_on_loan => Schedule80EEB.TotalInterest80EEB",
        
    ]

    _mapper = AutoMapper(rules=RULES, ignore_missing=True)

   

    # ==========================================================================
    # PUBLIC API
    # ==========================================================================
    @classmethod
    async def filing_to_itr1(cls, filing: FilingModel) -> Dict[str, Any]:
        """Convert FilingModel to ITR1 using AutoMapper + building service."""
        
        # 1) Map simple fields + schedule detail arrays into a plain payload.
        payload_any = cls._mapper.map(source=filing, target_type=dict)
        payload = cast(Dict[str, Any], payload_any)
        return cls._normalize_itr1_payload_for_validation(payload)  
        

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
    @staticmethod
    def _normalize_itr1_payload_for_validation(payload: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure mapper payload has required ITR1 fields and correct types so ITR1.model_validate succeeds."""
        out: Dict[str, Any] = dict(payload)

        # CreationInfo: ensure JSONCreationDate exists
        ci = out.get("CreationInfo")
        if isinstance(ci, dict) and "JSONCreationDate" not in ci:
            ci["JSONCreationDate"] = date.today().isoformat()
            out["CreationInfo"] = ci

        # Refund: add minimal if missing
        if "Refund" not in out or out["Refund"] is None:
            out["Refund"] = {"RefundDue": 0, "BankAccountDtls": {}}

        # Verification: add minimal if missing
        if "Verification" not in out or out["Verification"] is None:
            out["Verification"] = {
                "Declaration": {"AssesseeVerName": "-", "FatherName": "-", "AssesseeVerPAN": "-"},
                "Capacity": "S",
                "Place": "-",
            }

        # Schedule80D: ITR1 model only allows Sec80DSelfFamSrCtznHealth; strip internal fields
        sch80d = out.get("Schedule80D")
        if isinstance(sch80d, dict):
            for extra in ("UserClaimedTotal", "AllowedTotal"):
                sch80d.pop(extra, None)
            if not sch80d.get("Sec80DSelfFamSrCtznHealth"):
                out["Schedule80D"] = None
            else:
                out["Schedule80D"] = sch80d

        # Optional schedules: drop if present but invalid (empty or missing required fields)
        for key in ("Schedule80DD", "Schedule80U"):
            sch = out.get(key)
            if isinstance(sch, dict):
                if not sch or sch.get("NatureOfDisability") is None or sch.get("DeductionAmount") is None:
                    out[key] = None
                elif key == "Schedule80DD" and (
                    sch.get("TypeOfDisability") is None or sch.get("DependentType") is None
                ):
                    out[key] = None

        # Schedule80EE / 80EEA / 80EEB: fix string '[]' -> list, None totals -> 0
        for key, dtls_key, total_key in (
            ("Schedule80EE", "Schedule80EEDtls", "TotalInterest80EE"),
            ("Schedule80EEA", "Schedule80EEADtls", "TotalInterest80EEA"),
            ("Schedule80EEB", "Schedule80EEBDtls", "TotalInterest80EEB"),
        ):
            sch = out.get(key)
            if isinstance(sch, dict):
                if sch.get(dtls_key) == "[]" or not isinstance(sch.get(dtls_key), list):
                    sch[dtls_key] = []
                if sch.get(total_key) is None:
                    sch[total_key] = 0
                out[key] = sch

        return out
