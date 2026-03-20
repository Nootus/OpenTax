"""
ITR Building Orchestrator – single entry-point that decides ITR1 vs ITR2
and delegates to the appropriate building service.

Selection logic (if **any** of the following are true → ITR-2):
  1. Real-estate capital gains exist
  2. Foreign capital gains exist
  3. Movable / deemed capital gains exist
  4. LTCG u/s 112A on securities exceeds ₹1,25,000
  5. More than one house property
  6. Agricultural income > ₹5,000
  7. Foreign income exists (salary / other income from abroad)
  8. Total income > ₹50 lakh (after all heads, before deductions)

Otherwise → ITR-1.
"""
import logging
import re
from datetime import date, datetime
from decimal import Decimal
from typing import Any, List, Optional

from domain.core.utils.tax_filing_helpers import compute_age

from domain.filing.itr.models.filing_build_itr_return_model import FilingBuildItrReturnModel
from domain.filing.itr.itr1.models.itr1_model import (
    CollectedYrEnum,
    EmployerOrDeductorOrCollectDetlModel,
    ScheduleTCSModel,
    TC,
    TaxPaymentModel,
    TaxesPaidModel,
)
from domain.filing.models.filing_model import FilingModel
from domain.filing.itr.itr2.models.itr2_model import (
    ScheduleTCSModel as ScheduleTCSITR2Model
)
from domain.filing.itr.itr1.itr1_building_service import Itr1BuildingService
from domain.filing.itr.itr2.itr2_building_service import Itr2BuildingService
from domain.filing.tax_calculation.tax_calculation_service import TaxCalculationService

logger = logging.getLogger(__name__)

_LTCG_112A_MAX_ITR1 = 125_000
_TOTAL_INCOME_MAX_ITR1 = 5_000_000
_AGRICULTURAL_INCOME_MAX_ITR1 = 5_000


