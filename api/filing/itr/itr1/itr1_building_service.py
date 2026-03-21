"""
ITR1 Building Service - Main orchestrator for building ITR1 sections.
Delegates to specialized services for income and deductions.
"""
import logging
from datetime import datetime
from typing import Any, Dict, Optional, cast

from filing.utils.tax_filing_helpers import compute_age
from filing.utils.master_data_service import MasterDataService

from filing.itr.itr1.models.filing_build_itr1_return_model import FilingBuildItr1ReturnModel
from filing.itr.itr1.models.itr1_model import (
    ITR1,
    AccountType,
    BankAccountDtlsModel,
    BankDetailTypeModel,
    CapacityEnum,
    CollectedYrEnum,
    CreationInfoModel,
    EmployerCategoryEnum,
    EmployerOrDeductorOrCollectDetlModel,
    FilingStatusModel,
    FormITR1Model,
    ReturnFileSecEnum,
    IntrstPayModel,
    ITR1IncomeDeductionsModel,
    ITR1TaxComputationModel,
    LTCG112AModel,
    PersonalInfoModel,
    RefundModel,
    Schedule80EEAModel,
    Schedule80EEBModel,
    Schedule80EEModel,
    Schedule80GModel,
    ScheduleTCSModel,
    TC,
    TaxPaidModel,
    TaxPaymentModel,
    TaxPaymentsModel,
    TaxesPaidModel,
    TDSonOthThanSalModel,
    TDSonOthThanSalsModel,
    TDSonSalaryModel,
    TDSonSalariesModel,
    VerificationModel,
)
from filing.models.filing_model import FilingModel
from filing.itr.models.income_only_result import IncomeOnlyResult
from filing.tax_calculation.models.tax_regime_breakdown import TaxRegimeBreakdownModel
from filing.itr.itr1.itr1_income_builder_service import Itr1IncomeBuilderService
from filing.itr.itr1.itr1_deduction_builder_service import Itr1DeductionBuilderService, Itr1ComputationContext
from filing.itr.validations.tax_validation_service import TaxValidationService
from filing.tax_calculation.interest_234_service import Interest234Service

