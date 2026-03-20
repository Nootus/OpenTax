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
from typing import List, Union, cast
from filing.itr.itr1.models.itr1_model import ITR1, LoanTknFromEnum, ReturnFileSecEnum
from filing.models.filing_model import FilingModel
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
            itr_model: ITR1 model

        Returns:
            List of ValidationError objects with field names matching FIELD_WIDGET_MAP
        """
        if itr_model is None:
            return []
        errors: List[ValidationError] = []

        self.personal_info_validator(itr_model, errors)
        self.validate_bank_details(itr_model, errors)

        if isinstance(itr_model, ITR1):
            # ITR-1-specific income and total validators
            await self.income_validator(itr_model, errors)
            self.ValidateITR1EligibilityTotalIncome(itr_model, errors)
            self.ValidateAllowancesVsGrossSalary(itr_model, errors)
            self.ValidateTotalChapVIADeductions(itr_model, errors)
            self.ValidateTotalIntrstPay(itr_model, errors)
            self.ValidateTotTaxPlusIntrstPay(itr_model, errors)
            self.ValidateLTCG112ACap(itr_model, errors)
            self.ValidateDeductionUs57iia(itr_model, errors)
            self.ValidateAgriculturalIncome(itr_model, errors)
            self.ValidateITRUTotalIncome(itr_model, errors)
            self.ValidateTotalIncomeNonNegative(itr_model, errors)

        # Common validators – work for both ITR1 and ITR2
        self.ValidateSchedule80C(itr_model, errors)
        self.validate_pran_number(itr_model, errors)
        self.ValidateSchedule80GGA(itr_model, errors)
        self.ValidateSchedule80GGC(itr_model, errors)
        self.ValidateSchedule80D(itr_model, errors)
        self.ValidateSchedule80G(itr_model, errors)
        self.ValidateSchedule80E(itr_model, errors)
        self.ValidateSchedule80EE(itr_model, errors)
        self.ValidateSchedule80EEA(itr_model, errors)
        self.ValidateSchedule80EEB(itr_model, errors)
        self.ValidateSchedule80DD(itr_model, errors)
        self.ValidateSchedule80U(itr_model, errors)

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

    def _check_aadhaar_format(self, value: str) -> bool:
        """VBA ValidateAadharNumber (xl/vba_code.txt 14477-14513): 12 digits, not all 0 or all 1."""
        if not value or not value.strip():
            return True  # optional field
        s = value.strip()
        if not s.isdigit() or len(s) != 12:
            return False
        if s == "000000000000" or s == "111111111111":
            return False
        return True   
    def personal_info_validator(self, req: ITR1, messages: list[ValidationError]) -> None:
        """Validates the personal information (ITR1)."""
        personal_info = req.PersonalInfo
        first_name = str(personal_info.AssesseeName.FirstName or "").strip()
        middle_name = str(personal_info.AssesseeName.MiddleName or "").strip()
        sur_name_or_org_name = str(personal_info.AssesseeName.SurNameOrOrgName or "").strip()
        dob = str(personal_info.DOB or "").strip()
        pan = decrypt_pan(str(personal_info.PAN or "").strip())
         # xl/vba_code.txt: ChkName (12619-12628), PIShtValidate (13895) - sheet1.SurNameOrOrgName mandatory
        if not sur_name_or_org_name:
            messages.append(ValidationError(field="person.lastName", message="* LastName is mandatory in personal details "))
        # xl/vba_code.txt: ChkName (12630-12634) - Name cannot exceed 125 characters
        elif len(sur_name_or_org_name) > 125:
            messages.append(ValidationError(field="person.lastName", message="* Name in personal details cannot exceed 125 characters "))
        # xl/vba_code.txt: checkfieldSuperSpecialcharactername (8727-8739), ChkName (12636-12646) - no <, >, & in names
        if not self._check_name_no_special_chars(sur_name_or_org_name):
            messages.append(ValidationError(field="person.lastName", message="* Last name should not Contain <, >, \" & characters in Income Details"))
        if first_name and not self._check_name_no_special_chars(first_name):
            messages.append(ValidationError(field="person.firstName", message="* First name should not Contains special characters in Income Details"))
        if middle_name and not self._check_name_no_special_chars(middle_name):
            messages.append(ValidationError(field="person.middleName", message="* Middle name should not Contain <, >, \" & characters in Income Details"))
       # xl/vba_code.txt: ValidateAadharNumber (14477-14513), PIShtValidate (14049-14053) - Sheet1.Aadhaar optional
        aadhaar = str(personal_info.AadhaarCardNo or "").strip()
        # Only validate format when value looks like plain Aadhaar (12 digits). Skip when encrypted (long string).
        if aadhaar and len(aadhaar) == 12 and aadhaar.isdigit():
            if not self._check_aadhaar_format(aadhaar):
                messages.append(ValidationError(field="person.aadhaarNumber", message="* Please enter the Aadhaar number in valid format "))
       # xl/vba_code.txt: ChkDOB (13066-13074), PIShtValidate (13934-13936); format CheckDOB23_24 (2783-2787), ChkMaxDOBDate (13169-13268)
        if not dob:
            messages.append(ValidationError(field="person.dateOfBirth", message="* Date of Birth is required "))
        elif not DOB_PATTERN.match(dob):
            messages.append(ValidationError(field="person.dateOfBirth", message="* Date of Birth must be in YYYY-MM-DD format "))

        # xl/vba_code.txt: ChkPAN (12516-12532), PIShtValidate (13896); format CheckPAN (13076-13118);ChkPAN 12526–12530;
        
        if not pan:
            messages.append(ValidationError(field="person.panNumber", message="* PAN is required "))
        elif not PAN_PATTERN.match(pan):
            messages.append(ValidationError(field="person.panNumber", message="* PAN must be in 10 digits format "))
  # --- Address: sheet1.ResidenceNo, ResidenceName, StateCode, Country, PinCode (xl/vba_code.txt) ---
        addr = personal_info.Address
        if addr:
            # SOURCE: xl/vba_code.txt 2442-2451, checkfieldSuperSpecialcharactername 8727-8740
            residence_no = str(addr.ResidenceNo or "").strip()
            if residence_no and not self._check_name_no_special_chars(residence_no):
                messages.append(ValidationError(
                    field="person_address.flatDoorNo",
                    message="* Flat/Door/Block No should not Contain <, >, \" & characters in Income Details",
                ))
            # SOURCE: xl/vba_code.txt 2454-2463, checkfieldSuperSpecialcharactername 8727-8740
            residence_name = str(addr.ResidenceName or "").strip()
            if residence_name and not self._check_name_no_special_chars(residence_name):
                messages.append(ValidationError(
                    field="person_address.premiseName",
                    message="* Name of Premises/Building/Village should not Contain <, >, \" & characters in Income Details",
                ))

            # SOURCE: xl/vba_code.txt ChkState 12709-12718, PIShtValidate; sheet1.StateCode1
            state_code = str(addr.StateCode or "").strip()
            if not state_code or state_code == "(Select)":
                messages.append(ValidationError(
                    field="person_address.state",
                    message="* State is mandatory in  personal details",
                ))

            # SOURCE: xl/vba_code.txt ChkCountry 13015-13028, 13939-13941; sheet1.Country
            country_code = str(addr.CountryCode or "").strip()
            if not country_code or country_code in ("(Select)", "("):
                messages.append(ValidationError(
                    field="person_address.country",
                    message="* Country is mandatory in Part A General Information",
                ))

            # SOURCE: xl/vba_code.txt ChkPincode 12721-12752, ValidatePinCode 13175-13203, 13944; sheet1.PinCode
            # When Country is India (91): PinCode mandatory, exactly 6 digits
            if country_code and country_code.startswith("91"):
                pincode_val = addr.PinCode
                if pincode_val is None:
                    messages.append(ValidationError(
                        field="person_address.pincode",
                        message="* PinCode is Mandatory in personal details",
                    ))
                else:
                    pincode_str = str(pincode_val).strip()
                    if len(pincode_str) != 6:
                        messages.append(ValidationError(
                            field="person_address.pincode",
                            message="* Pincode in personal details cannot exceed 6 characters " if len(pincode_str) > 6 else "* PinCode in personal details must contain only 6 digits",
                        ))
                    elif not pincode_str.isdigit():
                        messages.append(ValidationError(
                            field="person_address.pincode",
                            message="* PinCode in personal details must contain only digits from 0 to 9",
                        ))

        # SOURCE: xl/vba_code.txt ChkEmpCategory 13030-13039, PIShtValidate 14029; sheet1.EmployerCategory1
        # EmployerCategory is on ITR1.PersonalInfo
        if isinstance(req, ITR1):
            emp_cat = str(req.PersonalInfo.EmployerCategory or "").strip()
            if not emp_cat or emp_cat == "(Select)":
                messages.append(ValidationError(
                    field="person.employer_category",
                    message="* Nature of Employment is mandatory in personal details",
                ))

    def validate_bank_details(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """Validates bank account details (ITR1).
        - At least one bank account must exist (error reported on bankDetails.accountType)
        - BankName, BankAccountNo, IFSCCode, AccountType mandatory per account
        - Exactly one account must be marked UseForRefund='true' (isPrimary)
        """
        bank_dtls = getattr(req.Refund, "BankAccountDtls", None)

        accounts: list = []
        if bank_dtls is not None:
            accounts = getattr(bank_dtls, "AddtnlBankDetails", None) or []

        if not accounts:
            messages.append(ValidationError(
                field="bankDetails.accountType",
                message="* Bank account details are required in personal details",
            ))
            return False

        ok = True
        primary_count = 0

        for acct in accounts:
            # Bank Name
            bank_name = str(getattr(acct, "BankName", None) or "").strip()
            if not bank_name:
                messages.append(ValidationError(
                    field="bankDetails.bankName",
                    message="* Bank Name is mandatory in bank details",
                ))
                ok = False
            elif len(bank_name) > 125:
                messages.append(ValidationError(
                    field="bankDetails.bankName",
                    message="* Bank Name cannot exceed 125 characters in bank details",
                ))
                ok = False

            # Account Number
            acct_no = str(getattr(acct, "BankAccountNo", None) or "").strip()
            if not acct_no:
                messages.append(ValidationError(
                    field="bankDetails.accountNumber",
                    message="* Account Number is mandatory in bank details",
                ))
                ok = False

            # IFSC Code
            ifsc = str(getattr(acct, "IFSCCode", None) or "").strip()
            if not ifsc:
                messages.append(ValidationError(
                    field="bankDetails.ifscCode",
                    message="* IFSC Code is mandatory in bank details",
                ))
                ok = False
            elif not _validate_ifsc_format(ifsc):
                messages.append(ValidationError(
                    field="bankDetails.ifscCode",
                    message="* Invalid IFSC Code in bank details (4 letters, digit 0, 6 alphanumeric)",
                ))
                ok = False

            # Account Type
            acct_type = getattr(acct, "AccountType_1", None)
            if acct_type is None:
                messages.append(ValidationError(
                    field="bankDetails.accountType",
                    message="* Account Type is mandatory in bank details",
                ))
                ok = False

            # isPrimary (UseForRefund)
            if str(getattr(acct, "UseForRefund", "") or "").lower() == "true":
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

    async def income_validator(self, itr1_model: ITR1, errors: list[ValidationError]) :
        await self.salary_section_validator(itr1_model, errors)
        self.house_property_validator(itr1_model, errors)
        self.others_income_validator(itr1_model, errors)

    async def salary_section_validator(self, itr1_model: ITR1, errors: list[ValidationError]) :
        self.salary_total_validator(itr1_model, errors)
        self.gross_salary_validator(itr1_model, errors)
        self.PerquisitesValue_validator(itr1_model, errors)
        self.ProfitsInSalary_validator(itr1_model, errors)
        self.DeductionUs16_validator(itr1_model, errors)
        self.net_salary_validator(itr1_model, errors)
        self.income_from_sal_validator(itr1_model, errors)
        self.DeductionUs16ia_validator(itr1_model, errors)
        await self.EntertainmentAlw16ii_validator(itr1_model, errors)
        self.ProfessionalTaxUs16iii_validator(itr1_model, errors)
    
    def house_property_validator(self, itr1_model: ITR1, errors: list[ValidationError]) :
        self.ValidatePropertyType(itr1_model, errors)
        self.ValidateGrossRentReceived(itr1_model, errors)
        self.ValidateTaxPaidLocalAuthorities(itr1_model, errors)
        self.ValidateAnnualValue(itr1_model, errors)
        self.ValidateStandardDeduction(itr1_model, errors)
        self.ValidateInterestBorrowedCapital(itr1_model, errors)
        self.ValidateArrears(itr1_model, errors)
        self.ValidateIncomeHeadHouseProperty(itr1_model, errors)
    def others_income_validator(self, itr1_model: ITR1, errors: list[ValidationError]) :
        # IncD.GrossTotIncome_New, IncD.IncomeFromOS (Excel validators)
        self.ValidateGrossTotIncome_New(itr1_model, errors)
        self.ValidateIncomeFromOS(itr1_model, errors)

        # Others.NOI_2, Nature_Others_2, Others.Amount_2 (Excel: ValidateOthersEI1, ValidateNatureOfIncome1, ValidateAmount1)
        self.ValidateOthersEI1(itr1_model, errors)

    def salary_total_validator(self, req: ITR1,errors: list[ValidationError]) -> bool:#Source: mIncmDtls.bas.bas (lines 1841-1843)
        """Validates the total salary income."""
        salary = cast(int, req.ITR1_IncomeDeductions.Salary)
        if len(str(salary)) > 14:
            errors.append(ValidationError(field="salary_total", message="* Allowances value should not exceed 14 digits in Income Details"))
            return False
        return True

    def gross_salary_validator(self, req: ITR1,messages: list[ValidationError]) -> bool:#Source: mIncmDtls.bas.bas - GrossSalary maps to IncD.IncomeFromSal
        """Validates the gross salary."""
        gross_salary = cast(int, req.ITR1_IncomeDeductions.GrossSalary)
        if len(str(gross_salary)) > 14:
            messages.append(ValidationError(field="gross_salary", message="* Gross salary value should not exceed 14 digits in Income Details"))
            return False
        return True

    def PerquisitesValue_validator(self, req: ITR1,messages: list[ValidationError]) -> bool:#Source: mIncmDtls.bas.bas (lines 1845-1847)
        """Validates the total perquisites value."""
        perquisites = cast(int, req.ITR1_IncomeDeductions.PerquisitesValue)
        if len(str(perquisites)) > 14:
            messages.append(ValidationError(field="salarySection172", message="* Perquisites value should not exceed 14 digits in Income Details"))
            return False
        return True

    def ProfitsInSalary_validator(self, req: ITR1,messages: list[ValidationError]) -> bool:#Source: mIncmDtls.bas.bas (lines 1849-1851)
        """Validates the total profits in salary."""
        profits = cast(int, req.ITR1_IncomeDeductions.ProfitsInSalary)
        if len(str(profits)) > 14:
            messages.append(ValidationError(field="profits_in_salary", message="* Profits salry should not exceed 14 digits in Income Details"))
            return False
        return True

    def DeductionUs16_validator(self, req: ITR1,messages: list[ValidationError]) -> bool:#Source: mIncmDtls.bas.bas (lines 1853-1855)
        """Validates the total deduction 16."""
        deduction_16 = cast(int, req.ITR1_IncomeDeductions.DeductionUs16)
        if len(str(deduction_16)) > 14:
            messages.append(ValidationError(field="deduction_16", message="* Deduction u/s 16 should not exceed 14 digits in Income Details"))
            return False
        return True

    def net_salary_validator(self, req: ITR1,messages: list[ValidationError]) -> bool:#Source: Net_salary - used in cross-validation
        """Validates the net salary."""
        net_salary = cast(int, req.ITR1_IncomeDeductions.NetSalary)
        if len(str(net_salary)) > 14:
            messages.append(ValidationError(field="net_salary", message="* Net salary value should not exceed 14 digits in Income Details"))
            return False
        return True

    def income_from_sal_validator(self, req: ITR1,messages: list[ValidationError]) -> bool:#Source: mIncmDtls.bas.bas (lines 1863-1865)
        """Validates the total income from salary."""
        income_from_sal = cast(int, req.ITR1_IncomeDeductions.IncomeFromSal)
        if len(str(income_from_sal)) > 14:
            messages.append(ValidationError(field="income_from_sal", message="* Total head salary should not exceed 14 digits in Income Details"))
            return False
        return True

    def DeductionUs16ia_validator(self, req: ITR1,messages: list[ValidationError]) -> bool:#Source: mIncmDtls.bas.bas (lines 1857-1884), Sheet1.cls.txt (lines 1150-1184)
        """Validates deduction u/s 16(ia)."""
        deduction_16ia = cast(int, req.ITR1_IncomeDeductions.DeductionUs16ia)
      
        
        deduction_16ia_int =  deduction_16ia
        net_salary = cast(int, req.ITR1_IncomeDeductions.NetSalary)
        
        # 14 digit check
        if len(str(deduction_16ia_int)) > 14:
            messages.append(ValidationError(field="deduction_16ia", message="* Deduction u/s 16(ia) should not exceed 14 digits in Income Details"))
            return False
        
       
        if req.FilingStatus.OptOutNewTaxRegime == "Y":  # type: ignore[attr-defined]
            if deduction_16ia_int > 50000:
                messages.append(ValidationError(field="deduction_16ia", message="* Maximum Deduction u/s 16(ia) is 50,000/- only in Income Details"))
                return False
        else:
            if deduction_16ia_int > 75000:
                messages.append(ValidationError(field="deduction_16ia", message="* Maximum Deduction u/s 16(ia) is 75,000/- only in Income Details"))
                return False
        # Must not exceed Net Salary
        if deduction_16ia_int > net_salary:
            messages.append(ValidationError(field="deduction_16ia", message="* Deduction u/s 16(ia) can not exceed Rs. 75,000 or Net Salary, whichever is lower in  Income Details"))
            return False
        
        return True

   
    async def EntertainmentAlw16ii_validator(self, req: ITR1,messages: list[ValidationError]) -> bool:#Source: mIncmDtls.bas.bas (lines 1898-1913), Sheet1.cls.txt (lines 2908-2914)
        """Validates entertainment allowance u/s 16(ii)."""
        entertainment_allowance = cast(int, req.ITR1_IncomeDeductions.EntertainmentAlw16ii)
        entertainment_allowance_int = entertainment_allowance
        salary = cast(int, req.ITR1_IncomeDeductions.Salary)
        
        # 14 digit check
        if len(str(entertainment_allowance_int)) > 14:
            messages.append(ValidationError(field="salaryDeduction16.entertainmentAllowance", message="* Deduction u/s 16 should not exceed 14 digits in Income Details"))
            return False
  
        # Max value check based on employer category - TODO: Need employer category from ITR1 model
        # For now, checking both limits
        # Central/State Government or PSU: Maximum ₹5,000
        # Others: 0
        if req.PersonalInfo.EmployerCategory.value in ("CGOV", "SGOV", "PE", "PESG"):
            if entertainment_allowance_int > 5000:
                messages.append(ValidationError(field="salaryDeduction16.entertainmentAllowance", message=" * Deduction of Entertainment allowance u/s 16(ii) should not exceed 10,000 in Income Details."))
                return False
        else:
            if entertainment_allowance_int > 0:
                messages.append(ValidationError(field="salaryDeduction16.entertainmentAllowance", message="* Deduction of Entertainment allowance u/s 16(ii) is not applicable for employer category" + " ""Not Applicable"" in Income Details."))
        # Cross-validation with Salary: Must not exceed min(5000, Salary/5)
        if salary:
            max_allowed = min(5000, salary // 5)
            if entertainment_allowance_int > max_allowed:
                messages.append(ValidationError(field="salaryDeduction16.entertainmentAllowance", message="* Deduction of Entertainment allowance u/s 16(ii) can not exceed 1/5th of Salary as per section 17(1) or Rs. 5,000 whichever is lower in Income Details"))
                return False
        
        return True

    def ProfessionalTaxUs16iii_validator(self, req: ITR1,errors: list[ValidationError]) -> bool:#Source: Sheet1.cls.txt (lines 2916-2922) - Commented out in VB
        """Validates professional tax u/s 16(iii)."""
        professional_tax = cast(int, req.ITR1_IncomeDeductions.ProfessionalTaxUs16iii)
        professional_tax_int = professional_tax
        
        # 14 digit check
        if len(str(professional_tax_int)) > 14:
            errors.append(ValidationError(field="professional_tax", message="* Professional tax u/s 16(iii) should not exceed 14 digits in Income Details"))
            return False
        
        # Note: Max ₹5,000 validation exists in VB but is commented out
        if professional_tax_int > 5000:
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
            amount: int = cast(int, detail.OthSrcOthAmount)
          
            # Must be numeric (already validated by Pydantic conint, but check for negative)
            if amount < 0:
                messages.append(ValidationError(
                    field="oth_src_oth_amount",
                    message=f"* Income From Other Sources:in Income Details should be Numeric value"
                ))
                return False
            
            # Cannot exceed 14 digits
            if amount > 99999999999999:
                messages.append(ValidationError(
                    field="oth_src_oth_amount",
                    message=f"* Income From Other Sources: Amount Income Details cannot exceed 14 digits"
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
    
    def ValidatePropertyType(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Validates TypeOfHP - must be selected if any house property fields are filled.
        
        Source: VB Dump - ValidatePropertyType() (lines 2286-2304)
        """
        # Check if any house property fields have values
        has_gross_rent = req.ITR1_IncomeDeductions.GrossRentReceived is not None and cast(int, req.ITR1_IncomeDeductions.GrossRentReceived) > 0
        has_tax_paid = req.ITR1_IncomeDeductions.TaxPaidlocalAuth is not None and cast(int, req.ITR1_IncomeDeductions.TaxPaidlocalAuth) > 0
        has_interest = req.ITR1_IncomeDeductions.InterestPayable is not None and cast(int, req.ITR1_IncomeDeductions.InterestPayable) > 0
        
        # If any house property field has a value, TypeOfHP must be selected
        if has_gross_rent or has_tax_paid or has_interest:
            type_of_hp = req.ITR1_IncomeDeductions.TypeOfHP
            if not type_of_hp or type_of_hp == "" or type_of_hp == "(Select)":
                messages.append(ValidationError(
                    field="type_of_hp",
                    message=f"* Select the Type of House Property in Income Details. {type_of_hp}"
                ))
                return False
            
            # Validate that TypeOfHP is one of the valid values (S, L, D)
            type_of_hp_str: str = type_of_hp
            if type_of_hp_str not in ["S", "L", "D", "Self Occupied", "Let Out", "Deemed Let Out"]:
                messages.append(ValidationError(
                    field="property.propertyType",
                    message="* Type of House Property must be one of: Self Occupied (S), Let Out (L), or Deemed Let Out (D) in Income Details."
                ))
                return False
        
        return True
    
    def ValidateGrossRentReceived(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Validates GrossRentReceived.
        
        Source: VB Dump - lines 1923-1925, 1802-1804
        """
        gross_rent_received = cast(int | None, req.ITR1_IncomeDeductions.GrossRentReceived)
        if gross_rent_received is None:
            return True  # Optional field

        gross_rent = gross_rent_received
        
        # Cannot exceed 14 digits
        if len(str(gross_rent)) > 14:
            messages.append(ValidationError(
                field="annualRentReceived",
                message="* Gross rent recieved should not exceed 14 digits in Income Details."
            ))
            return False
        
        # If TypeOfHP is "Let Out" or "Deemed Let Out", GrossRentReceived must be > 0
        type_of_hp = req.ITR1_IncomeDeductions.TypeOfHP
        if type_of_hp:
            type_of_hp_str: str = type_of_hp
            if type_of_hp_str in ["L", "D", "Let Out", "Deemed Let Out"]:
                if gross_rent == 0:
                    messages.append(ValidationError(
                        field="annualRentReceived",
                        message="* Gross rent received/ receivable/ letable value during the year should be greater than zero in  Income Details"
                    ))
                    return False
        
        return True

    def ValidateTaxPaidLocalAuthorities(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Validates TaxPaidlocalAuth.
        
        Source: VB Dump - lines 1927-1929, 1808-1812
        """
        if req.ITR1_IncomeDeductions.TaxPaidlocalAuth is None:
            return True  # Optional field
        
        tax_paid = cast(int, req.ITR1_IncomeDeductions.TaxPaidlocalAuth)
        
        # Cannot exceed 14 digits
        if len(str(tax_paid)) > 14:
            messages.append(ValidationError(
                field="municipalTaxesPaid",
                message="* Tax paid local authorities should not exceed 14 digits in Income Details."
            ))
            return False
        
        # Tax paid can only be claimed if GrossRentReceived > 0
        gross_rent = req.ITR1_IncomeDeductions.GrossRentReceived
        if tax_paid > 0:
            if not gross_rent or cast(int, gross_rent) == 0:
                messages.append(ValidationError(
                    field="municipalTaxesPaid",
                    message="* Tax paid to local authorities can be claimed only if income from house property is declared in Income Details."
                ))
                return False
        
        return True
    
    def ValidateAnnualValue(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Validates AnnualValue.
        
        Source: VB Dump - lines 1931-1933
        """
        annual_value = cast(int, req.ITR1_IncomeDeductions.AnnualValue)
        
        # Cannot exceed 14 digits
        if len(str(annual_value)) > 14:
            messages.append(ValidationError(
                field="annualRentReceived",
                message="* Annual value should not exceed 14 digits in Income Details."
            ))
            return False
        
        return True
    
    def ValidateStandardDeduction(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Validates StandardDeduction.
        
        Source: VB Dump - lines 1935-1937
        """
        standard_deduction = cast(int, req.ITR1_IncomeDeductions.StandardDeduction)
        
        # Cannot exceed 14 digits
        if len(str(standard_deduction)) > 14:
            messages.append(ValidationError(
                field="standard_deduction",
                message="* Standard deduction  should not exceed 14 digits in Income Details."
            ))
            return False
        
        return True
    
    def ValidateInterestBorrowedCapital(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Validates InterestPayable (InterestBorrowedCapital).
        
        Source: VB Dump - lines 1939-1941
        Note: The validation for max 200000 for Self Occupied is commented out in VB dump
        """
        if req.ITR1_IncomeDeductions.InterestPayable is None:
            return True  # Optional field
        
        interest = cast(int, req.ITR1_IncomeDeductions.InterestPayable)
        
        # Cannot exceed 14 digits
        if len(str(interest)) > 14:
            messages.append(ValidationError(
                field="interest_payable",
                message="* Interest borrowed capital should not exceed 14 digits in Income Details."
            ))
            return False
        
        return True
    
    def ValidateArrears(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Validates ArrearsUnrealizedRentRcvd.
        
        Source: VB Dump - Similar to other 14 digit checks
        """
        if req.ITR1_IncomeDeductions.ArrearsUnrealizedRentRcvd is None:
            return True  # Optional field
        
        arrears = cast(int, req.ITR1_IncomeDeductions.ArrearsUnrealizedRentRcvd)
        
        # Cannot exceed 14 digits
        if len(str(arrears)) > 14:
            messages.append(ValidationError(
                field="arrears_unrealized_rent_rcvd",
                message="* Arrears/Unrealized Rent Received should not exceed 14 digits in Income Details."
            ))
            return False
        
        return True
    
    def ValidateIncomeHeadHouseProperty(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Validates TotalIncomeOfHP (IncomeHeadHouseProperty).
        
        Source: VB Dump - lines 1943-1945
        """
        total_income_hp = cast(int, req.ITR1_IncomeDeductions.TotalIncomeOfHP)
        
        # Cannot exceed 14 digits
        if len(str(abs(total_income_hp))) > 14:
            messages.append(ValidationError(
                field="total_income_of_hp",
                message="* Income Head House Property  should not exceed 14 digits in Income Details."
            ))
            return False
        
        return True
    
        # =============================================================================
    # IncD.GrossTotIncome_New, IncD.IncomeFromOS (Excel validators)
    # =============================================================================
    # Source: itr1_macros - GrossTotIncome_New (lines 14423-14425), IncomeFromOS usage

    def ValidateGrossTotIncome_New(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        IncD.GrossTotIncome_New - Gross Total income should not be greater than 14 digits.
        Source: VB - If Len(Range("IncD.GrossTotIncome_New").Value) > 14 Then ...
        """
        val = getattr(req.ITR1_IncomeDeductions, "GrossTotIncomeIncLTCG112A", None) or getattr(req.ITR1_IncomeDeductions, "GrossTotIncome", 0)
        gti = cast(int, val)
        if len(str(gti)) > 14:
            messages.append(ValidationError(
                field="GrossTotIncome_New",
                message="* Gross Total income in  Income Details should not be greater than 14 digits"
            ))
            return False
        return True

    def ValidateIncomeFromOS(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        IncD.IncomeFromOS (IncomeOthSrc) - should not exceed 14 digits.
        """
        income_os = cast(int, req.ITR1_IncomeDeductions.IncomeOthSrc)
        if len(str(income_os)) > 14:
            messages.append(ValidationError(
                field="IncomeFromOS",
                message="* Income from Other Sources total in  Income Details should not be greater than 14 digits"
            ))
            return False
        return True
    def ValidateTotalIncomeNonNegative(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Total Income (Gross Total Income minus Chapter VIA deductions) must be >= 0.
        If user-claimed deductions exceed gross income, show a validation error.
        """
        total_income = getattr(req.ITR1_IncomeDeductions, "TotalIncome", None)
        if total_income is None:
            return True
        val = cast(int, total_income)
        if val < 0:
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
                desc: str = desc_obj
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
            if amount > 99999999999999:
                messages.append(ValidationError(
                    field="Others.Amount_2",
                    message=f"* Income From Other Sources: Amount in Income Details cannot exceed 14 digits"
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

    def ValidateITR1EligibilityTotalIncome(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        ITR-1 is for total income (excluding LTCG 112A) upto Rs.50 lakh.
        Source: mIncmDtls.bas (TotalIncome_New - CG_LTCG) > 5000000
        """
        total_income = cast(int, req.ITR1_IncomeDeductions.TotalIncome)
        ltcg = 0
        if getattr(req, "LTCG112A", None) is not None:
            ltcg = cast(int, req.LTCG112A.LongCap112A)
        total_excl_ltcg = total_income - ltcg
        if total_excl_ltcg > ITR1_MAX_TOTAL_INCOME_EXCL_LTCG:
            messages.append(ValidationError(
                field="salarySection171",
                message='* "ITR 1 is for individuals being a resident (other than not ordinarily resident) having total income upto Rs.50 lakh, having Income from Salaries, one house property, interest income, Family pension income etc. and agricultural income upto Rs.5 thousand. Please file another ITR as applicable"'
            ))
            return False
        return True

    def ValidateAllowancesVsGrossSalary(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Total of allowances shall not exceed gross salary at sl. no. ia+ib+ic.
        Source: mIncmDtls.bas Less_allowance > TotAllowances_17abc
        """
        salary = req.ITR1_IncomeDeductions.Salary
        gross_salary = cast(int, req.ITR1_IncomeDeductions.GrossSalary)
        if salary is not None and gross_salary is not None:
            sal_int = cast(int, salary)
            if sal_int > gross_salary:
                messages.append(ValidationError(
                    field="salary_total",
                    message="* Total of allowances shall not exceed gross salary at sl. no. ia+ib+ic in Schedule Income details"
                ))
                return False
        return True

    def ValidateTotalChapVIADeductions(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Deductions (Chapter VIA) should not exceed 14 digits.
        Source: mIncmDtls.bas IncD.TotalChapVIADeductions_Input
        """
        ud = req.ITR1_IncomeDeductions.UsrDeductUndChapVIA
        val = getattr(ud, "TotalChapVIADeductions", None)
        if val is None:
            return True
        if len(str(cast(int, val))) > 14:
            messages.append(ValidationError(
                field="TotalChapVIADeductions",
                message="* Deductions in Income Details should not be greater than 14 digits"
            ))
            return False
        return True

    def ValidateTotalIntrstPay(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Total Interest Payable should not exceed 14 digits.
        Source: mIncmDtls.bas IncD.TotalIntrstPay
        """
        tax_comp = getattr(req, "ITR1_TaxComputation", None)
        if tax_comp is None:
            return True
        val = getattr(tax_comp, "TotalIntrstPay", None)
        if val is None:
            return True
        if len(str(cast(int, val))) > 14:
            messages.append(ValidationError(
                field="TotalIntrstPay",
                message="* Total Interest in Income Details should not be greater than 14 digits"
            ))
            return False
        return True

    def ValidateTotTaxPlusIntrstPay(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Total Tax and Interest Payable should not exceed 14 digits.
        Source: mIncmDtls.bas IncD.TotTaxPlusIntrstPay
        """
        tax_comp = getattr(req, "ITR1_TaxComputation", None)
        if tax_comp is None:
            return True
        val = getattr(tax_comp, "TotTaxPlusIntrstPay", None)
        if val is None:
            return True
        if len(str(cast(int, val))) > 14:
            messages.append(ValidationError(
                field="TotTaxPlusIntrstPay",
                message="* Total Tax and Interest Payable in Income Details should not be greater than 14 digits"
            ))
            return False
        return True

    def ValidateLTCG112ACap(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Long term capital gains u/s 112A should not exceed Rs 1,25,000 in ITR-1.
        Source: itr1_macros (Cost_LTCG/Sale_LTCG change), mIncmDtls validateLTCG
        """
        ltcg_section = getattr(req, "LTCG112A", None)
        if ltcg_section is None:
            return True
        long_cap = cast(int, ltcg_section.LongCap112A)
        if long_cap > LTCG_112A_MAX:
            messages.append(ValidationError(
                field="LTCG112A",
                message="* Long term capital gains as per sec 112A should not exceed 1,25,000"
            ))
            return False
        if len(str(long_cap)) > 14:
            messages.append(ValidationError(
                field="LTCG112A",
                message="* Long term capital gains as per sec 112A should not exceed 14 digits in Income Details"
            ))
            return False
        return True

    def ValidateDeductionUs57iia(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Deduction u/s 57(iia) cannot exceed lower of 1/3rd of Family pension or Rs 15,000/25,000.
        Source: itr1_macros LessDeduction57, LessDeduction57New
        """
        ded = getattr(req.ITR1_IncomeDeductions, "DeductionUs57iia", None)
        if ded is None:
            return True
        d = cast(int, ded)
        if len(str(d)) > 14:
            messages.append(ValidationError(
                field="DeductionUs57iia",
                message="* Deduction u/s 57(iia) should not exceed 14 digits in Income Details"
            ))
            return False
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

    def ValidateAgriculturalIncome(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        If agricultural income > Rs 5,000 then use ITR 2 or 3.
        Source: itr1_macros ExcempIncome > 5000, MsgPartBSheet
        """
        exempt = getattr(req.ITR1_IncomeDeductions, "ExemptIncAgriOthUs10", None)
        if exempt is None:
            return True
        total_agri = 0
        dtls = getattr(exempt, "ExemptIncAgriOthUs10Dtls", None) or []
        for d in dtls:
            nature = getattr(d, "NatureDesc", None)
            if nature is not None:
                nstr = nature
                if nstr and "AGRI" in nstr.upper():
                    total_agri += cast(int, getattr(d, "OthAmount", 0))
        if total_agri > AGRICULTURAL_INCOME_ITR1_MAX:
            messages.append(ValidationError(
                field="ExemptIncAgriOthUs10",
                message="* If agricultural income is more than Rs 5000/- then use ITR 2 or 3"
            ))
            return False
        return True

    def ValidateITRUTotalIncome(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        If filing u/s 139(8A) (ITR-U), total income must be > Rs 2.5 lakh.
        Source: mIncmDtls.bas TotalIncome < 250000 And ReturnFileSec = "139(8A)"
        """
        try:
            sec = req.FilingStatus.ReturnFileSec
        except Exception:
            return True
        if sec != ReturnFileSecEnum.integer_21:
            return True
        total_income = cast(int, req.ITR1_IncomeDeductions.TotalIncome)
        if total_income < ITR_U_MIN_TOTAL_INCOME:
            messages.append(ValidationError(
                field="salarySection171",
                message="* If total income of the assessee is less than or equal to 2.5 lakhs, then user is not allowed to file ITR-U"
            ))
            return False
        return True 

    def ValidateSchedule80C_Amount(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Amount eligible for deduction u/s 80C: mandatory, numeric, <= 14 digits per row.
        Source: md80C.bas ValidateAmount_80C
        """
        sch = getattr(req, "Schedule80C", None)
        if sch is None or not sch.Schedule80CDtls:
            return True
        for i, dtl in enumerate(sch.Schedule80CDtls, start=1):
            amt = getattr(dtl, "Amount", None)
            if amt is None:
                messages.append(ValidationError(
                    field="80c.amount",
                    message=f"* Amount eligible for deduction u/s 80C is mandatory in schedule 80C"
                ))
                return False
            a = cast(int, amt)
            if a > MAX_14_DIGITS:
                messages.append(ValidationError(
                    field="80c.amount",
                    message=f"* Amount eligible for deduction at 80C cannot exceed 14 digits"
                ))
                return False
        return True

    def ValidateSchedule80C_Identification(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Policy/Document Identification: mandatory, <= 50 chars, no < or > per row.
        Source: xl/vba_code.txt, md80C.bas — ValidateIdentification_Number_80C.
        """
        sch = getattr(req, "Schedule80C", None)
        if sch is None or not sch.Schedule80CDtls:
            return True
        for i, dtl in enumerate(sch.Schedule80CDtls, start=1):
            ident = getattr(dtl, "IdentificationNo", None)
            if ident is None or (isinstance(ident, str) and ident.strip() == ""):
                messages.append(ValidationError(
                    field="80c.policyNumber",
                    message=f"* Policy number or Document Identification number is mandatory in schedule 80C"
                ))
                return False
            s = str(ident).strip()
            if len(s) > 50:
                messages.append(ValidationError(
                    field="80c.policyNumber",
                    message=f"* Policy number or Document Identification number cannot be more than 50 characters."
                ))
                return False
            if not self._no_angle_brackets(s):
                messages.append(ValidationError(
                    field="80c.policyNumber",
                    message=f"* Policy number or Document Identification number in schedule 80C at Sl.no. {i} should not Contain <, >, characters."
                ))
                return False
        return True

    def ValidateSchedule80C_Total(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Total of deduction u/s 80C cannot exceed 14 digits.
        Source: md80C.bas Validategreater_80C
        """
        # Prefer schedule total; else user Chapter VIA Section80C
        total_val = None
        sch = getattr(req, "Schedule80C", None)
        if sch is not None:
            total_val = getattr(sch, "TotalAmt", None)
        if total_val is None:
            inc_ded = getattr(req, "ITR1_IncomeDeductions", None)
            if inc_ded is not None:
                ud = getattr(inc_ded, "UsrDeductUndChapVIA", None)
                if ud is not None:
                    total_val = getattr(ud, "Section80C", None)

        if total_val is None:
            return True
        v = cast(int, total_val)
        if v > MAX_14_DIGITS or len(str(v)) > 14:
            messages.append(ValidationError(
                field="80c.amount",
                message="* Total of deduction u/s 80C amount cannot exceed 14 Digits."
            ))
            return False
        return True

    def ValidateSchedule80C(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Schedule 80C validations. Run only when opted out of new regime (BacValue=2).
        Source: xl/vba_code.txt, md80C.bas — Validate_80C, Validate80C_All.
        """
        opt_out = str(getattr(self._get_filing_status(req), "OptOutNewTaxRegime", "") or "")
        if opt_out != "Y":
            return True
        ok = True
        ok = self.ValidateSchedule80C_Amount(req, messages) and ok
        ok = self.ValidateSchedule80C_Identification(req, messages) and ok
        ok = self.ValidateSchedule80C_Total(req, messages) and ok
        return ok


    def validate_pran_number(self, itr: ITR1, messages: list[ValidationError]) -> bool:
        """
        PRAN number should not exceed 125 characters.
        Source: mIncmDtls.bas IncD.PRANNum
        """
        inc_ded = itr.ITR1_IncomeDeductions
            pran_number = getattr(inc_ded, "PRANNum", None)
            if pran_number is not None and len(str(pran_number)) > 125:
                messages.append(ValidationError(
                    field="80ccc.pranNumber",
                    message="* PRAN number should not exceed 125 characters"
                ))
                return False
            ud = getattr(inc_ded, "UsrDeductUndChapVIA", None)
        if ud is not None and getattr(ud, "Section80CCC", 0):
            pran = getattr(ud, "PRANNum", None)
            if pran is not None and len(str(pran)) > 125:
                messages.append(ValidationError(
                    field="80ccc.pranNumber",
                    message="* PRAN number should not exceed 125 characters"
                ))
                return False
            if not pran:
                messages.append(ValidationError(
                    field="80ccc.pranNumber",
                    message="* PRAN number is required"
                ))
                return False
        return True
    ELIGIBLE_DONATION_80GGA_PERCENT_OF_TOTAL_INCOME = 10
    def ValidateSchedule80GGA_EligibleDonationCap(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Total eligible donation u/s 80GGA should not exceed 10% of total income.
        Source: xl/vba_code.txt — Sch80GGA.bas (eligible donation cap % of total income).
        """
        sch = getattr(req, "Schedule80GGA", None)
        if sch is None:
            return True
        total_income = cast(int, req.ITR1_IncomeDeductions.GrossTotIncome)
        eligible = cast(int, getattr(sch, "TotalEligibleDonationAmt80GGA", 0) or 0)
        if total_income <= 0:
            return True
        cap = int(total_income * self.ELIGIBLE_DONATION_80GGA_PERCENT_OF_TOTAL_INCOME / 100)
        if eligible > cap:
            messages.append(ValidationError(
                field="80gga.donationAmountNonCash",
                message=f"* Total eligible donation u/s 80GGA cannot exceed {self.ELIGIBLE_DONATION_80GGA_PERCENT_OF_TOTAL_INCOME}% of total income (Rs {cap})"
            ))
            return False
        return True

    def ValidateSchedule80D(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """
        Schedule 80D: InsurerName and PolicyNo are mandatory per insurance detail row,
        <= 125 / 75 chars, no < or >; reject placeholder 'NA'/'0'; HealthInsAmt mandatory.
        Source: xl/vba_code.txt — Validate_80D; mappers/validators Sch80D, md80D.
        """
        opt_out = str(getattr(self._get_filing_status(req), "OptOutNewTaxRegime", "") or "")
        if opt_out != "Y":
            return True
        sch80d = getattr(req, "Schedule80D", None)
        if sch80d is None:
            return True
        # Support both: Schedule80D.Sec80DSelfFamSrCtznHealth (nested) or flat dict (from builder)
        if isinstance(sch80d, dict):
            health = sch80d.get("Sec80DSelfFamSrCtznHealth") or sch80d
        else:
            health = getattr(sch80d, "Sec80DSelfFamSrCtznHealth", None)
        if health is None:
            return True
        def _get(obj, key, default=None):
            if obj is None:
                return default
            if isinstance(obj, dict):
                return obj.get(key, default)
            return getattr(obj, key, default) 
            # DEBUG: see what 80D structure validation actually sees
        _debug_tables = [
            ("Sec80DSelfFamHIDtls", "SelfAndFamily"),
            ("Sec80DSelfFamSrCtznHIDtls", "SelfAndFamilySeniorCitizen"),
            ("Sec80DParentsHIDtls", "Parents"),
            ("Sec80DParentsSrCtznHIDtls", "ParentsSeniorCitizen"),
        ]
        for _attr, _label in _debug_tables:
            _dtls = _get(health, _attr)
            _ins_list = (_get(_dtls, "Sch80DInsDtls") or []) if _dtls is not None else []
            print(f"[80D debug] {_label}: dtls={type(_dtls).__name__}, ins_list len={len(_ins_list)}")
            if _ins_list:
                print(f"[80D debug] first row: {_ins_list[0]}")
        tables: list[tuple[str, str]] = [
            ("Sec80DSelfFamHIDtls", "SelfAndFamily"),
            ("Sec80DSelfFamSrCtznHIDtls", "SelfAndFamilySeniorCitizen"),
            ("Sec80DParentsHIDtls", "Parents"),
            ("Sec80DParentsSrCtznHIDtls", "ParentsSeniorCitizen"),
        ]
        ok = True
        for attr_name, table_label in tables:
            dtls = _get(health, attr_name)
            if dtls is None:
                continue
            ins_list = _get(dtls, "Sch80DInsDtls") or []
            for i, ins in enumerate(ins_list, start=1):
                name = _get(ins, "InsurerName")
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
                policy = _get(ins, "PolicyNo")
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
                    if policy == 0 or (isinstance(policy, str) and policy.strip() == "0"):    
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
                health_amt = _get(ins, "HealthInsAmt")
                if not _chk_compulsory(health_amt):
                    messages.append(ValidationError(
                        field="healthInsurance.healthInsAmt",
                        message="* Schedule 80D: Health insurance amount is mandatory",
                    ))
                    ok = False
        return ok

    def ValidateSchedule80GGA(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """Schedule 80GGA: item fields + totals + eligible donation cap.
        Source: xl/vba_code.txt — Sch80GGA.bas; item fields (RelevantClause, Name, Address, City, State, PinCode, PAN, DonationAmt), totals, eligible cap %% of total income."""
        ok = self.ValidateSchedule80GGA_ItemFields(req, messages)
        ok = self.ValidateSchedule80GGA_Totals(req, messages) and ok
        opt_out = str(getattr(self._get_filing_status(req), "OptOutNewTaxRegime", "") or "")
        if opt_out != "Y":
            return ok
        return self.ValidateSchedule80GGA_EligibleDonationCap(req, messages) and ok

    def ValidateSchedule80GGA_ItemFields(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """Schedule 80GGA item validations from Excel (Sch80GGA.bas): RelevantClause, Name, Address, City, State, PinCode, PAN, DonationAmt."""
        sch = getattr(req, "Schedule80GGA", None)
        if sch is None:
            return True
        donations = getattr(sch, "DonationDtlsSciRsrchRuralDev", None) or []
        ok = True
        for i, item in enumerate(donations, start=1):
            prefix = f"Schedule80GGA.DonationDtlsSciRsrchRuralDev.{i - 1}"
            # RelevantClauseUndrDedClaimed: mandatory
            clause = getattr(item, "RelevantClauseUndrDedClaimed", None) or getattr(item, "RelevantClauseUndrDedClaimed", None)
            if not _chk_compulsory(clause):
                messages.append(ValidationError(field="clauseUnderDonation", message=f"* Schedule 80GGA: Relevant Clause is mandatory "))
                ok = False
            # NameOfDonee: mandatory
            name = getattr(item, "NameOfDonee", None) or ""
            if not (name if isinstance(name, str) else str(name or "")).strip():
                messages.append(ValidationError(field="80gga.doneeName", message=f"* Schedule 80GGA: Name of Donee is mandatory"))
                ok = False
            # AddressDetail.AddrDetail: mandatory
            addr = getattr(item, "AddressDetail", None) or getattr(item, "AddressDetail", None)
            if addr is not None:
                addr_detail = getattr(addr, "AddrDetail", None) or ""
                if not (addr_detail if isinstance(addr_detail, str) else str(addr_detail or "")).strip():
                    messages.append(ValidationError(field="80gga.pincode", message=f"* Schedule 80GGA: Address is mandatory" ))
                    ok = False
                # CityOrTownOrDistrict: mandatory
                city = getattr(addr, "CityOrTownOrDistrict", None) or ""
                if not (city if isinstance(city, str) else str(city or "")).strip():
                    messages.append(ValidationError(field="80gga.pincode", message=f"* Schedule 80GGA: City/Town/District is mandatory "))
                    ok = False
                # StateCode: mandatory, not (Select)
                state = getattr(addr, "StateCode", None) or ""
                state_str = (state if isinstance(state, str) else str(state or "")).strip()
                if not state_str or state_str == "(Select)":
                    messages.append(ValidationError(field="80gga.pincode", message=f"* Schedule 80GGA: State Code is mandatory "))
                    ok = False
                # PinCode: mandatory, 6 digits numeric
                pin = getattr(addr, "PinCode", None)
                if not _chk_compulsory(pin):
                    messages.append(ValidationError(field="80gga.pincode", message=f"* Schedule 80GGA: Pin Code is mandatory "))
                    ok = False
                elif pin is not None:
                    pin_str = str(pin).strip()
                    if not pin_str.isdigit() or len(pin_str) != 6:
                        messages.append(ValidationError(field="80gga.pincode", message=f"* Schedule 80GGA: Pin Code  Must be 6 digits Numeric Value"))
                        ok = False
            else:
                messages.append(ValidationError(field="80gga.pincode", message=f"* Schedule 80GGA: Address is mandatory "))
                ok = False
            # DoneePAN: mandatory, valid PAN format
            pan = getattr(item, "DoneePAN", None) or ""
            pan_str = (pan if isinstance(pan, str) else str(pan or "")).strip()
            if not pan_str:
                messages.append(ValidationError(field=f"{prefix}.DoneePAN", message=f"* Schedule 80GGA: PAN of Donee is mandatory "))
                ok = False
            elif not _validate_pan_format(pan_str):
                messages.append(ValidationError(field=f"{prefix}.DoneePAN", message=f"* Schedule 80GGA: Invalid PAN format "))
                ok = False
            # DonationAmt: mandatory, numeric, non-negative, <= 14 digits
            amt = getattr(item, "DonationAmt", None)
            if not _chk_compulsory(amt):
                messages.append(ValidationError(field=f"{prefix}.DonationAmt", message=f"* Schedule 80GGA: Donation Amount is mandatory "))
                ok = False
            elif isinstance(amt, (int, float)):
                if amt < 0:
                    messages.append(ValidationError(field=f"{prefix}.DonationAmt", message=f"* Schedule 80GGA: Donation Amount  should be Numeric, Non negative"))
                    ok = False
                if amt > MAX_14_DIGITS:
                    messages.append(ValidationError(field=f"{prefix}.DonationAmt", message=f"* Schedule 80GGA: Donation Amount  cannot exceed 14 digits"))
                    ok = False
        return ok

    def ValidateSchedule80GGA_Totals(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """Schedule 80GGA totals cannot exceed 14 digits (Excel)."""
        sch = getattr(req, "Schedule80GGA", None)
        if sch is None:
            return True
        ok = True
        for attr, label in [
            ("TotalDonationAmtCash80GGA", "Total amount of Donation in Cash"),
            ("TotalDonationAmtOtherMode80GGA", "Total amount of Donation in Other Mode"),
            ("TotalDonationsUs80GGA", "Total Donation u/s 80GGA"),
            ("TotalEligibleDonationAmt80GGA", "Total Eligible Donation amount"),
        ]:
            val = getattr(sch, attr, None)
            if val is not None and isinstance(val, (int, float)) and val > MAX_14_DIGITS:
                messages.append(ValidationError(field=f"Schedule80GGA.{attr}", message=f"* Schedule 80GGA: {label} cannot be greater than 14 digits"))
                ok = False
        return ok

    def ValidateSchedule80GGC(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """Schedule 80GGC: item fields + totals.
        Source: xl/vba_code.txt — Sch80GGC.bas; date, cash/other mode, TransactionRef, IFSC; totals <= 14 digits."""
        a = self.ValidateSchedule80GGC_ItemFields(req, messages)
        b = self.ValidateSchedule80GGC_Totals(req, messages)
        return a and b

    def ValidateSchedule80GGC_ItemFields(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """Schedule 80GGC item validations.
        Source: xl/vba_code.txt — Sch80GGC.bas; date (if any field filled), cash or other mode, transaction ref/IFSC for other mode, row amounts <= 14 digits."""
        sch = getattr(req, "Schedule80GGC", None)
        if sch is None:
            return True
        details = getattr(sch, "Schedule80GGCDetails", None) or []
        if not details:
            return True
        date_pattern = re.compile(r"^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))$")
        ok = True
        for i, item in enumerate(details, start=1):
            prefix = f"Schedule80GGC.Schedule80GGCDetails.{i - 1}"
            donation_date = getattr(item, "DonationDate", None)
            donation_cash = getattr(item, "DonationAmtCash", None) or 0
            donation_other = getattr(item, "DonationAmtOtherMode", None) or 0
            cheque_no = getattr(item, "TransactionRefNum", None)
            ifsc = getattr(item, "IFSCCode", None)
            ifsc_val = ifsc
            # optional: print(f"ifsc_val: {ifsc_val!r}", flush=True)
            # If any field is filled, date is mandatory
            if (donation_cash or donation_other or _chk_compulsory(cheque_no) or (not _isdropdownblank(ifsc))):
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
                if _isdropdownblank(ifsc):
                    messages.append(ValidationError(field="donorBankIfsc", message=f"* Schedule 80GGC: please enter \"your bank IFSC from which Contribution is made\" at Sr.No {i}"))
                    ok = False
                elif len(ifsc_val) > 11:
                    messages.append(ValidationError(field="donorBankIfsc", message=f"* Schedule 80GGC: IFS Code  cannot exceed 11 characters"))
                    ok = False
                elif not _validate_ifsc_format(ifsc_val):
                    messages.append(ValidationError(field="donorBankIfsc", message=f"* Schedule 80GGC: Invalid IFS Code  . Refer to your bank for valid IFS Codes. (1st 4 Alphabets, followed by Zero and remaining 6 should be alphanumeric)"))
                    ok = False
            # DonationAmt and EligibleDonationAmt <= 14 digits per row
            total_donation = getattr(item, "DonationAmt", None)
            if total_donation is not None and isinstance(total_donation, (int, float)) and total_donation > MAX_14_DIGITS:
                messages.append(ValidationError(field="contributionAmountNonCash", message=f"* Schedule 80GGC: Total Contribution Amount  cannot exceed 14 digits"))
                ok = False
            eligible_donation = getattr(item, "EligibleDonationAmt", None)
            if eligible_donation is not None and isinstance(eligible_donation, (int, float)) and eligible_donation > MAX_14_DIGITS:
                messages.append(ValidationError(field="contributionAmountNonCash", message=f"* Schedule 80GGC: Eligible contribution Amount cannot exceed 14 digits"))
                ok = False
        return ok

    def ValidateSchedule80GGC_Totals(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """Schedule 80GGC totals cannot exceed 14 digits (Excel)."""
        sch = getattr(req, "Schedule80GGC", None)
        if sch is None:
            return True 
        ok = True
        for attr, label in [
            ("TotalDonationAmtCash80GGC", "Total amount of Contribution in Cash"),
            ("TotalDonationAmtOtherMode80GGC", "Total amount of Contribution in Other Mode"),
            ("TotalDonationsUs80GGC", "Total amount Total Contribution"),
            ("TotalEligibleDonationAmt80GGC", "Total Eligible Contribution amount"),
        ]:
            val = getattr(sch, attr, None)
            if val is not None and isinstance(val, (int, float)) and val > MAX_14_DIGITS:
                messages.append(ValidationError(field=f"Schedule80GGC.{attr}", message=f"* Schedule 80GGC: {label} cannot be greater than 14 digits"))
                ok = False
        return ok


    def ValidateSchedule80G(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """Schedule 80G: item fields for each DoneeWithPan + section totals.
        Source: xl/vba_code.txt — Validate_80G; DoneeWithPan (name, PAN, address, donation amounts) per section."""
        a = self.ValidateSchedule80G_ItemFields(req, messages)
        b = self.ValidateSchedule80G_Totals(req, messages)
        return a and b

    def _ValidateSchedule80G_DoneeList(
        self,
        donations: list,
        section_label: str,
        section_key: str,
        messages: list[ValidationError],
    ) -> bool:
        """Validate one section's DoneeWithPan list (name, PAN, address, amounts)."""
        if not donations:
            return True
        ok = True
        for i, item in enumerate(donations, start=1):
            prefix = f"Schedule80G.{section_key}.DoneeWithPan.{i - 1}"
            name = getattr(item, "DoneeWithPanName", None) or ""
            if not (name if isinstance(name, str) else str(name or "")).strip():
                messages.append(ValidationError(field=f"{prefix}.DoneeWithPanName", message=f"* Schedule 80G ({section_label}): Name of Donee is mandatory "))
                ok = False
            pan = getattr(item, "DoneePAN", None) or ""
            pan_str = (pan if isinstance(pan, str) else str(pan or "")).strip()
            if not pan_str:
                messages.append(ValidationError(field=f"{prefix}.DoneePAN", message=f"* Schedule 80G ({section_label}): PAN of Donee is mandatory "))
                ok = False
            elif not _validate_pan_format(pan_str):
                messages.append(ValidationError(field=f"{prefix}.DoneePAN", message=f"* Schedule 80G ({section_label}): Invalid PAN format "))
                ok = False
            addr = getattr(item, "AddressDetail", None) or getattr(item, "AddressDetail", None)
            if addr is not None:
                addr_detail = getattr(addr, "AddrDetail", None) or ""
                if not (addr_detail if isinstance(addr_detail, str) else str(addr_detail or "")).strip():
                    messages.append(ValidationError(field=f"{prefix}.AddressDetail.AddrDetail", message=f"* Schedule 80G ({section_label}): Address is mandatory "))
                    ok = False
                city = getattr(addr, "CityOrTownOrDistrict", None) or ""
                if not (city if isinstance(city, str) else str(city or "")).strip():
                    messages.append(ValidationError(field=f"{prefix}.AddressDetail.CityOrTownOrDistrict", message=f"* Schedule 80G ({section_label}): City/Town/District is mandatory "))
                    ok = False
                state = getattr(addr, "StateCode", None) or ""
                state_str = (state if isinstance(state, str) else str(state or "")).strip()
                if not state_str or state_str == "(Select)":
                    messages.append(ValidationError(field=f"{prefix}.AddressDetail.StateCode", message=f"* Schedule 80G ({section_label}): State Code is mandatory "))
                    ok = False
                pin = getattr(addr, "PinCode", None)
                if not _chk_compulsory(pin):
                    messages.append(ValidationError(field=f"{prefix}.AddressDetail.PinCode", message=f"* Schedule 80G ({section_label}): Pin Code is mandatory "))
                    ok = False
                elif pin is not None:
                    pin_str = str(pin).strip()
                    if not pin_str.isdigit() or len(pin_str) != 6:
                        messages.append(ValidationError(field=f"{prefix}.AddressDetail.PinCode", message=f"* Schedule 80G ({section_label}): Pin Code  must be 6 digits"))
                        ok = False
            else:
                messages.append(ValidationError(field=f"{prefix}.AddressDetail", message=f"* Schedule 80G ({section_label}): Address is mandatory "))
                ok = False
            for attr, label in [
                ("DonationAmtCash", "Donation in cash"),
                ("DonationAmtOtherMode", "Donation in other mode"),
                ("DonationAmt", "Total Donation"),
                ("EligibleDonationAmt", "Eligible Amount of Donation"),
            ]:
                val = getattr(item, attr, None)
                if val is not None and isinstance(val, (int, float)):
                    if val < 0:
                        messages.append(ValidationError(field=f"{prefix}.{attr}", message=f"* Schedule 80G ({section_label}): {label}  should be non-negative"))
                        ok = False
                    if val > MAX_14_DIGITS:
                        messages.append(ValidationError(field=f"{prefix}.{attr}", message=f"* Schedule 80G ({section_label}): {label}  cannot exceed 14 digits"))
                        ok = False
        return ok

    def ValidateSchedule80G_ItemFields(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """Schedule 80G: validate DoneeWithPan items in all four sections.
        Source: xl/vba_code.txt — Validate_80G (DoneeWithPan name, PAN, address, amounts)."""
        sch = getattr(req, "Schedule80G", None)
        if sch is None:
            return True
        ok = True
        for section_attr, section_key, section_label in [
            ("Don100Percent", "Don100Percent", "100% without limit"),
            ("Don50PercentNoApprReqd", "Don50PercentNoApprReqd", "50% without limit"),
            ("Don100PercentApprReqd", "Don100PercentApprReqd", "100% subject to qualifying limit"),
            ("Don50PercentApprReqd", "Don50PercentApprReqd", "50% subject to qualifying limit"),
        ]:
            section = getattr(sch, section_attr, None)
            if section is None:
                continue
            donee_list = getattr(section, "DoneeWithPan", None) or getattr(section, "DoneeWithPan", None) or []
            ok = self._ValidateSchedule80G_DoneeList(donee_list, section_label, section_key, messages) and ok
        return ok

    def ValidateSchedule80G_Totals(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """Schedule 80G: section totals and overall totals cannot exceed 14 digits.
        Source: xl/vba_code.txt — Validate_80G."""
        sch = getattr(req, "Schedule80G", None)
        if sch is None:
            return True
        ok = True
        for attr, label in [
            ("TotalDonationsUs80GCash", "Total Donation in cash"),
            ("TotalDonationsUs80GOtherMode", "Total Donation in other mode"),
            ("TotalDonationsUs80G", "Total Donation"),
            ("TotalEligibleDonationsUs80G", "Total Eligible Amount of Donation"),
        ]:
            val = getattr(sch, attr, None)
            if val is not None and isinstance(val, (int, float)) and val > MAX_14_DIGITS:
                messages.append(ValidationError(field=f"Schedule80G.{attr}", message=f"* Schedule 80G: {label} cannot be greater than 14 digits"))
                ok = False
        return ok

# ============================================================================
# SCHEDULE 80E VALIDATORS (md80E.bas.bas)
# ============================================================================

    def ValidateSchedule80E(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """Validate Schedule80E. Appends ValidationError to messages like personal_info_validator. VBA: Validate_80E"""
        opt_out = str(getattr(self._get_filing_status(req), "OptOutNewTaxRegime", "") or "")
        if opt_out != "Y":
            return True
       
        def _get(obj, key, default=None):
            if obj is None:
                return default
            if isinstance(obj, dict):
                return obj.get(key, default)
            return getattr(obj, key, default)
        ok = True
        sch = getattr(req, "Schedule80E", None)
        if sch is None:
            return True
        if hasattr(sch, "model_dump"):
            sch = sch.model_dump(by_alias=True)
        if not isinstance(sch, dict):
            return True

        dtls = sch.get("Schedule80EDtls")
        if not isinstance(dtls, list):
            return True

        # Normalize LoanTknFrom for comparison (accept str "B"/"I" or enum)
        def _loan_from_ok(val: object) -> bool:
            if val is None:
                return False
            if isinstance(val, LoanTknFromEnum):
                return val in (LoanTknFromEnum.B, LoanTknFromEnum.I)
            if isinstance(val, str):
                return val.upper() in ("B", "I")
            return False

        sum_interest_80e = 0
        for i, dtl in enumerate(dtls, start=1):
            if not isinstance(dtl, dict):
                continue

            # LoanTknFrom: must be "B" or "I"
            loan_from = _get(dtl, "LoanTknFrom")
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
            loan_account_number = _get(dtl, "LoanAccNoOfBankOrInstnRefNo")
            if loan_account_number is None or loan_account_number == "" or loan_account_number == "0":
                messages.append(ValidationError(
                    field="80e.loanAccountNumber",
                    message="* Schedule 80E: Loan Account Number is mandatory",
                ))
                ok = False

            # BankOrInstnName: mandatory
            bank_name = _get(dtl, "BankOrInstnName")
            if bank_name is None:
                messages.append(ValidationError(
                    field="80e.lenderName",
                    message="* Schedule 80E: Bank or Institution Name is mandatory",
                ))
                ok = False
            elif  bank_name =="Financial Institution":
                messages.append(ValidationError(
                    field="80e.lenderName",
                    message="* Schedule 80E: Bank or Institution Name is mandatory",
                ))
                ok = False

            # DateofLoan: mandatory
            loan_date = _get(dtl, "DateofLoan")
            if not _chk_compulsory(loan_date):
                messages.append(ValidationError(
                    field="80e.loanSanctionDate",
                    message="* Schedule 80E: Date of Loan is mandatory",
                ))
                ok = False

            # Interest80E: mandatory, numeric, >= 0, <= 14 digits
            interest = _get(dtl, "Interest80E")
            if not _chk_compulsory(interest):
                messages.append(ValidationError(
                    field="80e.interestOnLoan",
                    message="* Schedule 80E: Interest u/s 80E is mandatory",
                ))
                ok = False
            elif isinstance(interest, (int, float)):
                sum_interest_80e += int(interest)
                if interest < 0:
                    messages.append(ValidationError(
                        field="80e.interestOnLoan",
                        message="* Schedule 80E: Interest u/s 80E should be Numeric, Non negative",
                    ))
                    ok = False
                if interest > MAX_14_DIGITS:
                    messages.append(ValidationError(
                        field="80e.interestOnLoan",
                        message="* Schedule 80E: Interest u/s 80E cannot exceed 14 digits",
                    ))
                    ok = False

            # Business rule: if Interest80E > 0, loan amounts should not both be 0
            if isinstance(interest, (int, float)) and interest > 0:
                total_loan = _get(dtl, "TotalLoanAmt")
                outstanding = _get(dtl, "LoanOutstndngAmt")
                total_loan_val = int(total_loan) if isinstance(total_loan, (int, float)) else 0
                outstanding_val = int(outstanding) if isinstance(outstanding, (int, float)) else 0
                if total_loan_val == 0 and outstanding_val == 0:
                    messages.append(ValidationError(
                        field="80e.loanOutstanding",
                        message="* Schedule 80E: Total loan amount or outstanding amount is required when interest u/s 80E is claimed",
                    ))
                    ok = False

        # TotalInterest80E: must equal sum of Interest80E in details, and <= 14 digits
        total = sch.get("TotalInterest80E")
        if isinstance(total, (int, float)) and total > MAX_14_DIGITS:
            messages.append(ValidationError(
                field="80e.interestOnLoan",
                message="* Schedule 80E: Total of Interest u/s 80E in schedule 80E cannot exceed 14 digits",
            ))
            ok = False
        if isinstance(total, (int, float)) and int(total) != sum_interest_80e:
            messages.append(ValidationError(
                field="80e.interestOnLoan",
                message=f"* Schedule 80E: Total Interest 80E ({total}) must equal sum of interest in details ({sum_interest_80e})",
            ))
            ok = False

# ============================================================================
# SCHEDULE 80EE VALIDATORS
# Source: xl/vba_code.txt, xl/itr1_macros.txt — Validate_80EE, Validate80EE_All.
# Sub-checks: ValidateLoanfrm_80EE, ValidateBankName_80EE, ValidateAccntNum_80EE,
# ValidateLoanDate_80EE, ValidateLoanAmt_80EE, ValidateLoanOutstanding_80EE, ValidateIntrst_80EE.
# ============================================================================

    def ValidateSchedule80EE(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """Schedule 80EE (interest on home loan): same rules as 80E on Schedule80EEDtls/Interest80EE/TotalInterest80EE.
        Source: xl/vba_code.txt — Validate_80EE, Validate80EE_All."""
        opt_out = str(getattr(self._get_filing_status(req), "OptOutNewTaxRegime", "") or "")
        if opt_out != "Y":
            return True

        def _get(obj, key, default=None):
            if obj is None:
                return default
            if isinstance(obj, dict):
                return obj.get(key, default)
            return getattr(obj, key, default)

        ok = True
        sch = getattr(req, "Schedule80EE", None)
        if sch is None:
            return True
        if hasattr(sch, "model_dump"):
            sch = sch.model_dump(by_alias=True)
        if not isinstance(sch, dict):
            return True

        dtls = sch.get("Schedule80EEDtls")
        if not isinstance(dtls, list):
            return True

        def _loan_from_ok(val: object) -> bool:
            if val is None:
                return False
            if isinstance(val, LoanTknFromEnum):
                return val in (LoanTknFromEnum.B, LoanTknFromEnum.I)
            if isinstance(val, str):
                return val.upper() in ("B", "I")
            return False

        sum_interest_80ee = 0
        for i, dtl in enumerate(dtls, start=1):
            if not isinstance(dtl, dict):
                continue

            loan_from = _get(dtl, "LoanTknFrom")
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

            loan_account_number = _get(dtl, "LoanAccNoOfBankOrInstnRefNo")
            if loan_account_number is None or loan_account_number == "" or loan_account_number == "0":
                messages.append(ValidationError(
                    field="80ee.loanAccountNumber",
                    message="* Schedule 80EE: Loan Account Number is mandatory",
                ))
                ok = False

            bank_name = _get(dtl, "BankOrInstnName")
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

            loan_date = _get(dtl, "DateofLoan")
            if not _chk_compulsory(loan_date):
                messages.append(ValidationError(
                    field="80ee.loanSanctionDate",
                    message="* Schedule 80EE: Date of Loan is mandatory",
                ))
                ok = False

            interest = _get(dtl, "Interest80EE")
            if not _chk_compulsory(interest):
                messages.append(ValidationError(
                    field="80ee.interestOnLoan",
                    message="* Schedule 80EE: Interest u/s 80EE is mandatory",
                ))
                ok = False
            elif isinstance(interest, (int, float)):
                sum_interest_80ee += int(interest)
                if interest < 0:
                    messages.append(ValidationError(
                        field="80ee.interestOnLoan",
                        message="* Schedule 80EE: Interest u/s 80EE should be Numeric, Non negative",
                    ))
                    ok = False
                if interest > MAX_14_DIGITS:
                    messages.append(ValidationError(
                        field="80ee.interestOnLoan",
                        message="* Schedule 80EE: Interest u/s 80EE cannot exceed 14 digits",
                    ))
                    ok = False

            if isinstance(interest, (int, float)) and interest > 0:
                total_loan = _get(dtl, "TotalLoanAmt")
                outstanding = _get(dtl, "LoanOutstndngAmt")
                total_loan_val = int(total_loan) if isinstance(total_loan, (int, float)) else 0
                outstanding_val = int(outstanding) if isinstance(outstanding, (int, float)) else 0
                if total_loan_val == 0 and outstanding_val == 0:
                    messages.append(ValidationError(
                        field="80ee.loanOutstanding",
                        message="* Schedule 80EE: Total loan amount or outstanding amount is required when interest u/s 80EE is claimed",
                    ))
                    ok = False

        total = sch.get("TotalInterest80EE")
        if isinstance(total, (int, float)) and total > MAX_14_DIGITS:
            messages.append(ValidationError(
                field="80ee.interestOnLoan",
                message="* Schedule 80EE: Total of Interest u/s 80EE in schedule 80EE cannot exceed 14 digits",
            ))
            ok = False
        if isinstance(total, (int, float)) and int(total) != sum_interest_80ee:
            messages.append(ValidationError(
                field="80ee.interestOnLoan",
                message=f"* Schedule 80EE: Total Interest 80EE ({total}) must equal sum of interest in details ({sum_interest_80ee})",
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

    def ValidateSchedule80EEA(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """Schedule 80EEA (interest on loan for affordable housing): PropStmpDtyVal <= 45L,
        Schedule80EEADtls (loan from, bank, account, date, amounts, Interest80EEA), TotalInterest80EEA.
        Source: VB Dump/ITR1/md80EEA.bas — Validate80EEA_All, Validate_80EEA."""
        opt_out = str(getattr(self._get_filing_status(req), "OptOutNewTaxRegime", "") or "")
        if opt_out != "Y":
            return True

        def _get(obj, key, default=None):
            if obj is None:
                return default
            if isinstance(obj, dict):
                return obj.get(key, default)
            return getattr(obj, key, default)

        ok = True
        sch = getattr(req, "Schedule80EEA", None)
        if sch is None:
            return True
        if hasattr(sch, "model_dump"):
            sch = sch.model_dump(by_alias=True)
        if not isinstance(sch, dict):
            return True

        dtls = sch.get("Schedule80EEADtls")
        if not isinstance(dtls, list):
            dtls = []
        has_dtls = len(dtls) > 0

        prop_stamp = _get(sch, "PropStmpDtyVal")
        # VBA: If Stampduty > 0 And end_80EEA = 0 Then "Please provide details..."
        if isinstance(prop_stamp, (int, float)) and prop_stamp > 0 and not has_dtls:
            messages.append(ValidationError(
                field="80eea.stampDutyValue",
                message="* Schedule 80EEA: Please provide details in respect of interest on loan taken for house property",
            ))
            ok = False
        # VBA: If end_80EEA > 0 then Stamp duty mandatory and <= 45 Lakhs
        if has_dtls:
            if not _chk_compulsory(prop_stamp):
                messages.append(ValidationError(
                    field="80eea.stampDutyValue",
                    message="* Schedule 80EEA: Stamp value of residential house property is mandatory in schedule 80EEA",
                ))
                ok = False
            elif isinstance(prop_stamp, (int, float)) and prop_stamp > 4500000:
                messages.append(ValidationError(
                    field="80eea.stampDutyValue",
                    message="* Schedule 80EEA: Stamp value of residential house property shall not be more than Rs. 45 Lakhs in schedule 80EEA",
                ))
                ok = False

        def _loan_from_ok(val: object) -> bool:
            if val is None:
                return False
            if isinstance(val, LoanTknFromEnum):
                return val in (LoanTknFromEnum.B, LoanTknFromEnum.I)
            if isinstance(val, str):
                return val.upper() in ("B", "I")
            return False

        sum_interest_80eea = 0
        for i, dtl in enumerate(dtls, start=1):
            if not isinstance(dtl, dict):
                continue

            loan_from = _get(dtl, "LoanTknFrom")
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

            loan_account_number = _get(dtl, "LoanAccNoOfBankOrInstnRefNo")
            if loan_account_number is None or loan_account_number == "" or loan_account_number == "0":
                messages.append(ValidationError(
                    field="80eea.loanAccountNumber",
                    message="* Schedule 80EEA: Loan Account Number is mandatory",
                ))
                ok = False

            bank_name = _get(dtl, "BankOrInstnName")
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

            loan_date = _get(dtl, "DateofLoan")
            if not _chk_compulsory(loan_date):
                messages.append(ValidationError(
                    field="80eea.loanSanctionDate",
                    message="* Schedule 80EEA: Date of Loan is mandatory",
                ))
                ok = False

            total_loan = _get(dtl, "TotalLoanAmt")
            if not _chk_compulsory(total_loan):
                messages.append(ValidationError(
                    field="80eea.totalLoanAmount",
                    message="* Schedule 80EEA: Total Loan Amount is mandatory",
                ))
                ok = False
            elif isinstance(total_loan, (int, float)):
                if total_loan < 0 or total_loan > MAX_14_DIGITS:
                    messages.append(ValidationError(
                        field="80eea.totalLoanAmount",
                        message="* Schedule 80EEA: Total Loan Amount should be Numeric, Non negative and cannot exceed 14 digits",
                    ))
                    ok = False

            outstanding = _get(dtl, "LoanOutstndngAmt")
            if not _chk_compulsory(outstanding):
                messages.append(ValidationError(
                    field="80eea.loanOutstanding",
                    message="* Schedule 80EEA: Loan Outstanding Amount is mandatory",
                ))
                ok = False
            elif isinstance(outstanding, (int, float)):
                if outstanding < 0 or outstanding > MAX_14_DIGITS:
                    messages.append(ValidationError(
                        field="80eea.loanOutstanding",
                        message="* Schedule 80EEA: Loan Outstanding Amount should be Numeric, Non negative and cannot exceed 14 digits",
                    ))
                    ok = False

            interest = _get(dtl, "Interest80EEA")
            if not _chk_compulsory(interest):
                messages.append(ValidationError(
                    field="80eea.interestOnLoan",
                    message="* Schedule 80EEA: Interest u/s 80EEA is mandatory",
                ))
                ok = False
            elif isinstance(interest, (int, float)):
                sum_interest_80eea += int(interest)
                if interest < 0:
                    messages.append(ValidationError(
                        field="80eea.interestOnLoan",
                        message="* Schedule 80EEA: Interest u/s 80EEA should be Numeric, Non negative",
                    ))
                    ok = False
                if interest > MAX_14_DIGITS:
                    messages.append(ValidationError(
                        field="80eea.interestOnLoan",
                        message="* Schedule 80EEA: Interest u/s 80EEA cannot exceed 14 digits",
                    ))
                    ok = False

            if isinstance(interest, (int, float)) and interest > 0:
                total_loan_val = int(total_loan) if isinstance(total_loan, (int, float)) else 0
                outstanding_val = int(outstanding) if isinstance(outstanding, (int, float)) else 0
                if total_loan_val == 0 and outstanding_val == 0:
                    messages.append(ValidationError(
                        field="80eea.loanOutstanding",
                        message="* Schedule 80EEA: Total loan amount or outstanding amount is required when interest u/s 80EEA is claimed",
                    ))
                    ok = False

        total = sch.get("TotalInterest80EEA")
        if isinstance(total, (int, float)) and total > MAX_14_DIGITS:
            messages.append(ValidationError(
                field="80eea.interestOnLoan",
                message="* Schedule 80EEA: Total of Interest u/s 80EEA in schedule 80EEA cannot exceed 14 digits",
            ))
            ok = False
        if isinstance(total, (int, float)) and int(total) != sum_interest_80eea:
            messages.append(ValidationError(
                field="80eea.interestOnLoan",
                message=f"* Schedule 80EEA: Total Interest 80EEA ({total}) must equal sum of interest in details ({sum_interest_80eea})",
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

    def ValidateSchedule80EEB(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """Schedule 80EEB (interest on electric vehicle loan): same rules as 80EE with VehicleRegNo and loan date 01/04/2019–31/03/2023.
        Source: xl/vba_code.txt — Validate_80EEB, Validate80EEB_All."""
        opt_out = str(getattr(self._get_filing_status(req), "OptOutNewTaxRegime", "") or "")
        if opt_out != "Y":
            return True

        def _get(obj, key, default=None):
            if obj is None:
                return default
            if isinstance(obj, dict):
                return obj.get(key, default)
            return getattr(obj, key, default)

        ok = True
        sch = getattr(req, "Schedule80EEB", None)
        if sch is None:
            return True
        if hasattr(sch, "model_dump"):
            sch = sch.model_dump(by_alias=True)
        if not isinstance(sch, dict):
            return True

        dtls = sch.get("Schedule80EEBDtls")
        if not isinstance(dtls, list):
            return True

        def _loan_from_ok(val: object) -> bool:
            if val is None:
                return False
            if isinstance(val, LoanTknFromEnum):
                return val in (LoanTknFromEnum.B, LoanTknFromEnum.I)
            if isinstance(val, str):
                return val.upper() in ("B", "I")
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

        sum_interest_80eeb = 0
        for i, dtl in enumerate(dtls, start=1):
            if not isinstance(dtl, dict):
                continue

            loan_from = _get(dtl, "LoanTknFrom")
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

            loan_account_number = _get(dtl, "LoanAccNoOfBankOrInstnRefNo")
            if loan_account_number is None or loan_account_number == "" or loan_account_number == "0":
                messages.append(ValidationError(
                    field="80eeb.loanAccountNumber",
                    message="* Schedule 80EEB: Loan Account Number is mandatory",
                ))
                ok = False
            elif isinstance(loan_account_number, str) and len(loan_account_number) > 20:
                messages.append(ValidationError(
                    field="80eeb.loanAccountNumber",
                    message="* Schedule 80EEB: Loan Account number should be less than or equal to 20 characters",
                ))
                ok = False

            bank_name = _get(dtl, "BankOrInstnName")
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
            elif isinstance(bank_name, str):
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

            vehicle_reg = _get(dtl, "VehicleRegNo")
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

            loan_date = _get(dtl, "DateofLoan")
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

            total_loan = _get(dtl, "TotalLoanAmt")
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
                if total_loan > MAX_14_DIGITS:
                    messages.append(ValidationError(
                        field="80eeb.totalLoanAmount",
                        message="* Schedule 80EEB: Total Loan Amount cannot exceed 14 digits",
                    ))
                    ok = False

            outstanding = _get(dtl, "LoanOutstndngAmt")
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
                if outstanding > MAX_14_DIGITS:
                    messages.append(ValidationError(
                        field="80eeb.loanOutstanding",
                        message="* Schedule 80EEB: Loan Outstanding Amount cannot exceed 14 digits",
                    ))
                    ok = False

            interest = _get(dtl, "Interest80EEB")
            if not _chk_compulsory(interest):
                messages.append(ValidationError(
                    field="80eeb.interestOnLoan",
                    message="* Schedule 80EEB: Interest u/s 80EEB is mandatory",
                ))
                ok = False
            elif isinstance(interest, (int, float)):
                sum_interest_80eeb += int(interest)
                if interest < 0:
                    messages.append(ValidationError(
                        field="80eeb.interestOnLoan",
                        message="* Schedule 80EEB: Interest u/s 80EEB should be Numeric, Non negative",
                    ))
                    ok = False
                if interest > MAX_14_DIGITS:
                    messages.append(ValidationError(
                        field="80eeb.interestOnLoan",
                        message="* Schedule 80EEB: Interest u/s 80EEB cannot exceed 14 digits",
                    ))
                    ok = False

            if isinstance(interest, (int, float)) and interest > 0:
                total_loan_val = int(total_loan) if isinstance(total_loan, (int, float)) else 0
                outstanding_val = int(outstanding) if isinstance(outstanding, (int, float)) else 0
                if total_loan_val == 0 and outstanding_val == 0:
                    messages.append(ValidationError(
                        field="80eeb.loanOutstanding",
                        message="* Schedule 80EEB: Total loan amount or outstanding amount is required when interest u/s 80EEB is claimed",
                    ))
                    ok = False

        total = sch.get("TotalInterest80EEB")
        if isinstance(total, (int, float)) and total > MAX_14_DIGITS:
            messages.append(ValidationError(
                field="80eeb.interestOnLoan",
                message="* Schedule 80EEB: Total of Interest u/s 80EEB cannot exceed 14 digits",
            ))
            ok = False
        if isinstance(total, (int, float)) and int(total) != sum_interest_80eeb:
            messages.append(ValidationError(
                field="80eeb.interestOnLoan",
                message=f"* Schedule 80EEB: Total Interest 80EEB ({total}) must equal sum of interest in details ({sum_interest_80eeb})",
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

    def ValidateSchedule80DD(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """Schedule 80DD (deduction for maintenance of disabled dependent): NatureOfDisability, TypeOfDisability,
        DeductionAmount, DependentType, PAN, Aadhaar, Form 10IA ack, UDID. Single object per return.
        Source: VB Dump/ITR1/Sch80U_DD.bas — Validate80DD, Validate80DD_1."""
        def _get(obj, key, default=None):
            if obj is None:
                return default
            if isinstance(obj, dict):
                return obj.get(key, default)
            return getattr(obj, key, default)

        def _alphanumeric_only(s: str) -> bool:
            """VBA checkfieldspecialcharacter: alphanumeric only."""
            return bool(s and re.match(r"^[a-zA-Z0-9]+$", s))

        def _udid_no_special(s: str) -> bool:
            """VBA checkfieldspecialcharacterUDID: alphanumeric only for UDID."""
            return bool(s and re.match(r"^[a-zA-Z0-9]+$", s))

        ok = True
        sch = getattr(req, "Schedule80DD", None)
        if sch is None:
            return True
        if hasattr(sch, "model_dump"):
            sch = sch.model_dump(by_alias=True)
        if not isinstance(sch, dict):
            return True

        # Field names aligned with FIELD_WIDGET_MAP (disabilityDependant widget):
        # 80dd.disabilityType, 80dd.expenditureIncurred, relationToDependant, dependantName
        # Unmapped fields (form10IAAckNum, udidNum, dependentPan, dependentAadhaar) use 80dd.disabilityType
        # so errors open the disabilityDependant widget.

        # ValidateNature_disability_80DD
        nature = _get(sch, "NatureOfDisability")
        if _isdropdownblank(nature) or (isinstance(nature, str) and nature.upper() == "SELECT"):
            messages.append(ValidationError(
                field="80dd.disabilityType",
                message="* Schedule 80DD: Please select one of the dropdown in 'Nature of disability' in Schedule 80DD",
            ))
            ok = False

        # ValidateType_disability_80DD
        type_dis = _get(sch, "TypeOfDisability")
        if type_dis is None or type_dis == "" or (isinstance(type_dis, str) and type_dis.strip() == "(Select)"):
            messages.append(ValidationError(
                field="80dd.disabilityType",
                message="* Schedule 80DD: Selection of \"Type of disability\" in schedule 80DD is mandatory.",
            ))
            ok = False

        # ValidateAmount_of_deduction_80DD (when amount <> 0) -> 80dd.expenditureIncurred
        amt = _get(sch, "DeductionAmount")
        if amt is not None and amt != 0:
            if not _chk_compulsory(amt):
                messages.append(ValidationError(
                    field="80dd.expenditureIncurred",
                    message="* Schedule 80DD: Please enter Amount of deduction in Schedule 80DD",
                ))
                ok = False
            elif isinstance(amt, (int, float)):
                if amt < 0:
                    messages.append(ValidationError(
                        field="80dd.expenditureIncurred",
                        message="* Schedule 80DD: Amount of deduction should be Numeric, Non negative",
                    ))
                    ok = False
                if amt > MAX_14_DIGITS:
                    messages.append(ValidationError(
                        field="80dd.expenditureIncurred",
                        message="* Schedule 80DD: Amount of deduction in Schedule 80DD cannot exceed 14 digits",
                    ))
                    ok = False

        # ValidateTypedependent_80DD -> relationToDependant
        dep_type = _get(sch, "DependentType")
        if _isdropdownblank(dep_type) or (isinstance(dep_type, str) and dep_type.upper() == "SELECT"):
            messages.append(ValidationError(
                field="relationToDependant",
                message="* Schedule 80DD: Please select one of the dropdown in 'Type of dependent' in schedule 80DD",
            ))
            ok = False

        # ValidateAckNoFm10IAfiled_80DD (no map key -> 80dd.disabilityType for same widget)
        ack_no = _get(sch, "Form10IAAckNum")
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

        # ValidateUDIDNum_80DD (no map key -> 80dd.disabilityType for same widget)
        udid = _get(sch, "UDIDNum")
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

        # ValidatePANdependent_80DD (no map key -> 80dd.disabilityType for same widget)
        pan_dep = _get(sch, "DependentPan")
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
                personal_info = req.PersonalInfo
                assessee_pan = (getattr(personal_info, "PAN", None) or "")
                if assessee_pan:
                    assessee_pan = decrypt_pan(str(assessee_pan).strip())
                if assessee_pan and s_pan == (assessee_pan or "").upper():
                    messages.append(ValidationError(
                        field="80dd.disabilityType",
                        message="* Schedule 80DD: PAN of the dependent cannot be same as assessee PAN in Part-A General Information.",
                    ))
                    ok = False

        # ValidateAadhaardependent_80DD (no map key -> 80dd.disabilityType for same widget)
        aadhaar_dep = _get(sch, "DependentAadhaar")
        if aadhaar_dep is not None and str(aadhaar_dep).strip():
            s_aad = str(aadhaar_dep).strip()
            if not _alphanumeric_only(s_aad):
                messages.append(ValidationError(
                    field="80dd.disabilityType",
                    message="* Schedule 80DD: Invalid Aadhaar in Schedule 80DD.",
                ))
                ok = False
            else:
                personal_info = req.PersonalInfo
                assessee_aadhaar = str(getattr(personal_info, "AadhaarCardNo", None) or "").strip()
                if assessee_aadhaar and s_aad == assessee_aadhaar:
                    messages.append(ValidationError(
                        field="80dd.disabilityType",
                        message="* Schedule 80DD: Aadhar of the dependent cannot be same as assessee Aaadhar in Part-A General Information.",
                    ))
                    ok = False
                if not self._check_aadhaar_format(s_aad):
                    messages.append(ValidationError(
                        field="80dd.disabilityType",
                        message="* Schedule 80DD: Invalid Aadhaar in Schedule 80DD.",
                    ))
                    ok = False

        # VBA: Acknowledgement number of Form 10IA filed for self and Dependent can't be same (80DD vs 80U)
        ack_80u = None
        sch80u = getattr(req, "Schedule80U", None)
        if sch80u is not None:
            if hasattr(sch80u, "model_dump"):
                sch80u = sch80u.model_dump(by_alias=True)
            if isinstance(sch80u, dict):
                ack_80u = sch80u.get("Form10IAAckNum")
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

    def ValidateSchedule80U(self, req: ITR1, messages: list[ValidationError]) -> bool:
        """Schedule 80U (deduction for self with disability): NatureOfDisability, TypeOfDisability,
        DeductionAmount, Form10IAAckNum, UDIDNum. Single object per return.
        Source: VB Dump/ITR1/Sch80U_DD.bas — Validate80U, Validate80U_1."""
        def _get(obj, key, default=None):
            if obj is None:
                return default
            if isinstance(obj, dict):
                return obj.get(key, default)
            return getattr(obj, key, default)

        def _alphanumeric_only(s: str) -> bool:
            """VBA checkfieldspecialcharacter: alphanumeric only."""
            return bool(s and re.match(r"^[a-zA-Z0-9]+$", s))

        def _udid_no_special(s: str) -> bool:
            """VBA checkfieldspecialcharacterUDID: alphanumeric only for UDID."""
            return bool(s and re.match(r"^[a-zA-Z0-9]+$", s))

        ok = True
        sch = getattr(req, "Schedule80U", None)
        if sch is None:
            return True
        if hasattr(sch, "model_dump"):
            sch = sch.model_dump(by_alias=True)
        if not isinstance(sch, dict):
            return True

        # ValidateNature_disability_80U -> 80u.disabilityType
        nature = _get(sch, "NatureOfDisability")
        if _isdropdownblank(nature) or (isinstance(nature, str) and nature.upper() == "SELECT"):
            messages.append(ValidationError(
                field="80u.disabilityType",
                message="* Schedule 80U: Please select one of the dropdown in 'Nature of disability' in Schedule 80U",
            ))
            ok = False

        # ValidateType_disability_80U -> 80u.disabilityType
        type_dis = _get(sch, "TypeOfDisability")
        if type_dis is None or type_dis == "" or (isinstance(type_dis, str) and type_dis.strip() == "(Select)"):
            messages.append(ValidationError(
                field="80u.disabilityType",
                message="* Schedule 80U: Selection of \"Type of disability\" in schedule 80U is mandatory.",
            ))
            ok = False

        # ValidateAmount_of_deduction_80U -> 80u.expenditureIncurred (mandatory in 80U)
        amt = _get(sch, "DeductionAmount")
        if not _chk_compulsory(amt):
            messages.append(ValidationError(
                field="80u.expenditureIncurred",
                message="* Schedule 80U: Please enter Amount of deduction in Schedule 80U",
            ))
            ok = False
        elif isinstance(amt, (int, float)):
            if amt < 0:
                messages.append(ValidationError(
                    field="80u.expenditureIncurred",
                    message="* Schedule 80U: Amount of deduction should be Numeric, Non negative",
                ))
                ok = False
            if amt > MAX_14_DIGITS:
                messages.append(ValidationError(
                    field="80u.expenditureIncurred",
                    message="* Schedule 80U: Amount of deduction in Schedule 80U cannot exceed 14 digits",
                ))
                ok = False

        # ValidateAckNoFm10IAfiled_80U -> 80u.disabilityType
        ack_no = _get(sch, "Form10IAAckNum")
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
        udid = _get(sch, "UDIDNum")
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
        sch80dd = getattr(req, "Schedule80DD", None)
        ack_80dd = None
        if sch80dd is not None:
            if hasattr(sch80dd, "model_dump"):
                sch80dd = sch80dd.model_dump(by_alias=True)
            if isinstance(sch80dd, dict):
                ack_80dd = sch80dd.get("Form10IAAckNum")
        if ack_no is not None and str(ack_no).strip() and ack_80dd is not None and str(ack_80dd).strip():
            if str(ack_no).strip() == str(ack_80dd).strip():
                messages.append(ValidationError(
                    field="80u.disabilityType",
                    message="* Schedule 80U: Acknowledgement number of Form 10IA filed for self and Dependent can't be same. Please provide proper acknowledgement number",
                ))
                ok = False

        return ok


