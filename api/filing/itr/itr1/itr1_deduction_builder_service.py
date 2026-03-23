"""
ITR1 Deduction Building Service - Handles all Chapter VIA deduction building logic.
This includes sections 80C, 80D, 80E, 80G, 80GGA, 80GGC, etc.
"""
import logging
from typing import Any

from filing.itr.itr1.models.itr1_model import (
    DeductUndChapVIATypeModel,
    UsrDeductUndChapVIATypeModel,
    AddressDetailModel,
    Don100PercentApprReqdModel,
    Don100PercentModel,
    Don50PercentApprReqdModel,
    Don50PercentNoApprReqdModel,
    DonationDtlsSciRsrchRuralDevItem,
    DoneeWithPanModel,
    ITR1DeductionsPartModel,
    LoanTknFromEnum,
    RelevantClauseUndrDedClaimedEnum,
    Schedule80CDtlModel,
    Schedule80CModel,
    Schedule80DDModel,
    Schedule80DModel,
    Schedule80EDtl,
    Schedule80EModel,
    Schedule80EEBDtl,
    Schedule80EEBModel,
    Schedule80EEDtl,
    Schedule80EEModel,
    Schedule80GGAModel,
    Schedule80GGCDetailModel,
    Schedule80GGCModel,
    Schedule80GModel,
    Schedule80UModel,
    Sch80DInsDtlsModel,
    Sec80DSelfFamHIDtlsModel,
    Sec80DSelfFamSrCtznHIDtlsModel,
    Sec80DParentsHIDtlsModel,
    Sec80DParentsSrCtznHIDtlsModel,
    Sec80DSelfFamSrCtznHealthModel,
)
from filing.models.filing_model import FilingModel

logger = logging.getLogger(__name__)


class Itr1ComputationContext:
    """Context object for sharing computation state across deduction builders."""
    def __init__(self):
        self.gross_salary = 0
        self.income_house_property = 0
        self.income_other_sources = 0
        self.gross_total_income = 0
        self.total_chapter_via_deductions = 0
        self.total_income = 0
        self.qualifying_amount_80g = 0
        self.total_deductions_without_80g = 0