logger = logging.getLogger(__name__)
class Itr1BuildingService:
    """Service for building ITR1 sections from FilingModel."""

    # Component IDs from salary_section_171_component: 8=BASIC, 9=DA, 11=HRA (component_type 1=salary, 2=allowance)
    _EA10_13A_BASIC_ID = 8
    _EA10_13A_DA_ID = 9
    _EA10_13A_HRA_ID = 11
    _SECTION_80C_80CCC_MAX_ALLOWED = 150000
    _SECTION_80CCD1B_MAX_ALLOWED = 50000
    _SECTION_80D_SELF_AND_FAMILY_NOT_SENIOR_MAX_ALLOWED = 25000
    _SECTION_80D_PARENTS_NOT_SENIOR_MAX_ALLOWED = 25000
    _SECTION_80D_SELF_AND_FAMILY_SENIOR_MAX_ALLOWED = 50000
    _SECTION_80D_PARENTS_SENIOR_MAX_ALLOWED = 50000
    _SECTION_80TTA_MAX_ALLOWED = 1000
    _SECTION_80TTB_MAX_ALLOWED = 1000
    _SECTION_80CCH_MAX_ALLOWED = 288000
    _SECTION_80GG_MAX_ALLOWED = 60000
    itr1:ITR1 |None= None
    def __init__(self) -> None:
        pass
    async def build_itr(self, filing: FilingModel) -> IncomeOnlyResult:
        """
        Phase 1: Map filing → ITR1, build income / deduction sections for BOTH
        regimes (without tax computation).

        Stores the mapped dict and built regime objects internally so
        finalize_with_precomputed_tax() can use them without rebuilding.
        """
        # Build new regime (no tax)
        self.itr1 = ITR1()
        await self._build_itr_for_regime(filing, "new")
        self._new_itr1_no_tax = self.itr1
        new_gross_income = int(getattr(self.itr1.ITR1_IncomeDeductions, "GrossTotIncome", 0) or 0)
        new_deductions = int(
            getattr(
                getattr(self.itr1.ITR1_IncomeDeductions, "DeductUndChapVIA", None),
                "TotalChapVIADeductions", 0,
            ) or 0
        )
        new_income_breakdown = getattr(self, "_income_breakdown", None)

        # Build old regime (no tax)
        self.itr1 = ITR1()
        await self._build_itr_for_regime(filing, "old")
        self._old_itr1_no_tax = self.itr1
        old_deductions = int(
            getattr(
                getattr(self.itr1.ITR1_IncomeDeductions, "DeductUndChapVIA", None),
                "TotalChapVIADeductions", 0,
            ) or 0
        )
        old_gross_income = int(getattr(self.itr1.ITR1_IncomeDeductions, "GrossTotIncome", 0) or 0)
        old_income_breakdown = getattr(self, "_income_breakdown", None)


        return IncomeOnlyResult(
            new_gross_income=new_gross_income,
            new_regime_deductions=new_deductions,
            old_gross_income=old_gross_income,
            old_regime_deductions=old_deductions,
            old_income_breakdown=old_income_breakdown,
            new_income_breakdown=new_income_breakdown
            )

    async def finalize_with_precomputed_tax(self, filing: FilingModel) -> FilingBuildItr1ReturnModel:
        """
        Phase 2 (orchestrator-driven): Finalise ITR1 using tax already computed
        by the orchestrator and stored in filing.tax_computation.

        Must be called after build_itr() and after the orchestrator
        has called ItrBuildingOrchestrator._compute_tax_for_regime() for both
        regimes.
        """
        assert hasattr(self, "_new_itr1_no_tax") and hasattr(self, "_old_itr1_no_tax"), (
            "finalize_with_precomputed_tax must be called after build_itr"
        )
        assert filing.tax_computation is not None, (
            "filing.tax_computation must be populated before finalize_with_precomputed_tax"
        )

        # Attach the pre-computed tax model to each regime's ITR1 object
        tax_model = self._to_itr1_tax_computation_model(filing.tax_computation.current_regime, filing)
        self._new_itr1_no_tax.ITR1_TaxComputation = tax_model
        self._old_itr1_no_tax.ITR1_TaxComputation = tax_model

        is_old = filing.tax_computation.current_regime.regime == "old"
        self.itr1 = self._old_itr1_no_tax if is_old else self._new_itr1_no_tax

        self.itr1.FilingStatus = self.build_filing_status(filing, self.itr1.FilingStatus)
        self.itr1.Refund = self.build_refund(filing)
        self.itr1.Verification = self.build_verification(filing, self.itr1.Verification)
        self.itr1.TaxPaid = self.build_tax_paid(filing)
        print('DEBUG: ITR1 (orchestrator-driven tax)', filing.filing_id)
        filing.user_validation_errors = await TaxValidationService().get_user_validation_errors(filing, self.itr1)
       
        return FilingBuildItr1ReturnModel(itr1=self.itr1, filingSummary=filing)

    
    async def _build_itr_for_regime(self, filing: FilingModel, regime: str) -> None:
            """Build and merge all complex sections into payload. Each builder merges its model into payload."""
            assert self.itr1 is not None, "_build_itr_for_regime must be called after self.itr1 is set"
            
            # CreationInfo
            self.itr1.CreationInfo = self.build_creation_info(self.itr1.CreationInfo)
            # Form_ITR1
            self.itr1.Form_ITR1 = self.build_form_itr1(filing, self.itr1.Form_ITR1)
            # PersonalInfo (async)
            self.itr1.PersonalInfo = await self.build_personal_info(filing, self.itr1.PersonalInfo)
            # FilingStatus
           
            
            # Income and Deductions (delegates to specialized services)
            self.itr1.ITR1_IncomeDeductions, schedules = await self.build_income_deductions(
                filing, self.itr1.ITR1_IncomeDeductions, regime
                )
            
            if schedules:
                self.itr1.Schedule80G = schedules["Schedule80G"]
                self.itr1.Schedule80GGA = schedules["Schedule80GGA"]
                self.itr1.Schedule80GGC = schedules["Schedule80GGC"]
                self.itr1.Schedule80D = schedules["Schedule80D"]
                self.itr1.Schedule80U = schedules["Schedule80U"]
                self.itr1.Schedule80E = schedules["Schedule80E"]
                self.itr1.Schedule80EE = schedules["Schedule80EE"]
                self.itr1.Schedule80EEB = schedules["Schedule80EEB"]              
                self.itr1.Schedule80C = schedules["Schedule80C"]
                       
               
            # LTCG 112A (capital gains from listed equity / MF / RSU with STT)
            ltcg_model, ltcg_amount = self.build_ltcg_112a(filing)
            self.itr1.LTCG112A = ltcg_model

            # Update GrossTotIncomeIncLTCG112A = GrossTotIncome + LongCap112A
            gross_tot_income = int(getattr(self.itr1.ITR1_IncomeDeductions, "GrossTotIncome", 0) or 0)
            self.itr1.ITR1_IncomeDeductions.GrossTotIncomeIncLTCG112A = gross_tot_income + ltcg_amount

            # Tax Payments
            self.itr1.TaxPayments = self.build_tax_payments(filing, self.itr1.TaxPayments)

            # TDS / TCS schedules
            self.itr1.TDSonSalaries, self.itr1.TDSonOthThanSals = self.build_tds(filing)
            self.itr1.ScheduleTCS = self.build_tcs(filing)  
            
    @staticmethod
    def _dict_or_none(value: Any) -> Optional[Dict[str, Any]]:
        """Check if value is a dict or None."""
        if isinstance(value, dict):
            return cast(Dict[str, Any], value)
        return None
       
    def _prune_empty_schedules(self, filing: FilingModel ) -> None:
        """Remove empty optional schedules from payload."""
        assert self.itr1 is not None, "prune_empty_schedules must be called after self.itr1 is set in build_itr_sections"
        sch80c = self._dict_or_none(self.itr1.Schedule80C)
        if sch80c is None or not sch80c.get("Schedule80CDtls"):
            self.itr1.Schedule80C = None

        sch80e = self._dict_or_none(self.itr1.Schedule80E)
        if sch80e is None or not sch80e.get("Schedule80EDtls"):
            self.itr1.Schedule80E = None

        sch80gga = self.itr1.Schedule80GGA
        if sch80gga is None:
            self.itr1.Schedule80GGA = None
        elif isinstance(sch80gga, dict):
            if not sch80gga.DonationDtlsSciRsrchRuralDev:
                self.itr1.Schedule80GGA = None
        else:
            # Schedule80GGAModel
            if not (sch80gga.DonationDtlsSciRsrchRuralDev or []):
                self.itr1.Schedule80GGA = None
        sch80ggc = self._dict_or_none(self.itr1.Schedule80GGC)
        if sch80ggc is None or not sch80ggc.get("Schedule80GGCDetails"):
            self.itr1.Schedule80GGC = None

        schus24b = self._dict_or_none(self.itr1.ScheduleUs24B)
        if schus24b is None or not schus24b.get("ScheduleUs24BDtls"):
            self.itr1.ScheduleUs24B = None

        sch80g = self._dict_or_none(self.itr1.Schedule80G)
        if filing.section_80g and sch80g is not None:
            don100 = self._dict_or_none(sch80g.get("Don100Percent"))
            donee100 = don100.get("DoneeWithPan") if don100 is not None else None
            if not donee100:
                sch80g.pop("Don100Percent", None)

            don50 = self._dict_or_none(sch80g.get("Don50PercentNoApprReqd"))
            donee50 = don50.get("DoneeWithPan") if don50 is not None else None
            if not donee50:
                sch80g.pop("Don50PercentNoApprReqd", None)

            self.itr1.Schedule80G = Schedule80GModel.model_validate(sch80g)
        else:
            self.itr1.Schedule80G = None

        if not filing.tds:
            self.itr1.TDSonSalaries = None
        if not filing.tcs:
            self.itr1.ScheduleTCS = None
        if not filing.advance_tax:
            self.itr1.TaxPayments = None
        if not filing.section_80dd:
            self.itr1.Schedule80DD = None
        if not filing.section_80u:
            self.itr1.Schedule80U = None
        if not filing.section_80ee:
            self.itr1.Schedule80EE = None
        if not filing.section_80eea:
            self.itr1.Schedule80EEA = None
        if not filing.section_80eeb:
            self.itr1.Schedule80EEB = None
        if not filing.section_80d or not (filing.section_80d.health_insurance or filing.section_80d.preventive_checkup or filing.section_80d.medical_expenditure):
            self.itr1.Schedule80D = None
        if not filing.salary or not any((sal.salary_section_171 or []) for sal in filing.salary):
            self.itr1.ScheduleEA10_13A = None
        if not filing.section_80ee:
            self.itr1.Schedule80EE = None
        else:
            # Ensure Schedule80EE has required list field if schedule exists
            sch80ee = self._dict_or_none(self.itr1.Schedule80EE)
            if sch80ee is not None:
                if "Schedule80EEDtls" not in sch80ee or not isinstance(sch80ee.get("Schedule80EEDtls"), list):
                    sch80ee["Schedule80EEDtls"] = []
                self.itr1.Schedule80EE = Schedule80EEModel.model_validate(sch80ee)   
        
        if not filing.section_80eea:
            self.itr1.Schedule80EEA = None
        else:
            # Ensure Schedule80EEA has required fields if schedule exists
            sch80eea = self._dict_or_none(self.itr1.Schedule80EEA)
            if sch80eea is not None:
                if "Schedule80EEADtls" not in sch80eea or not isinstance(sch80eea.get("Schedule80EEADtls"), list):
                    sch80eea["Schedule80EEADtls"] = []
                if "PropStmpDtyVal" not in sch80eea:
                    sch80eea["PropStmpDtyVal"] = 0
                self.itr1.Schedule80EEA = Schedule80EEAModel.model_validate(sch80eea)
        
        if not filing.section_80eeb:
            self.itr1.Schedule80EEB = None
        else:
            # Ensure Schedule80EEB has required list field if schedule exists
            sch80eeb = self._dict_or_none(self.itr1.Schedule80EEB)
            if sch80eeb is not None:
                if "Schedule80EEBDtls" not in sch80eeb or not isinstance(sch80eeb.get("Schedule80EEBDtls"), list):
                    sch80eeb["Schedule80EEBDtls"] = []
                self.itr1.Schedule80EEB = Schedule80EEBModel.model_validate(sch80eeb)
    
    def build_creation_info(self, creation_info: CreationInfoModel) -> CreationInfoModel:
        """Build CreationInfo section: use passed creation_info, add/update JSONCreationDate and IntermediaryCity."""
        creation_info.JSONCreationDate = datetime.now().strftime("%Y-%m-%d")
        creation_info.IntermediaryCity = "Hyderabad"
        return creation_info

    def build_filing_status(
        self,
        filing: FilingModel,
        filing_status: FilingStatusModel,
        return_file_sec: int = 11,
        itr_filing_due_date: str | None = None,
    ) -> FilingStatusModel:
        """Build FilingStatus section: use passed filing_status, add/update OptOutNewTaxRegime."""

        is_old_regime = (
            filing.tax_computation is not None and filing.tax_computation.current_regime.regime == "old"
        )

        if not itr_filing_due_date:
            itr_filing_due_date = self._itr_due_date_from_ay(getattr(filing, "assessment_year", None))

        filing_status.ReturnFileSec = ReturnFileSecEnum(return_file_sec)
        filing_status.ItrFilingDueDate = itr_filing_due_date
        filing_status.OptOutNewTaxRegime = "Y" if is_old_regime else "N"
        return filing_status

    
    def _itr_due_date_from_ay(self, assessment_year: str | None) -> str:
        ay = (assessment_year or "").strip()
        head = ay.split("-")[0].strip() if "-" in ay else ay
        year = head[:4] if len(head) >= 4 else "2025"
        if not year.isdigit():
            year = "2025"
        return f"{year}-07-31"
    
    def build_form_itr1(self, filing: FilingModel, form_itr1: FormITR1Model) -> FormITR1Model:
        """Build Form_ITR1 section: update AssessmentYear (4-digit)."""
        ay = filing.assessment_year or "2026"
        if "-" in ay:
            ay = ay.split("-")[0]
        form_itr1.AssessmentYear = ay[:4] if len(ay) >= 4 else "2026"
        return form_itr1
    

    async def build_personal_info(self, filing: FilingModel, personal_info: PersonalInfoModel) -> PersonalInfoModel:
        """Build PersonalInfo: set all fields from filing."""
        person = filing.person
        if person is not None:
            if person.first_name:
                personal_info.AssesseeName.FirstName = person.first_name
            if person.middle_name:
                personal_info.AssesseeName.MiddleName = person.middle_name
            if person.last_name:
                personal_info.AssesseeName.SurNameOrOrgName = person.last_name
            if person.pan_number:
                personal_info.PAN = person.pan_number
            if person.aadhaar_number:
                personal_info.AadhaarCardNo = person.aadhaar_number
            if person.date_of_birth:
                dob = person.date_of_birth
                personal_info.DOB = dob.isoformat() if hasattr(dob, "isoformat") else str(dob)
            if person.email:
                personal_info.Address.EmailAddress = person.email
            if person.mobile_number:
                personal_info.Address.MobileNo = self._to_int(person.mobile_number)

        if filing.salary and len(filing.salary) > 0:
            first_salary = filing.salary[0]
            if first_salary.employer and first_salary.employer.employer_type:
                ec = first_salary.employer.employer_type
                if ec in ["CGOV", "SGOV", "PSU", "PE", "PESG", "PEPS", "PEO", "OTH", "NA"]:
                    personal_info.EmployerCategory = EmployerCategoryEnum(ec)

        if filing.person_address:
            addr = filing.person_address
            if addr.flat_door_no:
                personal_info.Address.ResidenceNo = addr.flat_door_no
            if addr.premise_name:
                personal_info.Address.ResidenceName = addr.premise_name
            if addr.street:
                personal_info.Address.RoadOrStreet = addr.street
            if addr.area_locality:
                personal_info.Address.LocalityOrArea = addr.area_locality
            if addr.pincode:
                personal_info.Address.PinCode = self._to_int(addr.pincode)

            master_data_service = MasterDataService()
            states_list = master_data_service.get_states()
            countries_list = master_data_service.get_countries()
            state_label_to_code = {str(r["label"]).strip(): str(r["value"]) for r in (states_list or [])}
            country_label_to_code = {str(r["label"]).strip(): str(r["value"]) for r in (countries_list or [])}
            state_codes = {str(r["value"]) for r in (states_list or [])}
            country_codes = {str(r["value"]) for r in (countries_list or [])}
            city = (addr.city or "").strip() or None
            state_raw = (addr.state or "").strip() or None
            country_raw = (addr.country or "").strip() or None
            state_code = state_label_to_code.get(state_raw) or (state_raw if state_raw in state_codes else None) if state_raw else None
            country_code = country_label_to_code.get(country_raw) or (str(country_raw) if str(country_raw) in country_codes else None) if country_raw else None
            if city:
                personal_info.Address.CityOrTownOrDistrict = city
            if state_code:
                personal_info.Address.StateCode = state_code
            if country_code is not None:
                personal_info.Address.CountryCode = country_code

        return personal_info

    

    @staticmethod
    def _to_itr1_tax_computation_model(
        regime: TaxRegimeBreakdownModel,
        filing: Optional[FilingModel] = None,
    ) -> ITR1TaxComputationModel:
        """Map TaxRegimeBreakdownModel → ITR1TaxComputationModel with 234 interest."""
        net_tax_liability = int(regime.total_tax_liability or 0)

        # ── Compute interest u/s 234A/B/C and late fee 234F ──
        interest = None
        if filing is not None and net_tax_liability > 0:
            dob = filing.person.date_of_birth if filing.person else None
            age = compute_age(dob, filing.assessment_year or "2026-27") if dob else 30
            _rs = (filing.person.residential_status or "") if filing.person else ""
            interest = Interest234Service().calculate(
                net_tax_liability=net_tax_liability,
                tds=int(regime.tds or 0),
                tcs=int(regime.tcs or 0),
                advance_tax_payments=filing.advance_tax or [],
                age=age,
                assessment_year=filing.assessment_year or "2026-27",
                total_income=int(regime.total_income or 0),
                is_resident=_rs.upper().startswith("RES"),
            )

        i234a = interest.interest_234a if interest else 0
        i234b = interest.interest_234b if interest else 0
        i234c = interest.interest_234c if interest else 0
        f234f = interest.late_fee_234f if interest else 0
        total_interest = i234a + i234b + i234c + f234f

        if filing is not None:
            filing.tax_intrest = int(total_interest)

        return ITR1TaxComputationModel(
            TotalTaxPayable=int(regime.tax_before_rebate or 0),
            Rebate87A=int(regime.rebate_87a or 0),
            TaxPayableOnRebate=int(regime.tax_after_rebate or 0),
            EducationCess=int(regime.health_education_cess or 0),
            GrossTaxLiability=net_tax_liability,
            Section89=0,
            NetTaxLiability=net_tax_liability,
            TotalIntrstPay=total_interest,
            TotTaxPlusIntrstPay=net_tax_liability + total_interest,
            IntrstPay=IntrstPayModel(
                IntrstPayUs234A=i234a,
                IntrstPayUs234B=i234b,
                IntrstPayUs234C=i234c,
                LateFilingFee234F=f234f,
            ),
        )    

  
   
    def _map_account_type(self,raw: str | None) -> AccountType:
        """Map a raw account-type string to the AccountType enum.

        Accepts both short codes (SB, CA, CC, OD, NRO, OTH) and
        full display names (case-insensitive). Falls back to OTH.
        """
        _LABEL_MAP: dict[str, AccountType] = {
            "SAVINGS": AccountType.SB,
            "SAVINGS ACCOUNT": AccountType.SB,
            "CURRENT": AccountType.CA,
            "CURRENT ACCOUNT": AccountType.CA,
            "CASH CREDIT": AccountType.CC,
            "CASH CREDIT ACCOUNT": AccountType.CC,
            "OVER DRAFT": AccountType.OD,
            "OVERDRAFT": AccountType.OD,
            "OVER DRAFT ACCOUNT": AccountType.OD,
            "NON RESIDENT": AccountType.NRO,
            "NON RESIDENT ACCOUNT": AccountType.NRO,
            "NRO": AccountType.NRO,
            "OTHER": AccountType.OTH,
            "OTHERS": AccountType.OTH,
        }
        if not raw:
            return AccountType.OTH
        code = raw.strip().upper()
        if code in {e.value for e in AccountType}:
            return AccountType(code)
        return _LABEL_MAP.get(code, AccountType.OTH)

    def build_refund(self, filing: FilingModel) -> RefundModel:
        """Build Refund section: use passed refund if any, set RefundDue and BankAccountDtls from filing."""
        
        model= RefundModel.model_construct()

        bank_details: list[BankDetailTypeModel] = []
        if filing.bank_account:
            for acc in filing.bank_account:
                bank_details.append(BankDetailTypeModel.model_validate({
                    "IFSCCode": acc.ifsc_code,
                    "BankName": acc.bank_name ,
                    "BankAccountNo": acc.account_number or "1",
                    "AccountType_1": self._map_account_type(acc.account_type),
                    "UseForRefund": "true" if acc.is_primary else "false",
                }))

        if not bank_details:
            bank_details = [BankDetailTypeModel.model_validate({
                "IFSCCode": "NA",
                "BankName": "NA",
                "BankAccountNo": "1",
                "AccountType_1": AccountType.OTH,
                "UseForRefund": "true",
            })]

        model.RefundDue = self._to_int(getattr(filing.tax_computation.current_regime, "refund", None)) if filing.tax_computation and filing.tax_computation.current_regime else 0
        model.BankAccountDtls = BankAccountDtlsModel(AddtnlBankDetails=bank_details)

        return model

    def build_verification(self, filing: FilingModel, verification: VerificationModel) -> VerificationModel:
        """Build Verification section: use passed verification if any, set Declaration/Capacity/Place from filing."""
        from filing.itr.itr1.models.itr1_model import DeclarationModel

        person = filing.person
        if person is not None:
            name = " ".join(p for p in [person.first_name or "", person.middle_name or "", person.last_name or ""] if p).strip() or "NA"
            father = (person.father_name or "").strip() or "NA"
            pan = (person.pan_number or "").strip() or "NA"
        else:
            name = father = pan = "NA"
        city = (filing.person_address.city or "").strip() or "Delhi" if filing.person_address else "Delhi"

        verification.Declaration = DeclarationModel(
            AssesseeVerName=name,
            FatherName=father,
            AssesseeVerPAN=pan,
        )
        verification.Capacity = CapacityEnum.S
        verification.Place = city
        return verification

    async def build_income_deductions(
        self, filing: FilingModel, income_deductions: ITR1IncomeDeductionsModel, regime: str
    ) -> tuple[ITR1IncomeDeductionsModel, dict[str, Any]]:
        """Build ITR1_IncomeDeductions by combining income and deductions parts using specialized services."""
        context = Itr1ComputationContext()

        income_service = Itr1IncomeBuilderService()
        income_part = await income_service.build_income(filing, context, regime)
        self._income_breakdown = income_service.income_breakdown

        context.gross_salary = self._to_int(getattr(income_part, "GrossSalary", None)) if income_part else 0
        deduction_service = Itr1DeductionBuilderService()
        deductions_part, schedules = deduction_service.build_deductions(
            filing,
            self._to_int(getattr(income_part, "GrossTotIncome", None)) if income_part else 0,
            regime,
            context,
        )

        # Copy income fields directly onto income_deductions
        income_deductions.GrossSalary = self._to_int(getattr(income_part, "GrossSalary", None))
        income_deductions.Salary = self._to_int(getattr(income_part, "Salary", None))
        income_deductions.PerquisitesValue = self._to_int(getattr(income_part, "PerquisitesValue", None))
        income_deductions.ProfitsInSalary = self._to_int(getattr(income_part, "ProfitsInSalary", None))
        income_deductions.IncomeNotified89AType = income_part.IncomeNotified89AType
        income_deductions.AllwncExemptUs10 = income_part.AllwncExemptUs10
        income_deductions.Increliefus89A = self._to_int(getattr(income_part, "Increliefus89A", None))
        income_deductions.Increliefus89AOS = self._to_int(getattr(income_part, "Increliefus89AOS", None))
        income_deductions.NetSalary = self._to_int(getattr(income_part, "NetSalary", None))
        income_deductions.DeductionUs16 = self._to_int(getattr(income_part, "DeductionUs16", None))
        income_deductions.DeductionUs16ia = self._to_int(getattr(income_part, "DeductionUs16ia", None))
        income_deductions.EntertainmentAlw16ii = self._to_int(getattr(income_part, "EntertainmentAlw16ii", None))
        income_deductions.ProfessionalTaxUs16iii = self._to_int(getattr(income_part, "ProfessionalTaxUs16iii", None))
        income_deductions.IncomeFromSal = self._to_int(getattr(income_part, "IncomeFromSal", None))
        income_deductions.TypeOfHP = income_part.TypeOfHP
        income_deductions.GrossRentReceived = self._to_int(getattr(income_part, "GrossRentReceived", None))
        income_deductions.TaxPaidlocalAuth = self._to_int(getattr(income_part, "TaxPaidlocalAuth", None))
        income_deductions.AnnualValue = self._to_int(getattr(income_part, "AnnualValue", None))
        income_deductions.StandardDeduction = self._to_int(getattr(income_part, "StandardDeduction", None))
        income_deductions.InterestPayable = self._to_int(getattr(income_part, "InterestPayable", None))
        income_deductions.ArrearsUnrealizedRentRcvd = self._to_int(getattr(income_part, "ArrearsUnrealizedRentRcvd", None))
        income_deductions.TotalIncomeOfHP = self._to_int(getattr(income_part, "TotalIncomeOfHP", None))
        income_deductions.OthersInc = income_part.OthersInc
        income_deductions.IncomeOthSrc = self._to_int(getattr(income_part, "IncomeOthSrc", None))
        income_deductions.GrossTotIncome = self._to_int(getattr(income_part, "GrossTotIncome", None))

        # Copy deductions fields directly onto income_deductions
        income_deductions.UsrDeductUndChapVIA = deductions_part.UsrDeductUndChapVIA
        income_deductions.DeductUndChapVIA = deductions_part.DeductUndChapVIA
        income_deductions.TotalIncome = self._to_int(getattr(deductions_part, "TotalIncome", None))

        # Reset LTCG (updated by build_ltcg_112a in _build_itr_for_regime)
        income_deductions.GrossTotIncomeIncLTCG112A = 0

        return income_deductions, schedules
    
    def build_tax_paid(self, filing: FilingModel) -> TaxPaidModel:
        if filing.tax_computation is None:
            taxes = TaxesPaidModel(
                AdvanceTax=0,
                TDS=0,
                TCS=0,
                SelfAssessmentTax=0,
                TotalTaxesPaid=0,
            )
            return TaxPaidModel(TaxesPaid=taxes, BalTaxPayable=0)

        regime = filing.tax_computation.current_regime

        tds = max(0, self._to_int(getattr(regime, "tds", None)))
        tcs = max(0, self._to_int(getattr(regime, "tcs", None)))
        adv = max(0, self._to_int(getattr(regime, "advance_tax", None)))
        bal = max(0, self._to_int(getattr(regime, "tax_payable", None)))

        taxes = TaxesPaidModel(
            AdvanceTax=adv,
            TDS=tds,
            TCS=tcs,
            SelfAssessmentTax=0,
            TotalTaxesPaid=tds + tcs + adv,
        )
        return TaxPaidModel(TaxesPaid=taxes, BalTaxPayable=bal)

    @staticmethod
    def _default_fy_start_date_str(assessment_year: str | None) -> str:
        ay = (assessment_year or "").strip()
        start_year = None
        if ay and "-" in ay:
            head = ay.split("-")[0]
            try:
                start_year = int(head) - 1
            except ValueError:
                start_year = None
        if start_year is None:
            start_year = 2025
        return f"{start_year:04d}-04-01"

    @staticmethod
    def _to_int(value: Any) -> int:
        if value is None or value == "":
            return 0
        if isinstance(value, bool):
            return int(value)
        if isinstance(value, (int, float)):
            return int(value)
        try:
            return int(float(str(value)))
        except (ValueError, TypeError):
            return 0

    def build_tds(self, filing: FilingModel) -> tuple[TDSonSalariesModel | None, TDSonOthThanSalsModel | None]:
        """Build TDS schedules for ITR1.

        - Salary TDS goes to `TDSonSalaries`
        - Non-salary TDS (interest/dividend/etc.) goes to `TDSonOthThanSals`
        """
        tds_entries = filing.tds or []
        if not tds_entries:
            return None, None

        salary_rows: list[TDSonSalaryModel] = []
        fallback_salary_rows: list[TDSonSalaryModel] = []
        other_rows: list[TDSonOthThanSalModel] = []
        total_salary_tds = 0
        total_fallback_salary_tds = 0
        total_other_tds = 0

        ay_raw = (filing.assessment_year or "").strip()
        ay_year_str = ay_raw.split("-")[0] if ay_raw else ""
        try:
            ay_year = int(ay_year_str) if ay_year_str else None
        except ValueError:
            ay_year = None
        deducted_yr = str((ay_year - 1) if ay_year else 2024)

        for row in tds_entries:
            tan = (getattr(row, "tan", None) or "NA").strip() or "NA"
            name = (getattr(row, "deductor_name", None) or "NA").strip() or "NA"
            section = (getattr(row, "tds_section", None) or "").strip()
            income_source = (getattr(row, "income_source", None) or "").strip().lower()

            amt_paid = self._to_int(getattr(row, "amount_paid", None))
            tax_deducted = max(0, self._to_int(getattr(row, "tax_deducted", None)))

            is_salary = (
                "salary" in income_source
                or section.startswith("192")
                or section in {"92A", "92B", "92C"}
            )

            detl = EmployerOrDeductorOrCollectDetlModel(
                TAN=tan,
                EmployerOrDeductorOrCollecterName=name,
            )

            fallback_salary_rows.append(
                TDSonSalaryModel(
                    EmployerOrDeductorOrCollectDetl=detl,
                    IncChrgSal=max(0, amt_paid),
                    TotalTDSSal=tax_deducted,
                )
            )
            total_fallback_salary_tds += tax_deducted

            if is_salary:
                salary_rows.append(
                    TDSonSalaryModel(
                        EmployerOrDeductorOrCollectDetl=detl,
                        IncChrgSal=max(0, amt_paid),
                        TotalTDSSal=tax_deducted,
                    )
                )
                total_salary_tds += tax_deducted
            else:
                tds_section = section or "94A"
                other_rows.append(
                    TDSonOthThanSalModel(
                        EmployerOrDeductorOrCollectDetl=detl,
                        TDSSection=tds_section,
                        AmtForTaxDeduct=max(0, amt_paid),
                        DeductedYr=deducted_yr,
                        TotTDSOnAmtPaid=tax_deducted,
                        ClaimOutOfTotTDSOnAmtPaid=tax_deducted,
                    )
                )
                total_other_tds += tax_deducted

        # Fallback: some upstream checks expect TDSonSalaries whenever filing.tds exists.
        if not salary_rows and fallback_salary_rows:
            salary_rows = fallback_salary_rows
            total_salary_tds = total_fallback_salary_tds
            other_rows = []
            total_other_tds = 0

        salary_schedule = (
            TDSonSalariesModel(TDSonSalary=salary_rows, TotalTDSonSalaries=total_salary_tds)
            if salary_rows
            else None
        )
        other_schedule = (
            TDSonOthThanSalsModel(TDSonOthThanSal=other_rows, TotalTDSonOthThanSals=total_other_tds)
            if other_rows
            else None
        )
        return salary_schedule, other_schedule

    def _safe_collected_year(self, filing: FilingModel, year_hint: Any = None) -> CollectedYrEnum:
        """Coerce the year to a CollectedYrEnum supported by this ITR1 schema."""
        if year_hint is not None and hasattr(year_hint, "year"):
            year_str = str(getattr(year_hint, "year"))
        else:
            ay_raw = (filing.assessment_year or "").strip()
            ay_year_str = ay_raw.split("-")[0] if ay_raw else ""
            try:
                year_str = str(int(ay_year_str) - 1)
            except (ValueError, TypeError):
                year_str = "2024"

        allowed = {e.value for e in CollectedYrEnum}
        if year_str in allowed:
            return CollectedYrEnum(year_str)
        return CollectedYrEnum.field_2024

    def build_tcs(self, filing: FilingModel) -> ScheduleTCSModel | None:
        """Build ScheduleTCS from filing.tcs."""
        tcs_entries = filing.tcs or []
        if not tcs_entries:
            return None

        tcs_rows: list[TC] = []
        total_sch_tcs = 0
        for row in tcs_entries:
            tan = (getattr(row, "tan", None) or "NA").strip() or "NA"
            name = (getattr(row, "collector_name", None) or "NA").strip() or "NA"
            amt_collected = max(0, self._to_int(getattr(row, "amount_collected", None)))
            tax_collected = max(0, self._to_int(getattr(row, "tax_collected", None)))
            claimed = max(0, self._to_int(getattr(row, "tax_credit_claimed", None)))
            if claimed == 0:
                claimed = tax_collected

            detl = EmployerOrDeductorOrCollectDetlModel(
                TAN=tan,
                EmployerOrDeductorOrCollecterName=name,
            )
            collected_year = self._safe_collected_year(filing, getattr(row, "year_of_collection", None))
            tcs_rows.append(
                TC(
                    EmployerOrDeductorOrCollectDetl=detl,
                    AmtTaxCollected=amt_collected,
                    CollectedYr=collected_year,
                    TotalTCS=tax_collected,
                    AmtTCSClaimedThisYear=claimed,
                )
            )
            total_sch_tcs += tax_collected

        return ScheduleTCSModel(TCS=tcs_rows, TotalSchTCS=total_sch_tcs)
    
    
    
    
    # ── LTCG 112A ─────────────────────────────────────────────────────────────
    _LTCG_112A_MAX = 125_000

    def build_ltcg_112a(self, filing: FilingModel) -> tuple[LTCG112AModel | None, int]:
        """
        Build LTCG112A from capital-gains securities.

        Only equity-like instruments eligible under section 112A are included:
        * Listed equity shares (share_type != unlisted/non-listed) with STT paid, held > 12 months
        * Equity-oriented mutual funds (equity_type != debt) with STT paid, held > 12 months
        * RSUs on listed equity with STT paid, held > 12 months

        Returns (LTCG112AModel | None, ltcg_amount).
        If net LTCG > ₹1,25,000 the model is NOT constructed (must file ITR-2).
        """
        cg = filing.capital_gains_securities
        if not cg:
            return None, 0        

        total_sale = 0.0
        total_cost = 0.0

        # Stocks – listed equity shares with STT paid
        for stock in cg.stocks or []:
            if not self._is_listed(stock.share_type):
                continue
            months = self._holding_months(stock.date_of_purchase, stock.date_of_sale)
            if months is not None and months > 12 and stock.stt_paid:
                sale = float(stock.total_sale_price or 0)
                cost = float(stock.total_purchase_price or 0) + float(stock.transfer_expenses or 0)
                # Use FMV as cost when FMV > purchase price (grandfathering)
                if stock.fair_market_value is not None:
                    fmv = float(stock.fair_market_value)
                    cost_of_acq = max(float(stock.total_purchase_price or 0), min(fmv, sale))
                    cost = cost_of_acq + float(stock.transfer_expenses or 0)
                total_sale += sale
                total_cost += cost

        # Mutual Funds – equity-oriented with STT paid (skip debt funds)
        for mf in cg.mutual_funds or []:
            equity_type_val = (mf.equity_type or "").strip().lower()
            if "debt" in equity_type_val:
                continue
            months = self._holding_months(mf.date_of_purchase, mf.date_of_sale)
            if months is not None and months > 12 and mf.stt_paid:
                sale = float(mf.total_sale_price or 0)
                cost = float(mf.total_purchase_price or 0) + float(mf.transfer_expenses or 0)
                if mf.fair_market_value is not None:
                    fmv = float(mf.fair_market_value)
                    cost_of_acq = max(float(mf.total_purchase_price or 0), min(fmv, sale))
                    cost = cost_of_acq + float(mf.transfer_expenses or 0)
                total_sale += sale
                total_cost += cost

        # RSUs – listed equity with STT paid
        for rsu in cg.rsus or []:
            if not self._is_listed(rsu.share_type):
                continue
            months = self._holding_months(rsu.date_of_purchase, rsu.date_of_sale)
            if months is not None and months > 12 and rsu.stt_paid:
                sale = float(rsu.total_sale_price or 0)
                cost = float(rsu.total_purchase_price or 0) + float(rsu.transfer_expenses or 0)
                if rsu.fair_market_value is not None:
                    fmv = float(rsu.fair_market_value)
                    cost_of_acq = max(float(rsu.total_purchase_price or 0), min(fmv, sale))
                    cost = cost_of_acq + float(rsu.transfer_expenses or 0)
                total_sale += sale
                total_cost += cost

        tot_sale_int = int(total_sale)
        tot_cost_int = int(total_cost)
        ltcg = max(0, tot_sale_int - tot_cost_int)

        if ltcg <= 0:
            return None, 0

        if ltcg > self._LTCG_112A_MAX:
            # ITR-1 does not support LTCG > ₹1,25,000 — leave LTCG112A empty;
            # validation service will flag this separately.
            logger.warning(
                "LTCG u/s 112A (%s) exceeds ₹1,25,000 limit for ITR-1; "
                "LTCG112A section will not be constructed.",
                ltcg,
            )
            return None, 0

        model = LTCG112AModel(
            TotSaleCnsdrn=tot_sale_int,
            TotCstAcqisn=tot_cost_int,
            LongCap112A=ltcg,
        )
        return model, ltcg
    def _holding_months(self,date_of_purchase: Any, date_of_sale: Any) -> int | None:
            if not date_of_purchase or not date_of_sale:
                return None
            return (date_of_sale.year - date_of_purchase.year) * 12 + (
                date_of_sale.month - date_of_purchase.month
            )

    def _is_listed(self, share_type: str | None) -> bool:
            val = (share_type or "").strip().lower()
            return "non listed" not in val and "unlisted" not in val
        
    def build_tax_payments(self, filing: FilingModel, tax_payments: TaxPaymentsModel | None) -> TaxPaymentsModel:
        if tax_payments is None:
            tax_payments = TaxPaymentsModel.model_construct()
        tax_payments_dtls: list[TaxPaymentModel] = []
        total_tax_payments: int = 0
        default_date = self._default_fy_start_date_str(getattr(filing, "assessment_year", None))
        for advance_tax in (filing.advance_tax or []):
            amt = max(0, self._to_int(getattr(advance_tax, "tax_paid_amount", None)))
            total_tax_payments += amt
            raw_date = getattr(advance_tax, "date_of_payment", None)
            if raw_date is None:
                date_dep_str = default_date
            elif hasattr(raw_date, "strftime"):
                date_dep_str = raw_date.strftime("%Y-%m-%d")
            else:
                date_dep_str = str(raw_date).strip() or default_date
            bsr = str(getattr(advance_tax, "bsr_code", None) or "NA").strip() or "NA"
            challan = max(0, self._to_int(getattr(advance_tax, "challan_number", None)))
            tax_payments_dtls.append(
                TaxPaymentModel(
                    BSRCode=bsr,
                    DateDep=date_dep_str,
                    SrlNoOfChaln=challan,
                    Amt=amt,
                )
            )
        tax_payments.TaxPayment = tax_payments_dtls if tax_payments_dtls else None
        tax_payments.TotalTaxPayments = total_tax_payments
        return tax_payments
  
    def _merge_section(self, payload: Dict[str, Any], section_name: str, section_value: Dict[str, Any]) -> None:
        """Merge section value into payload."""
        existing_any = payload.get(section_name)
        if isinstance(existing_any, dict):
            existing = cast(Dict[str, Any], existing_any)
        else:
            existing = {}
            payload[section_name] = existing
        Itr1BuildingService._deep_update(existing, section_value)

    @staticmethod
    def _deep_update(dst: Dict[str, Any], src: Dict[str, Any]) -> None:
        """Deep update dst with src."""
        for k, v in src.items():
            if isinstance(v, dict):
                dst_child_any = dst.get(k)
                if isinstance(dst_child_any, dict):
                    dst_child = cast(Dict[str, Any], dst_child_any)
                else:
                    dst_child = {}
                    dst[k] = dst_child
                Itr1BuildingService._deep_update(dst_child, cast(Dict[str, Any], v))
            else:
                dst[k] = v

       