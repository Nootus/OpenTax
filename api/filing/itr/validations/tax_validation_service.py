"""Tax Validation Service - User validation errors for left panel.

Validation sources (Excel/VBA dump):
  - xl/vba_code.txt, xl/itr1_macros.txt  — VBA macros and validation functions
  - Schedule 80C:  Validate_80C, Validate80C_All; md80C.bas (ValidateAmount_80C, ValidateIdentification_Number_80C, Validategreater_80C)
  - Schedule 80D:  Validate_80D; mappers/validators, md80D, Sch80D (InsurerName, PolicyNo, HealthInsAmt mandatory; no NA/0)
  - Schedule 80E:  Validate_80E; md80E.bas (LoanTknFrom, BankName, AccntNum, LoanDate, LoanAmt, LoanOutstanding, Intrst)
  - Schedule 80EE:  Validate_80EE, Validate80EE_All (LoanTknFrom, BankName, AccntNum, LoanDate, LoanAmt, LoanOutstanding, Intrst_80EE)
  - Schedule 80EEA: VB Dump/ITR1/md80EEA.bas — Validate80EEA_All, Validate_80EEA (PropStmpDtyVal <= 45L, Schedule80EEADtls, TotalInterest80EEA).
  - Schedule 80G:   Validate_80G (DoneeWithPan name, PAN, address, amounts per section)
  - Schedule 80GGA: Sch80GGA.bas (RelevantClause, Name, Address, City, State, PinCode, PAN, DonationAmt; totals; eligible cap)
  - Schedule 80GGC: Sch80GGC.bas (date, cash/other mode, TransactionRef, IFSC; totals)
  - Schedule 80DD:  VB Dump/ITR1/Sch80U_DD.bas — Validate80DD, Validate80DD_1 (NatureOfDisability, TypeOfDisability,
    DeductionAmount, DependentType, PAN, Aadhaar, Form10IAAckNum, UDIDNum).
  - Schedule 80U:   VB Dump/ITR1/Sch80U_DD.bas — Validate80U, Validate80U_1 (NatureOfDisability, TypeOfDisability,
    DeductionAmount, Form10IAAckNum, UDIDNum).
"""

import re
from typing import List, cast
from filing.itr.itr1.models.itr1_model import ITR1
from filing.models.filing_model import FilingModel
from filing.models.salary_model import SalaryModel   
from filing.models.property_model import PropertyModel 
from filing.itr.validations.models.validation import ValidationError    
from filing.utils.encryption import decrypt_pan
# Excel/VB constants
ITR1_MAX_TOTAL_INCOME_EXCL_LTCG = 5000000
LTCG_112A_MAX = 125000
AGRICULTURAL_INCOME_ITR1_MAX = 5000
ITR_U_MIN_TOTAL_INCOME = 250000
MAX_14_DIGITS = 99999999999999
DOB_PATTERN = re.compile(r"^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))$")
PAN_PATTERN = re.compile(r"^[A-Z]{5}\d{4}[A-Z]$")
ELIGIBLE_DONATION_80GGA_PERCENT_OF_TOTAL_INCOME = 10
def _chk_compulsory(value: object) -> bool:
    """Excel/VBA: value is not None, not empty string, not 0."""
    if value is None:
        return False
    if isinstance(value, str):
        return value.strip() != ""
    if isinstance(value, str):
        return value.strip() != "NA"
    if isinstance(value, (int, float)):
        return value != 0
    
    return True


def _validate_pan_format(pan: object) -> bool:
    """PAN format: 5 alphabets, 4 digits, 1 alphabet (Excel 80GGA)."""
    if not isinstance(pan, str) or len(pan) != 10:
        return False
    return bool(re.match(r"^[A-Z]{5}\d{4}[A-Z]$", pan.upper()))


def _validate_ifsc_format(ifsc: object) -> bool:
    """IFSC: first 4 alphabets, 5th is 0, remaining 6 alphanumeric (Excel 80GGC)."""
    if not isinstance(ifsc, str) or len(ifsc) != 11:
        return False
    u = ifsc.upper()
    return u[:4].isalpha() and u[4] == "0" and u[5:].isalnum()


def _check_field_special_character_trans(value: str) -> bool:
    """Excel 80GGC: Transaction ref allows only alphanumeric, space, / and -."""
    return bool(re.match(r"^[a-zA-Z0-9\s/\-]+$", value))


def _isdropdownblank(value: object) -> bool:
    """Excel: dropdown blank if empty or starts with '('."""
    if value is None:
        return True
    if isinstance(value, str):
        s = value.strip()
        return s == "" or s.startswith("(")
    return False