class Itr1DeductionBuilderService:
    """Service for building ITR1 deduction sections (Chapter VIA) from FilingModel."""

    # Limits
    _SECTION_80C_80CCC_MAX_ALLOWED = 150000
    _SECTION_80CCD1B_MAX_ALLOWED = 50000
    _SECTION_80D_SELF_AND_FAMILY_NOT_SENIOR_MAX_ALLOWED = 25000
    _SECTION_80D_PARENTS_NOT_SENIOR_MAX_ALLOWED = 25000
    _SECTION_80D_SELF_AND_FAMILY_SENIOR_MAX_ALLOWED = 50000
    _SECTION_80D_PARENTS_SENIOR_MAX_ALLOWED = 50000
    _SECTION_80D_PREVENTIVE_CAP = 5000
    _SECTION_80TTA_MAX_ALLOWED =10000
    _SECTION_80TTB_MAX_ALLOWED = 10000
    _SECTION_80CCH_MAX_ALLOWED = 288000
    _SECTION_80GG_MAX_ALLOWED = 60000
    _SECTION_80EE_MAX_ALLOWED = 50000
    _SECTION_80EEB_MAX_ALLOWED = 150000
    _SECTION_80DDB_MAX_ALLOWED = 40000
    _SECTION_80DDB_SENIOR_MAX_ALLOWED = 100000

    def __init__(self) -> None:
        pass

    def build_deductions(
        self,
        filing: FilingModel,
        gross_tot_income: float,
        regime: str,
        context: Itr1ComputationContext,
    ) -> tuple[ITR1DeductionsPartModel, dict[str, Any]]:
        """Build deductions part: Chapter VIA (UsrDeductUndChapVIA, DeductUndChapVIA) and TotalIncome.
        
        Each section method handles regime check and returns (user_claimed, allowed, schedule).
        """
        usr = UsrDeductUndChapVIATypeModel()
        ded = DeductUndChapVIATypeModel()

        # Apply each section - each method checks regime and calculates user_claimed/allowed
        regime = regime or "old"
        usr_80c, ded_80c, sched_80c = self._apply_section_80c(filing, gross_tot_income, regime)
        usr.Section80C = usr_80c
        ded.Section80C = ded_80c

        usr_80ccc, ded_80ccc, pran_num = self._apply_section_80ccc(filing, gross_tot_income, ded_80c, regime)
        usr.Section80CCC = usr_80ccc
        usr.PRANNum = pran_num or None
        ded.Section80CCC = ded_80ccc

        usr_80ccd1, ded_80ccd1, _ = self._apply_section_80ccd1(filing, gross_tot_income, ded_80c, ded_80ccc, regime)
        usr.Section80CCDEmployeeOrSE = usr_80ccd1
        ded.Section80CCDEmployeeOrSE = ded_80ccd1

        usr_80ccd1b, ded_80ccd1b, _ = self._apply_section_80ccd1b(filing, gross_tot_income, regime)
        usr.Section80CCD1B = usr_80ccd1b
        ded.Section80CCD1B = ded_80ccd1b

        usr_80ccd2, ded_80ccd2, _ = self._apply_section_80ccd2(filing, gross_tot_income, regime)
        usr.Section80CCDEmployer = usr_80ccd2
        ded.Section80CCDEmployer = ded_80ccd2

        usr_80d, ded_80d, sched_80d = self._apply_section_80d(filing, regime)
        usr.Section80D = usr_80d
        ded.Section80D = ded_80d

        usr_80dd, ded_80dd, sched_80dd = self._apply_section_80dd(filing, gross_tot_income, regime)
        usr.Section80DD = usr_80dd
        ded.Section80DD = ded_80dd

        usr_80e, ded_80e, sched_80e = self._apply_section_80e(filing, regime)
        usr.Section80E = usr_80e
        ded.Section80E = ded_80e

        usr_80ee, ded_80ee, sched_80ee = self._apply_section_80ee(filing, regime)
        usr.Section80EE = usr_80ee
        ded.Section80EE = ded_80ee

        usr_80eeb, ded_80eeb, sched_80eeb = self._apply_section_80eeb(filing, regime)
        usr.Section80EEB = usr_80eeb
        ded.Section80EEB = ded_80eeb

        usr_80u, ded_80u, sched_80u = self._apply_section_80u(filing, regime)
        usr.Section80U = usr_80u
        ded.Section80U = ded_80u

        usr_80gga, ded_80gga, sched_80gga = self._apply_section_80gga(filing, context, regime)
        usr.Section80GGA = usr_80gga
        ded.Section80GGA = ded_80gga

        usr_80ggc, ded_80ggc, sched_80ggc = self._apply_section_80ggc(filing, regime)
        usr.Section80GGC = usr_80ggc
        ded.Section80GGC = ded_80ggc

        usr_80ddb, ded_80ddb, usr_80ddb_type, usr_80ddb_disease = self._apply_section_80ddb(filing, regime)
        usr.Section80DDB = usr_80ddb
        usr.Section80DDBUsrType = usr_80ddb_type or None
        usr.NameOfSpecDisease80DDB = usr_80ddb_disease or None
        ded.Section80DDB = ded_80ddb

        (
            usr_80tta, ded_80tta,
            usr_80ttb, ded_80ttb,
            usr_80cch, ded_80cch,
            usr_80gg, ded_80gg,
            form10ba_ack_num,
        ) = self._apply_other_deductions(filing, regime)
        usr.Section80TTA = usr_80tta
        usr.Section80TTB = usr_80ttb
        usr.AnyOthSec80CCH = usr_80cch
        usr.Section80GG = usr_80gg
        usr.Form10BAAckNum = form10ba_ack_num or ""
        ded.Section80TTA = ded_80tta
        ded.Section80TTB = ded_80ttb
        ded.AnyOthSec80CCH = ded_80cch
        ded.Section80GG = ded_80gg

        # Calculate 80G last (depends on total_income without 80G)
        context.total_deductions_without_80g = sum([
            getattr(ded, 'Section80C', 0) or 0,
            getattr(ded, 'Section80CCC', 0) or 0,
            getattr(ded, 'Section80CCDEmployeeOrSE', 0) or 0,
            getattr(ded, 'Section80CCD1B', 0) or 0,
            getattr(ded, 'Section80CCDEmployer', 0) or 0,
            getattr(ded, 'Section80D', 0) or 0,
            getattr(ded, 'Section80DD', 0) or 0,
            getattr(ded, 'Section80DDB', 0) or 0,
            getattr(ded, 'Section80E', 0) or 0,
            getattr(ded, 'Section80EE', 0) or 0,
            getattr(ded, 'Section80EEB', 0) or 0,
            getattr(ded, 'Section80GGA', 0) or 0,
            getattr(ded, 'Section80GGC', 0) or 0,
            getattr(ded, 'Section80GG', 0) or 0,
            getattr(ded, 'Section80TTA', 0) or 0,
            getattr(ded, 'Section80TTB', 0) or 0,
            getattr(ded, 'AnyOthSec80CCH', 0) or 0,
            getattr(ded, 'Section80U', 0) or 0,
        ])

        usr_80g, ded_80g, sched_80g = self._apply_section_80g(filing, context, regime)
        usr.Section80G = usr_80g
        ded.Section80G = ded_80g

        # Calculate totals
        usr.TotalChapVIADeductions = sum([
            getattr(usr, 'Section80C', 0) or 0,
            getattr(usr, 'Section80CCC', 0) or 0,
            getattr(usr, 'Section80CCDEmployeeOrSE', 0) or 0,
            getattr(usr, 'Section80CCD1B', 0) or 0,
            getattr(usr, 'Section80CCDEmployer', 0) or 0,
            getattr(usr, 'Section80D', 0) or 0,
            getattr(usr, 'Section80DD', 0) or 0,
            getattr(usr, 'Section80DDB', 0) or 0,
            getattr(usr, 'Section80E', 0) or 0,
            getattr(usr, 'Section80EE', 0) or 0,
            getattr(usr, 'Section80EEB', 0) or 0,
            getattr(usr, 'Section80G', 0) or 0,
            getattr(usr, 'Section80GG', 0) or 0,
            getattr(usr, 'Section80GGA', 0) or 0,
            getattr(usr, 'Section80GGC', 0) or 0,
            getattr(usr, 'Section80U', 0) or 0,
            getattr(usr, 'Section80TTA', 0) or 0,
            getattr(usr, 'Section80TTB', 0) or 0,
            getattr(usr, 'AnyOthSec80CCH', 0) or 0,
        ])

        ded.TotalChapVIADeductions = context.total_deductions_without_80g + (getattr(ded, 'Section80G', 0) or 0)

        total_income = max(0, int(gross_tot_income - (getattr(ded, 'TotalChapVIADeductions', 0) or 0)))

        schedules = {
            "Schedule80G": sched_80g,
            "Schedule80GGA": sched_80gga,
            "Schedule80GGC": sched_80ggc,
            "Schedule80D": sched_80d,
            "Schedule80DD": sched_80dd,
            "Schedule80U": sched_80u,
            "Schedule80E": sched_80e,
            "Schedule80EE": sched_80ee,
            "Schedule80EEB": sched_80eeb,
            "Schedule80C": sched_80c,
        }

        deductions_part = ITR1DeductionsPartModel(
            UsrDeductUndChapVIA=usr,
            DeductUndChapVIA=ded,
            TotalIncome=total_income,
        )

        return deductions_part, schedules   

    # --- Section-wise application methods ---
    
    def _apply_section_80c(
        self, filing: FilingModel, gross_tot_income: float, regime: str
    ) -> tuple[int, int, Any]:
        """Section 80C: LIC, PPF, ELSS, etc."""
        user_claimed = int(sum(section_80c.amount or 0 for section_80c in filing.section_80c or []))
        if regime.upper() == "NEW":
            filing.chapterVIADeductions.section_80c.claimed = user_claimed
            filing.chapterVIADeductions.section_80c.allowed = 0
            return user_claimed, 0, None

        schedule = self.build_schedule_80c(filing)
        total_income = max(0, int(gross_tot_income))
        pool_150k = min(self._SECTION_80C_80CCC_MAX_ALLOWED, total_income)
        allowed = min(user_claimed, pool_150k)

        filing.chapterVIADeductions.section_80c.claimed = user_claimed
        filing.chapterVIADeductions.section_80c.allowed = allowed
        filing.chapterVIADeductions.section_80c.max_allowed = self._SECTION_80C_80CCC_MAX_ALLOWED

        return user_claimed, allowed, schedule
    
    def _apply_section_80ccc(
        self, filing: FilingModel, gross_tot_income: float, section_80c_allowed: int, regime: str
    ) -> tuple[int, int, str | None]:
        """Section 80CCC: Pension schemes. Returns (user_claimed, allowed, pran_num)."""
        user_claimed = int(sum(item.amount for item in filing.section_80ccc or []))
        pran_num = filing.section_80ccc[0].pran_number if filing.section_80ccc else ""
        if regime.upper() == "NEW" or not filing.section_80ccc:
            filing.chapterVIADeductions.section_80ccc.claimed = user_claimed
            filing.chapterVIADeductions.section_80ccc.allowed = 0
            return user_claimed, 0, pran_num

        total_income = max(0, int(gross_tot_income))
        pool_150k = min(self._SECTION_80C_80CCC_MAX_ALLOWED, total_income)
        remaining = max(0, pool_150k - section_80c_allowed)
        allowed = min(user_claimed, remaining)

        filing.chapterVIADeductions.section_80ccc.claimed = user_claimed
        filing.chapterVIADeductions.section_80ccc.allowed = allowed
        filing.chapterVIADeductions.section_80ccc.max_allowed = min(self._SECTION_80C_80CCC_MAX_ALLOWED, int(gross_tot_income))

        return user_claimed, allowed, pran_num
    
    def _apply_section_80ccd1(
        self,
        filing: FilingModel,
        gross_tot_income: float,
        section_80c_allowed: int,
        section_80ccc_allowed: int,
        regime: str,
    ) -> tuple[int, int, None]:
        """Section 80CCD(1): NPS contributions by employee/self-employed."""
        user_claimed = int(sum(item.amount for item in filing.section_80ccd1 or []))
        if regime.upper() == "NEW" or not filing.section_80ccd1:
            filing.chapterVIADeductions.section_80ccd1.claimed = user_claimed
            filing.chapterVIADeductions.section_80ccd1.allowed = 0
            return user_claimed, 0, None

        total_income = max(0, int(gross_tot_income))
        pool_150k = min(self._SECTION_80C_80CCC_MAX_ALLOWED, total_income)
        remaining = max(0, pool_150k - section_80c_allowed - section_80ccc_allowed)
        allowed = min(user_claimed, remaining)

        filing.chapterVIADeductions.section_80ccd1.claimed = user_claimed
        filing.chapterVIADeductions.section_80ccd1.allowed = allowed
        filing.chapterVIADeductions.section_80ccd1.max_allowed = (
            min(self._SECTION_80C_80CCC_MAX_ALLOWED, int(gross_tot_income)) - section_80c_allowed - section_80ccc_allowed
        )

        return user_claimed, allowed, None
    
    def _apply_section_80ccd1b(
        self, filing: FilingModel, gross_tot_income: float, regime: str
    ) -> tuple[int, int, None]:
        """Section 80CCD(1B): Additional NPS contribution (over and above 80C limit)."""
        user_claimed = int(sum(item.amount for item in filing.section_80ccd1b or []))
        if regime.upper() == "NEW" or not filing.section_80ccd1b:
            filing.chapterVIADeductions.section_80ccd1b.claimed = user_claimed
            filing.chapterVIADeductions.section_80ccd1b.allowed = 0
            return user_claimed, 0, None
        total_income = max(0, int(gross_tot_income))
        allowed = int(min(user_claimed, self._SECTION_80CCD1B_MAX_ALLOWED, total_income))

        filing.chapterVIADeductions.section_80ccd1b.claimed = user_claimed
        filing.chapterVIADeductions.section_80ccd1b.allowed = allowed
        filing.chapterVIADeductions.section_80ccd1b.max_allowed = min(self._SECTION_80CCD1B_MAX_ALLOWED, int(gross_tot_income))

        return user_claimed, allowed, None
    
    def _apply_section_80ccd2(
        self, filing: FilingModel, gross_tot_income: float, regime: str
    ) -> tuple[int, int, None]:
        """Section 80CCD(2): Employer NPS contribution."""
        user_claimed = int(sum(item.amount for item in filing.section_80ccd2 or []))
        if regime.upper() == "NEW" or not filing.section_80ccd2:
            filing.chapterVIADeductions.section_80ccd2.claimed = user_claimed
            filing.chapterVIADeductions.section_80ccd2.allowed = 0
            return user_claimed, 0, None

        total_income = max(0, int(gross_tot_income))
        allowed = int(min(user_claimed, total_income))

        filing.chapterVIADeductions.section_80ccd2.claimed = user_claimed
        filing.chapterVIADeductions.section_80ccd2.allowed = allowed

        return user_claimed, round(allowed), None
    
    def _apply_section_80d(self, filing: FilingModel, regime: str) -> tuple[int, int, Any]:
        """Section 80D: Health insurance premium, preventive checkup, medical expenditure."""
        schedule = self.build_section_80d(filing)
        # user_claimed: raw sum of all entries before capping
        s80d_data = filing.section_80d
        user_claimed = int(
            sum(float(hi.health_insurance_premium or 0) for hi in (s80d_data.health_insurance if s80d_data else []) or [])
            + sum(float(pc.checkup_amount or 0) for pc in (s80d_data.preventive_checkup if s80d_data else []) or [])
            + sum(float(me.expenditure_amount or 0) for me in (s80d_data.medical_expenditure if s80d_data else []) or [])
        )
        allowed_amount = 0
        self_senior_flag = "S"
        parents_senior_flag = "P"
        if schedule is not None:
            health = schedule.Sec80DSelfFamSrCtznHealth
            allowed_amount = int(getattr(health, 'EligibleAmountOfDedn', 0) or 0)
            self_senior_flag = getattr(health, 'SeniorCitizenFlag', "S") or "S"
            parents_senior_flag = getattr(health, 'ParentsSeniorCitizenFlag', "P") or "P"
        # Dynamic max: sum of whichever caps actually apply per bucket
        self_max = (
            self._SECTION_80D_SELF_AND_FAMILY_SENIOR_MAX_ALLOWED if self_senior_flag == "Y"
            else (self._SECTION_80D_SELF_AND_FAMILY_NOT_SENIOR_MAX_ALLOWED if self_senior_flag == "N" else 0)
        )
        parents_max = (
            self._SECTION_80D_PARENTS_SENIOR_MAX_ALLOWED if parents_senior_flag == "Y"
            else (self._SECTION_80D_PARENTS_NOT_SENIOR_MAX_ALLOWED if parents_senior_flag == "N" else 0)
        )
        max_allowed = self_max + parents_max
        if regime.upper() == "NEW" or not filing.section_80d:
            filing.chapterVIADeductions.section_80d.claimed = user_claimed
            filing.chapterVIADeductions.section_80d.allowed = 0
            return user_claimed, 0, None

        filing.chapterVIADeductions.section_80d.claimed = user_claimed
        filing.chapterVIADeductions.section_80d.allowed = allowed_amount
        filing.chapterVIADeductions.section_80d.max_allowed = max_allowed
        return user_claimed, allowed_amount, schedule
    
    def _apply_section_80dd(
        self, filing: FilingModel, gross_tot_income: float, regime: str
    ) -> tuple[int, int, Any]:
        """Section 80DD: Medical treatment of dependent with disability."""
        schedule = self.build_schedule_80dd(filing)
        user_claimed = int(getattr(filing.section_80dd, "expenditure_incurred", 0) or 0)
        if regime.upper() == "NEW" or not filing.section_80dd or schedule is None:
            filing.chapterVIADeductions.section_80dd.claimed = user_claimed
            filing.chapterVIADeductions.section_80dd.allowed = 0
            return user_claimed, 0, None

        user_claimed = int(getattr(schedule, 'DeductionAmount', 0))
        nature_of_disability = getattr(schedule, 'NatureOfDisability', "1") or "1"
        total_income = max(0, int(gross_tot_income))

        if nature_of_disability == "1":
            allowed = min(user_claimed, 75000, total_income)
        else:
            allowed = min(user_claimed, 125000, total_income)

        filing.chapterVIADeductions.section_80dd.claimed = user_claimed
        filing.chapterVIADeductions.section_80dd.allowed = allowed
        filing.chapterVIADeductions.section_80dd.max_allowed = user_claimed

        return user_claimed, allowed, schedule
    
    def _apply_section_80e(self, filing: FilingModel, regime: str) -> tuple[int, int, Any]:
        """Section 80E: Interest on education loan."""
        user_claimed = int(sum(getattr(item, 'interest_on_loan', 0) or 0 for item in filing.section_80e or []))
        if regime.upper() == "NEW" or not filing.section_80e:
            filing.chapterVIADeductions.section_80e.claimed = user_claimed
            filing.chapterVIADeductions.section_80e.allowed = 0
            return user_claimed, 0, None

        schedule = self.build_schedule_80e(filing)
        allowed = int(getattr(schedule, 'TotalInterest80E', 0))

        filing.chapterVIADeductions.section_80e.claimed = user_claimed
        filing.chapterVIADeductions.section_80e.allowed = allowed
        filing.chapterVIADeductions.section_80e.max_allowed = user_claimed
        return user_claimed, allowed, schedule
    
    def _apply_section_80ee(self, filing: FilingModel, regime: str) -> tuple[int, int, Any]:
        """Section 80EE: Interest on home loan."""
        user_claimed = int(getattr(filing.section_80ee, "interest_on_loan", 0) or 0)
        if regime.upper() == "NEW" or not filing.section_80ee:
            filing.chapterVIADeductions.section_80ee.claimed = user_claimed
            filing.chapterVIADeductions.section_80ee.allowed = 0
            return user_claimed, 0, None

        schedule = self.build_schedule_80ee(filing)
        allowed = int(getattr(schedule, 'TotalInterest80EE', 0))

        filing.chapterVIADeductions.section_80ee.claimed = user_claimed
        filing.chapterVIADeductions.section_80ee.allowed = allowed
        filing.chapterVIADeductions.section_80ee.max_allowed = self._SECTION_80EE_MAX_ALLOWED
        return user_claimed, allowed, schedule
    
    def _apply_section_80eeb(self, filing: FilingModel, regime: str) -> tuple[int, int, Any]:
        """Section 80EEB: Interest on electric vehicle loan."""
        user_claimed = int(getattr(filing.section_80eeb, "interest_on_loan", 0) or 0)
        if regime.upper() == "NEW" or not filing.section_80eeb:
            filing.chapterVIADeductions.section_80eeb.claimed = user_claimed
            filing.chapterVIADeductions.section_80eeb.allowed = 0
            return user_claimed, 0, None

        schedule = self.build_schedule_80eeb(filing)
        allowed = int(getattr(schedule, 'TotalInterest80EEB', 0))

        filing.chapterVIADeductions.section_80eeb.claimed = user_claimed
        filing.chapterVIADeductions.section_80eeb.allowed = allowed
        filing.chapterVIADeductions.section_80eeb.max_allowed = self._SECTION_80EEB_MAX_ALLOWED
        return user_claimed, allowed, schedule
    
    def _apply_section_80u(self, filing: FilingModel, regime: str) -> tuple[int, int, Any]:
        """Section 80U: Person with disability."""
        user_claimed = int(getattr(filing.section_80u, "expenditure_incurred", 0) or 0)
        if regime.upper() == "NEW" or not filing.section_80u:
            filing.chapterVIADeductions.section_80u.claimed = user_claimed
            filing.chapterVIADeductions.section_80u.allowed = 0
            return user_claimed, 0, None

        schedule = self.build_schedule_80u(filing)
        user_claimed = allowed = int(getattr(schedule, 'DeductionAmount', 0))
        filing.chapterVIADeductions.section_80u.claimed = user_claimed
        filing.chapterVIADeductions.section_80u.allowed = allowed
        filing.chapterVIADeductions.section_80u.max_allowed = user_claimed
        return user_claimed, allowed, schedule
    def _apply_section_80gga(
        self, filing: FilingModel, context: Itr1ComputationContext, regime: str
    ) -> tuple[int, int, Any]:
        """Section 80GGA: Donations for scientific research."""
        user_claimed = int(
            sum(
                (item.donation_amount_cash or 0) + (item.donation_amount_non_cash or 0)
                for item in filing.section_80gga or []
            )
        )
        if regime.upper() == "NEW":
            filing.chapterVIADeductions.section_80gga.claimed = user_claimed
            filing.chapterVIADeductions.section_80gga.allowed = 0
            return user_claimed, 0, None

        schedule = self.build_schedule_80gga(filing, context)
        allowed = int(getattr(schedule, "TotalEligibleDonationAmt80GGA", 0))

        filing.chapterVIADeductions.section_80gga.claimed = user_claimed
        filing.chapterVIADeductions.section_80gga.allowed = allowed
        filing.chapterVIADeductions.section_80gga.max_allowed = allowed
        return user_claimed, allowed, schedule

    def _apply_section_80ddb(self, filing: FilingModel, regime: str) -> tuple[int, int, str, str]:
        """Section 80DDB: Medical treatment of dependent with disability. Returns (user_claimed, allowed, usr_type, disease)."""
        user_claimed = int(getattr(filing.section_80ddb, "expenditure_incurred", 0) or 0)
        if regime.upper() == "NEW" or not filing.section_80ddb:
            filing.chapterVIADeductions.section_80ddb.claimed = user_claimed
            filing.chapterVIADeductions.section_80ddb.allowed = 0
            return user_claimed, 0, "", ""
        schedule = self.build_section_80ddb(filing)
        allowed = schedule.get("Section80DDB_calc", 0)
        usr_type = schedule.get("Section80DDBUsrType", "")
        disease = schedule.get("NameOfSpecDisease80DDB", "")
        filing.chapterVIADeductions.section_80ddb.claimed = user_claimed
        filing.chapterVIADeductions.section_80ddb.allowed = allowed
        filing.chapterVIADeductions.section_80ddb.max_allowed = (
            self._SECTION_80DDB_MAX_ALLOWED
            if getattr(filing.section_80ddb, 'treatment_for', '1') == "1"
            else self._SECTION_80DDB_SENIOR_MAX_ALLOWED
        )
        return user_claimed, allowed, usr_type, disease

    def _apply_section_80ggc(self, filing: FilingModel, regime: str) -> tuple[int, int, Any]:
        """Section 80GGC: Contribution to political party."""
        user_claimed = int(
            sum(
                (item.contribution_amount_cash or 0) + (item.contribution_amount_non_cash or 0)
                for item in filing.section_80ggc or []
            )
        )
        if regime.upper() == "NEW" or not filing.section_80ggc:
            filing.chapterVIADeductions.section_80ggc.claimed = user_claimed
            filing.chapterVIADeductions.section_80ggc.allowed = 0
            return user_claimed, 0, None

        schedule = self.build_schedule_80ggc(filing)
        allowed = int(getattr(schedule, "TotalEligibleDonationAmt80GGC", 0))

        filing.chapterVIADeductions.section_80ggc.claimed = user_claimed
        filing.chapterVIADeductions.section_80ggc.allowed = allowed
        filing.chapterVIADeductions.section_80ggc.max_allowed = allowed
        return user_claimed, allowed, schedule
    
    def _apply_section_80g(
        self, filing: FilingModel, context: Itr1ComputationContext, regime: str
    ) -> tuple[int, int, Any]:
        """Section 80G: Donations."""
        user_claimed = int(
            sum(
                (item.donation_amount_cash or 0) + (item.donation_amount_non_cash or 0)
                for item in filing.section_80g or []
            )
        )
        if regime.upper() == "NEW" or not filing.section_80g:
            filing.chapterVIADeductions.section_80g.claimed = user_claimed
            filing.chapterVIADeductions.section_80g.allowed = 0
            return user_claimed, 0, None

        schedule = self.build_schedule_80g(filing, context)
        allowed = int(getattr(schedule, 'TotalEligibleDonationsUs80G', 0) or 0)

        filing.chapterVIADeductions.section_80g.claimed = user_claimed
        filing.chapterVIADeductions.section_80g.allowed = allowed
        filing.chapterVIADeductions.section_80g.max_allowed = allowed
        return user_claimed, allowed, schedule
    
    def _apply_other_deductions(
        self, filing: FilingModel, regime: str
    ) -> tuple[int, int, int, int, int, int, int, int, str]:
        """Other deductions: 80TTA, 80TTB, 80CCH, 80GG.
        Returns (usr_80tta, ded_80tta, usr_80ttb, ded_80ttb, usr_80cch, ded_80cch, usr_80gg, ded_80gg, form10ba_ack_num).
        """
        result = self.build_other_deductions(filing) if filing.other_deductions else {}
        usr_80tta = result.get("Section80TTA", 0)
        usr_80ttb = result.get("Section80TTB", 0)
        usr_80cch = result.get("AnyOthSec80CCH", 0)
        usr_80gg = result.get("Section80GG", 0)
        form10ba_ack_num = result.get("Form10BAAckNum", "")
        if regime.upper() == "NEW" or not filing.other_deductions:
            filing.chapterVIADeductions.section_80tta.claimed = usr_80tta
            filing.chapterVIADeductions.section_80tta.allowed = 0
            filing.chapterVIADeductions.section_80ttb.claimed = usr_80ttb
            filing.chapterVIADeductions.section_80ttb.allowed = 0
            filing.chapterVIADeductions.section_80cch.claimed = usr_80cch
            filing.chapterVIADeductions.section_80cch.allowed = 0
            filing.chapterVIADeductions.section_80gg.claimed = usr_80gg
            filing.chapterVIADeductions.section_80gg.allowed = 0
            return usr_80tta, 0, usr_80ttb, 0, usr_80cch, 0, usr_80gg, 0, form10ba_ack_num

        ded_80tta = result.get("Section80TTA_calc", 0)
        ded_80ttb = result.get("Section80TTB_calc", 0)
        ded_80cch = result.get("AnyOthSec80CCH_calc", 0)
        ded_80gg = result.get("Section80GG_calc", 0)
        filing.chapterVIADeductions.section_80tta.claimed = usr_80tta
        filing.chapterVIADeductions.section_80tta.allowed = ded_80tta
        filing.chapterVIADeductions.section_80tta.max_allowed = self._SECTION_80TTA_MAX_ALLOWED
        filing.chapterVIADeductions.section_80ttb.claimed = usr_80ttb
        filing.chapterVIADeductions.section_80ttb.allowed = ded_80ttb
        filing.chapterVIADeductions.section_80ttb.max_allowed = self._SECTION_80TTB_MAX_ALLOWED
        filing.chapterVIADeductions.section_80cch.claimed = usr_80cch
        filing.chapterVIADeductions.section_80cch.allowed = ded_80cch
        filing.chapterVIADeductions.section_80cch.max_allowed = self._SECTION_80CCH_MAX_ALLOWED
        filing.chapterVIADeductions.section_80gg.claimed = usr_80gg
        filing.chapterVIADeductions.section_80gg.allowed = ded_80gg
        filing.chapterVIADeductions.section_80gg.max_allowed = self._SECTION_80GG_MAX_ALLOWED
        return (
            usr_80tta, ded_80tta,
            usr_80ttb, ded_80ttb,
            usr_80cch, ded_80cch,
            usr_80gg, ded_80gg,
            form10ba_ack_num,
        )
   
    # --- Existing schedule builders (called by section methods above) ---

    def build_schedule_80c(self, filing: FilingModel) -> Schedule80CModel:
        """Build Schedule 80C."""
        if filing.regime == "NEW":
            return Schedule80CModel(Schedule80CDtls=[], TotalAmt=0)

        Schedule80CDtls: list[Schedule80CDtlModel] = []
        total_amt_80c: int = 0
        for section_80c in filing.section_80c or []:
            amount = int(section_80c.amount or 0)
            total_amt_80c += amount
            Schedule80CDtls.append(
                Schedule80CDtlModel(
                    Amount=amount,
                    IdentificationNo=(section_80c.policy_number or "")[:50],
                )
            )
        filing.chapterVIADeductions.section_80c.claimed = total_amt_80c
        filing.chapterVIADeductions.section_80c.max_allowed = 150000

        return Schedule80CModel(Schedule80CDtls=Schedule80CDtls, TotalAmt=total_amt_80c)

    @staticmethod
    def _map_loan_tkn_from(raw: str | None) -> LoanTknFromEnum:
        """Map raw loan-taken-from string to LoanTknFromEnum. Defaults to I (Institution)."""
        v = (raw or "").strip().upper()
        if v in ("B", "BANK"):
            return LoanTknFromEnum.B
        return LoanTknFromEnum.I

    def build_schedule_80u(self, filing: FilingModel) -> Schedule80UModel | None:
        """Build Schedule 80U."""
        if filing.regime == "NEW" or not filing.section_80u:
            return None
        nature = "1" if filing.section_80u.disability_type == "Disabled" else "2"
        deduction_amount = 75000 if nature == "1" else 125000
        return Schedule80UModel(
            NatureOfDisability=nature,
            TypeOfDisability=getattr(filing.section_80u, 'itr_type_of_disability', None) or "2",
            DeductionAmount=deduction_amount,
            Form10IAAckNum=getattr(filing.section_80u, 'itr_form10ia_ack_num', None),
            UDIDNum=getattr(filing.section_80u, 'itr_udid_num', None),
        )

    def build_schedule_80dd(self, filing: FilingModel) -> Schedule80DDModel | None:
        """Build Schedule 80DD. Returns None when not applicable (NEW regime or no section_80dd)."""
        if filing.regime == "NEW" or not filing.section_80dd:
            return None
        return Schedule80DDModel(
            NatureOfDisability=getattr(filing.section_80dd, 'itr_nature_of_disability', None) or "1",
            TypeOfDisability=getattr(filing.section_80dd, 'itr_type_of_disability', None) or "1",
            DeductionAmount=int(getattr(filing.section_80dd, 'itr_deduction_amount', 0) or 0),
            DependentType=getattr(filing.section_80dd, 'itr_dependent_type', None) or "1",
            DependentPan=getattr(filing.section_80dd, 'itr_dependent_pan', None),
            DependentAadhaar=filing.section_80dd.udid_no,
            Form10IAAckNum=getattr(filing.section_80dd, 'itr_form10ia_ack_num', None),
            UDIDNum=getattr(filing.section_80dd, 'itr_udid_num', None),
        )

    def build_schedule_80gga(self, filing: FilingModel, context: Itr1ComputationContext) -> Schedule80GGAModel:
        """Build Schedule 80GGA."""
        schedule_80gga_dtls: list[DonationDtlsSciRsrchRuralDevItem] = []

        total_amt_80gga: int = 0
        total_amt_80gga_cash: int = 0
        total_amt_80gga_non_cash: int = 0
        total_amt_80gga_eligible: int = 0
        if filing.regime == "NEW":
            total_amt_80gga = 0
            total_amt_80gga_cash = 0
            total_amt_80gga_non_cash = 0
            total_amt_80gga_eligible = 0
            return Schedule80GGAModel(
                DonationDtlsSciRsrchRuralDev=[],
                TotalDonationAmtCash80GGA=total_amt_80gga_cash,
                TotalDonationAmtOtherMode80GGA=total_amt_80gga_non_cash,
                TotalDonationsUs80GGA=total_amt_80gga,
                TotalEligibleDonationAmt80GGA=total_amt_80gga_eligible,
            )
        else:
            for section_80gga in filing.section_80gga:
                donation_amt_cash = int(min(section_80gga.donation_amount_cash, 2000))
                donation_amt_other_mode = int(section_80gga.donation_amount_non_cash)
                total_donation_amt = donation_amt_cash + donation_amt_other_mode
                eligible_donation_amt = max(0, min(donation_amt_cash + donation_amt_other_mode, context.gross_total_income))
                addressDetail: AddressDetailModel = AddressDetailModel(
                    AddrDetail=str(section_80gga.address_line1) + " " + str(section_80gga.address_line2) or "",
                    CityOrTownOrDistrict=section_80gga.city or "",
                    StateCode=section_80gga.state or "",
                    PinCode=section_80gga.pincode or "",
                )
                schedule_80gga_dtls.append(
                    DonationDtlsSciRsrchRuralDevItem(
                        RelevantClauseUndrDedClaimed=RelevantClauseUndrDedClaimedEnum(section_80gga.itr_relevant_clause),
                        NameOfDonee=section_80gga.donee_name,
                        AddressDetail=addressDetail,
                        DoneePAN=section_80gga.donee_pan,
                        DonationAmtCash=donation_amt_cash,
                        DonationAmtOtherMode=donation_amt_other_mode,
                        DonationAmt=total_donation_amt,
                        EligibleDonationAmt=eligible_donation_amt,
                    )
                )
                total_amt_80gga_cash += donation_amt_cash
                total_amt_80gga_non_cash += donation_amt_other_mode
                total_amt_80gga += donation_amt_cash + donation_amt_other_mode
                total_amt_80gga_eligible += eligible_donation_amt

            return Schedule80GGAModel(
                DonationDtlsSciRsrchRuralDev=schedule_80gga_dtls,
                TotalDonationAmtCash80GGA=total_amt_80gga_cash,
                TotalDonationAmtOtherMode80GGA=total_amt_80gga_non_cash,
                TotalDonationsUs80GGA=total_amt_80gga,
                TotalEligibleDonationAmt80GGA=total_amt_80gga_eligible,
            )

    def build_schedule_80ggc(self, filing: FilingModel) -> Schedule80GGCModel:
        """Build Schedule 80GGC."""
        if filing.regime == "NEW":
            return Schedule80GGCModel(
                Schedule80GGCDetails=[],
                TotalDonationAmtCash80GGC=0,
                TotalDonationAmtOtherMode80GGC=0,
                TotalDonationsUs80GGC=0,
                TotalEligibleDonationAmt80GGC=0,
            )

        schedule_80ggc_dtls: list[Schedule80GGCDetailModel] = []
        total_amt_80ggc_cash: int = 0
        total_amt_80ggc_non_cash: int = 0
        total_amt_80ggc: int = 0
        total_amt_80ggc_eligible: int = 0

        for section_80ggc in filing.section_80ggc or []:
            donation_amt_cash = int(section_80ggc.contribution_amount_cash or 0)
            donation_amt_other_mode = int(section_80ggc.contribution_amount_non_cash or 0)
            total_donation_amt = donation_amt_cash + donation_amt_other_mode
            eligible_donation_amt = donation_amt_other_mode
            ifsc = (section_80ggc.donor_bank_ifsc or "").strip() or None
            if ifsc is not None and not ifsc:
                ifsc = None
            schedule_80ggc_dtls.append(
                Schedule80GGCDetailModel(
                    DonationDate=str(section_80ggc.date_of_donation),
                    DonationAmtCash=donation_amt_cash or 0,
                    DonationAmtOtherMode=donation_amt_other_mode or 0,
                    DonationAmt=total_donation_amt or 0,
                    EligibleDonationAmt=eligible_donation_amt or 0,
                    TransactionRefNum=(section_80ggc.transaction_id or "")[:50] or None,
                    IFSCCode=ifsc if ifsc else None,
                )
            )
            total_amt_80ggc_cash += donation_amt_cash
            total_amt_80ggc_non_cash += donation_amt_other_mode
            total_amt_80ggc += donation_amt_cash + donation_amt_other_mode
            total_amt_80ggc_eligible += eligible_donation_amt

        return Schedule80GGCModel(
            Schedule80GGCDetails=schedule_80ggc_dtls,
            TotalDonationAmtCash80GGC=total_amt_80ggc_cash,
            TotalDonationAmtOtherMode80GGC=total_amt_80ggc_non_cash,
            TotalDonationsUs80GGC=total_amt_80ggc,
            TotalEligibleDonationAmt80GGC=total_amt_80ggc_eligible,
        )

    
    def build_schedule_80e(self, filing: FilingModel) -> Schedule80EModel:
        """Build Schedule 80E."""
        if filing.regime == "NEW":
            return Schedule80EModel(Schedule80EDtls=[], TotalInterest80E=0)
        dtls: list[Schedule80EDtl] = []
        total: int = 0
        for s in filing.section_80e or []:
            interest = int(getattr(s, 'interest_on_loan', 0) or 0)
            total += interest
            dtls.append(Schedule80EDtl(
                LoanTknFrom=self._map_loan_tkn_from(getattr(s, 'itr_loan_tkn_from', None)),
                BankOrInstnName=getattr(s, 'itr_bank_or_instn_name', None) or "NA",
                LoanAccNoOfBankOrInstnRefNo=str(getattr(s, 'itr_loan_acc_ref', None) or ""),
                DateofLoan=getattr(s, 'itr_dateofloan', None),
                TotalLoanAmt=int(getattr(s, 'itr_total_loan_amt', 0) or 0),
                LoanOutstndngAmt=int(getattr(s, 'itr_loan_outstanding_amt', 0) or 0),
                Interest80E=interest,
            ))
        return Schedule80EModel(Schedule80EDtls=dtls, TotalInterest80E=total)

    def build_schedule_80ee(self, filing: FilingModel) -> Schedule80EEModel:
        """Build Schedule 80EE."""
        dtls: list[Schedule80EEDtl] = []
        total: int = 0
        # Do not check filing.regime here; _apply_section_80ee already returns None for NEW regime
        section_80ee = filing.section_80ee
        if section_80ee is not None:
            interest = int(getattr(section_80ee, 'interest_on_loan', 0) or 0)
            total = interest
            dtls.append(Schedule80EEDtl(
                LoanTknFrom=self._map_loan_tkn_from(getattr(section_80ee, 'itr_loan_tkn_from', None)),
                BankOrInstnName=getattr(section_80ee, 'itr_bank_or_instn_name', None) or "NA",
                LoanAccNoOfBankOrInstnRefNo=str(getattr(section_80ee, 'itr_loan_acc_ref', None) or ""),
                DateofLoan=getattr(section_80ee, 'itr_dateofloan', None),
                TotalLoanAmt=int(getattr(section_80ee, 'itr_total_loan_amt', 0) or 0),
                LoanOutstndngAmt=int(getattr(section_80ee, 'itr_loan_outstanding_amt', 0) or 0),
                Interest80EE=interest,
            ))
        return Schedule80EEModel(Schedule80EEDtls=dtls, TotalInterest80EE=total)
    def build_schedule_80eeb(self, filing: FilingModel) -> Schedule80EEBModel:
        """Build Schedule 80EEB."""
        if filing.regime == "NEW":
            return Schedule80EEBModel(Schedule80EEBDtls=[], TotalInterest80EEB=0)
        dtls: list[Schedule80EEBDtl] = []
        total: int = 0
        section_80eeb = filing.section_80eeb
        if section_80eeb is not None:
            interest = int(getattr(section_80eeb, 'interest_on_loan', 0) or 0)
            total = interest
            dtls.append(Schedule80EEBDtl(
                LoanTknFrom=self._map_loan_tkn_from(getattr(section_80eeb, 'itr_loan_tkn_from', None)),
                BankOrInstnName=getattr(section_80eeb, 'itr_bank_or_instn_name', None) or "NA",
                LoanAccNoOfBankOrInstnRefNo=str(getattr(section_80eeb, 'itr_loan_acc_ref', None) or ""),
                DateofLoan=getattr(section_80eeb, 'itr_dateofloan', None),
                TotalLoanAmt=int(getattr(section_80eeb, 'itr_total_loan_amt', 0) or 0),
                LoanOutstndngAmt=int(getattr(section_80eeb, 'itr_loan_outstanding_amt', 0) or 0),
                VehicleRegNo=getattr(section_80eeb, 'itr_vehicle_reg_no', None) or "NA",
                Interest80EEB=interest,
            ))
        return Schedule80EEBModel(Schedule80EEBDtls=dtls, TotalInterest80EEB=total)

    def build_section_80d(self, filing: FilingModel) -> Schedule80DModel | None:
        """Build Section 80D: Health insurance, preventive checkup, medical expenditure.

        Two independent buckets — self/family and parents — each resolved via:
          - taken_for in {"Self", "Self & Family"} → self bucket
          - taken_for == "Parents"                 → parents bucket
          - includes_senior_citizen on ANY entry   → marks that bucket as senior

        Caps (per VB Sheet9.cls formulas):
          Non-senior: MIN(25000, premium + preventive)
          Senior:     MIN(50000, premium + preventive + medical)
          Preventive: additionally capped at ₹5 000 per bucket
          Medical:    counted only when no insurance premium exists in that bucket
        """
        if not filing.section_80d:
            return None

        _PREV_CAP = self._SECTION_80D_PREVENTIVE_CAP
        _SELF_TAKEN_FOR = {"Self", "Self & Family"}

        # ── Accumulators ────────────────────────────────────────────────────────
        self_premium: float = 0
        self_preventive: float = 0
        self_medical: float = 0
        self_senior: bool = False
        self_ins_non_sr: list[Sch80DInsDtlsModel] = []
        self_ins_sr: list[Sch80DInsDtlsModel] = []

        parent_premium: float = 0
        parent_preventive: float = 0
        parent_medical: float = 0
        parent_senior: bool = False
        parent_ins_non_sr: list[Sch80DInsDtlsModel] = []
        parent_ins_sr: list[Sch80DInsDtlsModel] = []

        # ── Health Insurance ─────────────────────────────────────────────────────
        for hi in (filing.section_80d.health_insurance or []):
            amt = float(hi.health_insurance_premium or 0)
            ins_row = Sch80DInsDtlsModel(
                InsurerName=hi.itr_insurer_name or "",
                PolicyNo=hi.itr_policy_no or "",
                HealthInsAmt=hi.itr_health_ins_amt,
            )
            if hi.taken_for in _SELF_TAKEN_FOR:
                self_premium += amt
                if hi.includes_senior_citizen:
                    self_senior = True
                    self_ins_sr.append(ins_row)
                else:
                    self_ins_non_sr.append(ins_row)
            elif hi.taken_for == "Parents":
                parent_premium += amt
                if hi.includes_senior_citizen:
                    parent_senior = True
                    parent_ins_sr.append(ins_row)
                else:
                    parent_ins_non_sr.append(ins_row)

        # ── Preventive Checkup ───────────────────────────────────────────────────
        for pc in (filing.section_80d.preventive_checkup or []):
            amt = float(pc.checkup_amount or 0)
            if pc.taken_for in _SELF_TAKEN_FOR:
                self_preventive += amt
                if pc.includes_senior_citizen:
                    self_senior = True
            elif pc.taken_for == "Parents":
                parent_preventive += amt
                if pc.includes_senior_citizen:
                    parent_senior = True

        # Cap preventive at ₹5 000 per bucket
        self_preventive = min(self_preventive, _PREV_CAP)
        parent_preventive = min(parent_preventive, _PREV_CAP)

        # ── Medical Expenditure (senior only; only when no premium in that bucket)
        for me in (filing.section_80d.medical_expenditure or []):
            amt = float(me.expenditure_amount or 0)
            if me.taken_for in _SELF_TAKEN_FOR:
                if me.includes_senior_citizen:
                    self_senior = True
                if self_premium == 0:
                    self_medical += amt
            elif me.taken_for == "Parents":
                if me.includes_senior_citizen:
                    parent_senior = True
                if parent_premium == 0:
                    parent_medical += amt

        # ── Deduction caps ───────────────────────────────────────────────────────
        has_self = bool(self_premium or self_preventive or self_medical)
        has_parents = bool(parent_premium or parent_preventive or parent_medical)

        if self_senior:
            self_deduction = min(
                int(self_premium + self_preventive + self_medical),
                self._SECTION_80D_SELF_AND_FAMILY_SENIOR_MAX_ALLOWED,
            )
        else:
            # Non-senior: only premium + preventive (no medical allowance)
            self_deduction = min(
                int(self_premium + self_preventive),
                self._SECTION_80D_SELF_AND_FAMILY_NOT_SENIOR_MAX_ALLOWED,
            )

        if parent_senior:
            parent_deduction = min(
                int(parent_premium + parent_preventive + parent_medical),
                self._SECTION_80D_PARENTS_SENIOR_MAX_ALLOWED,
            )
        else:
            parent_deduction = min(
                int(parent_premium + parent_preventive),
                self._SECTION_80D_PARENTS_NOT_SENIOR_MAX_ALLOWED,
            )

        total_deduction = self_deduction + parent_deduction

        # ── SeniorCitizenFlag / ParentsSeniorCitizenFlag ─────────────────────────
        # "S" = not claiming for self/family; "P" = not claiming for parents
        if not has_self:
            senior_flag = "S"
        elif self_senior:
            senior_flag = "Y"
        else:
            senior_flag = "N"

        if not has_parents:
            parents_flag = "P"
        elif parent_senior:
            parents_flag = "Y"
        else:
            parents_flag = "N"

        # ── Build typed Sec80DSelfFamSrCtznHealthModel ────────────────────────────
        health = Sec80DSelfFamSrCtznHealthModel(
            SeniorCitizenFlag=senior_flag,
            # Non-senior self/family sub-bucket (only when not senior)
            SelfAndFamily=(self_deduction if not self_senior else None),
            HealthInsPremSlfFam=(int(self_premium) if not self_senior else None),
            Sec80DSelfFamHIDtls=(
                Sec80DSelfFamHIDtlsModel(Sch80DInsDtls=self_ins_non_sr, TotalPayments=int(self_premium))
                if not self_senior and self_ins_non_sr
                else None
            ),
            PrevHlthChckUpSlfFam=(int(self_preventive) if not self_senior else None),
            # Senior self/family sub-bucket (only when senior)
            SelfAndFamilySeniorCitizen=(self_deduction if self_senior else None),
            HlthInsPremSlfFamSrCtzn=(int(self_premium) if self_senior else None),
            Sec80DSelfFamSrCtznHIDtls=(
                Sec80DSelfFamSrCtznHIDtlsModel(Sch80DInsDtls=self_ins_sr, TotalPayments=int(self_premium))
                if self_senior and self_ins_sr
                else None
            ),
            PrevHlthChckUpSlfFamSrCtzn=(int(self_preventive) if self_senior else None),
            MedicalExpSlfFamSrCtzn=(int(self_medical) if self_senior else None),
            # Parents
            ParentsSeniorCitizenFlag=parents_flag,
            # Non-senior parents sub-bucket
            Parents=(parent_deduction if not parent_senior else None),
            HlthInsPremParents=(int(parent_premium) if not parent_senior else None),
            Sec80DParentsHIDtls=(
                Sec80DParentsHIDtlsModel(Sch80DInsDtls=parent_ins_non_sr, TotalPayments=int(parent_premium))
                if not parent_senior and parent_ins_non_sr
                else None
            ),
            PrevHlthChckUpParents=(int(parent_preventive) if not parent_senior else None),
            # Senior parents sub-bucket
            ParentsSeniorCitizen=(parent_deduction if parent_senior else None),
            HlthInsPremParentsSrCtzn=(int(parent_premium) if parent_senior else None),
            Sec80DParentsSrCtznHIDtls=(
                Sec80DParentsSrCtznHIDtlsModel(Sch80DInsDtls=parent_ins_sr, TotalPayments=int(parent_premium))
                if parent_senior and parent_ins_sr
                else None
            ),
            PrevHlthChckUpParentsSrCtzn=(int(parent_preventive) if parent_senior else None),
            MedicalExpParentsSrCtzn=(int(parent_medical) if parent_senior else None),
            EligibleAmountOfDedn=total_deduction,
        )
        return Schedule80DModel(Sec80DSelfFamSrCtznHealth=health)

    def build_other_deductions(self, filing: FilingModel) -> dict[str, Any]:
        """Build other deductions (80TTA, 80TTB, 80CCH, 80GG)."""
        section_80_tta = 0
        section_80_ttb = 0
        any_oth_sec_80_cch = 0
        section_80_gg = 0
        form10ba_ack_num = ""
        section_80_tta_calc = 0
        section_80_ttb_calc = 0
        section_80_cch_calc = 0
        section_80_gg_calc = 0
        if filing.other_deductions is not None:
            if filing.other_deductions.deduction_80_tta:
                section_80_tta = filing.other_deductions.deduction_80_tta.interest_amount
                section_80_tta_calc = min(section_80_tta, self._SECTION_80TTA_MAX_ALLOWED)
            if filing.other_deductions.deduction_80_ttb:
                section_80_ttb = filing.other_deductions.deduction_80_ttb.interest_amount
                section_80_ttb_calc = min(section_80_ttb, self._SECTION_80TTB_MAX_ALLOWED)
            if filing.other_deductions.deduction_80_cch:
                # if only he is central government employee then only the contribution is allowed
                any_oth_sec_80_cch = filing.other_deductions.deduction_80_cch.contribution_amount
                section_80_cch_calc = min(any_oth_sec_80_cch, self._SECTION_80CCH_MAX_ALLOWED)
            if filing.other_deductions.deduction_80_gg:
                section_80_gg = filing.other_deductions.deduction_80_gg.rent_paid_amount
                section_80_gg_calc = min(section_80_gg, self._SECTION_80GG_MAX_ALLOWED)
                form10ba_ack_num = filing.other_deductions.deduction_80_gg.acknowledgement_no_10_ba
        return {
            "Section80TTA": section_80_tta,
            "Section80TTB": section_80_ttb,
            "AnyOthSec80CCH": any_oth_sec_80_cch,
            "Section80GG": section_80_gg,
            "Form10BAAckNum": form10ba_ack_num,
            "Section80TTA_calc": section_80_tta_calc,
            "Section80TTB_calc": section_80_ttb_calc,
            "AnyOthSec80CCH_calc": section_80_cch_calc,
            "Section80GG_calc": section_80_gg_calc,
        }
    def build_section_80ddb(self, filing: FilingModel) -> dict[str, Any]:   
        """Build Section 80DDB.
        -> all fields are required
        -> treatment_for: "1" for self, "2" for dependent
        -> senior_citizen_type: "1" for self, "2" for dependent
        -> disease: "a" for Dementia, "b" for Dystonia Musculorum Deformans, "c" for Motor Neuron Disease, "d" for Ataxia, "e" for Chorea, "f" for Hemiballismus, "g" for Aphasia, "h" for Parkinsons Disease, "i" for Malignant Cancers, "j" for Full Blown Acquired Immuno-Deficiency Syndrome (AIDS), "k" for Chronic Renal failure, "l" for Hematological disorders, "m" for Hemophilia, "n" for Thalassaemia
        -> expenditure_incurred: amount
        -> return 80 ddb  Section80DDBUsrType,NameOfSpecDisease80DDB,Section80DDB,Section80DDB_calc
        -> 40000 max allowed for self or dependent 100000 for senior citizen
        """
        section_80_ddb = 0
        section_80_ddb_calc = 0
        section_80_ddb_usr_type = ""
        section_80_ddb_disease = ""
        if filing.section_80ddb is not None:
            section_80_ddb_usr_type = filing.section_80ddb.treatment_for
            section_80_ddb_disease = filing.section_80ddb.disease
            section_80_ddb = filing.section_80ddb.expenditure_incurred
            if filing.section_80ddb.treatment_for == "1":
                section_80_ddb_calc = min(section_80_ddb, self._SECTION_80DDB_MAX_ALLOWED)
            else:
                section_80_ddb_calc = min(section_80_ddb, self._SECTION_80DDB_SENIOR_MAX_ALLOWED)
   
        return {
            "Section80DDBUsrType": section_80_ddb_usr_type,
            "NameOfSpecDisease80DDB": section_80_ddb_disease,
            "Section80DDB": section_80_ddb,
            "Section80DDB_calc": section_80_ddb_calc,
        }

    def _addr_80g(self, section_80g: Any) -> AddressDetailModel:
        addr = (str(section_80g.address_line1 or "") + " " + str(section_80g.address_line2 or "")).strip() or "-"
        pin = section_80g.pincode
        pin_ok = pin is not None and str(pin).strip().isdigit() and 100000 <= int(pin) <= 999999
        return AddressDetailModel(
            AddrDetail=addr,
            CityOrTownOrDistrict=section_80g.city or "-",
            StateCode=section_80g.state or "-",
            PinCode=int(pin) if pin_ok else None,
        )

    def build_schedule_80g(self, filing: FilingModel, context: Itr1ComputationContext) -> Schedule80GModel:
        remaining_qualifying_cap_80g = max(
            0, int(0.10 * context.gross_total_income - context.total_deductions_without_80g)
        )

        if filing.regime == "NEW":
            return Schedule80GModel(
                Don100Percent=Don100PercentModel(
                    DoneeWithPan=[], TotDon100PercentCash=0, TotDon100PercentOtherMode=0,
                    TotDon100Percent=0, TotEligibleDon100Percent=0,
                ),
                Don50PercentNoApprReqd=Don50PercentNoApprReqdModel(
                    DoneeWithPan=[], TotDon50PercentNoApprReqdCash=0, TotDon50PercentNoApprReqdOtherMode=0,
                    TotDon50PercentNoApprReqd=0, TotEligibleDon50Percent=0,
                ),
                Don50PercentApprReqd=Don50PercentApprReqdModel(
                    DoneeWithPan=[], TotDon50PercentApprReqdCash=0, TotDon50PercentApprReqdOtherMode=0,
                    TotDon50PercentApprReqd=0, TotEligibleDon50PercentApprReqd=0,
                ),
                Don100PercentApprReqd=Don100PercentApprReqdModel(
                    DoneeWithPan=[], TotDon100PercentApprReqdCash=0, TotDon100PercentApprReqdOtherMode=0,
                    TotDon100PercentApprReqd=0, TotEligibleDon100PercentApprReqd=0,
                ),
                TotalDonationsUs80GCash=0,
                TotalDonationsUs80GOtherMode=0,
                TotalDonationsUs80G=0,
                TotalEligibleDonationsUs80G=0,
            )

        donee_100_nolimit: list[DoneeWithPanModel] = []
        tot_100_cash = tot_100_other = tot_100 = tot_100_elig = 0

        donee_50_nolimit: list[DoneeWithPanModel] = []
        tot_50nl_cash = tot_50nl_other = tot_50nl = tot_50nl_elig = 0

        donee_50_limit: list[DoneeWithPanModel] = []
        tot_50l_cash = tot_50l_other = tot_50l = tot_50l_elig = 0

        donee_100_limit: list[DoneeWithPanModel] = []
        tot_100l_cash = tot_100l_other = tot_100l = tot_100l_elig = 0

        for section_80g in filing.section_80g or []:
            name = (getattr(section_80g, "donee_name", None) or "").strip() or "-"
            pan = (getattr(section_80g, "donee_pan", None) or "").strip() or "-"
            arn = (getattr(section_80g, "approval_reference_number", None) or "").strip() or None
            if arn:
                arn = arn[:50]
            addr = self._addr_80g(section_80g)
            cash = int(getattr(section_80g, "donation_amount_cash", None) or 0)
            other = int(getattr(section_80g, "donation_amount_non_cash", None) or 0)
            total_don = cash + other

            if getattr(section_80g, "qualifying_percentage", None) == "100" and getattr(section_80g, "limit_on_deduction", None) == "Without Limit":
                elig = min(
                    (other + min(cash, 2000)) if cash <= 2000 else 0,
                    int(context.gross_total_income),
                )
                donee_100_nolimit.append(
                    DoneeWithPanModel(
                        DoneeWithPanName=name, DoneePAN=pan, ArnNbr=arn, AddressDetail=addr,
                        DonationAmtCash=cash, DonationAmtOtherMode=other,
                        DonationAmt=total_don, EligibleDonationAmt=int(elig),
                    )
                )
                tot_100_cash += cash
                tot_100_other += other
                tot_100 += total_don
                tot_100_elig += int(elig)

            elif getattr(section_80g, "qualifying_percentage", None) == "50" and getattr(section_80g, "limit_on_deduction", None) == "Without Limit":
                elig = int(min(
                    (other / 2 + cash / 2) if cash <= 2000 else 0,
                    int(context.gross_total_income),
                ))
                donee_50_nolimit.append(
                    DoneeWithPanModel(
                        DoneeWithPanName=name, DoneePAN=pan, ArnNbr=arn, AddressDetail=addr,
                        DonationAmtCash=cash, DonationAmtOtherMode=other,
                        DonationAmt=total_don, EligibleDonationAmt=elig,
                    )
                )
                tot_50nl_cash += cash
                tot_50nl_other += other
                tot_50nl += total_don
                tot_50nl_elig += elig

            elif getattr(section_80g, "qualifying_percentage", None) == "50" and getattr(section_80g, "limit_on_deduction", None) == "Subject to 10% of Total Income":
                elig = int(min(
                    (other / 2 + cash / 2) if cash <= 2000 else 0,
                    int(remaining_qualifying_cap_80g),
                ))
                remaining_qualifying_cap_80g -= elig
                donee_50_limit.append(
                    DoneeWithPanModel(
                        DoneeWithPanName=name, DoneePAN=pan, ArnNbr=arn, AddressDetail=addr,
                        DonationAmtCash=cash, DonationAmtOtherMode=other,
                        DonationAmt=total_don, EligibleDonationAmt=elig,
                    )
                )
                tot_50l_cash += cash
                tot_50l_other += other
                tot_50l += total_don
                tot_50l_elig += elig

            elif getattr(section_80g, "qualifying_percentage", None) == "100" and getattr(section_80g, "limit_on_deduction", None) == "Subject to 10% of Total Income":
                cash_capped = min(cash, 2000)
                elig_val = min(
                    min(cash_capped + other, int(context.total_income)),
                    int(remaining_qualifying_cap_80g),
                )
                elig = int(round(elig_val, 0))
                remaining_qualifying_cap_80g -= elig
                donee_100_limit.append(
                    DoneeWithPanModel(
                        DoneeWithPanName=name, DoneePAN=pan, ArnNbr=arn, AddressDetail=addr,
                        DonationAmtCash=cash, DonationAmtOtherMode=other,
                        DonationAmt=total_don, EligibleDonationAmt=elig,
                    )
                )
                tot_100l_cash += cash
                tot_100l_other += other
                tot_100l += total_don
                tot_100l_elig += elig

        total_cash = tot_100_cash + tot_50nl_cash + tot_50l_cash + tot_100l_cash
        total_other = tot_100_other + tot_50nl_other + tot_50l_other + tot_100l_other
        total_all = tot_100 + tot_50nl + tot_50l + tot_100l
        total_elig = tot_100_elig + tot_50nl_elig + tot_50l_elig + tot_100l_elig

        return Schedule80GModel(
            Don100Percent=Don100PercentModel(
                DoneeWithPan=donee_100_nolimit,
                TotDon100PercentCash=tot_100_cash, TotDon100PercentOtherMode=tot_100_other,
                TotDon100Percent=tot_100, TotEligibleDon100Percent=tot_100_elig,
            ) if donee_100_nolimit else None,
            Don50PercentNoApprReqd=Don50PercentNoApprReqdModel(
                DoneeWithPan=donee_50_nolimit,
                TotDon50PercentNoApprReqdCash=tot_50nl_cash, TotDon50PercentNoApprReqdOtherMode=tot_50nl_other,
                TotDon50PercentNoApprReqd=tot_50nl, TotEligibleDon50Percent=tot_50nl_elig,
            ) if donee_50_nolimit else None,
            Don50PercentApprReqd=Don50PercentApprReqdModel(
                DoneeWithPan=donee_50_limit,
                TotDon50PercentApprReqdCash=tot_50l_cash, TotDon50PercentApprReqdOtherMode=tot_50l_other,
                TotDon50PercentApprReqd=tot_50l, TotEligibleDon50PercentApprReqd=tot_50l_elig,
            ) if donee_50_limit else None,
            Don100PercentApprReqd=Don100PercentApprReqdModel(
                DoneeWithPan=donee_100_limit,
                TotDon100PercentApprReqdCash=tot_100l_cash, TotDon100PercentApprReqdOtherMode=tot_100l_other,
                TotDon100PercentApprReqd=tot_100l, TotEligibleDon100PercentApprReqd=tot_100l_elig,
            ) if donee_100_limit else None,
            TotalDonationsUs80GCash=total_cash,
            TotalDonationsUs80GOtherMode=total_other,
            TotalDonationsUs80G=total_all,
            TotalEligibleDonationsUs80G=total_elig,
        )