class ItrBuildingOrchestrator:
    """Unified orchestrator: determines the correct ITR form and builds it."""

    # ITR2 schema has a strict regex of allowed TAN prefixes; keep it aligned
    # with `itr2-schema.json`'s `EmployerOrDeductorOrCollectTAN` pattern.
    _ITR2_TAN_PATTERN = re.compile(
        r"HYD[A-Z][0-9]{5}[A-Z]|VPN[A-Z][0-9]{5}[A-Z]|BBN[A-Z][0-9]{5}[A-Z]|BPL[A-Z][0-9]{5}[A-Z]|JBP[A-Z][0-9]{5}[A-Z]|CHE[A-Z][0-9]{5}[A-Z]|CMB[A-Z][0-9]{5}[A-Z]|MRI[A-Z][0-9]{5}[A-Z]|DEL[A-Z][0-9]{5}[A-Z]|CAL[A-Z][0-9]{5}[A-Z]|MRT[A-Z][0-9]{5}[A-Z]|AHM[A-Z][0-9]{5}[A-Z]|BRD[A-Z][0-9]{5}[A-Z]|RKT[A-Z][0-9]{5}[A-Z]|SRT[A-Z][0-9]{5}[A-Z]|BLR[A-Z][0-9]{5}[A-Z]|AGR[A-Z][0-9]{5}[A-Z]|KNP[A-Z][0-9]{5}[A-Z]|CHN[A-Z][0-9]{5}[A-Z]|TVD[A-Z][0-9]{5}[A-Z]|ALD[A-Z][0-9]{5}[A-Z]|LKN[A-Z][0-9]{5}[A-Z]|MUM[A-Z][0-9]{5}[A-Z]|NGP[A-Z][0-9]{5}[A-Z]|AMR[A-Z][0-9]{5}[A-Z]|JLD[A-Z][0-9]{5}[A-Z]|PTL[A-Z][0-9]{5}[A-Z]|RTK[A-Z][0-9]{5}[A-Z]|KLP[A-Z][0-9]{5}[A-Z]|NSK[A-Z][0-9]{5}[A-Z]|PNE[A-Z][0-9]{5}[A-Z]|PTN[A-Z][0-9]{5}[A-Z]|RCH[A-Z][0-9]{5}[A-Z]|JDH[A-Z][0-9]{5}[A-Z]|JPR[A-Z][0-9]{5}[A-Z]|SHL[A-Z][0-9]{5}[A-Z]"
    )

    async def build_itr(self, filing: FilingModel) -> FilingBuildItrReturnModel:
        """
        Build the appropriate ITR (1 or 2) for the given filing.

        Strategy:
          1. Run pre-build checks (determine_itr_type) — if any structural
             rule triggers, build ITR2 directly.
          2. Otherwise build ITR1 *income sections only* (no tax computation).
             Inspect the computed GrossTotIncome.
          3. If GrossTotIncome > ₹50 lakh → discard ITR1, build ITR2 instead.
          4. If GrossTotIncome ≤ ₹50 lakh → compute tax here in the orchestrator
             (shared for both ITR1 and ITR2), then finalize the form.

        Tax computation is centralised in this orchestrator via
        _compute_tax_for_regime(), which is identical for both ITR forms.

        Returns a FilingBuildItrReturnModel with itr_type, itr1/itr2, and filingSummary.
        """
        itr_type, reasons = self.determine_itr_type(filing)

        # ── Pre-build rules already require ITR2 ───────────────────────────
        if itr_type == "ITR2":
            logger.info(
                "Filing %s requires ITR2 (pre-build): %s",
                filing.filing_id, "; ".join(reasons),
            )
            itr2_svc = Itr2BuildingService()
            inc = await itr2_svc.build_itr(filing)
            self._compute_tax_for_regime(filing, inc.gross_income, inc.new_regime_deductions, inc.income_breakdown, "new")
            self._compute_tax_for_regime(filing, inc.gross_income, inc.old_regime_deductions, inc.income_breakdown, "old")
            result = await itr2_svc.finalize_from_precomputed_tax(filing)
            return FilingBuildItrReturnModel(
                itr2=result.itr2,
                itr_type="ITR2",
                filingSummary=result.filingSummary,
            )

        # ── Phase 1: Build ITR1 income sections for both regimes (no tax) ──
        itr1_svc = Itr1BuildingService()
        inc = await itr1_svc.build_itr(filing)
        logger.info(
            "Filing %s ITR1 income built — GrossTotIncome=%s",
            filing.filing_id, f"{inc.gross_income:,}",
        )

        # ── Check gross income against ₹50-lakh ceiling ────────────────────
        if inc.gross_income > _TOTAL_INCOME_MAX_ITR1:
            logger.info(
                "Filing %s GrossTotIncome=%s exceeds ₹50 lakh — upgrading to ITR2",
                filing.filing_id, f"{inc.gross_income:,}",
            )
            itr2_svc = Itr2BuildingService()
            inc2 = await itr2_svc.build_itr(filing)
            self._compute_tax_for_regime(filing, inc2.gross_income, inc2.new_regime_deductions, inc2.income_breakdown, "new")
            self._compute_tax_for_regime(filing, inc2.gross_income, inc2.old_regime_deductions, inc2.income_breakdown, "old")
            result = await itr2_svc.finalize_from_precomputed_tax(filing)
            
            return FilingBuildItrReturnModel(
                itr2=result.itr2,
                itr_type="ITR2",
                filingSummary=result.filingSummary,
            )

        # ── Phase 2: GrossTotIncome ≤ ₹50 lakh → compute tax, finalize ITR1
        logger.info("Filing %s computing tax and finalising ITR1", filing.filing_id)
        self._compute_tax_for_regime(filing, inc.gross_income, inc.new_regime_deductions, inc.income_breakdown, "new")
        self._compute_tax_for_regime(filing, inc.gross_income, inc.old_regime_deductions, inc.income_breakdown, "old")
        itr1_result = await itr1_svc.finalize_with_precomputed_tax(filing)
        return FilingBuildItrReturnModel(
            itr1=itr1_result.itr1,
            itr_type="ITR1",
            filingSummary=itr1_result.filingSummary,
        )

    # ── Shared TaxPaid / TaxPayments builders ─────────────────────────────

    @staticmethod
    def _safe_int(value: Any) -> int:
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

    @staticmethod
    def _fy_start_date_str(assessment_year: str | None) -> str:
        """Return FY start date as YYYY-MM-DD from an AY like '2026-27'."""
        ay = (assessment_year or "").strip()
        start_year = None
        if ay and "-" in ay:
            head = ay.split("-")[0]
            try:
                start_year = int(head) - 1
            except ValueError:
                start_year = None
        if start_year is None:
            # Safe fallback: matches schema pattern and typical FY start.
            start_year = 2025
        return f"{start_year:04d}-04-01"

    @staticmethod
    def _date_to_yyyy_mm_dd(raw_date: Any, default_date: str) -> str:
        if raw_date is None:
            return default_date
        if isinstance(raw_date, (datetime, date)):
            return raw_date.strftime("%Y-%m-%d")
        s = str(raw_date).strip()
        return s if s else default_date

    def _coerce_itr1_collected_year(self, filing: FilingModel, year_hint: date | datetime | None) -> CollectedYrEnum:
        """Coerce a year hint into an ITR1 CollectedYrEnum value."""
        if year_hint is not None:
            year_str = str(year_hint.year)
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

    def _build_schedule_tcs_itr1(self, filing: FilingModel) -> ScheduleTCSModel | None:
        """Build ITR1 ScheduleTCS from filing.tcs."""
        if not filing.tcs:
            return None

        tcs_rows: list[TC] = []
        total_sch_tcs = 0
        for row in filing.tcs:
            tan = (row.tan or "NA").strip().upper() or "NA"
            name = (row.collector_name or "NA").strip() or "NA"
            amt_collected = max(0, self._safe_int(row.amount_collected))
            tax_collected = max(0, self._safe_int(row.tax_collected))
            claimed = max(0, self._safe_int(row.tax_credit_claimed))
            if claimed == 0:
                claimed = tax_collected

            detl = EmployerOrDeductorOrCollectDetlModel(
                TAN=tan,
                EmployerOrDeductorOrCollecterName=name,
            )
            collected_year = self._coerce_itr1_collected_year(filing, row.year_of_collection)

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

    def _build_schedule_tcs_itr2(self, filing: FilingModel) -> ScheduleTCSITR2Model | None:
        """Build ITR2 ScheduleTCS from filing.tcs using the ITR2 schema shape."""
        if not filing.tcs:
            return None

        rows: list[dict[str, Any]] = []
        total = 0

        for row in filing.tcs:
            tan = (row.tan or "").strip().upper()
            if not tan:
                continue
            if self._ITR2_TAN_PATTERN.fullmatch(tan) is None:
                logger.warning(
                    "Skipping TCS row with TAN=%r for filing %s (fails ITR2 schema pattern)",
                    tan,
                    filing.filing_id,
                )
                continue

            tax_collected = max(0, self._safe_int(row.tax_collected))
            claimed = max(0, self._safe_int(row.tax_credit_claimed))
            if claimed == 0:
                claimed = tax_collected

            rows.append(
                {
                    "TCSCreditOwner": "1",
                    "EmployerOrDeductorOrCollectTAN": tan,
                    "TCSCurrFYDtls": {
                        "TCSAmtCollOwnHand": tax_collected,
                        "TCSAmtCollSpouseOrOthrHand": 0,
                    },
                    "TCSClaimedThisYearDtls": {
                        "TCSAmtCollOwnHand": claimed,
                        "TCSAmtCollSpouseOrOthrHand": 0,
                    },
                }
            )
            total += claimed

        if not rows:
            return None

        return ScheduleTCSITR2Model(TCS=rows, TotalSchTCS=total)

    def _build_tax_payments_rows(self, filing: FilingModel) -> tuple[list[TaxPaymentModel], int]:
        payments: list[TaxPaymentModel] = []
        total = 0
        default_date = self._fy_start_date_str(filing.assessment_year)

        for at in filing.advance_tax:
            amt = max(0, self._safe_int(at.tax_paid_amount))
            total += amt
            bsr = str(at.bsr_code or "NA").strip() or "NA"
            date_str = self._date_to_yyyy_mm_dd(at.date_of_payment, default_date)
            challan = max(0, self._safe_int(at.challan_number))
            payments.append(
                TaxPaymentModel(
                    BSRCode=bsr,
                    DateDep=date_str,
                    SrlNoOfChaln=challan,
                    Amt=amt,
                )
            )

        return payments, total

    def _build_tax_paid_common(self, filing: FilingModel) -> tuple[TaxesPaidModel, int]:
        # Source of truth is orchestrator-computed tax_computation.
        if filing.tax_computation is None:
            taxes = TaxesPaidModel(
                AdvanceTax=0,
                TDS=0,
                TCS=0,
                SelfAssessmentTax=0,
                TotalTaxesPaid=0,
            )
            return taxes, 0

        regime = filing.tax_computation.current_regime

        tds = max(0, self._safe_int(regime.tds))
        tcs = max(0, self._safe_int(regime.tcs))
        adv = max(0, self._safe_int(regime.advance_tax))
        bal = max(0, self._safe_int(regime.tax_payable))

        taxes = TaxesPaidModel(
            AdvanceTax=adv,
            TDS=tds,
            TCS=tcs,
            SelfAssessmentTax=0,
            TotalTaxesPaid=tds + tcs + adv,
        )
        return taxes, bal

    

    # ── ITR-type determination ─────────────────────────────────────────────────

    @staticmethod
    def determine_itr_type(filing: FilingModel) -> tuple[str, List[str]]:
        """
        Determine ITR type from FilingModel data.

        Returns:
            (itr_type, reasons) – e.g. ("ITR2", ["Real-estate capital gains present"])
            If reasons is empty the filing is eligible for ITR-1.
        """
        reasons: List[str] = []

        # 1. Real-estate capital gains
        if filing.capital_gains_real_estate and (
            filing.capital_gains_real_estate.properties
        ):
            reasons.append("Real-estate capital gains present")

        # 2. Foreign capital gains
        if filing.capital_gains_foreign:
            reasons.append("Foreign capital gains present")

        # 3. Movable / deemed capital gains
        if filing.capital_gains_movable:
            reasons.append("Movable capital gains present")
        if filing.capital_gains_deemed:
            reasons.append("Deemed capital gains present")

        # 4. Sec 112 securities (bonds, unlisted/non-STT stocks/MF/RSUs)
        sec112_reason = _has_sec112_securities(filing)
        if sec112_reason:
            reasons.append(sec112_reason)

        # 5. LTCG u/s 112A > ₹1,25,000
        ltcg_112a = _compute_ltcg_112a(filing)
        if ltcg_112a > _LTCG_112A_MAX_ITR1:
            reasons.append(
                f"LTCG u/s 112A ({ltcg_112a:,}) exceeds ₹1,25,000 limit"
            )

        #6. Multiple house properties
        if len(filing.house_property) > 1:
            reasons.append(
                f"Multiple house properties ({len(filing.house_property)})"
            )

        # 7. Agricultural income > ₹5,000
        agri = _get_agricultural_income(filing)
        if agri > _AGRICULTURAL_INCOME_MAX_ITR1:
            reasons.append(
                f"Agricultural income ({agri:,}) exceeds ₹5,000"
            )

        # 8. Foreign income
        if filing.foreign_income:
            reasons.append("Foreign income present")

        # NOTE: Rule 9 (Total income > ₹50 lakh) is checked *after* building
        # ITR1, using the actual computed TotalIncome. See build_itr().

        itr_type = "ITR2" if reasons else "ITR1"
        return itr_type, reasons


    # ── Shared tax computation ───────────────────────────────────────────────

    @staticmethod
    def _compute_tax_for_regime(
        filing: FilingModel,
        income: int,
        deductions: int,
        income_breakdown: Optional[Any],
        regime: str,
    ) -> None:
        """
        Compute tax for one regime and persist the result in
        filing.tax_computation.  Identical logic is needed for both ITR1
        and ITR2, so it lives here in the orchestrator rather than being
        duplicated in each building service.

        Args:
            filing:           The active FilingModel (mutated in-place).
            income:           Gross total income (same for both regimes).
            deductions:       Chapter VIA deductions for this regime.
            income_breakdown: Optional per-head income breakdown.
            regime:           "new" or "old".
        """
        dob = filing.person.date_of_birth if filing.person else None
        ay = filing.assessment_year or "2026-27"
        age = compute_age(dob, ay) if dob else 30
        TaxCalculationService().calculate_tax(
            Decimal(income),
            Decimal(deductions),
            age,
            filing,
            regime,
            ay,
            income_breakdown,
        )
        logger.debug(
            "Tax computed for %s regime — income=%s deductions=%s",
            regime, income, deductions,
        )


