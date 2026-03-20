"""
ITR1 Deduction Building Service - Handles all Chapter VIA deduction building logic.
This includes sections 80C, 80D, 80E, 80G, 80GGA, 80GGC, etc.
"""
import logging
from typing import Any, Dict

from domain.filing.itr.itr1.models.itr1_model import (
    AddressDetailModel,
    Don100PercentApprReqdModel,
    Don100PercentModel,
    Don50PercentApprReqdModel,
    Don50PercentNoApprReqdModel,
    DonationDtlsSciRsrchRuralDevItem,
    DoneeWithPanModel,
    ITR1DeductionsPartModel,
    RelevantClauseUndrDedClaimedEnum,
    Schedule80CDtlModel,
    Schedule80CModel,
    Schedule80GGAModel,
    Schedule80GGCDetailModel,
    Schedule80GGCModel,
    Schedule80GModel,
)
from domain.filing.models.filing_model import FilingModel

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
    _SECTION_80TTA_MAX_ALLOWED =1000
    _SECTION_80TTB_MAX_ALLOWED = 1000
    _SECTION_80CCH_MAX_ALLOWED = 288000
    _SECTION_80GG_MAX_ALLOWED = 60000
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
        
        Each section method handles regime check and returns {user_claimed, allowed, schedule, ...}
        """
        UsrDeductUndChapVIA: dict[str, Any] = {
            "Section80C": 0,
            "Section80CCC": 0,
            "Section80CCDEmployeeOrSE": 0,
            "Section80CCD1B": 0,
            "Section80CCDEmployer": 0,
            "PRANNum": None,
            "Section80DD": 0,
            "Section80E": 0,
            "Section80EE": 0,
            "Section80EEB": 0,
            "Section80GGC": 0,
            "Section80GGA": 0,
            "Section80G": 0,
            "Section80GG": 0,
            "Section80U": 0,
            "Section80D": 0,
            "Section80TTA": 0,
            "Section80TTB": 0,
            "AnyOthSec80CCH": 0,
            "Form10BAAckNum": "",
            "Section80DDB": 0,
            "TotalChapVIADeductions": 0,
        }

        DeductUndChapVIA: Dict[str, Any] = {
            "Section80C": 0,
            "Section80CCC": 0,
            "Section80CCDEmployeeOrSE": 0,
            "Section80CCD1B": 0,
            "Section80CCDEmployer": 0,
            "Section80GGA": 0,
            "Section80GGC": 0,
            "Section80DDB": 0,
            "Section80DD": 0,
            "Section80E": 0,
            "Section80EE": 0,
            "Section80EEB": 0,
            "Section80GG": 0,
            "Section80U": 0,
            "Section80D": 0,
            "Section80G": 0,
            "Section80TTA": 0,
            "Section80TTB": 0,
            "AnyOthSec80CCH": 0,
            "Section80EEA": 0,
            "TotalChapVIADeductions": 0,
        }
        
        # Apply each section - each method checks regime and calculates user_claimed/allowed
        regime = regime or "old"
        result_80c = self._apply_section_80c(filing, gross_tot_income, regime)
        UsrDeductUndChapVIA["Section80C"] = result_80c["user_claimed"]
        DeductUndChapVIA["Section80C"] = result_80c["allowed"]
        
        result_80ccc = self._apply_section_80ccc(filing, gross_tot_income, result_80c["allowed"], regime)
        UsrDeductUndChapVIA["Section80CCC"] = result_80ccc["user_claimed"]
        UsrDeductUndChapVIA["PRANNum"] = result_80ccc.get("pran_num") or None
        DeductUndChapVIA["Section80CCC"] = result_80ccc["allowed"]
        
        result_80ccd1 = self._apply_section_80ccd1(
            filing, gross_tot_income, result_80c["allowed"], result_80ccc["allowed"], regime
        )
        UsrDeductUndChapVIA["Section80CCDEmployeeOrSE"] = result_80ccd1["user_claimed"]
        DeductUndChapVIA["Section80CCDEmployeeOrSE"] = result_80ccd1["allowed"]
        
        result_80ccd1b = self._apply_section_80ccd1b(filing, gross_tot_income, regime)
        UsrDeductUndChapVIA["Section80CCD1B"] = result_80ccd1b["user_claimed"]
        DeductUndChapVIA["Section80CCD1B"] = result_80ccd1b["allowed"]
        
        result_80ccd2 = self._apply_section_80ccd2(filing, gross_tot_income, regime)
        UsrDeductUndChapVIA["Section80CCDEmployer"] = result_80ccd2["user_claimed"]
        DeductUndChapVIA["Section80CCDEmployer"] = result_80ccd2["allowed"]
        
        result_80d = self._apply_section_80d(filing, regime)
        UsrDeductUndChapVIA["Section80D"] = result_80d["user_claimed"]
        DeductUndChapVIA["Section80D"] = result_80d["allowed"]
        
        result_80dd = self._apply_section_80dd(filing, gross_tot_income, regime)
        UsrDeductUndChapVIA["Section80DD"] = result_80dd["user_claimed"]
        DeductUndChapVIA["Section80DD"] = result_80dd["allowed"]
        
        result_80e = self._apply_section_80e(filing, regime)
        UsrDeductUndChapVIA["Section80E"] = result_80e["user_claimed"]
        DeductUndChapVIA["Section80E"] = result_80e["allowed"]
        
        result_80ee = self._apply_section_80ee(filing, regime)
        UsrDeductUndChapVIA["Section80EE"] = result_80ee["user_claimed"]
        DeductUndChapVIA["Section80EE"] = result_80ee["allowed"]
        
        result_80eeb = self._apply_section_80eeb(filing, regime)
        UsrDeductUndChapVIA["Section80EEB"] = result_80eeb["user_claimed"]
        DeductUndChapVIA["Section80EEB"] = result_80eeb["allowed"]
        
        result_80u = self._apply_section_80u(filing, regime)
        UsrDeductUndChapVIA["Section80U"] = result_80u["user_claimed"]
        DeductUndChapVIA["Section80U"] = result_80u["allowed"]
        
        result_80gga = self._apply_section_80gga(filing, context, regime)
        UsrDeductUndChapVIA["Section80GGA"] = result_80gga["user_claimed"]
        DeductUndChapVIA["Section80GGA"] = result_80gga["allowed"]
        
        result_80ggc = self._apply_section_80ggc(filing, regime)
        UsrDeductUndChapVIA["Section80GGC"] = result_80ggc["user_claimed"]
        DeductUndChapVIA["Section80GGC"] = result_80ggc["allowed"]
        
        result_80ddb = self._apply_section_80ddb(filing, regime)
        UsrDeductUndChapVIA["Section80DDB"] = result_80ddb["user_claimed"]
        DeductUndChapVIA["Section80DDB"] = result_80ddb["allowed"]
        
        result_other = self._apply_other_deductions(filing, regime)
        UsrDeductUndChapVIA["Section80TTA"] = result_other["Section80TTA"]["user_claimed"]
        UsrDeductUndChapVIA["Section80TTB"] = result_other["Section80TTB"]["user_claimed"]
        UsrDeductUndChapVIA["AnyOthSec80CCH"] = result_other["Section80CCH"]["user_claimed"]
        UsrDeductUndChapVIA["Section80GG"] = result_other["Section80GG"]["user_claimed"]
        UsrDeductUndChapVIA["Form10BAAckNum"] = result_other.get("Form10BAAckNum", "")
        DeductUndChapVIA["Section80TTA"] = result_other["Section80TTA"]["allowed"]
        DeductUndChapVIA["Section80TTB"] = result_other["Section80TTB"]["allowed"]
        DeductUndChapVIA["AnyOthSec80CCH"] = result_other["Section80CCH"]["allowed"]
        DeductUndChapVIA["Section80GG"] = result_other["Section80GG"]["allowed"]
        
        # Calculate 80G last (depends on total_income without 80G)
        context.total_deductions_without_80g = sum([
            DeductUndChapVIA["Section80C"],
            DeductUndChapVIA["Section80CCC"],
            DeductUndChapVIA["Section80CCDEmployeeOrSE"],
            DeductUndChapVIA["Section80CCD1B"],
            DeductUndChapVIA["Section80CCDEmployer"],
            DeductUndChapVIA["Section80GGA"],
            DeductUndChapVIA["Section80GGC"],
            DeductUndChapVIA["Section80DD"],
            DeductUndChapVIA["Section80E"],
            DeductUndChapVIA["Section80EEB"],
            DeductUndChapVIA["Section80TTA"],
            DeductUndChapVIA["Section80TTB"],
            DeductUndChapVIA["AnyOthSec80CCH"],
            DeductUndChapVIA["Section80GG"],
        ])
        
        result_80g = self._apply_section_80g(filing, context, regime)
        UsrDeductUndChapVIA["Section80G"] = result_80g["user_claimed"]
        DeductUndChapVIA["Section80G"] = result_80g["allowed"]

        # Calculate totals
        UsrDeductUndChapVIA["TotalChapVIADeductions"] = sum([
            UsrDeductUndChapVIA["Section80C"],
            UsrDeductUndChapVIA["Section80CCC"],
            UsrDeductUndChapVIA["Section80CCDEmployeeOrSE"],
            UsrDeductUndChapVIA["Section80CCD1B"],
            UsrDeductUndChapVIA["Section80CCDEmployer"],
            UsrDeductUndChapVIA["Section80D"],
            UsrDeductUndChapVIA["Section80DD"],
            UsrDeductUndChapVIA["Section80E"],
            UsrDeductUndChapVIA["Section80EE"],
            UsrDeductUndChapVIA["Section80EEB"],
            UsrDeductUndChapVIA["Section80G"],
            UsrDeductUndChapVIA["Section80GG"],
            UsrDeductUndChapVIA["Section80GGA"],
            UsrDeductUndChapVIA["Section80GGC"],
            UsrDeductUndChapVIA["Section80U"],
            UsrDeductUndChapVIA["Section80TTA"],
            UsrDeductUndChapVIA["Section80TTB"],
            UsrDeductUndChapVIA["AnyOthSec80CCH"],
        ])
        
        DeductUndChapVIA["TotalChapVIADeductions"] = context.total_deductions_without_80g + DeductUndChapVIA["Section80G"]
        
        total_income = max(0, int(gross_tot_income - DeductUndChapVIA["TotalChapVIADeductions"]))
        
        schedules = {
                "Schedule80G": result_80g.get("schedule"),
                "Schedule80GGA": result_80gga.get("schedule"),
                "Schedule80GGC": result_80ggc.get("schedule"),
                "Schedule80D": result_80d.get("schedule"),
                "Schedule80DD": result_80dd.get("schedule"),
                "Schedule80U": result_80u.get("schedule"),
                "Schedule80E": result_80e.get("schedule"),
                "Schedule80EE": result_80ee.get("schedule"),
                "Schedule80EEB": result_80eeb.get("schedule"),
                
                "Schedule80C": result_80c.get("schedule"),
               
            }
        
        deductions_part = ITR1DeductionsPartModel.model_validate({
            "UsrDeductUndChapVIA": UsrDeductUndChapVIA,
            "DeductUndChapVIA": DeductUndChapVIA,
            "TotalIncome": total_income,
        })

        return deductions_part, schedules

    # --- Section-wise application methods ---
    
    def _apply_section_80c(
        self, filing: FilingModel, gross_tot_income: float, regime: str
    ) -> Dict[str, Any]:
        """Section 80C: LIC, PPF, ELSS, etc."""
        user_claimed = int(sum(section_80c.amount or 0 for section_80c in filing.section_80c or []))
        if regime.upper() == "NEW":
            filing.chapterVIADeductions.section_80c.claimed = user_claimed
            filing.chapterVIADeductions.section_80c.allowed = 0
            return {"user_claimed": user_claimed, "allowed": 0, "schedule": None}

        schedule = self.build_schedule_80c(filing)
        total_income = max(0, int(gross_tot_income))
        pool_150k = min(self._SECTION_80C_80CCC_MAX_ALLOWED, total_income)
        allowed = min(user_claimed, pool_150k)
        
        filing.chapterVIADeductions.section_80c.allowed = allowed
        filing.chapterVIADeductions.section_80c.max_allowed = self._SECTION_80C_80CCC_MAX_ALLOWED
        
        return {"user_claimed": user_claimed, "allowed": allowed, "schedule": schedule}
    
    def _apply_section_80ccc(
        self, filing: FilingModel, gross_tot_income: float, section_80c_allowed: int, regime: str
    ) -> Dict[str, Any]:
        """Section 80CCC: Pension schemes."""
        user_claimed = int(sum(item.amount for item in filing.section_80ccc or []))
        pran_num = filing.section_80ccc[0].pran_number if filing.section_80ccc else ""
        if regime.upper() == "NEW" or not filing.section_80ccc:
            filing.chapterVIADeductions.section_80ccc.claimed = user_claimed
            filing.chapterVIADeductions.section_80ccc.allowed = 0
            return {"user_claimed": user_claimed, "allowed": 0, "pran_num": pran_num}

        total_income = max(0, int(gross_tot_income))
        pool_150k = min(self._SECTION_80C_80CCC_MAX_ALLOWED, total_income)
        remaining = max(0, pool_150k - section_80c_allowed)
        allowed = min(user_claimed, remaining)
        
        filing.chapterVIADeductions.section_80ccc.claimed = user_claimed
        filing.chapterVIADeductions.section_80ccc.allowed = allowed
        filing.chapterVIADeductions.section_80ccc.max_allowed = min(self._SECTION_80C_80CCC_MAX_ALLOWED, int(gross_tot_income))
        
        return {"user_claimed": user_claimed, "allowed": allowed, "pran_num": pran_num}
    
    def _apply_section_80ccd1(
        self,
        filing: FilingModel,
        gross_tot_income: float,
        section_80c_allowed: int,
        section_80ccc_allowed: int,
        regime: str,
    ) -> Dict[str, Any]:
        """Section 80CCD(1): NPS contributions by employee/self-employed."""
        user_claimed = int(sum(item.amount for item in filing.section_80ccd1 or []))
        if regime.upper() == "NEW" or not filing.section_80ccd1:
            filing.chapterVIADeductions.section_80ccd1.claimed = user_claimed
            filing.chapterVIADeductions.section_80ccd1.allowed = 0
            return {"user_claimed": user_claimed, "allowed": 0}
        
        total_income = max(0, int(gross_tot_income))
        pool_150k = min(self._SECTION_80C_80CCC_MAX_ALLOWED, total_income)
        remaining = max(0, pool_150k - section_80c_allowed - section_80ccc_allowed)
        allowed = min(user_claimed, remaining)
        
        filing.chapterVIADeductions.section_80ccd1.claimed = user_claimed
        filing.chapterVIADeductions.section_80ccd1.allowed = allowed
        filing.chapterVIADeductions.section_80ccd1.max_allowed = (
            min(self._SECTION_80C_80CCC_MAX_ALLOWED, int(gross_tot_income)) - section_80c_allowed - section_80ccc_allowed
        )
        
        return {"user_claimed": user_claimed, "allowed": allowed}
    
    def _apply_section_80ccd1b(
        self, filing: FilingModel, gross_tot_income: float, regime: str
    ) -> Dict[str, Any]:
        """Section 80CCD(1B): Additional NPS contribution (over and above 80C limit)."""
        user_claimed = int(sum(item.amount for item in filing.section_80ccd1b or []))
        if regime.upper() == "NEW" or not filing.section_80ccd1b:
            filing.chapterVIADeductions.section_80ccd1b.claimed = user_claimed
            filing.chapterVIADeductions.section_80ccd1b.allowed = 0
            return {"user_claimed": user_claimed, "allowed": 0}
        total_income = max(0, int(gross_tot_income))
        allowed = int(min(user_claimed, self._SECTION_80CCD1B_MAX_ALLOWED, total_income))
        
        filing.chapterVIADeductions.section_80ccd1b.claimed = user_claimed
        filing.chapterVIADeductions.section_80ccd1b.allowed = allowed
        filing.chapterVIADeductions.section_80ccd1b.max_allowed = min(self._SECTION_80CCD1B_MAX_ALLOWED, int(gross_tot_income))
        
        return {"user_claimed": user_claimed, "allowed": allowed}
    
    def _apply_section_80ccd2(
        self, filing: FilingModel, gross_tot_income: float, regime: str
    ) -> Dict[str, Any]:
        """Section 80CCD(2): Employer NPS contribution."""
        user_claimed = int(sum(item.amount for item in filing.section_80ccd2 or []))
        if regime.upper() == "NEW" or not filing.section_80ccd2:
            filing.chapterVIADeductions.section_80ccd2.claimed = user_claimed
            filing.chapterVIADeductions.section_80ccd2.allowed = 0
            return {"user_claimed": user_claimed, "allowed": 0}

        total_income = max(0, int(gross_tot_income))
        allowed = int(min(user_claimed, total_income))
        
        filing.chapterVIADeductions.section_80ccd2.claimed = user_claimed
        filing.chapterVIADeductions.section_80ccd2.allowed = allowed
        
        return {"user_claimed": user_claimed, "allowed": round(allowed)}
    
    def _apply_section_80d(self, filing: FilingModel, regime: str) -> Dict[str, Any]:
        """Section 80D: Health insurance premium, preventive checkup, medical expenditure."""
        section_80d_details = self.build_section_80d(filing)
        # UserClaimedTotal  = raw sum of (premium + preventive + medical) entered
        # AllowedTotal       = capped deduction: premium + preventive [+ medical only for senior with no insurance]
        user_claimed = section_80d_details.get("UserClaimedTotal", 0)
        allowed_amount = section_80d_details.get("AllowedTotal", 0)
        # Dynamic max: sum of whichever caps actually apply per bucket
        s80d = section_80d_details.get("section_80d", {})
        self_senior_flag = s80d.get("SeniorCitizenFlag", "S")
        parents_senior_flag = s80d.get("ParentsSeniorCitizenFlag", "P")
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
            return {"user_claimed": user_claimed, "allowed": 0, "schedule": None}

        filing.chapterVIADeductions.section_80d.claimed = user_claimed
        filing.chapterVIADeductions.section_80d.allowed = allowed_amount
        filing.chapterVIADeductions.section_80d.max_allowed = max_allowed
        return {"user_claimed": user_claimed, "allowed": allowed_amount, "schedule": s80d}
    
    def _apply_section_80dd(
        self, filing: FilingModel, gross_tot_income: float, regime: str
    ) -> Dict[str, Any]:
        """Section 80DD: Medical treatment of dependent with disability."""
        schedule = self.build_schedule_80dd(filing)
        user_claimed = int(getattr(filing.section_80dd, "expenditure_incurred", 0) or 0)
        if regime.upper() == "NEW" or not filing.section_80dd or schedule is None:
            return {"user_claimed": user_claimed, "allowed": 0, "schedule": None}

        user_claimed = schedule.get("DeductionAmount", 0)
        nature_of_disability = schedule.get("NatureOfDisability", "1")
        total_income = max(0, int(gross_tot_income))
        
        if nature_of_disability == "1":
            allowed = min(user_claimed, 75000, total_income)
        else:
            allowed = min(user_claimed, 125000, total_income)
        
        filing.chapterVIADeductions.section_80dd.claimed = user_claimed
        filing.chapterVIADeductions.section_80dd.allowed = allowed
        filing.chapterVIADeductions.section_80dd.max_allowed = user_claimed
        
        return {"user_claimed": user_claimed, "allowed": allowed, "schedule": schedule}
    
    def _apply_section_80e(self, filing: FilingModel, regime: str) -> Dict[str, Any]:
        """Section 80E: Interest on education loan."""
        user_claimed = int(sum(item.itr_interest_80e or 0 for item in filing.section_80e or []))
        if regime.upper() == "NEW" or not filing.section_80e:
            return {"user_claimed": user_claimed, "allowed": 0, "schedule": None}

        schedule = self.build_schedule_80e(filing)
        allowed = schedule.get("TotalInterest80E", 0)

        return {"user_claimed": user_claimed, "allowed": allowed, "schedule": schedule}
    
    def _apply_section_80ee(self, filing: FilingModel, regime: str) -> Dict[str, Any]:
        """Section 80EE: Interest on home loan."""
        user_claimed = int(getattr(filing.section_80ee, "itr_interest_80e", 0) or 0)
        if regime.upper() == "NEW" or not filing.section_80ee:
            return {"user_claimed": user_claimed, "allowed": 0, "schedule": None}

        schedule = self.build_schedule_80ee(filing)
        allowed = schedule.get("TotalInterest80EE", 0)

        return {"user_claimed": user_claimed, "allowed": allowed, "schedule": schedule}
    
    def _apply_section_80eeb(self, filing: FilingModel, regime: str) -> Dict[str, Any]:
        """Section 80EEB: Interest on electric vehicle loan."""
        user_claimed = int(getattr(filing.section_80eeb, "itr_interest_80e", 0) or 0)
        if regime.upper() == "NEW" or not filing.section_80eeb:
            return {"user_claimed": user_claimed, "allowed": 0, "schedule": None}

        schedule = self.build_schedule_80eeb(filing)
        allowed = schedule.get("TotalInterest80EEB", 0)

        return {"user_claimed": user_claimed, "allowed": allowed, "schedule": schedule}
    
    def _apply_section_80u(self, filing: FilingModel, regime: str) -> Dict[str, Any]:
        """Section 80U: Person with disability."""
        user_claimed = int(getattr(filing.section_80u, "expenditure_incurred", 0) or 0)
        if regime.upper() == "NEW" or not filing.section_80u:
            return {"user_claimed": user_claimed, "allowed": 0, "schedule": None}

        schedule = self.build_schedule_80u(filing)
        allowed = schedule.get("DeductionAmount", 0)

        return {"user_claimed": user_claimed, "allowed": allowed, "schedule": schedule}
    def _apply_section_80gga(
        self, filing: FilingModel, context: Itr1ComputationContext, regime: str
    ) -> Dict[str, Any]:
        """Section 80GGA: Donations for scientific research."""
        user_claimed = int(
            sum(
                (item.donation_amount_cash or 0) + (item.donation_amount_non_cash or 0)
                for item in filing.section_80gga or []
            )
        )
        if regime.upper() == "NEW":
            return {"user_claimed": user_claimed, "allowed": 0, "schedule": None}

        schedule = self.build_schedule_80gga(filing, context)
        allowed = int(getattr(schedule, "TotalEligibleDonationAmt80GGA", 0))

        return {"user_claimed": user_claimed, "allowed": allowed, "schedule": schedule}
    def _apply_section_80ddb(self, filing: FilingModel, regime: str) -> Dict[str, Any]:
        """Section 80DDB: Medical treatment of dependent with disability."""
        user_claimed = int(getattr(filing.section_80ddb, "expenditure_incurred", 0) or 0)
        if regime.upper() == "NEW" or not filing.section_80ddb:
            return {"user_claimed": user_claimed, "allowed": 0, "schedule": None}
        schedule = self.build_section_80ddb(filing)
        allowed = schedule.get("Section80DDB_calc", 0)
        return {"user_claimed": user_claimed, "allowed": allowed, "schedule": schedule}
    def _apply_section_80ggc(self, filing: FilingModel, regime: str) -> Dict[str, Any]:
        """Section 80GGC: Contribution to political party."""
        user_claimed = int(
            sum(
                (item.contribution_amount_cash or 0) + (item.contribution_amount_non_cash or 0)
                for item in filing.section_80ggc or []
            )
        )
        if regime.upper() == "NEW" or not filing.section_80ggc:
            return {"user_claimed": user_claimed, "allowed": 0, "schedule": None}

        schedule = self.build_schedule_80ggc(filing)
        allowed = int(getattr(schedule, "TotalEligibleDonationAmt80GGC", 0))

        return {"user_claimed": user_claimed, "allowed": allowed, "schedule": schedule}
    
    def _apply_section_80g(
        self, filing: FilingModel, context: Itr1ComputationContext, regime: str
    ) -> Dict[str, Any]:
        """Section 80G: Donations."""
        user_claimed = int(
            sum(
                (item.donation_amount_cash or 0) + (item.donation_amount_non_cash or 0)
                for item in filing.section_80g or []
            )
        )
        if regime.upper() == "NEW" or not filing.section_80g:
            return {"user_claimed": user_claimed, "allowed": 0, "schedule": None}

        schedule = self.build_schedule_80g(filing)
        allowed = int(schedule.TotalEligibleDonationsUs80G)

        return {"user_claimed": user_claimed, "allowed": allowed, "schedule": schedule}
    
    def _apply_other_deductions(self, filing: FilingModel, regime: str) -> Dict[str, Any]:
        """Other deductions: 80TTA, 80TTB, 80CCH, 80GG."""
        result = self.build_other_deductions(filing) if filing.other_deductions else {}
        user_claimed = {
            "Section80TTA": result.get("Section80TTA", 0),
            "Section80TTB": result.get("Section80TTB", 0),
            "Section80CCH": result.get("AnyOthSec80CCH", 0),
            "Section80GG": result.get("Section80GG", 0),
        }
        if regime.upper() == "NEW" or not filing.other_deductions:
            return {
                "Section80TTA": {"user_claimed": user_claimed["Section80TTA"], "allowed": 0},
                "Section80TTB": {"user_claimed": user_claimed["Section80TTB"], "allowed": 0},
                "Section80CCH": {"user_claimed": user_claimed["Section80CCH"], "allowed": 0},
                "Section80GG": {"user_claimed": user_claimed["Section80GG"], "allowed": 0},
                "Form10BAAckNum": result.get("Form10BAAckNum", ""),
            }

        return {
            "Section80TTA": {
                "user_claimed": user_claimed["Section80TTA"],
                "allowed": result.get("Section80TTA_calc", 0),
            },
            "Section80TTB": {
                "user_claimed": user_claimed["Section80TTB"],
                "allowed": result.get("Section80TTB_calc", 0),
            },
            "Section80CCH": {
                "user_claimed": user_claimed["Section80CCH"],
                "allowed": result.get("AnyOthSec80CCH_calc", 0),
            },
            "Section80GG": {
                "user_claimed": user_claimed["Section80GG"],
                "allowed": result.get("Section80GG_calc", 0),
            },
            "Form10BAAckNum": result.get("Form10BAAckNum", ""),
        }
   
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

    def build_schedule_80u(self, filing: FilingModel) -> dict[str, Any]:
        """Build Schedule 80U."""
        total_amt_80u: int = 0
        if filing.regime == "NEW":
            return {}
        else:
            Schedule80U: dict[str, Any] = {}
            if filing.section_80u:
                total_amt_80u += int(filing.section_80u.expenditure_incurred or 0)

                Schedule80U = {
                    "NatureOfDisability": "1" if filing.section_80u.disability_type == "Disabled" else "2",
                    "TypeOfDisability": "1",
                    "DeductionAmount": 75000,
                    "Form10IAAckNum": "123456789012345",
                }
            return Schedule80U

    def build_schedule_80dd(self, filing: FilingModel) -> dict[str, Any] | None:
        """Build Schedule 80DD. Returns None when not applicable (NEW regime or no section_80dd)."""
        if filing.regime == "NEW" or not filing.section_80dd:
            return None
        return {
            "NatureOfDisability": filing.section_80dd.itr_nature_of_disability,
            "TypeOfDisability": filing.section_80dd.itr_type_of_disability,
            "DeductionAmount": filing.section_80dd.itr_deduction_amount,
            "DependentType": filing.section_80dd.itr_dependent_type,
            "DependentPan": filing.section_80dd.itr_dependent_pan,
            "DependentAadhaar": filing.section_80dd.udid_no,
            "Form10IAAckNum": filing.section_80dd.itr_form10ia_ack_num,
            "UDIDNum": filing.section_80dd.itr_udid_num,
        }

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

    
    def build_schedule_80e(self, filing: FilingModel) -> dict[str, Any]:
        """Build Schedule 80E."""
        schedule_80e_dtls: list[dict[str, Any]] = []
        total_interest_80e: int = 0
        if filing.regime == "NEW":
            return {"Schedule80EDtls": [], "TotalInterest80E": 0}
        else:
            for section_80e in filing.section_80e:
                total_interest_80e += section_80e.itr_interest_80e
                schedule_80e_dtls.append(
                    {
                        "LoanTknFrom": section_80e.itr_loan_tkn_from,
                        "BankOrInstnName": section_80e.itr_bank_or_instn_name ,
                        "LoanAccNoOfBankOrInstnRefNo": section_80e.itr_loan_acc_ref ,
                        "DateofLoan": section_80e.itr_dateofloan ,
                        "TotalLoanAmt": section_80e.itr_total_loan_amt ,
                        "LoanOutstndngAmt": section_80e.itr_loan_outstanding_amt ,
                        "Interest80E": section_80e.itr_interest_80e ,
                    }
                )

        return {"Schedule80EDtls": schedule_80e_dtls, "TotalInterest80E": total_interest_80e}

    def build_schedule_80ee(self, filing: FilingModel) -> dict[str, Any]:
        """Build Schedule 80EE."""
        schedule_80ee_dtls: list[dict[str, Any]] = []
        total_interest_80ee: int = 0
        # Do not check filing.regime here; _apply_section_80ee already returns None for NEW regime
        section_80ee = filing.section_80ee
        if section_80ee is not None:
            total_interest_80ee = section_80ee.itr_interest_80e
            schedule_80ee_dtls.append(
                {
                    "LoanTknFrom": section_80ee.itr_loan_tkn_from,
                    "BankOrInstnName": section_80ee.itr_bank_or_instn_name,
                    "LoanAccNoOfBankOrInstnRefNo": section_80ee.itr_loan_acc_ref,
                    "DateofLoan": section_80ee.itr_dateofloan,
                    "TotalLoanAmt": section_80ee.itr_total_loan_amt,
                    "LoanOutstndngAmt": section_80ee.itr_loan_outstanding_amt,
                    "Interest80EE": section_80ee.itr_interest_80e,
                }
            )
        return {"Schedule80EEDtls": schedule_80ee_dtls, "TotalInterest80EE": total_interest_80ee}
    def build_schedule_80eeb(self, filing: FilingModel) -> dict[str, Any]:
        """Build Schedule 80EEB."""
        schedule_80eeb_dtls: list[dict[str, Any]] = []
        total_interest_80eeb: int = 0
        if filing.regime == "NEW":
            return {"Schedule80EEBDtls": [], "TotalInterest80EEB": 0}
        section_80eeb = filing.section_80eeb
        if section_80eeb is not None:
            total_interest_80eeb = section_80eeb.itr_interest_80e
            schedule_80eeb_dtls.append(
                {
                    "LoanTknFrom": section_80eeb.itr_loan_tkn_from,
                    "BankOrInstnName": section_80eeb.itr_bank_or_instn_name,
                    "LoanAccNoOfBankOrInstnRefNo": section_80eeb.itr_loan_acc_ref,
                    "DateofLoan": section_80eeb.itr_dateofloan,
                    "TotalLoanAmt": section_80eeb.itr_total_loan_amt,
                    "LoanOutstndngAmt": section_80eeb.itr_loan_outstanding_amt,
                    "VehicleRegNo": section_80eeb.itr_vehicle_reg_no,
                    "Interest80EEB": section_80eeb.itr_interest_80e,
                }
            )
        return {"Schedule80EEBDtls": schedule_80eeb_dtls, "TotalInterest80EEB": total_interest_80eeb}

    def build_section_80d(self, filing: FilingModel) -> dict[str, Any]:
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
            return {}

        _PREV_CAP = self._SECTION_80D_PREVENTIVE_CAP
        _SELF_TAKEN_FOR = {"Self", "Self & Family"}

        # ── Accumulators ────────────────────────────────────────────────────────
        self_premium: float = 0
        self_preventive: float = 0
        self_medical: float = 0
        self_senior: bool = False
        self_ins_non_sr: list[dict[str, Any]] = []
        self_ins_sr: list[dict[str, Any]] = []

        parent_premium: float = 0
        parent_preventive: float = 0
        parent_medical: float = 0
        parent_senior: bool = False
        parent_ins_non_sr: list[dict[str, Any]] = []
        parent_ins_sr: list[dict[str, Any]] = []

        # ── Health Insurance ─────────────────────────────────────────────────────
        for hi in (filing.section_80d.health_insurance or []):
            amt = float(hi.health_insurance_premium or 0)
            ins_row: dict[str, Any] = {
                "InsurerName": hi.itr_insurer_name or "",
                "PolicyNo": hi.itr_policy_no or "",
                "HealthInsAmt": hi.itr_health_ins_amt,
            }
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

        # ── Build output dict matching Sec80DSelfFamSrCtznHealthModel ─────────────
        section_80d: dict[str, Any] = {
            "SeniorCitizenFlag": senior_flag,
            # Non-senior self/family sub-bucket (only when not senior)
            "SelfAndFamily": (self_deduction if not self_senior else None),
            "HealthInsPremSlfFam": (int(self_premium) if not self_senior else None),
            "Sec80DSelfFamHIDtls": (
                {"Sch80DInsDtls": self_ins_non_sr, "TotalPayments": int(self_premium)}
                if not self_senior and self_ins_non_sr
                else None
            ),
            "PrevHlthChckUpSlfFam": (int(self_preventive) if not self_senior else None),
            # Senior self/family sub-bucket (only when senior)
            "SelfAndFamilySeniorCitizen": (self_deduction if self_senior else None),
            "HlthInsPremSlfFamSrCtzn": (int(self_premium) if self_senior else None),
            "Sec80DSelfFamSrCtznHIDtls": (
                {"Sch80DInsDtls": self_ins_sr, "TotalPayments": int(self_premium)}
                if self_senior and self_ins_sr
                else None
            ),
            "PrevHlthChckUpSlfFamSrCtzn": (int(self_preventive) if self_senior else None),
            "MedicalExpSlfFamSrCtzn": (int(self_medical) if self_senior else None),
            # Parents
            "ParentsSeniorCitizenFlag": parents_flag,
            # Non-senior parents sub-bucket
            "Parents": (parent_deduction if not parent_senior else None),
            "HlthInsPremParents": (int(parent_premium) if not parent_senior else None),
            "Sec80DParentsHIDtls": (
                {"Sch80DInsDtls": parent_ins_non_sr, "TotalPayments": int(parent_premium)}
                if not parent_senior and parent_ins_non_sr
                else None
            ),
            "PrevHlthChckUpParents": (int(parent_preventive) if not parent_senior else None),
            # Senior parents sub-bucket
            "ParentsSeniorCitizen": (parent_deduction if parent_senior else None),
            "HlthInsPremParentsSrCtzn": (int(parent_premium) if parent_senior else None),
            "Sec80DParentsSrCtznHIDtls": (
                {"Sch80DInsDtls": parent_ins_sr, "TotalPayments": int(parent_premium)}
                if parent_senior and parent_ins_sr
                else None
            ),
            "PrevHlthChckUpParentsSrCtzn": (int(parent_preventive) if parent_senior else None),
            "MedicalExpParentsSrCtzn": (int(parent_medical) if parent_senior else None),
            "EligibleAmountOfDedn": total_deduction,
        }
        raw_total = int(
            self_premium + self_preventive + self_medical
            + parent_premium + parent_preventive + parent_medical
        )
        return {
            "section_80d": {"Sec80DSelfFamSrCtznHealth": section_80d},
            "UserClaimedTotal": raw_total,
            "AllowedTotal": total_deduction,  # capped: premium+preventive[+medical for senior]
        }

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

    def build_schedule_80g(self, filing: FilingModel) -> Schedule80GModel:
        context = Itr1ComputationContext()
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
            ),
            Don50PercentNoApprReqd=Don50PercentNoApprReqdModel(
                DoneeWithPan=donee_50_nolimit,
                TotDon50PercentNoApprReqdCash=tot_50nl_cash, TotDon50PercentNoApprReqdOtherMode=tot_50nl_other,
                TotDon50PercentNoApprReqd=tot_50nl, TotEligibleDon50Percent=tot_50nl_elig,
            ),
            Don50PercentApprReqd=Don50PercentApprReqdModel(
                DoneeWithPan=donee_50_limit,
                TotDon50PercentApprReqdCash=tot_50l_cash, TotDon50PercentApprReqdOtherMode=tot_50l_other,
                TotDon50PercentApprReqd=tot_50l, TotEligibleDon50PercentApprReqd=tot_50l_elig,
            ),
            Don100PercentApprReqd=Don100PercentApprReqdModel(
                DoneeWithPan=donee_100_limit,
                TotDon100PercentApprReqdCash=tot_100l_cash, TotDon100PercentApprReqdOtherMode=tot_100l_other,
                TotDon100PercentApprReqd=tot_100l, TotEligibleDon100PercentApprReqd=tot_100l_elig,
            ),
            TotalDonationsUs80GCash=total_cash,
            TotalDonationsUs80GOtherMode=total_other,
            TotalDonationsUs80G=total_all,
            TotalEligibleDonationsUs80G=total_elig,
        )