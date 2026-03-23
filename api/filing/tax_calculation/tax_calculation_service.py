from datetime import date
from decimal import Decimal, ROUND_HALF_EVEN
from typing import List, Optional, Self
from filing.models.filing_model import FilingModel
from filing.tax_calculation.models.tax_calculation_response import TaxCalculationResponseModel
from filing.tax_calculation.models.tax_regime_breakdown import CapitalGainsIncomePartModel, CessBreakdown, IncomeBreakdown, SpecialRateTaxEntry, SurchargeBreakdown, TaxRegimeBreakdownModel, TaxSlabEntry
from filing.tax_calculation.models.tax_interest_breakdown import TaxInterestBreakdownModel
from filing.tax_calculation.interest_234_service import Interest234Service


class TaxCalculationService:
    # ============================================================
    # CONSTANTS
    # ============================================================

    # XL: SAL.DeductionUnder16ii/16iii — Schedule S Net Income computation
    OLD_STANDARD_DEDUCTION: Decimal = Decimal("50000")   # XL: Sec 16(ia) std ded; TI_TTI_Salary.bas CollectPartBData_8b
    NEW_STANDARD_DEDUCTION: Decimal = Decimal("75000")   # XL: Finance Act 2024 — same SAL std ded, new regime
    HEALTH_EDU_CESS_RATE: Decimal = Decimal("0.04")      # XL: Sheet9.EducationCess (L77) = ROUND(0.04*(TaxAtNormalRates+TaxAtSpecialRates+Surcharge−Rebate87A), 0)

    # XL: Part B-TI TTI sheet54 — Rebate87Aformula_new (L65), O65 (new regime), P65 (old regime)
    NEW_REBATE_TAX_LIMIT: Decimal = Decimal("60000")     # XL: AY 2026-27 new regime rebate cap (Finance Act 2025)
    NEW_REBATE_INCOME_LIMIT: Decimal = Decimal("1200000")# XL: AY 2026-27 new regime income limit for full rebate
    OLD_REBATE_TAX_LIMIT: Decimal = Decimal("12500")     # XL: P65 old regime: MIN(TaxPayableOnTotInc−SI_112A_Tax−...,12500)

    # XL: Schedule 80D — Sheet cell ranges for self/parent premium buckets
    NON_SENIOR_CAP: Decimal = Decimal("25000")           # XL: Sec 80D non-senior cap
    SENIOR_CAP: Decimal = Decimal("50000")               # XL: Sec 80D senior citizen cap
    PREVENTIVE_CAP: Decimal = Decimal("5000")            # XL: Sec 80D preventive health checkup cap

    # XL: HP.InterestBorrowedCapital — Schedule HP interest loss set-off cap u/s 71(3A)
    SECTION_24B_SET_OFF_LIMIT: Decimal = Decimal("200000") # XL: Sheet HP — Sec 24(b) interest set-off limit
    THIRTY_PERCENT: Decimal = Decimal("0.30")              # XL: HP standard deduction @ 30% of NAV

    # Special rate constants — Finance Act 2024 (AY 2025-26 / 2026-27)
    # XL: Part B-TI TTI sheet54 — Schedule SI rows (Sheet21.SI.*); CG sheet named ranges
    STCG_111A_PRE_JUL23_RATE: Decimal = Decimal("15")    # XL: Sheet8b.ShortTermUs111A (J14); SI row Sec 111A @15%
    STCG_111A_POST_JUL23_RATE: Decimal = Decimal("20")   # XL: Sheet8b.ShortTerm20 (J15); SI row Sec 111A @20% post-Jul23
    LTCG_112A_PRE_JUL23_RATE: Decimal = Decimal("10")    # XL: Sheet8b.LongTermP (J21); SI row Sec 112A @10%
    LTCG_112A_POST_JUL23_RATE: Decimal = Decimal("12.5") # XL: Sheet8b.LongTerm12.5NP (J22); SI row Sec 112A @12.5% post-Jul23
    LTCG_112A_EXEMPTION: Decimal = Decimal("125000")     # XL: Sec 112A first ₹1.25L exempt (Finance Act 2024 raised from ₹1L)
    LTCG_OTHER_POST_JUL23_RATE: Decimal = Decimal("12.5")# XL: Sheet8b.LongTermNP-equivalent; Sec 112 @12.5% no-indexation post-Jul23
    LTCG_SEC112_RATE: Decimal = Decimal("20")            # XL: Sheet8b.LongTermNP (J23); Sec 112 @20% with indexation pre-Jul23
    SPECIAL_30_PCT_RATE: Decimal = Decimal("30")         # XL: Sheet8b.WinLotteriesRacesGambling (os.*); SI rows 115BB/115BBH/115BBJ
    UNEXPLAINED_60_PCT_RATE: Decimal = Decimal("60")     # XL: SI row Sec 115BBE @60% (no deduction allowed)

    # ============================================================
    # UTILITIES
    # ============================================================

    @staticmethod
    def vba_round(val: Decimal) -> Decimal:
        return val.quantize(Decimal("1"), rounding=ROUND_HALF_EVEN)

    @staticmethod
    def to_decimal(val: Decimal | int | float | str | None) -> Decimal:
        if val is None:
            return Decimal("0")
        if isinstance(val, Decimal):
            return val
        if isinstance(val, str):
            s = val.strip()
            if not s:
                return Decimal("0")
            try:
                return Decimal(s)
            except Exception:
                return Decimal("0")
        return Decimal(str(val))

    @staticmethod
    def calculate_age_as_on_fy_end(
        dob: date | None,
        financial_year: str,
    ) -> int:
        if dob is None:
            return 0
        fy_start = int(financial_year.split("-")[0])
        as_on = date(fy_start + 1, 3, 31)
        age = as_on.year - dob.year
        if (as_on.month, as_on.day) < (dob.month, dob.day):
            age -= 1
        return max(age, 0)

    # ============================================================
    # SLAB BREAKDOWN
    # ============================================================

    @staticmethod
    def _compute_slabs(
        total_income: Decimal,
        brackets: list[tuple[Decimal, Optional[Decimal], Decimal]],
    ) -> List[TaxSlabEntry]:
        """Generic helper — converts a bracket list into per-slab TaxSlabEntry items.

        Each bracket is (low, high_or_None, rate_percent).
        Only slabs with taxable_amount > 0 are included.
        """
        entries: List[TaxSlabEntry] = []
        for (low, high, rate) in brackets:
            if total_income <= low:
                break
            taxable = (
                min(total_income, high) - low
                if high is not None
                else total_income - low
            )
            if taxable <= 0:
                continue
            tax = TaxCalculationService.vba_round(
                taxable * rate / Decimal("100")
            )
            entries.append(
                TaxSlabEntry(
                    from_amount=low,
                    to_amount=high,
                    rate=rate,
                    taxable_amount=taxable,
                    tax=tax,
                )
            )
        return entries

    @staticmethod
    def calc_slab_breakdown_old_regime(
        total_income: Decimal, age: int
    ) -> List[TaxSlabEntry]:
        # XL: Part B-TI TTI sheet54 — cell O60 (IF-chain slab formula, bacValue=1 = old regime)
        # XL: TI_TTI_Salary.bas Tax_Calc — Sheet9.TaxAtNormalRatesOnAggrInc (old regime path)
        if age < 60:
            # XL: age < 60 — ExemptionUnder_TI = 250000 (S47: IF(Status=I, 250000, ...))
            brackets: list[tuple[Decimal, Optional[Decimal], Decimal]] = [
                (Decimal("0"),       Decimal("250000"),  Decimal("0")),
                (Decimal("250000"),  Decimal("500000"),  Decimal("5")),
                (Decimal("500000"),  Decimal("1000000"), Decimal("20")),
                (Decimal("1000000"), None,               Decimal("30")),
            ]
        elif age < 80:
            # XL: Senior (60-79) — ExemptionUnder_TI = 300000 (S47: IF(age>59 AND age<80, 300000, ...))
            brackets = [
                (Decimal("0"),       Decimal("300000"),  Decimal("0")),
                (Decimal("300000"),  Decimal("500000"),  Decimal("5")),
                (Decimal("500000"),  Decimal("1000000"), Decimal("20")),
                (Decimal("1000000"), None,               Decimal("30")),
            ]
        else:
            # XL: Super senior (≥80) — ExemptionUnder_TI = 500000 (S47: IF(age>=80, 500000, ...))
            brackets = [
                (Decimal("0"),       Decimal("500000"),  Decimal("0")),
                (Decimal("500000"),  Decimal("1000000"), Decimal("20")),
                (Decimal("1000000"), None,               Decimal("30")),
            ]
        return TaxCalculationService._compute_slabs(total_income, brackets)

    @staticmethod
    def calc_slab_breakdown_new_regime_2025_26(
        total_income: Decimal,
    ) -> List[TaxSlabEntry]:
        # XL: Part B-TI TTI sheet54 — cell O71 (IF-chain for new regime AY 2025-26, bacValue=2)
        # XL: TI_TTI_Salary.bas — TotalIncome.INCD_New slabs (3L-7L-10L-12L-15L bands)
        brackets: list[tuple[Decimal, Optional[Decimal], Decimal]] = [
            (Decimal("0"),       Decimal("300000"),  Decimal("0")),   # XL: O71 ≤3L → 0
            (Decimal("300000"),  Decimal("700000"),  Decimal("5")),   # XL: O71 3L-7L → 5%
            (Decimal("700000"),  Decimal("1000000"), Decimal("10")),  # XL: O71 7L-10L → 10%
            (Decimal("1000000"), Decimal("1200000"), Decimal("15")),  # XL: O71 10L-12L → 15%
            (Decimal("1200000"), Decimal("1500000"), Decimal("20")),  # XL: O71 12L-15L → 20%
            (Decimal("1500000"), None,               Decimal("30")),  # XL: O71 >15L → 30%
        ]
        return TaxCalculationService._compute_slabs(total_income, brackets)

    @staticmethod
    def calc_slab_breakdown_new_regime(
        total_income: Decimal,
    ) -> List[TaxSlabEntry]:
        # XL: Part B-TI TTI sheet54 — cell O72 (IF-chain for new regime AY 2026-27 Finance Act 2025)
        # XL: TI_TTI_Salary.bas — TotalIncome.INCD_New slabs (4L-8L-12L-16L-20L-24L bands)
        brackets: list[tuple[Decimal, Optional[Decimal], Decimal]] = [
            (Decimal("0"),       Decimal("400000"),  Decimal("0")),   # XL: O72 ≤4L → 0
            (Decimal("400000"),  Decimal("800000"),  Decimal("5")),   # XL: O72 4L-8L → 5%
            (Decimal("800000"),  Decimal("1200000"), Decimal("10")),  # XL: O72 8L-12L → 10%
            (Decimal("1200000"), Decimal("1600000"), Decimal("15")),  # XL: O72 12L-16L → 15%
            (Decimal("1600000"), Decimal("2000000"), Decimal("20")),  # XL: O72 16L-20L → 20%
            (Decimal("2000000"), Decimal("2400000"), Decimal("25")),  # XL: O72 20L-24L → 25%
            (Decimal("2400000"), None,               Decimal("30")),  # XL: O72 >24L → 30%
        ]
        return TaxCalculationService._compute_slabs(total_income, brackets)

    @staticmethod
    def calc_slab_breakdown_new_regime_by_ay(
        total_income: Decimal,
        assessment_year: str = "2026-27",
    ) -> List[TaxSlabEntry]:
        if assessment_year == "2025-26":
            return TaxCalculationService.calc_slab_breakdown_new_regime_2025_26(total_income)
        return TaxCalculationService.calc_slab_breakdown_new_regime(total_income)

    # ============================================================
    # INCOME COMPUTATION
    # ============================================================

    
    def salary_income(self: Self, req: FilingModel) -> tuple[Decimal, Decimal]:
        gross = Decimal("0")
        allowances = Decimal("0")
        for sal in req.salary or []:
            for sec in (
                sal.salary_section_171
                + sal.salary_section_172
                + sal.salary_section_173
            ):
                  # ESOP / RSU perquisite
                gross += self.to_decimal(sec.amount)

            # allowances exempt u/s 10(17)
            for sec in sal.salary_section_171:
                allowances += self.to_decimal(sec.exemption_amount)
        gross += self.equity_compensation_income(req)
        return gross, allowances
    
    def equity_compensation_income(self, req: FilingModel) -> Decimal:
        """ESOP / RSU perquisite income — taxable under Salary."""
        if not req.equity_compensation_income:
            return Decimal("0")
        return self.to_decimal(req.equity_compensation_income.amount)

    def house_property_income(self: Self, req: FilingModel) -> Decimal:
        total = Decimal("0")

        for prop in req.house_property or []:
            hp = prop.property

            # 1️⃣ Gross Annual Value
            gross_rent = self.to_decimal(hp.annual_rent_received)

            # 2️⃣ Municipal taxes (paid)
            municipal_tax = self.to_decimal(hp.municipal_taxes_paid)

            # 3️⃣ Net Annual Value (can be zero)
            nav = gross_rent - municipal_tax

            # 4️⃣ Standard deduction @ 30% (only if NAV > 0)
            standard_deduction = (
                nav * self.THIRTY_PERCENT if nav > 0 else Decimal("0")
            )

            # 5️⃣ Interest on borrowed capital
            interest = (
                self.to_decimal(prop.property_loan.interest_paid)
                if prop.property_loan
                else Decimal("0")
            )

            # 6️⃣ Income from this property (can be negative)
            property_income = nav - standard_deduction - interest

            # 7️⃣ Ownership share
            ownership_share = self.to_decimal(hp.ownership_share or 100) / Decimal("100")
            total += property_income * ownership_share

        # 8️⃣ Loss set-off cap u/s 71(3A)
        return max(total, -self.SECTION_24B_SET_OFF_LIMIT)


    def interest_income(self: Self, req: FilingModel) -> Decimal:
        return sum(
            (self.to_decimal(i.amount) for i in req.interest_income or [] if i.amount is not None),
            start=Decimal("0"),
        )
 
    def calculate_dividend_income(self, filing: FilingModel) -> Decimal:
        """
        Calculates total dividend income.

        Rules:
        - Sum all EquityDividendModel.amount
        - Sum all RSUDividendModel.amount
        - If both present → add both
        - If dividend_income is None → return 0
        """

        total = Decimal("0")

        dividend = filing.dividend_income
        if not dividend:
            return total

        # Equity dividends (LIST)
        if dividend.equity:
            for e in dividend.equity:
                total += self.to_decimal(e.amount)

        # RSU / Foreign dividends (LIST)
        if dividend.rsu:
            for r in dividend.rsu:
                total += self.to_decimal(r.amount)

        return total

    def ded_80ccd1b(self: Self, req: FilingModel) -> Decimal:
        ccd1b_total = sum((self.to_decimal(i.amount) for i in req.section_80ccd1b or []), start=Decimal("0"))
        return min(Decimal("50000"), ccd1b_total)

    def ded_80ccd2(self: Self, req: FilingModel) -> Decimal:
        return sum((self.to_decimal(i.amount) for i in req.section_80ccd2 or []), start=Decimal("0"))

    # ---------------- SECTION 80D ----------------

    def ded_80d(self: Self, req: FilingModel) -> Decimal:
        """
        Section 80D – Health Insurance / Medical Expenditure
        Model-aligned, law-correct, Pylance-strict safe
        """

        if req.section_80d is None:
            return Decimal("0")

        entry = req.section_80d

        # -----------------------------
        # Buckets
        # -----------------------------
        self_premium: Decimal = Decimal("0")
        self_preventive: Decimal = Decimal("0")
        self_medical: Decimal = Decimal("0")

        parent_premium: Decimal = Decimal("0")
        parent_preventive: Decimal = Decimal("0")
        parent_medical: Decimal = Decimal("0")

        self_senior: bool = False
        parent_senior: bool = False

        # -----------------------------
        # 1️⃣ Health Insurance Premium
        # -----------------------------
        for h in entry.health_insurance or []:
            amt = self.to_decimal(h.health_insurance_premium)

            if h.taken_for in ("Self", "Self & Family"):
                self_premium += amt
                self_senior = self_senior or h.includes_senior_citizen

            elif h.taken_for == "Parents":
                parent_premium += amt
                parent_senior = parent_senior or h.includes_senior_citizen

        # -----------------------------
        # 2️⃣ Preventive Health Checkup
        # -----------------------------
        for p in entry.preventive_checkup or []:
            amt = self.to_decimal(p.checkup_amount)

            if p.taken_for in ("Self", "Self & Family"):
                self_preventive += amt
                self_senior = self_senior or p.includes_senior_citizen

            elif p.taken_for == "Parents":
                parent_preventive += amt
                parent_senior = parent_senior or p.includes_senior_citizen

        # Preventive cap (₹5,000 per bucket)
        self_preventive = min(self_preventive, self.PREVENTIVE_CAP)
        parent_preventive = min(parent_preventive, self.PREVENTIVE_CAP)

        # -----------------------------
        # 3️⃣ Medical Expenditure
        # (Senior only & only if no premium)
        # -----------------------------
        for m in entry.medical_expenditure or []:
            amt = self.to_decimal(m.expenditure_amount)

            if m.taken_for in ("Self", "Self & Family"):
                self_medical += amt
                self_senior = self_senior or m.includes_senior_citizen

            elif m.taken_for == "Parents":
                parent_medical += amt
                parent_senior = parent_senior or m.includes_senior_citizen

        # Medical allowed ONLY if no insurance premium
        if self_premium > 0:
            self_medical = Decimal("0")

        if parent_premium > 0:
            parent_medical = Decimal("0")

        # -----------------------------
        # 4️⃣ Apply caps
        # -----------------------------
        self_cap: Decimal = (
            self.SENIOR_CAP if self_senior else self.NON_SENIOR_CAP
        )
        parent_cap: Decimal = (
            self.SENIOR_CAP if parent_senior else self.NON_SENIOR_CAP
        )

        self_deduction: Decimal = min(
            self_premium + self_preventive + self_medical,
            self_cap,
        )

        parent_deduction: Decimal = min(
            parent_premium + parent_preventive + parent_medical,
            parent_cap,
        )

        return self_deduction + parent_deduction

    def ded_80cce(self: Self, req: FilingModel) -> Decimal:
        """
        Section 80CCE:
        Combined cap for 80C + 80CCC + 80CCD(1) = ₹1,50,000
        """
        total_80c = sum(
            (self.to_decimal(i.amount) for i in req.section_80c or []),
            start=Decimal("0"),
        )

        total_80ccc = sum(
            (self.to_decimal(i.amount) for i in req.section_80ccc or []),
            start=Decimal("0"),
        )

        total_80ccd1 = sum(
            (self.to_decimal(i.amount) for i in req.section_80ccd1 or []),
            start=Decimal("0"),
        )

        combined = total_80c + total_80ccc + total_80ccd1
        return min(combined, Decimal("150000"))

    def ded_80dd(self: Self, req: FilingModel) -> Decimal:
        if not req.section_80dd:
            return Decimal("0")
        return (
            Decimal("125000")
            if req.section_80dd.disability_type == "Severely Disabled"
            else Decimal("75000")
        )

    def ded_80ddb(self: Self, req: FilingModel, age: int) -> Decimal:
        if not req.section_80ddb:
            return Decimal("0")
        cap = Decimal("100000") if age >= 60 else Decimal("40000")
        return min(self.to_decimal(req.section_80ddb.expenditure_incurred), cap)

    def ded_80u(self: Self, req: FilingModel) -> Decimal:
        if not req.section_80u:
            return Decimal("0")
        return (
            Decimal("125000")
            if req.section_80u.disability_type == "Severely Disabled"
            else Decimal("75000")
        )

    def ded_80e(self: Self, req: FilingModel) -> Decimal:
        return sum((self.to_decimal(i.interest_on_loan) for i in req.section_80e or []), start=Decimal("0"))

    def ded_80ee(self: Self, req: FilingModel) -> Decimal:
        return (
            self.to_decimal(req.section_80ee.interest_on_loan)
            if req.section_80ee
            else Decimal("0")
        )

    def ded_80eea(self: Self, req: FilingModel) -> Decimal:
        return (
            self.to_decimal(req.section_80eea.interest_on_loan)
            if req.section_80eea
            else Decimal("0")
        )

    def ded_80eeb(self: Self, req: FilingModel) -> Decimal:
        return (
            self.to_decimal(req.section_80eeb.interest_on_loan)
            if req.section_80eeb
            else Decimal("0")
        )

    def ded_80tta(self: Self, req: FilingModel) -> Decimal:
        return (
            self.to_decimal(req.section_80tta.interest_amount)
            if req.section_80tta
            else Decimal("0")
        )

    def ded_80ttb(self: Self, req: FilingModel) -> Decimal:
        return (
            self.to_decimal(req.section_80ttb.interest_amount)
            if req.section_80ttb
            else Decimal("0")
        )
    def ded_interest_savings(self, req: FilingModel, age: int) -> Decimal:
        """
        Interest deduction:
        - 80TTA for non-senior citizens
        - 80TTB for senior citizens
        Mutual exclusivity enforced
        """
        if age >= 60:
            return self.ded_80ttb(req)
        return self.ded_80tta(req)


    def ded_80g(self: Self, req: FilingModel, adjusted_gti: Decimal) -> Decimal:
        without_limit: Decimal = Decimal("0")
        with_limit_base: Decimal = Decimal("0")

        for d in (req.section_80g or []):
            # --------------------------------------------------
            # 1. Read donation amounts (Decimal-safe)
            # --------------------------------------------------
            cash_amt: Decimal = self.to_decimal(d.donation_amount_cash)
            non_cash_amt: Decimal = self.to_decimal(d.donation_amount_non_cash)

            # Cash donation allowed only up to ₹2000
            allowed_cash: Decimal = min(cash_amt, Decimal("2000"))

            donation_total: Decimal = allowed_cash + non_cash_amt
            if donation_total <= 0:
                continue

            # --------------------------------------------------
            # 2. Deduction percentage
            # --------------------------------------------------
            percentage: str = (d.qualifying_percentage or "").strip()

            if percentage == "100%":
                deduction_factor: Decimal = Decimal("1")
            elif percentage == "50%":
                deduction_factor = Decimal("0.5")
            else:
                # Invalid / unknown percentage → ignore safely
                continue

            deductible_amount: Decimal = donation_total * deduction_factor

            # --------------------------------------------------
            # 3. Qualifying limit
            # --------------------------------------------------
            limit_flag: str = (d.limit_on_deduction or "").strip().lower()

            if limit_flag == "with limit":
                with_limit_base += deductible_amount
            else:
                # Treat all other cases as "without limit"
                without_limit += deductible_amount

        # --------------------------------------------------
        # 4. Apply 10% of Adjusted GTI cap (only for with-limit)
        # --------------------------------------------------
        qualifying_cap: Decimal = adjusted_gti * Decimal("0.10")

        return without_limit + min(with_limit_base, qualifying_cap)
    
    def ded_80gg(self, req: FilingModel, adjusted_gti: Decimal) -> Decimal:
        if not req.section_80gg:
            return Decimal("0")

        rent_paid = self.to_decimal(req.section_80gg.rent_paid_amount)

        if rent_paid <= 0:
            return Decimal("0")

        limit_1 = Decimal("60000")  # ₹5,000 × 12
        limit_2 = adjusted_gti * Decimal("0.25")
        limit_3 = rent_paid - (adjusted_gti * Decimal("0.10"))

        return max(Decimal("0"), min(limit_1, limit_2, limit_3))

    def ded_80ggc(self, req: FilingModel) -> Decimal:
        total = Decimal("0")

        for d in req.section_80ggc or []:
            # Cash contribution NOT allowed
            total += self.to_decimal(d.contribution_amount_non_cash)

        return total
    def ded_80gga(self, req: FilingModel) -> Decimal:
        total = Decimal("0")

        for d in req.section_80gga or []:
            # Cash is NOT allowed u/s 80GGA
            total += self.to_decimal(d.donation_amount_non_cash)

        return total

    def ded_80cch(self, req: FilingModel) -> Decimal:
        return self.to_decimal(req.section_80cch.contribution_amount) if req.section_80cch else Decimal("0")

    def ded_80qqb(self, req: FilingModel) -> Decimal:
        return self.to_decimal(req.section_80qqb.royalty_amount) if req.section_80qqb else Decimal("0")

    def ded_80rrb(self, req: FilingModel) -> Decimal:
        return self.to_decimal(req.section_80rrb.royalty_amount) if req.section_80rrb else Decimal("0")


    def _compute_regime_breakdown(
        self: Self,
        age: int,
        regime_name: str,
        filing: FilingModel | None,
        gross_total_income: Decimal,
        taxable_income: Decimal,
        tax_before_rebate: Decimal,
        total_deductions: Decimal,
        tds_amount: Decimal,
        tcs_amount: Decimal,
        advance_tax_amount: Decimal,
        assessment_year: str = "2026-27",
        slab_breakdown: Optional[List[TaxSlabEntry]] = None,
        # Special-rate params — if provided, rebate is limited to slab tax only
        slab_tax_only: Optional[Decimal] = None,
        normal_taxable_income: Optional[Decimal] = None,
        special_rate_entries: Optional[List[SpecialRateTaxEntry]] = None,
        special_rate_tax_total: Decimal = Decimal("0"),
        bel: Decimal = Decimal("0"),
        bel_shortfall: Decimal = Decimal("0"),
    ) -> TaxRegimeBreakdownModel:

        # ── Interest u/s 234A/B/C and late fee 234F (computed per-regime) ──
        interest_bd = TaxInterestBreakdownModel()
        interest_total = Decimal("0")
        net_tax_liability_int = int(tax_before_rebate or 0)

        rebate_amount = self._compute_rebate_amount(
            regime_name,
            slab_tax_only if slab_tax_only is not None else tax_before_rebate,
            normal_taxable_income if normal_taxable_income is not None else taxable_income,
        )  # XL: Part B-TI TTI sheet54 L65 = Rebate87Aformula_new

        tax_after_rebate = max(Decimal("0"), tax_before_rebate - rebate_amount) # XL: Sheet9.BalTaxPayable (L66)
        surcharge_amount, surcharge_bd = self._compute_surcharge_amount(
            age,
            regime_name,
            tax_after_rebate,
            taxable_income,
            assessment_year)
        # XL: Sheet9.EducationCess (L77) = ROUND(0.04*(BalTaxPayable + SurchargeOnTaxPayable), 0)
        #     i.e. 4% health & education cess on (tax after rebate + surcharge)
        cess_base = tax_after_rebate + surcharge_amount
        cess_amount = self.vba_round(cess_base * self.HEALTH_EDU_CESS_RATE) # XL: Sheet9.EducationCess
        cess_bd = CessBreakdown(
            rate=self.HEALTH_EDU_CESS_RATE * Decimal("100"),
            base_amount=cess_base,
            cess=cess_amount,
        )
        total_tax_liability = tax_after_rebate + surcharge_amount + cess_amount  # XL: Sheet9.GrossTaxLiability (L78 / L79)

        net_tax_liability_int = int(total_tax_liability or 0)
        if filing is not None and net_tax_liability_int > 0:
            _rs = (filing.person.residential_status or "") if filing.person else ""
            interest = Interest234Service().calculate(
                net_tax_liability=net_tax_liability_int,
                tds=int(tds_amount or 0),
                tcs=int(tcs_amount or 0),
                advance_tax_payments=filing.advance_tax or [],
                age=age,
                assessment_year=assessment_year,
                total_income=int(taxable_income or 0),
                is_resident=_rs.upper().startswith("RES"),
            )
            interest_bd = TaxInterestBreakdownModel(
                interest_234a=int(interest.interest_234a),
                interest_234b=int(interest.interest_234b),
                interest_234c=int(interest.interest_234c),
                late_fee_234f=int(interest.late_fee_234f),
                total=int(interest.total_interest),
            )
            interest_total = Decimal(str(interest.total_interest))

        total_paid = tds_amount + tcs_amount + advance_tax_amount  # XL: L104 = SUM(J100:J103)
        # Net balance after considering interest/late fee as well.
        aggregate_liability = total_tax_liability + interest_total
        net = aggregate_liability - total_paid

        result = TaxRegimeBreakdownModel.model_validate(
            {
                "regime": regime_name,
                "gross_total_income": gross_total_income,       # XL: Sheet8b.GrossTotalIncome (L34)
                "total_deductions": total_deductions,           # XL: Sheet8b.DeductionsUnderScheduleVIA (L42)
                "total_income": taxable_income,                 # XL: Sheet8b.TotalIncome (L44)
                "tax_before_rebate": tax_before_rebate,         # XL: Sheet9.TaxPayableOnTotInc (slab) + TaxAtSpecialRates
                "rebate_87a": rebate_amount,                    # XL: Sheet9.RebateUs88E (L65 formula result)
                "tax_after_rebate": tax_after_rebate,           # XL: Sheet9.BalTaxPayable (L66)
                "surcharge": surcharge_amount,                  # XL: Sheet9.Surcharge_ii (J74) or Surcharge_i (J73); SurchargeOnTaxPayable (L76)
                "health_education_cess": cess_amount,           # XL: Sheet9.EducationCess
                "total_tax_liability": total_tax_liability,     # XL: Sheet9.GrossTaxLiability (L78)
                "tds": tds_amount,                              # XL: J101 TDS schedules
                "tcs": tcs_amount,                              # XL: J102 TCS schedule
                "advance_tax": advance_tax_amount,              # XL: J100 IT.AT / J103 IT.SAT
                "total_taxes_paid": total_paid,                 # XL: L104 = SUM(J100:J103)
                # Net tax payable includes interest_total (if any).
                "tax_payable": self.vba_round(net) if net > 0 else Decimal("0"),
                # Refund is net of interest_total as well.
                "refund": self.vba_round(-net) if net < 0 else Decimal("0"),
                "tax_intrest": interest_total,
                "tax_intrest_breakdown": interest_bd,
                # XL: Sheet9.TaxAtSpecialRates (S98) = Sheet21.SI.TotSplRateIncTax
                "special_rate_tax": special_rate_tax_total,
                "bel": bel,
                "bel_shortfall": bel_shortfall,
            }
        )
        result.slab_breakdown = slab_breakdown
        result.special_rate_tax_breakdown = special_rate_entries or []
        result.surcharge_breakdown = surcharge_bd
        result.cess_breakdown = cess_bd
        return result

    def _compute_rebate_amount(
        self: Self,
        regime_name: str,
        slab_tax: Decimal,
        normal_taxable_income: Decimal,
    ) -> Decimal:
        """Compute Section 87A rebate.

        Rebate applies ONLY on slab-rate tax (not on special-rate CG tax,
        VDA, lottery, etc.) per Finance Act 2024 clarification.
        XL: Part B-TI TTI sheet54 L65 = Rebate87Aformula_new (current regime selector)
        XL: P65 = old regime: IF(TotalIncome+DTAA<=500000, MIN(TaxPayableOnTotInc−SI_112A_Tax−...,12500), 0)
        XL: O65 = new regime: IF(bacValue=2, IF(TotalIncome_New<=500000, MIN(tax,12500),
                                 IF(TotalIncome_New<=700000, MIN(tax,25000), marginal_relief)), 0)
        XL: VBA warning in Tax_Calc.bas: "Rebate u/s 87A available only on income taxable at normal rates"
              triggered when SI income (SIincomediff) > 0.

        Args:
            slab_tax: Tax computed at normal slab rates (exclude special rate tax).
            normal_taxable_income: Taxable income at normal rates (exclude special rate income).
        """
        if regime_name == "new":
            # XL: O65 — AY 2026-27 new regime rebate: full rebate ≤60K (Finance Act 2025)
            if slab_tax <= self.NEW_REBATE_TAX_LIMIT:
                return slab_tax
            else:
                # XL: O65 marginal relief band: TotalIncome_New > 1200000 → partial rebate
                return max(Decimal("0"), slab_tax - (normal_taxable_income - self.NEW_REBATE_INCOME_LIMIT))
        else:
            # XL: P65 old regime — MIN(tax, 12500) when TotalIncome+DTAA ≤ 500000
            if slab_tax <= self.OLD_REBATE_TAX_LIMIT:
                return slab_tax
            else:
                return Decimal("0")
    # _compute_rebate_amount

    def _compute_surcharge_amount(
        self: Self,
        age: int,
        regime_name: str,
        tax_after_rebate: Decimal,
        taxable_income: Decimal,
        assessment_year: str = "2026-27",
    ) -> tuple[Decimal, Optional[SurchargeBreakdown]]:
        # XL: Part B-TI TTI sheet54 — surcharge slabs computed in columns S/X/AC/AH
        #   S57/X57/AC57/AH57 = rounded-down income at 1Cr/50L/2Cr/5Cr cutoffs
        #   S59 = IF(S57>1Cr, TaxDeemedTI*0.15, 0)          → 15% surcharge @1Cr (old)
        #   X59 = IF(X57>50L, TaxDeemedTI*0.10, 0)          → 10% surcharge @50L
        #   AC59 = IF(AC57>2Cr, TaxDeemedTI*0.25, 0)        → 25% surcharge @2Cr
        #   AH59 = IF(AH57>5Cr, TaxDeemedTI*0.37, 0)        → 37% surcharge @5Cr (old) / 25% (new)
        #   S77/X77/AC77/AH77 = marginal relief per bracket
        #   S80/X80/AC80/AH80 = MAX(0, surcharge_before_relief - marginal_relief)
        #   Final: Sheet9.Surcharge_ii = J74 = final surcharge after marginal relief + MR_ND
        #          Sheet9.Surcharge_i  = J73 = surcharge on normal-rate income only
        #          Sheet9.Surcharge_iBfr = J69; Sheet9.BfrSurcharge_ii = J70 (pre-marginal-relief surcharge)
        #          Sheet9.SurchargeOnTaxPayable = L76
        surcharge_rate = Decimal("0")
        base_amount = Decimal("0")

        # XL: X57 > 5000000 → 10% (col X = 50L bracket)
        if taxable_income > Decimal("5000000") and taxable_income <= Decimal("10000000"):
            surcharge_rate = Decimal("0.10")
            base_amount = Decimal("5000000")
        # XL: S57 > 10000000 → 15% (col S = 1Cr bracket)
        elif taxable_income > Decimal("10000000") and taxable_income <= Decimal("20000000"):
            surcharge_rate = Decimal("0.15")
            base_amount = Decimal("10000000")
        # XL: AC57 > 20000000 → 25% (col AC = 2Cr bracket)
        elif taxable_income > Decimal("20000000") and taxable_income <= Decimal("50000000"):
            surcharge_rate = Decimal("0.25")
            base_amount = Decimal("20000000")
        # XL: AH57 > 50000000 → 37%/25% (col AH = 5Cr bracket; new regime capped @25% per Finance Act 2023)
        elif taxable_income > Decimal("50000000"):
            surcharge_rate = Decimal("0.37") if regime_name == "old" else Decimal("0.25")
            base_amount = Decimal("50000000")

        if base_amount > 0:
            surcharge_before_relief = tax_after_rebate * surcharge_rate
            if regime_name == "new":
                base_tax = sum((s.tax for s in TaxCalculationService.calc_slab_breakdown_new_regime_by_ay(base_amount, assessment_year)), Decimal("0"))
            else:
                base_tax = sum((s.tax for s in TaxCalculationService.calc_slab_breakdown_old_regime(base_amount, age)), Decimal("0"))
            base_surcharge_amount, _ = self._compute_surcharge_amount(age, regime_name, base_tax, base_amount, assessment_year)
            base_tax += base_surcharge_amount

            # XL: Marginal relief — S77 = MAX((S55+S59-(S56+S66)),0); S80 = MAX(0,IF((S55+S59)>(S56+S66),S59-S77,S59))
            # i.e. relief = surcharge_before_relief − (excess_income) when tax+surcharge > base_tax+cutoff_income
            excess_tax = tax_after_rebate + surcharge_before_relief - base_tax
            excess_income = taxable_income - base_amount
            relief = max(Decimal("0"), excess_tax - excess_income)
            net_surcharge = self.vba_round(surcharge_before_relief - relief)

            breakdown = SurchargeBreakdown(
                rate=surcharge_rate * Decimal("100"),
                surcharge_before_relief=self.vba_round(surcharge_before_relief),
                marginal_relief=self.vba_round(relief),
                net_surcharge=net_surcharge,
            )
            return net_surcharge, breakdown

        return Decimal("0"), None
    # _compute_surcharge_amount

    # ============================================================
    # BEL HELPERS
    # ============================================================

    @staticmethod
    def _get_bel(regime: str, age: int) -> Decimal:
        """Basic Exemption Limit for BEL-LTCG proviso.

        Old regime (age-based):
            < 60  → ₹2,50,000
            60–79 → ₹3,00,000 (senior citizen)
            ≥ 80  → ₹5,00,000 (super senior)
        New regime (AY 2025-26 / 2026-27):
            All ages → ₹3,00,000

        XL: Part B-TI TTI sheet54 — named range ExemptionUnder_TI
            S47 = IF(AND(Status=I, bacValue=2, age>59, age<80, RES/NOR), 300000,
                    IF(AND(Status=I, bacValue=2, age>=80, RES/NOR), 500000,
                    IF(OR(Status=I, Status=H), 250000, 0)))
            L47 = IF((MAX(0,TotalIncome−IncChargeTaxSplRate111A112)) > ExemptionUnder_TI,
                     (MAX(0,TotalIncome−IncChargeTaxSplRate111A112)+NetAgriIncomeForRate), 0)
            → when normal income ≤ ExemptionUnder_TI, L47=0 → LTCG taxed on shortfall-adjusted amount
        """
        # XL: New regime — ExemptionUnder_TI = 300000 for all ages (bacValue=2)
        if regime.upper() == "NEW":
            return Decimal("300000")
        # XL: Super senior ≥80 — ExemptionUnder_TI = 500000 (IF age>=80)
        if age >= 80:
            return Decimal("500000")
        # XL: Senior 60-79 — ExemptionUnder_TI = 300000 (IF age>59 AND age<80)
        if age >= 60:
            return Decimal("300000")
        # XL: Individual/HUF <60 — ExemptionUnder_TI = 250000 (IF Status=I/H)
        return Decimal("250000")

    @staticmethod
    def _apply_bel_to_ltcg(
        shortfall: Decimal,
        cg: CapitalGainsIncomePartModel,
    ) -> None:
        """Reduce special-rate CG buckets by the BEL shortfall.

        Per ITR form rules, the BEL shortfall absorption order is:
            Normal income → STCG slab → STCG 111A → LTCG 112A → LTCG 112
        Normal income and STCG at slab rate are already absorbed before this
        method is called (via bel_shortfall = max(0, bel - normal_taxable)).

        Remaining absorption order applied here:
            STCG 111A @15% → STCG 111A @20% → LTCG 112A @10% → LTCG 112A @12.5%
            → Sec112 @12.5% → Sec112 @20%

        XL: msSI.bas populateSI() (lines 548-584) — BEL absorption via
            exemption = getExemption_SI
            partbSetoffInc = TotalIncome − IncChargeableTaxSplRates
            Absorption order: SI.SplRateInc item(5) → item(3) → item(6)
            where items map to CG rate buckets on Sheet21 (Schedule SI).

        Mutates cg fields in-place.
        """
        rem = shortfall

        # ── STCG 111A (cheapest special rate first) ─────────────────────────
        orig = cg.stcg_15_pct
        cg.stcg_15_pct = max(Decimal("0"), orig - rem)
        rem = max(Decimal("0"), rem - orig)

        orig = cg.stcg_20_pct
        cg.stcg_20_pct = max(Decimal("0"), orig - rem)
        rem = max(Decimal("0"), rem - orig)

        # ── LTCG 112A ──────────────────────────────────────────────────────
        orig = cg.ltcg_10_pct
        cg.ltcg_10_pct = max(Decimal("0"), orig - rem)
        rem = max(Decimal("0"), rem - orig)

        orig = cg.ltcg_12_5_pct
        cg.ltcg_12_5_pct = max(Decimal("0"), orig - rem)
        rem = max(Decimal("0"), rem - orig)

        # ── LTCG Sec 112 ──────────────────────────────────────────────────
        orig = cg.ltcg_12_5_pct_other
        cg.ltcg_12_5_pct_other = max(Decimal("0"), orig - rem)
        rem = max(Decimal("0"), rem - orig)

        cg.ltcg_20_pct = max(Decimal("0"), cg.ltcg_20_pct - rem)

    # ============================================================
    # MAIN
    # ============================================================

    async def calculate(
        self: Self,
        request: FilingModel,
    ) -> FilingModel:

        person = request.person
        assessment_year = request.assessment_year
        age = (
            self.calculate_age_as_on_fy_end(
                person.date_of_birth if person else None,
                assessment_year,
            )
            if assessment_year
            else 0
        )

        gross_salary, salary_allowances = self.salary_income(request)
        old_salary = max(Decimal("0"), gross_salary - salary_allowances - self.OLD_STANDARD_DEDUCTION)
        new_salary = max(Decimal("0"), gross_salary - self.NEW_STANDARD_DEDUCTION)
        hp_income = self.house_property_income(request)
        other_income = self.interest_income(request)
        dividend_income = self.calculate_dividend_income(request)
        gti_old = old_salary + hp_income + other_income + dividend_income
        gti_new = new_salary + hp_income + other_income + dividend_income

        old_deductions_base = (
             self.ded_80cce(request)
            + self.ded_80ccd1b(request)
            + self.ded_80ccd2(request)
            + self.ded_80d(request)
            + self.ded_80dd(request)
            + self.ded_80ddb(request, age)
            + self.ded_80u(request)
            + self.ded_80e(request)
            + self.ded_80ee(request)
            + self.ded_80eea(request)
            + self.ded_80eeb(request)
            + self.ded_interest_savings(request, age)             
            + self.ded_80ggc(request)
            + self.ded_80gga(request)
            + self.ded_80cch(request)
            + self.ded_80qqb(request)
            + self.ded_80rrb(request)
        )

        adjusted_gti = max(Decimal("0"), gti_old - old_deductions_base)
        ded_80g = self.ded_80g(
            request,
            adjusted_gti,
        )
        ded_80gg = self.ded_80gg(
            request,
            adjusted_gti,
        )
        old_deductions = old_deductions_base + ded_80g + ded_80gg
        old_income = max(Decimal("0"), gti_old - old_deductions)

        new_deductions = self.ded_80ccd2(request)
        new_income = max(Decimal("0"), gti_new - new_deductions)

        ay = assessment_year or "2025-26"
        old_slabs = self.calc_slab_breakdown_old_regime(old_income, age)
        new_slabs = self.calc_slab_breakdown_new_regime_by_ay(new_income, ay)
        old_tax = sum((s.tax for s in old_slabs), Decimal("0"))
        new_tax = sum((s.tax for s in new_slabs), Decimal("0"))

        tds = sum(
            (self.to_decimal(t.tax_deducted) for t in request.tds or [] if t.tax_deducted is not None),
            start=Decimal("0"),
        )
        tcs = sum(
            (self.to_decimal(t.tax_collected) for t in request.tcs or [] if t.tax_collected is not None),
            start=Decimal("0"),
        )
        adv = sum(
            (self.to_decimal(t.tax_paid_amount) for t in request.advance_tax or [] if t.tax_paid_amount is not None),
            start=Decimal("0"),
        )

        old_breakdown = self._compute_regime_breakdown(
            age,
            regime_name="old",
            filing=request,
            gross_total_income=gti_old,
            taxable_income=old_income,
            tax_before_rebate=old_tax,
            total_deductions=old_deductions,
            tds_amount=tds,
            tcs_amount=tcs,
            advance_tax_amount=adv,
            assessment_year=ay,
            slab_breakdown=old_slabs,
        )

        new_breakdown = self._compute_regime_breakdown(
            age,
            regime_name="new",
            filing=request,
            gross_total_income=gti_new,
            taxable_income=new_income,
            tax_before_rebate=new_tax,
            total_deductions=new_deductions,
            tds_amount=tds,
            tcs_amount=tcs,
            advance_tax_amount=adv,
            assessment_year=ay,
            slab_breakdown=new_slabs,
        )


        if request.regime == "old":
            current_breakdown = old_breakdown
        elif request.regime == "new":
            current_breakdown = new_breakdown
        else:
            current_breakdown = (
                old_breakdown
                if old_breakdown.total_tax_liability <= new_breakdown.total_tax_liability
                else new_breakdown
            )

        response = TaxCalculationResponseModel.model_validate(
            {
                "current_regime": current_breakdown,
                "old_regime": old_breakdown,
                "new_regime": new_breakdown,
            }
        )

        request.tax_computation = response
        
        return request

    # ============================================================
    # SIMPLE TAX CALCULATOR (pre-computed income/deductions)
    # ============================================================

    def calculate_tax(
        self: Self,
        income: Decimal,
        deductions: Decimal,
        age: int,
        request: FilingModel,
        regime: str,
        assessment_year: str = "2026-27",
        income_breakdown: Optional[IncomeBreakdown] = None,
    ) -> FilingModel:
        """Calculate tax given pre-computed income and deductions.

        Unlike `calculate()`, this does not recompute income/deductions from
        the FilingModel — the caller is responsible for passing them in.

        Special-rate buckets (CG flat rates, VDA, lottery) are extracted from
        `income_breakdown.capital_gains` and taxed at their prescribed flat rates.
        Chapter VIA deductions and 87A rebate apply ONLY to slab-rate income.
        Preserves any existing regime breakdown in request.tax_computation.
        """
        # ── 1. Extract per-bucket special-rate incomes ──────────────────────────
        # Use a local copy so BEL mutations don't bleed into the original income_breakdown
        # (which would corrupt the second regime's calculation when both are computed).
        _cg_source = income_breakdown.capital_gains if income_breakdown and income_breakdown.capital_gains else CapitalGainsIncomePartModel()
        cg = _cg_source.model_copy(deep=True)

       
       

        # ── 1B. Regime-based slab exclusion ────────────────────────────────────
        # Slab-tax base must EXCLUDE all special-rate buckets.
        # Otherwise (especially in OLD regime) lottery/VDA/gaming would be slab-taxed
        # AND again taxed at their flat special rates (double taxation).
        cg_special_income  = cg.stcg_15_pct + cg.stcg_20_pct + cg.ltcg_10_pct + cg.ltcg_12_5_pct + cg.ltcg_12_5_pct_other + cg.ltcg_20_pct
        all_special_income = cg_special_income + cg.lottery_30_pct + cg.vda_30_pct + cg.online_gaming_30_pct + cg.unexplained_60_pct

        slab_exclusion = all_special_income

        # ── 2. Normal income (slab-rated) ───────────────────────────────────────
        # Deductions apply only to normal (slab-rate) income.
        # stcg_applicable_rate (Sheet8b.STCGspecialrate J18 / Sheet8b.ShortTermOther J17)
        # is already included in normal_income — taxed at slab, not a fixed special rate.
        # XL: Sheet8b.GrossTotalIncome (L34) − slab_exclusion → Sheet8b.TotalIncome (L44)
        #     Sheet8b.TotalIncome − Sheet8b.DeductionsUnderScheduleVIA → normal slab base
        normal_income  = max(Decimal("0"), income - slab_exclusion)   # XL: Sheet8b.TotalIncome − IncChargeTaxSplRate111A112[_New]
        normal_taxable = max(Decimal("0"), normal_income - deductions) # XL: Sheet8b.AggregateIncome (AC83) used as slab tax base

        # ── 2A. BEL adjustment for LTCG (Section 112A / 112 proviso) ───────────
        # If normal income (slab portion) is below the Basic Exemption Limit,
        # the shortfall reduces taxable LTCG before applying flat-rate tax.
        # BEL: Old → ₹2.5L / ₹3L / ₹5L (age-based);  New → ₹3L (AY 2025-26)
        bel          = self._get_bel(regime, age)
        bel_shortfall = max(Decimal("0"), bel - normal_taxable)
        self._apply_bel_to_ltcg(bel_shortfall, cg)

        if regime.upper() == "OLD":
            slabs = self.calc_slab_breakdown_old_regime(normal_taxable, age)
        else:
            slabs = self.calc_slab_breakdown_new_regime_by_ay(normal_taxable, assessment_year)
        slab_tax = sum((s.tax for s in slabs), Decimal("0"))

        # ── 3. Special-rate taxes per bucket ────────────────────────────────────
        special_entries: list[SpecialRateTaxEntry] = []
        

        # Note: cg.ltcg_* values below are already BEL-adjusted (step 2A above)
        special_tax = Decimal("0")
        special_tax += self._special(special_entries, "111A",   "STCG — Listed equity/EO MF, STT paid (pre Jul 23, 2024)",        self.STCG_111A_PRE_JUL23_RATE,   cg.stcg_15_pct)
        special_tax += self._special(special_entries, "111A",   "STCG — Listed equity/EO MF, STT paid (on/after Jul 23, 2024)",   self.STCG_111A_POST_JUL23_RATE,  cg.stcg_20_pct)

        # ── 112A — exemption already applied in income builder ───────────────
        # The ₹1,25,000 Sec 112A exemption is applied in Itr2IncomeBuilderService
        # BEFORE BEL adjustment, matching the ITR2 form order.
        # XL: SPI-SI sheet — P3 = MIN(125000, H28); O3 = MIN(125000-P3-P5, H27)
        # cg.ltcg_10_pct and cg.ltcg_12_5_pct are already NET of the exemption.
        special_tax += self._special(special_entries, "112A",   "LTCG — Listed equity/EO MF, STT paid (pre Jul 23, 2024)",        self.LTCG_112A_PRE_JUL23_RATE,   cg.ltcg_10_pct)
        special_tax += self._special(special_entries, "112A",   "LTCG — Listed equity/EO MF, STT paid (on/after Jul 23, 2024)",   self.LTCG_112A_POST_JUL23_RATE,  cg.ltcg_12_5_pct)
        if cg.ltcg_112_proviso_credit > Decimal("0") and cg.ltcg_12_5_pct_other > Decimal("0"):
            # Finance Act 2024 Sec 112 proviso: real estate acquired pre-Jul23, sold post-Jul23
            # ITD places the un-indexed gain in 12.5% row but subtracts the gross-level credit
            # Formula: TAX = MAX(0, ROUND(BEL_adj_gain × 12.5% − credit, 0))
            # XL: SPI-SI row 6/26: I26 = ROUND(H26×12.5%) but via B3h_Excess / B1g_ImmpropertyB1e1c credit
            raw_proviso_tax = self.vba_round(cg.ltcg_12_5_pct_other * self.LTCG_OTHER_POST_JUL23_RATE / Decimal("100"))
            net_proviso_tax = max(Decimal("0"), raw_proviso_tax - cg.ltcg_112_proviso_credit)
            special_entries.append(SpecialRateTaxEntry(
                section="112",
                description="LTCG — Real estate (on/after Jul 23, 2024, acquired pre Jul 23), Sec 112 proviso @12.5% with credit",
                rate=self.LTCG_OTHER_POST_JUL23_RATE,
                income=cg.ltcg_12_5_pct_other,
                taxable_income=cg.ltcg_12_5_pct_other,
                tax=net_proviso_tax,
            ))
            special_tax += net_proviso_tax
        else:
            special_tax += self._special(special_entries, "112",    "LTCG — Other capital assets (on/after Jul 23, 2024), no indexation",  self.LTCG_OTHER_POST_JUL23_RATE, cg.ltcg_12_5_pct_other)
        special_tax += self._special(special_entries, "112",    "LTCG — All capital assets with indexation (pre Jul 23, 2024)",    self.LTCG_SEC112_RATE,            cg.ltcg_20_pct)
        special_tax += self._special(special_entries, "115BB",  "Lottery / crossword puzzles / game shows / betting",              self.SPECIAL_30_PCT_RATE,         cg.lottery_30_pct)
        special_tax += self._special(special_entries, "115BBH", "Virtual Digital Assets (VDA / crypto / NFTs)",                    self.SPECIAL_30_PCT_RATE,         cg.vda_30_pct)
        special_tax += self._special(special_entries, "115BBJ", "Online gaming winnings",                                           self.SPECIAL_30_PCT_RATE,         cg.online_gaming_30_pct)
        special_tax += self._special(special_entries, "115BBE", "Unexplained income / credits / investments (Sec 115BBE)",          self.UNEXPLAINED_60_PCT_RATE,     cg.unexplained_60_pct)

        # ── 4. Total taxable income and tax ─────────────────────────────────────
        # XL: Sheet9.TaxAtNormalRatesOnAggrInc (J58) = slab_tax
        #     Sheet9.TaxAtSpecialRates = special_tax → SI.TotSplRateIncTax ('SPI - SI'!$I$115)
        #     Sheet9.BalTaxPayable (L66) = TaxAtNormalRates after rebate87A
        #     Sheet9.GrossTaxLiability (L78) = MAX(TaxPayable, AMT_tax)
        #     Sheet9.NetTaxLiability (L91)
        #     Sheet9.Surcharge_i = J73; Sheet9.Surcharge_ii = J74; Sheet9.SurchargeOnTaxPayable = L76
        special_taxable_total = sum(e.taxable_income for e in special_entries)
        total_taxable_income = normal_taxable + special_taxable_total  # XL: Sheet8b.AggregateIncome (AC83)
        total_tax = slab_tax + special_tax                             # XL: Sheet9.TaxPayableOnTotInc = slab; +TaxAtSpecialRates

        # ── 5. TDS / TCS / Advance tax ──────────────────────────────────────────
        # XL: Schedule TDS1/TDS2/TDS3 (TDS1.TotalTDSSal + TDS2.ClaimedInOwnHands + TDS3.ClaimedInOwnHands)
        #     Schedule TCS1 (TCS1.TotalSchTCS); Advance tax (IT.AT, IT.SAT) → J100/J101/J103
        tds = sum(
            (self.to_decimal(t.tax_deducted) for t in request.tds or [] if t.tax_deducted is not None),
            start=Decimal("0"),
        )  # XL: J101 = SUM(TDS1.TotalTDSSal)+SUM(TDS2.ClaimedInOwnHands)+SUM(TDS3.ClaimedInOwnHands)
        tcs = sum(
            (self.to_decimal(t.tax_collected) for t in request.tcs or [] if t.tax_collected is not None),
            start=Decimal("0"),
        )  # XL: J102 = SUM(TCS1.TotalSchTCS)
        adv = sum(
            (self.to_decimal(t.tax_paid_amount) for t in request.advance_tax or [] if t.tax_paid_amount is not None),
            start=Decimal("0"),
        )  # XL: J100 = IT.AT (advance tax); J103 = IT.SAT (self-assessment tax)

        # ── 6. Build regime breakdown ────────────────────────────────────────────
        breakdown = self._compute_regime_breakdown(
            age,
            regime_name=regime.lower(),
            filing=request,
            gross_total_income=income,
            taxable_income=total_taxable_income,
            tax_before_rebate=total_tax,
            total_deductions=deductions,
            tds_amount=tds,
            tcs_amount=tcs,
            advance_tax_amount=adv,
            assessment_year=assessment_year,
            slab_breakdown=slabs,
            slab_tax_only=slab_tax,
            normal_taxable_income=normal_taxable,
            special_rate_entries=special_entries,
            special_rate_tax_total=special_tax,
            bel=bel,
            bel_shortfall=bel_shortfall,
        )
        breakdown.income_breakdown = income_breakdown
        breakdown.special_rate_tax = special_tax

        # Preserve existing breakdowns; update only the selected regime
        existing_old = request.tax_computation.old_regime if request.tax_computation else None
        existing_new = request.tax_computation.new_regime if request.tax_computation else None

        if regime.upper() == "OLD":
            old_breakdown = breakdown
            new_breakdown = existing_new
        else:
            old_breakdown = existing_old
            new_breakdown = breakdown

        # Pick regime with lower tax liability
        current_breakdown = breakdown
        if old_breakdown and new_breakdown:
            current_breakdown = (
                new_breakdown
                if new_breakdown.total_tax_liability <= old_breakdown.total_tax_liability
                else old_breakdown
            )
        elif old_breakdown:
            current_breakdown = old_breakdown
        elif new_breakdown:
            current_breakdown = new_breakdown

        response = TaxCalculationResponseModel.model_validate(
            {
                "current_regime": current_breakdown,
                "old_regime": old_breakdown,
                "new_regime": new_breakdown,
            }
        )

        request.tax_computation = response
        return request

    def _special(self, special_entries: list[SpecialRateTaxEntry], section: str, desc: str, rate: Decimal, gross: Decimal, exemption: Decimal = Decimal("0")) -> Decimal:
            if gross <= 0:
                return Decimal("0")
            taxable = max(Decimal("0"), gross - exemption)
            computed_tax = self.vba_round(taxable * rate / Decimal("100"))
            special_entries.append(SpecialRateTaxEntry(
                section=section,
                description=desc,
                rate=rate,
                income=gross,
                taxable_income=taxable,
                tax=computed_tax,
            ))
            return computed_tax