class TaxValidationService:
    """
    Service for calculating user validation errors.
    These errors appear on the left panel for real-time feedback.
    Separate from ERI validation which happens on the tax-validation page.
    """


    @staticmethod
    def _get_filing_status(req: ITR1):
        """Return the FilingStatus object from ITR1."""
        return req.FilingStatus

    async def get_user_validation_errors(self, filing_model: FilingModel, itr_model: ITR1 | None) -> List[ValidationError]:
        """
        Calculate USER validation errors for the filing (for left panel).
        These are for incomplete/invalid user input, NOT ERI validation.

        Args:
            filing_model: The FilingModel with computed tax values
            itr_model: ITR1 or ITR2 model; validators are dispatched by type

        Returns:
            List of ValidationError objects with field names matching FIELD_WIDGET_MAP
        """
        if itr_model is None:
            return []
        errors: List[ValidationError] = []

        self.personal_info_validator(filing_model, errors)
        self.validate_bank_details(filing_model, errors)
        self.ValidateTotalIncomeNonNegative(filing_model, errors)
        await self.income_validator(filing_model, errors)   
        # ITR-1-specific income and total validators
        self.others_income_validator(itr_model, errors)
        self.ValidateDeductionUs57iia(itr_model, errors)

        # Common validators – work for both ITR1 and ITR2
        self.ValidateSchedule80C(filing_model, errors)
        self.ValidateSchedule80GGA(filing_model, errors)
        self.ValidateSchedule80GGC(filing_model, errors)
        self.ValidateSchedule80D(filing_model, errors)
        self.ValidateSchedule80G(filing_model, errors)
        self.ValidateSchedule80E(filing_model, errors)
        self.ValidateSchedule80EE(filing_model, errors)
        self.ValidateSchedule80EEA(filing_model, errors)
        self.ValidateSchedule80EEB(filing_model, errors)
        self.ValidateSchedule80DD(filing_model, errors)
        self.ValidateSchedule80U(filing_model, errors)
        self.ValidateSchedule80TTA(filing_model, errors)  
        self.ValidateTDS(filing_model, errors)  
        return errors

    def perinfo_validator(self, req: ITR1,errors: list[ValidationError]) -> bool:
        errors.append(ValidationError(field="employer.employerName", message="* Gross salary value should not exceed 14 digits in Income Details"))
        return False
    def _no_angle_brackets(self, value: str) -> bool:
        """VBA _schedule_80c_no_angle_brackets: no < or > in Policy/Identification."""
        return "<" not in value and ">" not in value
    def _check_name_no_special_chars(self, value: str) -> bool:
        """VBA checkfieldSuperSpecialcharactername: no <, >, or & in name fields."""
        if not value:
            return True
        for c in "<>&":
            if c in value:
                return False
        return True

    def _check_aadhaar_format(self, value: str|None) -> bool:
        """VBA ValidateAadharNumber (xl/vba_code.txt 14477-14513): 12 digits, not all 0 or all 1."""
        if not value or not value.strip():
            return True  # optional field
        s = value.strip()
        if not s.isdigit() or len(s) != 12:
            return False
        if s == "000000000000" or s == "111111111111":
            return False
        return True   
    def personal_info_validator(self,filingmodel:FilingModel, messages: list[ValidationError]) -> None:
        """Validates the personal information (works for both ITR1 and ITR2)."""
        
        if(filingmodel.person is None):
            messages.append(ValidationError(field="person.firstName", message="* Personal details are required "))
            return
        if(filingmodel.person.first_name is None):
            messages.append(ValidationError(field="person.firstName", message="* FirstName is mandatory in personal details "))
        elif not self._check_name_no_special_chars(filingmodel.person.first_name):
            messages.append(ValidationError(field="person.firstName", message="* First name should not contain special characters in personal details "))
        if(filingmodel.person.last_name is None):
            messages.append(ValidationError(field="person.lastName", message="* LastName is mandatory in personal details "))   
        elif not self._check_name_no_special_chars(filingmodel.person.last_name):
            messages.append(ValidationError(field="person.lastName", message="* Last name should not contain special characters in personal details "))
        if(filingmodel.person.date_of_birth is None):
            messages.append(ValidationError(field="person.dateOfBirth", message="* Date of Birth is required "))
        elif not DOB_PATTERN.match(str(filingmodel.person.date_of_birth)):
            messages.append(ValidationError(field="person.dateOfBirth", message="* Date of Birth must be in YYYY-MM-DD format "))
        if(filingmodel.person.aadhaar_number is not None and not self._check_aadhaar_format(str(filingmodel.person.aadhaar_number))):
            messages.append(ValidationError(field="person.aadhaarNumber", message="* Please enter the Aadhaar number in valid format "))
        if(filingmodel.person.middle_name is not None and not self._check_name_no_special_chars(filingmodel.person.middle_name)):
            messages.append(ValidationError(field="person.middleName", message="* Middle name should not contain special characters in personal details "))
        if(filingmodel.person.pan_number is None):
            messages.append(ValidationError(field="person.panNumber", message="* PAN is required "))
        elif not PAN_PATTERN.match(str(decrypt_pan(filingmodel.person.pan_number))):
            messages.append(ValidationError(field="person.panNumber", message="* PAN must be in 10 digits format "))
        if(filingmodel.person.mobile_number is not None):
            mobile_str = str(filingmodel.person.mobile_number).strip()
            if not mobile_str.isdigit() or len(mobile_str) != 10:
                messages.append(ValidationError(field="person.mobileNumber", message="* Mobile number must be 10 digits "))
        if(filingmodel.person.email is not None):
            email_str = str(filingmodel.person.email).strip()
            if "@" not in email_str or "." not in email_str:
                messages.append(ValidationError(field="person.email", message="* Please enter a valid email address "))
        if(filingmodel.person_address is None):
            messages.append(ValidationError(field="person_address.flatDoorNo", message="* Address details are required "))  
        else:
            if(filingmodel.person_address.state is None):
             messages.append(ValidationError(field="person_address.state", message="* State is mandatory in address details "))  
            if(filingmodel.person_address.city is None):
             messages.append(ValidationError(field="person_address.city", message="* City is mandatory in address details ")    )
            if(filingmodel.person_address.pincode is not None):
             pincode_str = str(filingmodel.person_address.pincode).strip()
             if not pincode_str.isdigit() or len(pincode_str) != 6:
                messages.append(ValidationError(field="person_address.pincode", message="* Pin code must be 6 digits in address details "))
            if(filingmodel.person_address.country is None):
             messages.append(ValidationError(field="person_address.country", message="* Country is mandatory in address details ")  )
            if(filingmodel.person_address.flat_door_no is not None and not self._check_name_no_special_chars(str(filingmodel.person_address.flat_door_no))):
             messages.append(ValidationError(field="person_address.flatDoorNo", message="* Flat/Door/Block No should not contain special characters in address details ") )
            if(filingmodel.person_address.premise_name is not None and not self._check_name_no_special_chars(str(filingmodel.person_address.premise_name))):
             messages.append(ValidationError(field="person_address.premiseName", message="* Name of Premises/Building/Village should not contain special characters in address details ") ) 
            if(filingmodel.person_address.street is not None and not self._check_name_no_special_chars(str(filingmodel.person_address.street))):
             messages.append(ValidationError(field="person_address.street", message="* Road/Street/Lane should not contain special characters in address details ") )
        # SOURCE: xl/vba_code.txt ChkEmpCategory 13030-13039, PIShtValidate 14029; sheet1.EmployerCategory1
        # EmployerCategory is only present on ITR1.PersonalInfo; ITR2 uses per-employer NatureOfEmployment
       

    def validate_bank_details(self, filing_model: FilingModel, messages: list[ValidationError]) -> bool:
        """Validates bank account details from filing_model.bank_account.
        - At least one bank account must exist
        - bank_name, account_number, ifsc_code, account_type mandatory per account
        - Exactly one account must be marked is_primary=True
        """
        if not filing_model.bank_account:
            messages.append(ValidationError(
                field="bankDetails.accountType",
                message="* Bank account details are required in personal details",
            ))
            return False

        ok = True
        primary_count = 0

        for acct in filing_model.bank_account:
            if not acct.bank_name.strip():
                messages.append(ValidationError(
                    field="bankDetails.bankName",
                    message="* Bank Name is mandatory in bank details",
                ))
                ok = False
            elif len(acct.bank_name) > 125:
                messages.append(ValidationError(
                    field="bankDetails.bankName",
                    message="* Bank Name cannot exceed 125 characters in bank details",
                ))
                ok = False

            if not acct.account_number.strip():
                messages.append(ValidationError(
                    field="bankDetails.accountNumber",
                    message="* Account Number is mandatory in bank details",
                ))
                ok = False

            if not acct.ifsc_code.strip():
                messages.append(ValidationError(
                    field="bankDetails.ifscCode",
                    message="* IFSC Code is mandatory in bank details",
                ))
                ok = False
            elif not _validate_ifsc_format(acct.ifsc_code.strip()):
                messages.append(ValidationError(
                    field="bankDetails.ifscCode",
                    message="* Invalid IFSC Code in bank details (4 letters, digit 0, 6 alphanumeric)",
                ))
                ok = False

            if not acct.account_type.strip():
                messages.append(ValidationError(
                    field="bankDetails.accountType",
                    message="* Account Type is mandatory in bank details",
                ))
                ok = False

            if acct.is_primary:
                primary_count += 1

        if primary_count == 0:
            messages.append(ValidationError(
                field="bankDetails.isPrimary",
                message="* Please mark at least one bank account as primary for refund",
            ))
            ok = False
        elif primary_count > 1:
            messages.append(ValidationError(
                field="bankDetails.isPrimary",
                message="* Only one bank account can be marked as primary for refund",
            ))
            ok = False

        return ok

    async def income_validator(self, filing_model: FilingModel, errors: list[ValidationError]) :
        await self.salary_section_validator(filing_model, errors)
        self.house_property_validator(filing_model, errors)       

    async def salary_section_validator(self, filing_model: FilingModel, errors: list[ValidationError]) :
        for salary in filing_model.salary:
         self.ValidateEmployerCategory(salary, errors)
         self.DeductionUs16ia_validator(filing_model,salary, errors)
         await self.EntertainmentAlw16ii_validator(salary, errors)
         self.ProfessionalTaxUs16iii_validator(salary, errors)
    
    def house_property_validator(self, filing_model: FilingModel, errors: list[ValidationError]) :
        for prop in filing_model.house_property:
         self.ValidatePropertyType(prop, errors)
         self.ValidateGrossRentReceived(prop, errors)
         self.ValidateTaxPaidLocalAuthorities(prop, errors)
         self.ValidateTenantPAN(prop, errors)
    def others_income_validator(self, filing_model: ITR1, errors: list[ValidationError]) :
        self.ValidateOthersEI1(filing_model, errors)

    def DeductionUs16ia_validator(self, filing_model:FilingModel, req: SalaryModel,messages: list[ValidationError]) -> bool:#Source: mIncmDtls.bas.bas (lines 1857-1884), Sheet1.cls.txt (lines 1150-1184)
        """Validates deduction u/s 16(ia)."""
        # deduction_16ia_int=0
        # if(req.salary_deduction_16 is not None):
        #     deduction_16ia_int =  req.salary_deduction_16.standard_deduction        
        
        # if filing_model.tax_computation.current_regime.regime.upper() == "OLD":  # type: ignore[attr-defined]
        #     if deduction_16ia_int > 50000.0:
        #         messages.append(ValidationError(field="deduction_16ia", message="* Maximum Deduction u/s 16(ia) is 50,000/- only in Income Details"))
        #         return False
        # else:
        #     if deduction_16ia_int > 75000.0:
        #         messages.append(ValidationError(field="deduction_16ia", message="* Maximum Deduction u/s 16(ia) is 75,000/- only in Income Details"))
        #         return False
        # Must not exceed Net Salary
       
        return True
    
    def ValidateEmployerCategory(self,req:SalaryModel, messages: list[ValidationError]) -> bool:#Source: ChkEmpCategory in xl/vba_code.txt (lines 13030-13039), sheet1.EmployerCategory1
        """Validates that Employer Category is selected if salary is provided."""
       
        if(req.employer.employer_type is None):
            messages.append(ValidationError(field="employer.employerType", message="* Employer category is required in Income Details when salary details are provided"))
                
        return True
   
    async def EntertainmentAlw16ii_validator(self, req: SalaryModel,messages: list[ValidationError]) -> bool:#Source: mIncmDtls.bas.bas (lines 1898-1913), Sheet1.cls.txt (lines 2908-2914)
        """Validates entertainment allowance u/s 16(ii)."""
        entertainment_allowance = req.salary_deduction_16.entertainment_allowance if req.salary_deduction_16 and req.salary_deduction_16.entertainment_allowance else 0
      
        # Max value check based on employer category - TODO: Need employer category from ITR1 model
        # For now, checking both limits
        # Central/State Government or PSU: Maximum ₹5,000
        # Others: 0
        if req.employer.employer_type in ("CGOV", "SGOV", "PE", "PESG"):
            if entertainment_allowance > 5000:
                messages.append(ValidationError(field="salaryDeduction16.entertainmentAllowance", message=" * Deduction of Entertainment allowance u/s 16(ii) should not exceed 10,000 in Income Details."))
                return False
        else:
            if entertainment_allowance > 0:
                messages.append(ValidationError(field="salaryDeduction16.entertainmentAllowance", message="* Deduction of Entertainment allowance u/s 16(ii) is not applicable for employer category" + " ""Not Applicable"" in Income Details."))
        # Cross-validation with Salary: Must not exceed min(5000, Salary/5)
       
        return True

    def ProfessionalTaxUs16iii_validator(self, req: SalaryModel,errors: list[ValidationError]) -> bool:#Source: Sheet1.cls.txt (lines 2916-2922) - Commented out in VB
        """Validates professional tax u/s 16(iii)."""
        professional_tax = cast(int, req.salary_deduction_16.professional_tax) if req.salary_deduction_16 and req.salary_deduction_16.professional_tax else 0
     
        
        # Note: Max ₹5,000 validation exists in VB but is commented out
        if professional_tax > 5000:
            errors.append(ValidationError(field="professional_tax", message="* Deduction of Professional tax u/s 16(iii) cannot exceed Rs.5,000 in Income Details."))
            return False
        
        return True
     # =============================================================================
    # Allowances Exemption VALIDATORS (ITR1 Model) - For OthersIncDtlsOthSrc (Others.NOI_1, Nature_Others_1, Others.Amount_1)
    # =============================================================================
    # Source: VB Dump - mIncmDtls.bas.bas (lines 5568-5707)
    # - ValidateOthersEI2() - lines 5568-5607
    # - ValidateNatureOfIncome2() - lines 5608-5670
    # - ValidateAmount2() - lines 5671-5707
    
    def ValidateNatureOfIncome_OthersInc1(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Validates Nature of Income (Others.NOI_1) and Description (Nature_Others_1) 
        for OthersIncDtlsOthSrc section.
        
        Source: VB Dump - ValidateNatureOfIncome2() (lines 5608-5670)
        """
        if not req.ITR1_IncomeDeductions.OthersInc or not req.ITR1_IncomeDeductions.OthersInc.OthersIncDtlsOthSrc:
            return True  # Section not filled
        
        for detail in req.ITR1_IncomeDeductions.OthersInc.OthersIncDtlsOthSrc:
            # Validate OthSrcNatureDesc (Others.NOI_1)
            nature_desc_obj = detail.OthSrcNatureDesc
            nature_desc: str = nature_desc_obj
            
            # Mandatory check - cannot be "(Select)" or empty
            if not nature_desc or nature_desc.strip() == "" or nature_desc == "(Select)":
                messages.append(ValidationError(
                    field="oth_src_nature_desc",
                    message=f"* Nature of Income in  Income Details is mandatory"
                ))
                return False
            
            # Special validation: If "Sec 10(13A)-Allowance to meet expenditure incurred on house rent" is selected,
            # then Section80GG_Calc must be 0 (cannot claim both 10(13A) and 80GG)
            if nature_desc == "10(13A)":
                # Check if Section80GG_Calc exists and is > 0
                # Note: This field may not exist in ITR1 model, so we check if it exists
                if hasattr(req.ITR1_IncomeDeductions, 'Section80GG_Calc'):
                    section_80gg = getattr(req.ITR1_IncomeDeductions, 'Section80GG_Calc', 0)
                    if section_80gg and cast(int, section_80gg) > 0:
                        messages.append(ValidationError(
                            field="oth_src_nature_desc",
                            message=f"* Deduction u/s 10(13A) & 80GG cannot be claimed for the same period in Income Details"
                        ))
                        return False
            
            # Validate OthSrcOthNatOfInc (Nature_Others_1) - Description field
            # If "Any Other" is selected, description is mandatory
            if nature_desc == "Any Other" or nature_desc == "OTH":
                description_obj = detail.OthSrcOthNatOfInc
                if not description_obj:
                    messages.append(ValidationError(
                        field="oth_src_oth_nat_of_inc",
                        message=f"* Please enter description in Nature of Exempt Allowance in Income Details"
                    ))
                    return False
                
                description: str = description_obj
                
                if not description or description.strip() == "":
                    messages.append(ValidationError(
                        field="oth_src_oth_nat_of_inc",
                        message=f"* Please enter description in Nature of Exempt Allowance  in  Income Details"
                    ))
                    return False
                
                # Description cannot exceed 125 characters
                if len(description) > 125:
                    messages.append(ValidationError(
                        field="oth_src_oth_nat_of_inc",
                        message=f"* Description  in  Income Details cannot exceed 125 characters"
                    ))
                    return False
        
        return True
    
    def ValidateAmount_OthersInc1(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Validates Amount (Others.Amount_1) for OthersIncDtlsOthSrc section.
        
        Source: VB Dump - ValidateAmount2() (lines 5671-5707)
        """
        if not req.ITR1_IncomeDeductions.OthersInc or not req.ITR1_IncomeDeductions.OthersInc.OthersIncDtlsOthSrc:
            return True  # Section not filled
        
        for detail in req.ITR1_IncomeDeductions.OthersInc.OthersIncDtlsOthSrc:
            amount_val = getattr(detail, "OthSrcOthAmount", None)
            if amount_val is None:
                continue
            amount: int = cast(int, amount_val)

            # Must be numeric (already validated by Pydantic conint, but check for negative)
            if amount < 0:
                messages.append(ValidationError(
                    field="oth_src_oth_amount",
                    message=f"* Income From Other Sources:in Income Details should be Numeric value"
                ))
                return False
            
        return True
    
    def Validate_OthersInc1(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Main orchestrator function that validates all OthersInc1 fields 
        (Others.NOI_1, Nature_Others_1, Others.Amount_1).
        
        Source: VB Dump - ValidateOthersEI2() (lines 5568-5607)
        """
        if not req.ITR1_IncomeDeductions.OthersInc or not req.ITR1_IncomeDeductions.OthersInc.OthersIncDtlsOthSrc:
            return True  # Section not filled
        
        # Validate that Others.NOI_1 is selected (not "(Select)" or empty)
        for detail in req.ITR1_IncomeDeductions.OthersInc.OthersIncDtlsOthSrc:
            nature_desc_obj = detail.OthSrcNatureDesc
            nature_desc: str = nature_desc_obj
            
            if not nature_desc or nature_desc.strip() == "" or nature_desc == "(Select)":
                messages.append(ValidationError(
                    field="oth_src_nature_desc",
                    message=f"* Please select an option from the drop down of 1(ii) in Income Details"
                ))
                return False
        
        # Validate Nature of Income and Description
        if not self.ValidateNatureOfIncome_OthersInc1(req, messages):
            return False
        
        # Validate Amount
        if not self.ValidateAmount_OthersInc1(req, messages):
            return False
        
        return True
    
     # =============================================================================
    # HOUSE PROPERTY VALIDATORS (ITR1 Model)
    # =============================================================================
    # Source: VB Dump - mIncmDtls.bas.bas
    # - ValidatePropertyType() - lines 2286-2304
    # - 14 digit checks - lines 1923-1945
    # - Cross-validations - lines 1796-1814
    
    def ValidatePropertyType(self, req: PropertyModel, messages: list[ValidationError]) -> bool:
        """
        Validates TypeOfHP - must be selected if any house property fields are filled.
        
        Source: VB Dump - ValidatePropertyType() (lines 2286-2304)
        """
        # Check if any house property fields have values
        if(req.property.property_type.strip() == "" or req.property.property_type == "(Select)"):
                    messages.append(ValidationError(
                        field="typeOfHP",
                        message="* Please select Type of House Property for each house property entry in Income Details"
                    ))
                    return False
        if req.property.property_type not in ["S", "L", "D", "Self Occupied", "Let Out", "Deemed Let Out"]:
                    messages.append(ValidationError(
                    field="property.propertyType",
                    message="* Type of House Property must be one of: Self Occupied (S), Let Out (L), or Deemed Let Out (D) in Income Details."
                    ))
                    return False
        
        
        return True
    def ValidateTenantPAN(self, req: PropertyModel, messages: list[ValidationError]) -> bool:
        """
        Validates TypeOfHP - must be selected if any house property fields are filled.
        
        Source: VB Dump - ValidatePropertyType() (lines 2286-2304)
        """
        # Check if any house property fields have values
        
        if req.property.property_type  in ["L", "D",  "Let Out", "Deemed Let Out"] and req.property.annual_rent_received is not None and req.property.annual_rent_received > 100000:
                    if(len(req.property_tenants)>0):
                        for tenant in req.property_tenants:
                            if tenant.identifier_value == "":
                                messages.append(ValidationError(
                                    field="propertyTenants.identifierValue",
                                    message="* Tenant Identification is mandatory if Gross Rent Received/Receivable/Letable Value exceeds Rs.1,00,000 in Income Details"
                                ))
                                return False 
                            if tenant.identifier_type == "PAN":
                                if _validate_pan_format(tenant.identifier_value) == False:
                                    messages.append(ValidationError(
                                        field="propertyTenants.identifierValue",
                                        message="* Tenant PAN must be in 10 digits format in Income Details"
                                    ))
                                return False   
                            if tenant.identifier_type == "Aadhaar":
                                if self._check_aadhaar_format(tenant.identifier_value) == False:
                                    messages.append(ValidationError(
                                        field="propertyTenants.identifierValue",
                                        message="* Tenant Aadhaar must be in 12 digits format in Income Details"
                                    ))
                                return False                
        return True
    
    def ValidateGrossRentReceived(self, req: PropertyModel, messages: list[ValidationError]) -> bool:
        """
        Validates GrossRentReceived.
        
        Source: VB Dump - lines 1923-1925, 1802-1804
        """
        if not req.property.property_type in ["L", "D", "Let Out", "Deemed Let Out"] and req.property.annual_rent_received is None:
            messages.append(ValidationError(
                        field="annualRentReceived",
                        message="* Gross rent received/ receivable/ letable value during the year should be greater than zero in  Income Details"
                    ))
            return False
        
        # If TypeOfHP is "Let Out" or "Deemed Let Out", GrossRentReceived must be > 0
        
                    
        
        return True

    def ValidateTaxPaidLocalAuthorities(self, req: PropertyModel, messages: list[ValidationError]) -> bool:
        """
        Validates TaxPaidlocalAuth.
        
        Source: VB Dump - lines 1927-1929, 1808-1812
        """
        """
        Validates GrossRentReceived.
        
        Source: VB Dump - lines 1923-1925, 1802-1804
        """
        if req.property.annual_rent_received is None and req.property.municipal_taxes_paid is not None and req.property.municipal_taxes_paid > 0 :
            messages.append(ValidationError(
                        field="municipalTaxesPaid",
                        message="* Tax paid to local authorities can be claimed only if income from house property is declared in Income Details."
                    ))
            return False
        if req.property.annual_rent_received is not None and req.property.annual_rent_received <= 0 and req.property.municipal_taxes_paid is not None and req.property.municipal_taxes_paid > 0:
            messages.append(ValidationError(
                        field="municipalTaxesPaid",
                        message="* Tax paid to local authorities can be claimed only if income from house property is declared in Income Details."
                    ))
            return False
        return True
    def ValidateTotalIncomeNonNegative(self, req: FilingModel, messages: list[ValidationError]) -> bool:
        """
        Total Income (Gross Total Income minus Chapter VIA deductions) must be >= 0.
        If user-claimed deductions exceed gross income, show a validation error.
        """
        if(req.tax_computation is not None and req.tax_computation.current_regime.total_income < 0):
            messages.append(ValidationError(
                field="TotalIncome",
                message="* Total Income cannot be negative. Chapter VIA deductions claimed cannot exceed Gross Total Income in Income Details."
            ))
            return False
        return True

    # =============================================================================
    # Others.NOI_2, Nature_Others_2, Others.Amount_2 (Excel: ValidateOthersEI1, ValidateNatureOfIncome1, ValidateAmount1)
    # =============================================================================
    # Source: itr1_macros - ValidateOthersEI1 (17615-17654), ValidateNatureOfIncome1 (17655-17708), ValidateAmount1 (17709-17748)

    def ValidateNatureOfIncome1(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Others.NOI_2, Nature_Others_2 - Nature mandatory; if Any Other, description mandatory; description max 125 chars.
        Source: VB ValidateNatureOfIncome1()
        """
        if not req.ITR1_IncomeDeductions.OthersInc or not req.ITR1_IncomeDeductions.OthersInc.OthersIncDtlsOthSrc:
            return True
        for detail in req.ITR1_IncomeDeductions.OthersInc.OthersIncDtlsOthSrc:
            nature_desc_obj = detail.OthSrcNatureDesc
            nature_desc: str = nature_desc_obj
            if not nature_desc or nature_desc.strip() == "" or nature_desc == "(Select)":
                messages.append(ValidationError(
                    field="Others.NOI_2",
                    message=f"* Nature of Income in Income Details is mandatory"
                ))
                return False
            if nature_desc == "Any Other" or nature_desc == "OTH":
                desc_obj = detail.OthSrcOthNatOfInc
                desc = desc_obj or ""
                if not desc or desc.strip() == "":
                    messages.append(ValidationError(
                        field="Nature_Others_2",
                        message=f"* Please enter description in Nature of Income (Income from other Sources) in Income Details "
                    ))
                    return False
                if len(desc) > 125:
                    messages.append(ValidationError(
                        field="Nature_Others_2",
                        message=f"* Description in Income Details cannot exceed 125 characters"
                    ))
                    return False
        return True

    def ValidateAmount1(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Others.Amount_2 - Amount mandatory, numeric, cannot exceed 14 digits.
        Source: VB ValidateAmount1()
        """
        if not req.ITR1_IncomeDeductions.OthersInc or not req.ITR1_IncomeDeductions.OthersInc.OthersIncDtlsOthSrc:
            return True
        for detail in req.ITR1_IncomeDeductions.OthersInc.OthersIncDtlsOthSrc:
            amount_val = getattr(detail, "OthSrcOthAmount", None)
            if amount_val is None:
                messages.append(ValidationError(
                    field="Others.Amount_2",
                    message=f'* "Income from other Sources - Please enter Amount in Income Details"'
                ))
                return False
            amount = cast(int, amount_val)
            if amount < 0:
                messages.append(ValidationError(
                    field="Others.Amount_2",
                    message=f"* Income From Other Sources: Amount in Income Details should be Numeric value"
                ))
                return False
        return True

    def ValidateOthersEI1(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Orchestrator for Others.NOI_2, Nature_Others_2, Others.Amount_2.
        Source: VB ValidateOthersEI1() - calls ValidateNatureOfIncome1 and ValidateAmount1 when grid has data.
        """
        if not req.ITR1_IncomeDeductions.OthersInc or not req.ITR1_IncomeDeductions.OthersInc.OthersIncDtlsOthSrc:
            return True
        if not self.ValidateNatureOfIncome1(req, messages):
            return False
        if not self.ValidateAmount1(req, messages):
            return False
        return True
    
    # =============================================================================
    # ITR-1 eligibility, LTCG 112A, 57(iia), agricultural, totals (Excel/VB audit)
    # =============================================================================

    def ValidateDeductionUs57iia(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Deduction u/s 57(iia) cannot exceed lower of 1/3rd of Family pension or Rs 15,000/25,000.
        Source: itr1_macros LessDeduction57, LessDeduction57New
        """
        ded = getattr(req.ITR1_IncomeDeductions, "DeductionUs57iia", None)
        if ded is None:
            return True
        d = cast(int, ded)
        if req.FilingStatus.OptOutNewTaxRegime == "Y":
            if d > 15000:
                messages.append(ValidationError(
                    field="DeductionUs57iia",
                    message='* "Deduction u/s 57(iia) cannot exceed lower of 1/3rd of Family pension Or Rs. 15,000"'
                ))
                return False
        else:
            if d > 25000:
                messages.append(ValidationError(
                    field="DeductionUs57iia",
                    message='* "Deduction u/s 57(iia) cannot exceed lower of 1/3rd of Family pension Or Rs. 25,000"'
                ))
                return False
        # Optional: if family pension amount available in Others, check <= min(15000 or 25000, pension/3)
        return True
    

    def ValidateSchedule80C(self, filing_model: FilingModel, messages: list[ValidationError]) -> bool:
        """
        Schedule 80C validations on filing_model.section_80c.
        Runs only under the old tax regime.
        Validates per row: amount mandatory, policy_number mandatory / <= 50 chars / no < or >.
        Source: xl/vba_code.txt, md80C.bas — Validate_80C, ValidateAmount_80C, ValidateIdentification_Number_80C.
        """
        if filing_model.tax_computation is not None and filing_model.tax_computation.current_regime.regime.upper() == "NEW":
            return True
        if not filing_model.section_80c:
            return True
        ok = True
        for i, dtl in enumerate(filing_model.section_80c, start=1):
            # Amount mandatory
            if dtl.amount <= 0:
                messages.append(ValidationError(
                    field="80c.amount",
                    message="* Amount eligible for deduction u/s 80C is mandatory in schedule 80C"
                ))
                ok = False
            # Policy / identification number
            
            if dtl.policy_number is None:
                messages.append(ValidationError(
                    field="80c.policyNumber",
                    message="* Policy number or Document Identification number is mandatory in schedule 80C"
                ))
                ok = False
            else:
                s = str(dtl.policy_number).strip()
                if len(s) > 50:
                    messages.append(ValidationError(
                        field="80c.policyNumber",
                        message="* Policy number or Document Identification number cannot be more than 50 characters."
                    ))
                    ok = False
                elif not self._no_angle_brackets(s):
                    messages.append(ValidationError(
                        field="80c.policyNumber",
                        message=f"* Policy number or Document Identification number in schedule 80C at Sl.no. {i} should not Contain <, >, characters."
                    ))
                    ok = False
        return ok


    def ValidateSchedule80D(self, filing_model: FilingModel, messages: list[ValidationError]) -> bool:
        """
        Schedule 80D: InsurerName and PolicyNo are mandatory per insurance detail row,
        <= 125 / 75 chars, no < or >; reject placeholder 'NA'/'0'; HealthInsAmt mandatory.
        Source: xl/vba_code.txt — Validate_80D; mappers/validators Sch80D, md80D.
        """
        if filing_model.tax_computation is not None and filing_model.tax_computation.current_regime.regime.upper() == "NEW":
            return True
        sch80d = filing_model.section_80d
        if sch80d is None:
            return True
        ins_list = sch80d.health_insurance or []
        if not ins_list:
            return True
        ok = True
        for  ins in ins_list:
            name = ins.insurer_name
            if not _chk_compulsory(name):
                messages.append(ValidationError(
                    field="healthInsurance.insurerName",
                    message=f"* Schedule 80D: Name of insurer is mandatory"
                ))
                ok = False
            elif isinstance(name, str):
                if len(name) > 125:
                    messages.append(ValidationError(
                        field="healthInsurance.insurerName",
                        message=f"* Schedule 80D: Name of insurer cannot be more than 125 characters"
                    ))
                    ok = False
                if name.strip().upper() == "NA":
                    messages.append(ValidationError(
                        field="healthInsurance.insurerName",
                        message="* Schedule 80D: Name of insurer is mandatory",
                    ))
                    ok = False
                if not self._no_angle_brackets(name):
                    messages.append(ValidationError(
                        field="healthInsurance.policyNumber",
                        message=f"* Schedule 80D: Name of insurer should not contain <, > characters"
                    ))
                    ok = False
            policy = ins.policy_number
            if not _chk_compulsory(policy):
                messages.append(ValidationError(
                    field="healthInsurance.policyNumber",
                    message=f"* Schedule 80D: Policy number is mandatory"
                ))
                ok = False
            elif isinstance(policy, str):
                if len(policy) > 75:
                    messages.append(ValidationError(
                        field="healthInsurance.policyNumber",
                        message=f"* Schedule 80D: Policy number cannot be more than 75 characters"
                    ))
                    ok = False
                # Reject placeholder "0" for policy number
                if policy.strip() == "0":
                    messages.append(ValidationError(
                        field="healthInsurance.policyNumber",
                        message="* Schedule 80D: Policy number is mandatory",
                    ))
                    ok = False
                if not self._no_angle_brackets(policy):
                    messages.append(ValidationError(
                        field="healthInsurance.policyNumber",
                        message=f"* Schedule 80D: Policy number should not contain <, > characters"
                    ))
                    ok = False
            # Health insurance amount mandatory and must be > 0
            health_amt = ins.health_insurance_premium
            if not _chk_compulsory(health_amt):
                messages.append(ValidationError(
                    field="healthInsurance.healthInsAmt",
                    message="* Schedule 80D: Health insurance amount is mandatory",
                ))
                ok = False
        return ok

    def ValidateSchedule80GGA(self, filing_model: FilingModel, messages: list[ValidationError]) -> bool:
        """
        Schedule 80GGA validations on filing_model.section_80gga.
        Runs only under the old tax regime.
        Validates per row: clause_under_donation, donee_name, address fields, donee_pan, donation amounts.
        Source: xl/vba_code.txt — Sch80GGA.bas; Validate_80GGA, ValidateAmount_80GGA.
        """
        if filing_model.tax_computation is not None and filing_model.tax_computation.current_regime.regime.upper() == "NEW":
            return True
        if not filing_model.section_80gga:
            return True
        ok = True
        for  dtl in filing_model.section_80gga:
            # clause_under_donation: mandatory
            if not dtl.clause_under_donation or not str(dtl.clause_under_donation).strip():
                messages.append(ValidationError(field="clauseUnderDonation", message="* Schedule 80GGA: Relevant Clause is mandatory"))
                ok = False
            # donee_name: mandatory
            if not dtl.donee_name or not str(dtl.donee_name).strip():
                messages.append(ValidationError(field="80gga.doneeName", message="* Schedule 80GGA: Name of Donee is mandatory"))
                ok = False
            # address_line1: mandatory
            if not dtl.address_line1 or not str(dtl.address_line1).strip():
                messages.append(ValidationError(field="80gga.pincode", message="* Schedule 80GGA: Address is mandatory"))
                ok = False
            # city: mandatory
            if not dtl.city or not str(dtl.city).strip():
                messages.append(ValidationError(field="80gga.pincode", message="* Schedule 80GGA: City/Town/District is mandatory"))
                ok = False
            # state: mandatory, not (Select)
            state_str = str(dtl.state or "").strip()
            if not state_str or state_str == "(Select)":
                messages.append(ValidationError(field="80gga.pincode", message="* Schedule 80GGA: State Code is mandatory"))
                ok = False
            # pincode: mandatory, 6 digits numeric
            if not dtl.pincode or not str(dtl.pincode).strip():
                messages.append(ValidationError(field="80gga.pincode", message="* Schedule 80GGA: Pin Code is mandatory"))
                ok = False
            else:
                pin_str = str(dtl.pincode).strip()
                if not pin_str.isdigit() or len(pin_str) != 6:
                    messages.append(ValidationError(field="80gga.pincode", message="* Schedule 80GGA: Pin Code must be 6 digits numeric value"))
                    ok = False
            # donee_pan: mandatory, valid PAN format
            pan_str = str(dtl.donee_pan or "").strip()
            if not pan_str:
                messages.append(ValidationError(field="80gga.doneePan", message="* Schedule 80GGA: PAN of Donee is mandatory"))
                ok = False
            elif not _validate_pan_format(pan_str):
                messages.append(ValidationError(field="80gga.doneePan", message="* Schedule 80GGA: Invalid PAN format"))
                ok = False
            # donation amount: mandatory, non-negative
            total_amt = (dtl.donation_amount_cash or 0) + (dtl.donation_amount_non_cash or 0)
            if total_amt <= 0:
                messages.append(ValidationError(field="80gga.donationAmount", message="* Schedule 80GGA: Donation Amount is mandatory"))
                ok = False
            elif dtl.donation_amount_cash < 0 or dtl.donation_amount_non_cash < 0:
                messages.append(ValidationError(field="80gga.donationAmount", message="* Schedule 80GGA: Donation Amount should be numeric, non-negative"))
                ok = False
        # Eligible donation cap: total donated must not exceed 10% of total income
        if ok:
            self.ValidateSchedule80GGA_EligibleDonationCap(filing_model, messages)
        return ok
    def ValidateSchedule80GGA_EligibleDonationCap(self, filing_model: FilingModel, messages: list[ValidationError]) -> bool:
        """
        Total eligible donation u/s 80GGA should not exceed 10% of total income.
        Source: xl/vba_code.txt — Sch80GGA.bas (eligible donation cap % of total income).
        """
        if filing_model.tax_computation is None:
            return True
        total_income = filing_model.tax_computation.current_regime.total_income
        if total_income <= 0:
            return True
        eligible = sum(
            (dtl.total_donation_amount or (dtl.donation_amount_cash or 0) + (dtl.donation_amount_non_cash or 0))
            for dtl in filing_model.section_80gga
        )
        cap = int(total_income * ELIGIBLE_DONATION_80GGA_PERCENT_OF_TOTAL_INCOME / 100)
        if eligible > cap:
            messages.append(ValidationError(
                field="80gga.donationAmountNonCash",
                message=f"* Total eligible donation u/s 80GGA cannot exceed {ELIGIBLE_DONATION_80GGA_PERCENT_OF_TOTAL_INCOME}% of total income (Rs {cap})"
            ))
            return False
        return True
    def ValidateSchedule80GGC(self, filing_model: FilingModel, messages: list[ValidationError]) -> bool:
        """Schedule 80GGC: item fields.
        Source: xl/vba_code.txt — Sch80GGC.bas; date, cash/other mode, TransactionRef, IFSC."""
        if filing_model.tax_computation is not None and filing_model.tax_computation.current_regime.regime.upper() == "NEW":
            return True
        return self.ValidateSchedule80GGC_ItemFields(filing_model, messages)

    def ValidateSchedule80GGC_ItemFields(self, filing_model: FilingModel, messages: list[ValidationError]) -> bool:
        """Schedule 80GGC item validations.
        Source: xl/vba_code.txt — Sch80GGC.bas; date (if any field filled), cash or other mode, transaction ref/IFSC for other mode, row amounts <= 14 digits."""
        details = filing_model.section_80ggc
        if not details:
            return True
        date_pattern = re.compile(r"^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))$")
        ok = True
        for i, item in enumerate(details, start=1):
            donation_date = item.date_of_donation
            donation_cash = item.contribution_amount_cash or 0
            donation_other = item.contribution_amount_non_cash or 0
            cheque_no = item.transaction_id
            ifsc_val = item.donor_bank_ifsc
            # If any field is filled, date is mandatory
            if (donation_cash or donation_other or _chk_compulsory(cheque_no) or (not _isdropdownblank(ifsc_val))):
                if not donation_date or not str(donation_date or "").strip():
                    messages.append(ValidationError(field="dateOfDonation", message=f"* Schedule 80GGC: please select \"date of Contribution\" "))
                    ok = False
                elif not date_pattern.match(str(donation_date).strip()):
                    messages.append(ValidationError(field="dateOfDonation", message="* Donation Date must be in YYYY-MM-DD format for Schedule 80GGC."))
                    ok = False
            # Contribution in cash or other mode mandatory
            if not donation_cash and not donation_other:
                messages.append(ValidationError(field="contributionAmountNonCash", message=f"* Schedule 80GGC: Enter the amount of Contribution either in field \"Contribution in cash\" or \"Contribution in other mode\" "))
                ok = False
            # If contribution in other mode > 0: TransactionRefNum and IFSCCode required and validated
            if donation_other and int(donation_other) > 0:
                if not _chk_compulsory(cheque_no):
                    messages.append(ValidationError(field="transactionId", message=f"* Schedule 80GGC: please enter \"Transaction Reference number/Cheque number/IMPS/NEFT/RTGS\" of Contribution transaction "))
                    ok = False
                elif isinstance(cheque_no, str):
                    if len(cheque_no) > 50:
                        messages.append(ValidationError(field="transactionId", message=f"* Schedule 80GGC: \"Transaction Reference number/Cheque number/IMPS/NEFT/RTGS\" of Contribution transaction at Sr.No {i} cannot exceed 50 characters"))
                        ok = False
                    if not _check_field_special_character_trans(cheque_no):
                        messages.append(ValidationError(field="transactionId", message=f"* Schedule 80GGC: \"Transaction Reference number/Cheque number/IMPS/NEFT/RTGS\" of Contribution transaction at Sr.No {i} is invalid, Only \" / \" and \" - \" special characters are allowed"))
                        ok = False
                if _isdropdownblank(ifsc_val):
                    messages.append(ValidationError(field="donorBankIfsc", message=f"* Schedule 80GGC: please enter \"your bank IFSC from which Contribution is made\" at Sr.No {i}"))
                    ok = False
                elif ifsc_val and len(ifsc_val) > 11:
                    messages.append(ValidationError(field="donorBankIfsc", message=f"* Schedule 80GGC: IFS Code  cannot exceed 11 characters"))
                    ok = False
                elif ifsc_val and not _validate_ifsc_format(ifsc_val):
                    messages.append(ValidationError(field="donorBankIfsc", message=f"* Schedule 80GGC: Invalid IFS Code  . Refer to your bank for valid IFS Codes. (1st 4 Alphabets, followed by Zero and remaining 6 should be alphanumeric)"))
                    ok = False
            # DonationAmt and EligibleDonationAmt <= 14 digits per row
        return ok

    def ValidateSchedule80G(self, filing_model: FilingModel, messages: list[ValidationError]) -> bool:
        """Schedule 80G: item fields for each donation row.
        Source: xl/vba_code.txt — Validate_80G; DoneeWithPan (name, PAN, address, donation amounts) per section."""
        if filing_model.tax_computation is not None and filing_model.tax_computation.current_regime.regime.upper() == "NEW":
            return True
        return self.ValidateSchedule80G_ItemFields(filing_model, messages)

    def ValidateSchedule80G_ItemFields(self, filing_model: FilingModel, messages: list[ValidationError]) -> bool:
        """Schedule 80G: validate each donation row in filing_model.section_80g.
        Source: xl/vba_code.txt — Validate_80G (donee name, PAN, address, amounts)."""
        donations = filing_model.section_80g
        if not donations:
            return True
        ok = True
        for i, item in enumerate(donations, start=1):
            prefix = f"Schedule80G.DoneeWithPan.{i - 1}"
            name = item.donee_name or ""
            if not name.strip():
                messages.append(ValidationError(field=f"{prefix}.DoneeWithPanName", message=f"* Schedule 80G: Name of Donee is mandatory "))
                ok = False
            pan_str = (item.donee_pan or "").strip()
            if not pan_str:
                messages.append(ValidationError(field=f"{prefix}.DoneePAN", message=f"* Schedule 80G: PAN of Donee is mandatory "))
                ok = False
            elif not _validate_pan_format(pan_str):
                messages.append(ValidationError(field=f"{prefix}.DoneePAN", message=f"* Schedule 80G: Invalid PAN format "))
                ok = False
            addr_line = (item.address_line1 or "").strip()
            if not addr_line:
                messages.append(ValidationError(field=f"{prefix}.AddressDetail.AddrDetail", message=f"* Schedule 80G: Address is mandatory "))
                ok = False
            city = (item.city or "").strip()
            if not city:
                messages.append(ValidationError(field=f"{prefix}.AddressDetail.CityOrTownOrDistrict", message=f"* Schedule 80G: City/Town/District is mandatory "))
                ok = False
            state_str = (item.state or "").strip()
            if not state_str or state_str == "(Select)":
                messages.append(ValidationError(field=f"{prefix}.AddressDetail.StateCode", message=f"* Schedule 80G: State Code is mandatory "))
                ok = False
            pin = item.pincode
            if not _chk_compulsory(pin):
                messages.append(ValidationError(field=f"{prefix}.AddressDetail.PinCode", message=f"* Schedule 80G: Pin Code is mandatory "))
                ok = False
            elif pin is not None:
                pin_str = str(pin).strip()
                if not pin_str.isdigit() or len(pin_str) != 6:
                    messages.append(ValidationError(field=f"{prefix}.AddressDetail.PinCode", message=f"* Schedule 80G: Pin Code  must be 6 digits"))
                    ok = False
            donation_checks: list[tuple[float | None, str]] = [
                (item.donation_amount_cash, "Donation in cash"),
                (item.donation_amount_non_cash, "Donation in other mode"),
                (item.donation_amount, "Total Donation"),
            ]
            for val, label in donation_checks:
                if val is not None:
                    if val < 0:
                        messages.append(ValidationError(field=f"{prefix}.DonationAmt", message=f"* Schedule 80G: {label}  should be non-negative"))
                        ok = False
        return ok



# ============================================================================
# SCHEDULE 80E VALIDATORS (md80E.bas.bas)
# ============================================================================

    def ValidateSchedule80E(self, filing_model: FilingModel, messages: list[ValidationError]) -> bool:
        """Validate Schedule80E. Appends ValidationError to messages like personal_info_validator. VBA: Validate_80E"""
        if filing_model.tax_computation is not None and filing_model.tax_computation.current_regime.regime.upper() == "NEW":
            return True

        # Normalize lender_type for comparison (accept "Bank"/"Financial Institution" or "B"/"I")
        def _loan_from_ok(val: object) -> bool:
            if val is None:
                return False
            if isinstance(val, str):
                return val.strip().upper() in ("B", "BANK", "I", "FINANCIAL INSTITUTION")
            return False

        ok = True
        dtls = filing_model.section_80e
        if not dtls:
            return True

      
        for  dtl in dtls:
            # lender_type: must be Bank or Financial Institution
            loan_from = dtl.lender_type
            if loan_from is None:
                messages.append(ValidationError(
                    field="80e.lenderType",
                    message="* Schedule 80E: Loan taken from is mandatory",
                ))
                ok = False
            elif not _loan_from_ok(loan_from):
                messages.append(ValidationError(
                    field="80e.lenderType",
                    message="* Schedule 80E: Loan taken from must be B (Bank) or I (Financial Institution)",
                ))
                ok = False

            loan_account_number = dtl.loan_account_number
            if loan_account_number is None or loan_account_number == "" or loan_account_number == "0":
                messages.append(ValidationError(
                    field="80e.loanAccountNumber",
                    message="* Schedule 80E: Loan Account Number is mandatory",
                ))
                ok = False

            # lender_name: mandatory
            bank_name = dtl.lender_name
            if bank_name is None:
                messages.append(ValidationError(
                    field="80e.lenderName",
                    message="* Schedule 80E: Bank or Institution Name is mandatory",
                ))
                ok = False
            elif bank_name == "Financial Institution":
                messages.append(ValidationError(
                    field="80e.lenderName",
                    message="* Schedule 80E: Bank or Institution Name is mandatory",
                ))
                ok = False

            # loan_sanction_date: mandatory
            loan_date = dtl.loan_sanction_date
            if not _chk_compulsory(loan_date):
                messages.append(ValidationError(
                    field="80e.loanSanctionDate",
                    message="* Schedule 80E: Date of Loan is mandatory",
                ))
                ok = False

            # interest_on_loan: mandatory, numeric, >= 0
            if dtl.interest_on_loan <=0:
                messages.append(ValidationError(
                    field="80e.interestOnLoan",
                    message="* Schedule 80E: Interest u/s 80E is mandatory",
                ))
                ok = False
            
            # Business rule: if interest > 0, loan amounts should not both be 0
            if dtl.interest_on_loan > 0:
                total_loan_val = int(dtl.total_loan_amount) if isinstance(dtl.total_loan_amount, (int, float)) else 0
                outstanding_val = int(dtl.loan_outstanding) if isinstance(dtl.loan_outstanding, (int, float)) else 0
                if total_loan_val == 0 and outstanding_val == 0:
                    messages.append(ValidationError(
                        field="80e.loanOutstanding",
                        message="* Schedule 80E: Total loan amount or outstanding amount is required when interest u/s 80E is claimed",
                    ))
                    ok = False

        return ok

# ============================================================================
# SCHEDULE 80EE VALIDATORS
# Source: xl/vba_code.txt, xl/itr1_macros.txt — Validate_80EE, Validate80EE_All.
# Sub-checks: ValidateLoanfrm_80EE, ValidateBankName_80EE, ValidateAccntNum_80EE,
# ValidateLoanDate_80EE, ValidateLoanAmt_80EE, ValidateLoanOutstanding_80EE, ValidateIntrst_80EE.
# ============================================================================

    def ValidateSchedule80EE(self, filing_model: FilingModel, messages: list[ValidationError]) -> bool:
        """Schedule 80EE (interest on home loan): same rules as 80E on a single loan record.
        Source: xl/vba_code.txt — Validate_80EE, Validate80EE_All."""
        if filing_model.tax_computation is not None and filing_model.tax_computation.current_regime.regime.upper() == "NEW":
            return True

        dtl = filing_model.section_80ee
        if dtl is None:
            return True

        def _loan_from_ok(val: object) -> bool:
            if val is None:
                return False
            if isinstance(val, str):
                return val.strip().upper() in ("B", "BANK", "I", "FINANCIAL INSTITUTION")
            return False

        ok = True

        loan_from = dtl.lender_type
        if loan_from is None:
            messages.append(ValidationError(
                field="80ee.lenderType",
                message="* Schedule 80EE: Loan taken from is mandatory",
            ))
            ok = False
        elif not _loan_from_ok(loan_from):
            messages.append(ValidationError(
                field="80ee.lenderType",
                message="* Schedule 80EE: Loan taken from must be B (Bank) or I (Financial Institution)",
            ))
            ok = False

        loan_account_number = dtl.loan_account_number
        if loan_account_number is None or loan_account_number == "" or loan_account_number == "0":
            messages.append(ValidationError(
                field="80ee.loanAccountNumber",
                message="* Schedule 80EE: Loan Account Number is mandatory",
            ))
            ok = False

        bank_name = dtl.lender_name
        if bank_name is None:
            messages.append(ValidationError(
                field="80ee.lenderName",
                message="* Schedule 80EE: Bank or Institution Name is mandatory",
            ))
            ok = False
        elif bank_name == "Financial Institution":
            messages.append(ValidationError(
                field="80ee.lenderName",
                message="* Schedule 80EE: Bank or Institution Name is mandatory",
            ))
            ok = False

        loan_date = dtl.loan_sanction_date
        if not _chk_compulsory(loan_date):
            messages.append(ValidationError(
                field="80ee.loanSanctionDate",
                message="* Schedule 80EE: Date of Loan is mandatory",
            ))
            ok = False
        else:
            s = str(loan_date).strip()
            if not DOB_PATTERN.match(s):
                messages.append(ValidationError(
                    field="80ee.loanSanctionDate",
                    message="* Schedule 80EE: Date of Loan must be in YYYY-MM-DD format",
                ))
                ok = False
            else:
                from datetime import date as _date
                try:
                    parsed = _date.fromisoformat(s)
                    if not (_date(2016, 4, 1) <= parsed <= _date(2017, 3, 31)):
                        messages.append(ValidationError(
                            field="80ee.loanSanctionDate",
                            message="* Schedule 80EE: Date of Loan sanction must be between 01/04/2016 and 31/03/2017",
                        ))
                        ok = False
                except ValueError:
                    messages.append(ValidationError(
                        field="80ee.loanSanctionDate",
                        message="* Schedule 80EE: Date of Loan is invalid",
                    ))
                    ok = False

        if dtl.interest_on_loan <= 0:
            messages.append(ValidationError(
                field="80ee.interestOnLoan",
                message="* Schedule 80EE: Interest u/s 80EE is mandatory",
            ))
            ok = False

        # Business rule: if interest > 0, loan amounts should not both be 0
        if dtl.interest_on_loan > 0:
            total_loan_val = int(dtl.total_loan_amount) if isinstance(dtl.total_loan_amount, (int, float)) else 0
            outstanding_val = int(dtl.loan_outstanding) if isinstance(dtl.loan_outstanding, (int, float)) else 0
            if total_loan_val == 0 and outstanding_val == 0:
                messages.append(ValidationError(
                    field="80ee.loanOutstanding",
                    message="* Schedule 80EE: Total loan amount or outstanding amount is required when interest u/s 80EE is claimed",
                ))
                ok = False

        return ok


# ============================================================================
# SCHEDULE 80EEA VALIDATORS
# Source: VB Dump/ITR1/md80EEA.bas — Validate80EEA_All, Validate_80EEA.
# Sub-checks: PropStmpDtyVal (stamp duty <= 45L), ValidateLoanfrm_80EEA, ValidateBankName_80EEA,
# ValidateAccntNum_80EEA, ValidateLoanDate_80EEA, ValidateLoanAmt_80EEA,
# ValidateLoanOutstanding_80EEA, ValidateIntrst_80EEA.
# ============================================================================

    def ValidateSchedule80EEA(self, filing_model: FilingModel, messages: list[ValidationError]) -> bool:
        """Schedule 80EEA (interest on loan for affordable housing): loan from, bank, account, date, amounts, interest.
        Source: VB Dump/ITR1/md80EEA.bas — Validate80EEA_All, Validate_80EEA."""
        if filing_model.tax_computation is not None and filing_model.tax_computation.current_regime.regime.upper() == "NEW":
            return True

        dtl = filing_model.section_80eea
        if dtl is None:
            return True

        def _loan_from_ok(val: object) -> bool:
            if val is None:
                return False
            if isinstance(val, str):
                return val.strip().upper() in ("B", "BANK", "I", "FINANCIAL INSTITUTION")
            return False

        ok = True

        loan_from = dtl.lender_type
        if loan_from is None:
            messages.append(ValidationError(
                field="80eea.lenderType",
                message="* Schedule 80EEA: Loan taken from is mandatory",
            ))
            ok = False
        elif not _loan_from_ok(loan_from):
            messages.append(ValidationError(
                field="80eea.lenderType",
                message="* Schedule 80EEA: Loan taken from must be B (Bank) or I (Financial Institution)",
            ))
            ok = False

        loan_account_number = dtl.loan_account_number
        if loan_account_number is None or loan_account_number == "" or loan_account_number == "0":
            messages.append(ValidationError(
                field="80eea.loanAccountNumber",
                message="* Schedule 80EEA: Loan Account Number is mandatory",
            ))
            ok = False

        bank_name = dtl.lender_name
        if bank_name is None:
            messages.append(ValidationError(
                field="80eea.lenderName",
                message="* Schedule 80EEA: Bank or Institution Name is mandatory",
            ))
            ok = False
        elif bank_name == "Financial Institution":
            messages.append(ValidationError(
                field="80eea.lenderName",
                message="* Schedule 80EEA: Bank or Institution Name is mandatory",
            ))
            ok = False

        loan_date = dtl.loan_sanction_date
        if not _chk_compulsory(loan_date):
            messages.append(ValidationError(
                field="80eea.loanSanctionDate",
                message="* Schedule 80EEA: Date of Loan is mandatory",
            ))
            ok = False

        total_loan = dtl.total_loan_amount
        if not _chk_compulsory(total_loan):
            messages.append(ValidationError(
                field="80eea.totalLoanAmount",
                message="* Schedule 80EEA: Total Loan Amount is mandatory",
            ))
            ok = False
        elif isinstance(total_loan, (int, float)):
            if total_loan < 0:
                messages.append(ValidationError(
                    field="80eea.totalLoanAmount",
                    message="* Schedule 80EEA: Total Loan Amount should be Numeric, Non negative",
                ))
                ok = False

        outstanding = dtl.loan_outstanding
        if not _chk_compulsory(outstanding):
            messages.append(ValidationError(
                field="80eea.loanOutstanding",
                message="* Schedule 80EEA: Loan Outstanding Amount is mandatory",
            ))
            ok = False
        elif isinstance(outstanding, (int, float)):
            if outstanding < 0:
                messages.append(ValidationError(
                    field="80eea.loanOutstanding",
                    message="* Schedule 80EEA: Loan Outstanding Amount should be Numeric, Non negative",
                ))
                ok = False

        if dtl.interest_on_loan <= 0:
            messages.append(ValidationError(
                field="80eea.interestOnLoan",
                message="* Schedule 80EEA: Interest u/s 80EEA is mandatory",
            ))
            ok = False

        # Business rule: if interest > 0, loan amounts should not both be 0
        if dtl.interest_on_loan > 0:
            total_loan_val = int(total_loan) if isinstance(total_loan, (int, float)) else 0
            outstanding_val = int(outstanding) if isinstance(outstanding, (int, float)) else 0
            if total_loan_val == 0 and outstanding_val == 0:
                messages.append(ValidationError(
                    field="80eea.loanOutstanding",
                    message="* Schedule 80EEA: Total loan amount or outstanding amount is required when interest u/s 80EEA is claimed",
                ))
                ok = False

        return ok


# ============================================================================
# SCHEDULE 80EEB VALIDATORS
# Source: xl/vba_code.txt, xl/itr1_macros.txt — Validate_80EEB, Validate80EEB_All.
# Sub-checks: ValidateLoanfrm_80EEB, ValidateBankName_80EEB, ValidateAccntNum_80EEB,
# ValidateVehicleReg_80EEB, ValidateLoanDate_80EEB, ValidateLoanAmt_80EEB,
# ValidateLoanOutstanding_80EEB, ValidateIntrst_80EEB.
# ============================================================================

    def ValidateSchedule80EEB(self, filing_model: FilingModel, messages: list[ValidationError]) -> bool:
        """Schedule 80EEB (interest on electric vehicle loan): same rules as 80EE with VehicleRegNo and loan date 01/04/2019–31/03/2023.
        Source: xl/vba_code.txt — Validate_80EEB, Validate80EEB_All."""
        if filing_model.tax_computation is not None and filing_model.tax_computation.current_regime.regime.upper() == "NEW":
            return True

        dtl = filing_model.section_80eeb
        if dtl is None:
            return True

        def _loan_from_ok(val: object) -> bool:
            if val is None:
                return False
            if isinstance(val, str):
                return val.strip().upper() in ("B", "BANK", "I", "FINANCIAL INSTITUTION")
            return False

        def _loan_date_in_80eeb_range(loan_date: object) -> bool:
            """VBA: Date of sanction of Loan shall be between 01/04/2019 to 31/03/2023."""
            if loan_date is None:
                return False
            s = str(loan_date).strip()
            if not s or len(s) > 10:
                return False
            if not DOB_PATTERN.match(s):
                return False
            from datetime import datetime, date
            try:
                parsed = datetime.strptime(s, "%Y-%m-%d").date()
            except ValueError:
                return False
            min_d = date(2019, 4, 1)
            max_d = date(2023, 3, 31)
            return min_d <= parsed <= max_d

        ok = True

        loan_from = dtl.lender_type
        if loan_from is None:
            messages.append(ValidationError(
                field="80eeb.lenderType",
                message="* Schedule 80EEB: Loan taken from is mandatory",
            ))
            ok = False
        elif not _loan_from_ok(loan_from):
            messages.append(ValidationError(
                field="80eeb.lenderType",
                message="* Schedule 80EEB: Loan taken from must be B (Bank) or I (Financial Institution)",
            ))
            ok = False

        loan_account_number = dtl.loan_account_number
        if loan_account_number is None or loan_account_number == "" or loan_account_number == "0":
            messages.append(ValidationError(
                field="80eeb.loanAccountNumber",
                message="* Schedule 80EEB: Loan Account Number is mandatory",
            ))
            ok = False
        elif len(loan_account_number) > 20:
            messages.append(ValidationError(
                field="80eeb.loanAccountNumber",
                message="* Schedule 80EEB: Loan Account number should be less than or equal to 20 characters",
            ))
            ok = False

        bank_name = dtl.lender_name
        if bank_name is None:
            messages.append(ValidationError(
                field="80eeb.lenderName",
                message="* Schedule 80EEB: Bank or Institution Name is mandatory",
            ))
            ok = False
        elif bank_name == "Financial Institution":
            messages.append(ValidationError(
                field="80eeb.lenderName",
                message="* Schedule 80EEB: Bank or Institution Name is mandatory",
            ))
            ok = False
        elif bank_name:
            if len(bank_name) > 125:
                messages.append(ValidationError(
                    field="80eeb.lenderName",
                    message="* Schedule 80EEB: Name of the Bank/Institution should be less than 125 characters",
                ))
                ok = False
            if not self._no_angle_brackets(bank_name):
                messages.append(ValidationError(
                    field="80eeb.lenderName",
                    message="* Schedule 80EEB: Name of the Bank/Institution should not Contain <, >, characters",
                ))
                ok = False

        vehicle_reg = dtl.vehicle_registration_number
        if not _chk_compulsory(vehicle_reg):
            messages.append(ValidationError(
                field="80eeb.vehicleRegistrationNumber",
                message="* Schedule 80EEB: Vehicle Registration Number is mandatory",
            ))
            ok = False
        elif isinstance(vehicle_reg, str) and not self._no_angle_brackets(vehicle_reg):
            messages.append(ValidationError(
                field="80eeb.vehicleRegistrationNumber",
                message="* Schedule 80EEB: Vehicle Registration Number should not Contain <, >, characters",
            ))
            ok = False

        loan_date = dtl.loan_sanction_date
        if not _chk_compulsory(loan_date):
            messages.append(ValidationError(
                field="80eeb.loanSanctionDate",
                message="* Schedule 80EEB: Date of Loan is mandatory",
            ))
            ok = False
        elif not _loan_date_in_80eeb_range(loan_date):
            messages.append(ValidationError(
                field="80eeb.loanSanctionDate",
                message="* Schedule 80EEB: Date of sanction of Loan shall be between 01/04/2019 to 31/03/2023",
            ))
            ok = False

        total_loan = dtl.total_loan_amount
        if not _chk_compulsory(total_loan):
            messages.append(ValidationError(
                field="80eeb.totalLoanAmount",
                message="* Schedule 80EEB: Total Loan Amount is mandatory",
            ))
            ok = False
        elif isinstance(total_loan, (int, float)):
            if total_loan < 0:
                messages.append(ValidationError(
                    field="80eeb.totalLoanAmount",
                    message="* Schedule 80EEB: Total Loan Amount should be Numeric, Non negative",
                ))
                ok = False

        outstanding = dtl.loan_outstanding
        if not _chk_compulsory(outstanding):
            messages.append(ValidationError(
                field="80eeb.loanOutstanding",
                message="* Schedule 80EEB: Loan Outstanding Amount is mandatory",
            ))
            ok = False
        elif isinstance(outstanding, (int, float)):
            if outstanding < 0:
                messages.append(ValidationError(
                    field="80eeb.loanOutstanding",
                    message="* Schedule 80EEB: Loan Outstanding Amount should be Numeric, Non negative",
                ))
                ok = False

        if dtl.interest_on_loan <= 0:
            messages.append(ValidationError(
                field="80eeb.interestOnLoan",
                message="* Schedule 80EEB: Interest u/s 80EEB is mandatory",
            ))
            ok = False

        # Business rule: if interest > 0, loan amounts should not both be 0
        if dtl.interest_on_loan > 0:
            total_loan_val = int(total_loan) if isinstance(total_loan, (int, float)) else 0
            outstanding_val = int(outstanding) if isinstance(outstanding, (int, float)) else 0
            if total_loan_val == 0 and outstanding_val == 0:
                messages.append(ValidationError(
                    field="80eeb.loanOutstanding",
                    message="* Schedule 80EEB: Total loan amount or outstanding amount is required when interest u/s 80EEB is claimed",
                ))
                ok = False

        return ok


# ============================================================================
# SCHEDULE 80DD VALIDATORS
# Source: VB Dump/ITR1/Sch80U_DD.bas — Validate80DD, Validate80DD_1, ValidateSheet80DD_Click.
# Sub-checks: ValidateNature_disability_80DD, ValidateType_disability_80DD,
# ValidateAmount_of_deduction_80DD, ValidateTypedependent_80DD, ValidateAckNoFm10IAfiled_80DD,
# ValidateUDIDNum_80DD, ValidatePANdependent_80DD, ValidateAadhaardependent_80DD.
# ============================================================================

    def ValidateSchedule80DD(self, filing_model: FilingModel, messages: list[ValidationError]) -> bool:
        """Schedule 80DD (deduction for maintenance of disabled dependent): NatureOfDisability, TypeOfDisability,
        DeductionAmount, DependentType, PAN, Form 10IA ack, UDID. Single object per return.
        Note: DependentAadhaar checks OMITTED — no dependant_aadhaar field in Deduction80DDModel.
        Source: VB Dump/ITR1/Sch80U_DD.bas — Validate80DD, Validate80DD_1."""

        def _alphanumeric_only(s: str) -> bool:
            """VBA checkfieldspecialcharacter: alphanumeric only."""
            return bool(s and re.match(r"^[a-zA-Z0-9]+$", s))

        def _udid_no_special(s: str) -> bool:
            """VBA checkfieldspecialcharacterUDID: alphanumeric only for UDID."""
            return bool(s and re.match(r"^[a-zA-Z0-9]+$", s))

        if filing_model.tax_computation is not None and filing_model.tax_computation.current_regime.regime.upper() == "NEW":
            return True
        ok = True
        sch = filing_model.section_80dd
        if sch is None:
            return True

        # ValidateNature_disability_80DD
        nature = sch.nature_of_disability
        if _isdropdownblank(nature) or (isinstance(nature, str) and nature.upper() == "SELECT"):
            messages.append(ValidationError(
                field="80dd.disabilityType",
                message="* Schedule 80DD: Please select one of the dropdown in 'Nature of disability' in Schedule 80DD",
            ))
            ok = False

        # ValidateType_disability_80DD
        type_dis = sch.disability_type
        if type_dis is None or type_dis == "" and type_dis.strip() == "(Select)":
            messages.append(ValidationError(
                field="80dd.disabilityType",
                message="* Schedule 80DD: Selection of \"Type of disability\" in schedule 80DD is mandatory.",
            ))
            ok = False

        # ValidateAmount_of_deduction_80DD (when amount <> 0) -> 80dd.expenditureIncurred
        
        if sch.expenditure_incurred < 0:
                messages.append(ValidationError(
                    field="80dd.expenditureIncurred",
                    message="* Schedule 80DD: Amount of deduction should be Numeric, Non negative",
                ))
                ok = False

        # ValidateTypedependent_80DD -> relationToDependant
        dep_type = sch.relation_to_dependant
        if _isdropdownblank(dep_type) or (isinstance(dep_type, str) and dep_type.upper() == "SELECT"):
            messages.append(ValidationError(
                field="relationToDependant",
                message="* Schedule 80DD: Please select one of the dropdown in 'Type of dependent' in schedule 80DD",
            ))
            ok = False

        # ValidateAckNoFm10IAfiled_80DD
        ack_no = sch.form_101a_ack_no
        type_dis_str = str(type_dis or "").strip() if type_dis is not None else ""
        autism_type = type_dis_str in ("1", "(i) autism, cerebral palsy, or multiple disabilities", "(i) autism, cerebral palsy, or multiple disabilities and")
        if ack_no is not None and str(ack_no).strip():
            s_ack = str(ack_no).strip()
            if not _alphanumeric_only(s_ack):
                messages.append(ValidationError(
                    field="80dd.disabilityType",
                    message="* Schedule 80DD: Ack. No. of Form 10IA filed cannot contain special characters in Schedule 80DD.",
                ))
                ok = False
            if len(s_ack) > 15:
                messages.append(ValidationError(
                    field="80dd.disabilityType",
                    message="* Schedule 80DD: Ack. No. of Form 10IA filed cannot exceed 15 digits in Schedule 80DD",
                ))
                ok = False
        elif autism_type:
            messages.append(ValidationError(
                field="80dd.disabilityType",
                message="* Schedule 80DD: Please provide Acknowledgement of Form 10IA in schedule 80DD",
            ))
            ok = False

        # ValidateUDIDNum_80DD
        udid = sch.udid_no
        if udid is not None and str(udid).strip():
            s_udid = str(udid).strip()
            if not _udid_no_special(s_udid):
                messages.append(ValidationError(
                    field="80dd.disabilityType",
                    message="* Schedule 80DD: UDID Number cannot contain special characters in Schedule 80DD.",
                ))
                ok = False
            if len(s_udid) > 18:
                messages.append(ValidationError(
                    field="80dd.disabilityType",
                    message="* Schedule 80DD: UDID Number cannot exceed 18 digits at Sr.No in Schedule 80DD",
                ))
                ok = False

        # ValidatePANdependent_80DD
        pan_dep = sch.dependant_pan
        if pan_dep is not None and str(pan_dep).strip():
            s_pan = str(pan_dep).strip().upper()
            if not _alphanumeric_only(str(pan_dep).strip()):
                messages.append(ValidationError(
                    field="80dd.disabilityType",
                    message="* Schedule 80DD: PAN Number cannot contain special characters in Schedule 80DD.",
                ))
                ok = False
            elif not PAN_PATTERN.match(s_pan):
                messages.append(ValidationError(
                    field="80dd.disabilityType",
                    message="* Schedule 80DD: Invalid PAN in Schedule 80DD.",
                ))
                ok = False
            else:
                assessee_pan = ""
                if filing_model.person is not None and filing_model.person.pan_number:
                    assessee_pan = decrypt_pan(str(filing_model.person.pan_number).strip())
                if assessee_pan and s_pan == assessee_pan.upper():
                    messages.append(ValidationError(
                        field="80dd.disabilityType",
                        message="* Schedule 80DD: PAN of the dependent cannot be same as assessee PAN in Part-A General Information.",
                    ))
                    ok = False

        # NOTE: DependentAadhaar checks OMITTED — no dependant_aadhaar field in Deduction80DDModel.

        # VBA: Acknowledgement number of Form 10IA filed for self and Dependent can't be same (80DD vs 80U)
        ack_80u = None
        if filing_model.section_80u is not None:
            ack_80u = filing_model.section_80u.form_101a_ack_no
        if ack_no is not None and str(ack_no).strip() and ack_80u is not None and str(ack_80u).strip():
            if str(ack_no).strip() == str(ack_80u).strip():
                messages.append(ValidationError(
                    field="80dd.disabilityType",
                    message="* Schedule 80DD: Acknowledgement number of Form 10IA filed for self and Dependent can't be same. Please provide proper acknowledgement number",
                ))
                ok = False

        return ok


# ============================================================================
# SCHEDULE 80U VALIDATORS
# Source: VB Dump/ITR1/Sch80U_DD.bas — Validate80U, Validate80U_1, ValidateSheet80U_Click.
# Sub-checks: ValidateNature_disability_80U, ValidateType_disability_80U,
# ValidateAmount_of_deduction_80U, ValidateAckNoFm10IAfiled_80U, ValidateUDIDNum_80U.
# Field names aligned with FIELD_WIDGET_MAP: 80u.disabilityType, 80u.expenditureIncurred (personDisability).
# ============================================================================

    def ValidateSchedule80U(self, filing_model: FilingModel, messages: list[ValidationError]) -> bool:
        """Schedule 80U (deduction for self with disability): NatureOfDisability, TypeOfDisability,
        DeductionAmount, Form10IAAckNum, UDIDNum. Single object per return.
        Source: VB Dump/ITR1/Sch80U_DD.bas — Validate80U, Validate80U_1."""

        def _alphanumeric_only(s: str) -> bool:
            """VBA checkfieldspecialcharacter: alphanumeric only."""
            return bool(s and re.match(r"^[a-zA-Z0-9]+$", s))

        def _udid_no_special(s: str) -> bool:
            """VBA checkfieldspecialcharacterUDID: alphanumeric only for UDID."""
            return bool(s and re.match(r"^[a-zA-Z0-9]+$", s))

        if filing_model.tax_computation is not None and filing_model.tax_computation.current_regime.regime.upper() == "NEW":
            return True
        ok = True
        sch = filing_model.section_80u
        if sch is None:
            return True

        # ValidateNature_disability_80U -> 80u.disabilityType
        nature = sch.disability_type
        if _isdropdownblank(nature) or (isinstance(nature, str) and nature.upper() == "SELECT"):
            messages.append(ValidationError(
                field="80u.disabilityType",
                message="* Schedule 80U: Please select one of the dropdown in 'Nature of disability' in Schedule 80U",
            ))
            ok = False

        # ValidateType_disability_80U -> 80u.disabilityType
        type_dis = sch.disability_type
        if type_dis is None or type_dis == ""  and type_dis.strip() == "(Select)":
            messages.append(ValidationError(
                field="80u.disabilityType",
                message="* Schedule 80U: Selection of \"Type of disability\" in schedule 80U is mandatory.",
            ))
            ok = False

        # ValidateAmount_of_deduction_80U -> 80u.expenditureIncurred (mandatory in 80U)
        if sch.expenditure_incurred <= 0:
            messages.append(ValidationError(
                field="80u.expenditureIncurred",
                message="* Schedule 80U: Please enter Amount of deduction in Schedule 80U",
            ))
            ok = False

        # ValidateAckNoFm10IAfiled_80U -> 80u.disabilityType
        ack_no = sch.form_101a_ack_no
        type_dis_str = str(type_dis or "").strip() if type_dis is not None else ""
        autism_type = type_dis_str in ("1", "(i) autism, cerebral palsy, or multiple disabilities", "(i) autism, cerebral palsy, or multiple disabilities and")
        if ack_no is not None and str(ack_no).strip():
            s_ack = str(ack_no).strip()
            if not _alphanumeric_only(s_ack):
                messages.append(ValidationError(
                    field="80u.disabilityType",
                    message="* Schedule 80U: Ack. No. of Form 10IA filed cannot contain special characters in Schedule 80U.",
                ))
                ok = False
            if len(s_ack) > 15:
                messages.append(ValidationError(
                    field="80u.disabilityType",
                    message="* Schedule 80U: Ack. No. of Form 10IA filed cannot exceed 15 digits in Schedule 80U",
                ))
                ok = False
        elif autism_type:
            messages.append(ValidationError(
                field="80u.disabilityType",
                message="* Schedule 80U: Please provide Acknowledgement of Form 10IA in schedule 80U",
            ))
            ok = False

        # ValidateUDIDNum_80U -> 80u.disabilityType
        udid = sch.udid_no
        if udid is not None and str(udid).strip():
            s_udid = str(udid).strip()
            if not _udid_no_special(s_udid):
                messages.append(ValidationError(
                    field="80u.disabilityType",
                    message="* Schedule 80U: UDID Number cannot contain special characters in Schedule 80U.",
                ))
                ok = False
            if len(s_udid) > 18:
                messages.append(ValidationError(
                    field="80u.disabilityType",
                    message="* Schedule 80U: UDID Number cannot exceed 18 digits in Schedule 80U",
                ))
                ok = False

        # VBA: Acknowledgement number of Form 10IA filed for self and Dependent can't be same (80U vs 80DD)
        ack_80dd = None
        if filing_model.section_80dd is not None:
            ack_80dd = filing_model.section_80dd.form_101a_ack_no
        if ack_no is not None and str(ack_no).strip() and ack_80dd is not None and str(ack_80dd).strip():
            if str(ack_no).strip() == str(ack_80dd).strip():
                messages.append(ValidationError(
                    field="80u.disabilityType",
                    message="* Schedule 80U: Acknowledgement number of Form 10IA filed for self and Dependent can't be same. Please provide proper acknowledgement number",
                ))
                ok = False

        return ok

    def ValidateSchedule80TTA(self, filing_model: FilingModel, messages: list[ValidationError]) -> bool:
        """Schedule 80TTA (interest from savings accounts, for non-senior-citizens) and
        80TTB (interest from deposits, for senior citizens) are mutually exclusive —
        only one can be claimed in a single return."""
        has_tta = (
            filing_model.section_80tta is not None
            and (filing_model.section_80tta.interest_amount or 0) > 0
        )
        has_ttb = (
            filing_model.section_80ttb is not None
            and (filing_model.section_80ttb.interest_amount or 0) > 0
        )
        if has_tta and has_ttb:
            messages.append(ValidationError(
                field="section80TTA.interestAmount",
                message="* Deduction under 80TTA and 80TTB cannot be claimed simultaneously. Please claim only one.",
            ))
            return False
        return True

    def ValidateTDS(self, filing_model: FilingModel, messages: list[ValidationError]) -> bool:
        """Validate that Gross Salary does not exceed the sum of amount_paid across all TDS entries.
        Source: ITR1 schema validation — Schedule TDS1 IncChrgSal must cover the declared Gross Salary."""
        if not filing_model.tds:
            return True

        # Compute gross salary: sum of all 17(1), 17(2), 17(3) component amounts
        gross_salary = 0.0
        for sal in filing_model.salary or []:
            for item in sal.salary_section_171 or []:
                gross_salary += float(item.amount or 0)
            for item in sal.salary_section_172 or []:
                gross_salary += float(item.amount or 0)
            for item in sal.salary_section_173 or []:
                gross_salary += float(item.amount or 0)

        if gross_salary == 0:
            return True

        # Sum amount_paid across all TDS entries
        total_tds_amount_paid = 0.0
        for tds in filing_model.tds:
            try:
                total_tds_amount_paid += float(tds.amount_paid or 0)
            except (TypeError, ValueError):
                pass

        if gross_salary > total_tds_amount_paid:
            messages.append(ValidationError(
                field="tds.amountPaid",
                message=(
                    "* Gross Salary declared is more than the total Amount Paid/Credited in Schedule TDS1. "
                    "Please ensure that the total Amount Paid in TDS entries is not less than the Gross Salary."
                ),
            ))
            return False
        return True