# ── Helpers ────────────────────────────────────────────────────────────────────

def _has_sec112_securities(filing: FilingModel) -> str | None:
    """Check for Sec 112 items (bonds, unlisted/non-STT) that require ITR2."""
    cg = filing.capital_gains_securities
    if not cg:
        return None

    # Bonds → always Sec 112 (not 111A/112A)
    if cg.bonds:
        return "Bonds/debentures capital gains present (Sec 112)"

    # Unlisted or non-STT stocks
    for stock in (cg.stocks or []):
        val = (stock.share_type or "").strip().lower()
        is_unlisted = "unlisted" in val or "non listed" in val
        if is_unlisted or not stock.stt_paid:
            return "Unlisted/non-STT stock capital gains present (Sec 112)"

    # Debt / non-equity mutual funds
    for mf in (cg.mutual_funds or []):
        if "debt" in (mf.equity_type or "").strip().lower():
            return "Debt mutual fund capital gains present (Sec 112)"
        if not mf.stt_paid:
            return "Non-STT mutual fund capital gains present (Sec 112)"

    # Unlisted or non-STT RSUs
    for rsu in (cg.rsus or []):
        val = (rsu.share_type or "").strip().lower()
        is_unlisted = "unlisted" in val or "non listed" in val
        if is_unlisted or not rsu.stt_paid:
            return "Unlisted/non-STT RSU capital gains present (Sec 112)"

    return None


def _compute_ltcg_112a(filing: FilingModel) -> int:
    """Quick LTCG 112A estimate from securities for eligibility check."""
    cg = filing.capital_gains_securities
    if not cg:
        return 0

    total_sale = 0.0
    total_cost = 0.0

    for stock in cg.stocks or []:
        val = (stock.share_type or "").strip().lower()
        if "unlisted" in val or "non listed" in val:
            continue
        months = _holding_months(stock.date_of_purchase, stock.date_of_sale)
        if months is not None and months > 12 and stock.stt_paid:
            sale = float(stock.total_sale_price or 0)
            cost = float(stock.total_purchase_price or 0) + float(stock.transfer_expenses or 0)
            if stock.fair_market_value is not None:
                fmv = float(stock.fair_market_value)
                cost = max(float(stock.total_purchase_price or 0), min(fmv, sale)) + float(stock.transfer_expenses or 0)
            total_sale += sale
            total_cost += cost

    for mf in cg.mutual_funds or []:
        if "debt" in (mf.equity_type or "").strip().lower():
            continue
        months = _holding_months(mf.date_of_purchase, mf.date_of_sale)
        if months is not None and months > 12 and mf.stt_paid:
            sale = float(mf.total_sale_price or 0)
            cost = float(mf.total_purchase_price or 0) + float(mf.transfer_expenses or 0)
            if mf.fair_market_value is not None:
                fmv = float(mf.fair_market_value)
                cost = max(float(mf.total_purchase_price or 0), min(fmv, sale)) + float(mf.transfer_expenses or 0)
            total_sale += sale
            total_cost += cost

    for rsu in cg.rsus or []:
        val = (rsu.share_type or "").strip().lower()
        if "unlisted" in val or "non listed" in val:
            continue
        months = _holding_months(rsu.date_of_purchase, rsu.date_of_sale)
        if months is not None and months > 12 and rsu.stt_paid:
            sale = float(rsu.total_sale_price or 0)
            cost = float(rsu.total_purchase_price or 0) + float(rsu.transfer_expenses or 0)
            if rsu.fair_market_value is not None:
                fmv = float(rsu.fair_market_value)
                cost = max(float(rsu.total_purchase_price or 0), min(fmv, sale)) + float(rsu.transfer_expenses or 0)
            total_sale += sale
            total_cost += cost

    return max(0, int(total_sale - total_cost))


def _holding_months(date_of_purchase: Any, date_of_sale: Any) -> int | None:
    if not date_of_purchase or not date_of_sale:
        return None
    return (date_of_sale.year - date_of_purchase.year) * 12 + (
        date_of_sale.month - date_of_purchase.month
    )


def _get_agricultural_income(filing: FilingModel) -> int:
    """Sum agricultural income from interest_income or other sources."""
    total = 0
    for inc in filing.interest_income or []:
        label = (getattr(inc, "income_type", "") or "").lower()
        if "agri" in label:
            total += int(getattr(inc, "amount", 0) or 0)
    return total



