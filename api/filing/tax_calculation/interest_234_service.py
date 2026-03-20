"""
Interest Calculation Service — Sections 234A, 234B, 234C, 234F.

Implements interest on delayed filing, default/deferment of advance tax
per Income Tax Act, 1961.  Mirrors the VBA reference in itr1_macros.txt.

Key rules:
  234A — 1% per month (or part) on unpaid tax from due date to filing date.
  234B — 1% per month on advance-tax shortfall from April of AY to filing date,
         with monthly SAT adjustments reducing outstanding principal.
  234C — 1% × 3 months per quarter on quarterly advance-tax shortfall
         (Q1=15%, Q2=45%, Q3=75%, Q4=100%); Q4 shortfall charged 1 month.
  234F — Flat late-filing fee (₹1,000 or ₹5,000) if return filed after due date.

Exemptions:
  • Senior citizens (age > 59) are exempt from 234B and 234C.
  • 234C does not apply if (NetTaxLiability − TDS − TCS) < ₹10,000.
"""
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Any, List, Optional

from filing.models.tax_paid_self_model import TaxPaidSelfModel


@dataclass
class InterestResult:
    """Result of interest calculation under sections 234A/B/C/F."""
    interest_234a: int = 0
    interest_234b: int = 0
    interest_234c: int = 0
    late_fee_234f: int = 0

    @property
    def total_interest(self) -> int:
        return self.interest_234a + self.interest_234b + self.interest_234c + self.late_fee_234f


class Interest234Service:
    """Compute penal interest under sections 234A, 234B, 234C, and 234F."""

    # ── Constants ──────────────────────────────────────────────────────────────
    INTEREST_RATE_PCT = Decimal("1")          # 1% per month
    NET_TAX_THRESHOLD = 10_000                # 234B/C minimum threshold
    ADVANCE_TAX_PCT = Decimal("90")           # 90% of assessed tax

    # Quarterly cumulative thresholds for 234C
    Q1_PCT = Decimal("0.15")   # 15% by Jun 15
    Q2_PCT = Decimal("0.45")   # 45% by Sep 15
    Q3_PCT = Decimal("0.75")   # 75% by Dec 15
    Q4_PCT = Decimal("1.00")   # 100% by Mar 15

    # ── Public entry point ────────────────────────────────────────────────────

    def calculate(
        self,
        net_tax_liability: int,
        tds: int,
        tcs: int,
        advance_tax_payments: List[TaxPaidSelfModel],
        age: int,
        assessment_year: str,
        filing_date: Optional[date] = None,
        due_date: Optional[date] = None,
        total_income: int = 0,
        is_resident: bool = True,
    ) -> InterestResult:
        """
        Calculate interest under 234A/B/C and late fee 234F.

        Args:
            net_tax_liability: Total tax liability (after cess, before interest).
            tds: Total TDS amount.
            tcs: Total TCS amount.
            advance_tax_payments: List of advance/self-assessment tax payments with dates.
            age: Taxpayer's age as of FY end.
            assessment_year: e.g. "2026-27".
            filing_date: Date of filing/verification. Defaults to today.
            due_date: Due date for filing. Defaults to Jul 31 of AY start year.
            total_income: Taxable income after deductions (used for 234F threshold).
            is_resident: True if residential status starts with "RES" (resident/NOR).
                         VBA exempts 234B and 234C only for resident senior citizens.
        """
        ay_start = self._ay_start_year(assessment_year)
        if due_date is None:
            due_date = date(ay_start, 7, 31)
        if filing_date is None:
            filing_date = date.today()

        # Separate advance tax (paid during FY) from self-assessment tax (paid in AY)
        fy_start = date(ay_start - 1, 4, 1)
        fy_end = date(ay_start, 3, 31)

        advance_tax_total = 0
        sat_before_due_date = 0
        sat_payments_by_month: dict[int, int] = {}    # month_offset → amount

        for payment in advance_tax_payments:
            amt = int(float(payment.tax_paid_amount or 0))
            pay_date = self._parse_date(payment.date_of_payment)
            if pay_date is None:
                advance_tax_total += amt
                continue

            if fy_start <= pay_date <= fy_end:
                # Paid during the financial year → advance tax
                advance_tax_total += amt
            elif pay_date > fy_end:
                # Paid in assessment year → self-assessment tax
                if pay_date <= due_date:
                    sat_before_due_date += amt
                # Track SAT by month offset from April of AY for 234B
                month_offset = (pay_date.year - ay_start) * 12 + (pay_date.month - 4) + 1
                if month_offset >= 1:
                    sat_payments_by_month[month_offset] = (
                        sat_payments_by_month.get(month_offset, 0) + amt
                    )

        result = InterestResult()

        # 234A — Interest for late filing
        result.interest_234a = self._calc_234a(
            net_tax_liability, advance_tax_total, tds, tcs,
            sat_before_due_date, filing_date, due_date,
        )

        # 234F — Late filing fee (must be computed before 234B)
        result.late_fee_234f = self._calc_234f(
            filing_date, due_date, total_income,
        )

        # Senior citizens (age > 59) who are resident are exempt from 234B and 234C.
        # VBA: If age > 59 And (resStatus = "RES..." Or "NOR...") Then 234B = 0, 234C = 0
        exempt_234bc = age > 59 and is_resident

        # 234C — Interest for deferment of advance tax (before 234B because
        #         234B's month-by-month loop includes 234C in month 1)
        if not exempt_234bc:
            result.interest_234c = self._calc_234c(
                net_tax_liability, tds, tcs, advance_tax_payments,
                assessment_year,
            )

        # 234B — Interest for default in advance tax
        if not exempt_234bc:
            result.interest_234b = self._calc_234b(
                net_tax_liability, advance_tax_total, tds, tcs,
                sat_payments_by_month, filing_date, due_date,
                assessment_year, result.interest_234c, result.late_fee_234f,
            )

        return result

    # ── 234A: Interest for late filing ────────────────────────────────────────
    #
    # VBA Reference (itr1_macros.txt lines 15907-15910, 16214):
    # ┌──────────────────────────────────────────────────────────────────────┐
    # │  If (BalTaxPayable - AdvanceTax - TDS - TCS                        │
    # │      - selfAssessmentTax234A < 0) Then                             │
    # │      intrst234Aprinciple = 0                                       │
    # │  Else                                                              │
    # │      intrst234Aprinciple = BalTaxPayable - AdvanceTax - TDS        │
    # │          - TCS - selfAssessmentTax234A                             │
    # │      intrst234Aprinciple = Application.WorksheetFunction           │
    # │          .Floor(intrst234Aprinciple, 100)                          │
    # │  End If                                                            │
    # │  ...                                                               │
    # │  intrst234A = intrst234Aprinciple * (0.01) * MonthsAfterDueDate    │
    # └──────────────────────────────────────────────────────────────────────┘

    def _calc_234a(
        self,
        net_tax_liability: int,
        advance_tax: int,
        tds: int,
        tcs: int,
        sat_before_due_date: int,
        filing_date: date,
        due_date: date,
    ) -> int:
        """
        Section 234A: 1% per month (or part) on outstanding tax from due date
        to date of filing.

        VBA ref: intrst234A = intrst234Aprinciple × 0.01 × MonthsAfterDueDate
        Principal = MAX(0, FLOOR(NetTaxLiability − AdvanceTax − TDS − TCS − SAT_before_due, 100))
        """
        if filing_date <= due_date:
            return 0

        principal = net_tax_liability - advance_tax - tds - tcs - sat_before_due_date
        if principal <= 0:
            return 0

        # Floor to nearest 100 as per VBA
        principal = _floor_to_100(principal)
        if principal <= 0:
            return 0

        months = _months_between(due_date, filing_date)
        interest = int(principal * Decimal("0.01") * months)
        return max(0, interest)

    # ── 234B: Interest for default in advance tax ─────────────────────────────
    #
    # VBA Reference (itr1_macros.txt lines 24982-25205):
    # ┌──────────────────────────────────────────────────────────────────────────┐
    # │  Function Calculate_InterestPayable234B(                                │
    # │      SysCalculatedNetTaxLiability, matchedAdvanceTax,                   │
    # │      tdsamtused, tcsamtused,                                            │
    # │      intrstPayUs234A_1, intrstPayUs234C_1, intrstPayUs234F_1)           │
    # │                                                                         │
    # │  ' Entry condition:                                                     │
    # │  If ((SysCalculatedNetTaxLiability - (tdsamtused + tcsamtused))          │
    # │      >= CONST_NET_Limit And                                             │
    # │      matchedAdvanceTax < CONST_ATP_Limit / 100                          │
    # │      * (SysCalculatedNetTaxLiability - (tdsamtused + tcsamtused))) Then  │
    # │                                                                         │
    # │      shortFall = Max(0, SysCalculatedNetTaxLiability                    │
    # │          - (matchedAdvanceTax + tdsamtused + tcsamtused))                │
    # │      shortFall = Floor((shortFall / 100), 1) * 100                      │
    # │                                                                         │
    # │  ' Month-by-month loop (April AY → filing date):                        │
    # │  For i = 1 To calcIntrst234BUptoPeriod                                  │
    # │      balancePrincipal = carryForwardPrinicipal                           │
    # │      calcIntrst234BOnPeriod = Round(                                    │
    # │          CONST_IntrstPay234B_Percentage / 100                            │
    # │          * RoundDown(balancePrincipal, -2))                              │
    # │      calcInterestPayable234B += calcIntrst234BOnPeriod                   │
    # │                                                                         │
    # │      ' Balance interest accumulation:                                   │
    # │      If i = 1 Then                                                      │
    # │          balanceInterest = ... + intrstPayUs234C_1                       │
    # │      ElseIf i = month_count_1 Then                                      │
    # │          balanceInterest = ... + intrstPayUs234F_1                       │
    # │      End If                                                             │
    # │                                                                         │
    # │      ' SAT adjustment: first interest, then principal                   │
    # │      SATPaidAtPeriod = SumIf(FormulaOfSAT1, "=" & i, TaxP.Amt)         │
    # │      adjustedInterest = Min(SATPaidAtPeriod, balanceInterest)            │
    # │      adjustedPrincipal = Max(0, Min(SATPaidAtPeriod                      │
    # │          - adjustedInterest, balancePrincipal))                          │
    # │      carryForwardPrinicipal = Max(0, balancePrincipal                    │
    # │          - adjustedPrincipal)                                            │
    # │      carryForwardInterest = Max(0, balanceInterest                      │
    # │          - adjustedInterest)                                             │
    # │  Next                                                                   │
    # │                                                                         │
    # │  Calculate_InterestPayable234B = Round(calcInterestPayable234B, 0)       │
    # └──────────────────────────────────────────────────────────────────────────┘

    def _calc_234b(
        self,
        net_tax_liability: int,
        advance_tax: int,
        tds: int,
        tcs: int,
        sat_by_month: dict[int, int],
        filing_date: date,
        due_date: date,
        assessment_year: str,
        interest_234c: int,
        late_fee_234f: int,
    ) -> int:
        """
        Section 234B: 1% per month on advance-tax shortfall.

        Applies when:
          (NetTaxLiability − TDS − TCS) ≥ ₹10,000  AND
          AdvanceTax < 90% of (NetTaxLiability − TDS − TCS)

        VBA ref: Calculate_InterestPayable234B function — month-by-month loop
        where SAT payments first adjust accrued interest, then principal.
        """
        assessed_tax = net_tax_liability - tds - tcs
        if assessed_tax < self.NET_TAX_THRESHOLD:
            return 0

        if advance_tax >= int(assessed_tax * self.ADVANCE_TAX_PCT / 100):
            return 0

        shortfall = max(0, net_tax_liability - advance_tax - tds - tcs)
        shortfall = _floor_to_100(shortfall)
        if shortfall <= 0:
            return 0

        ay_start = self._ay_start_year(assessment_year)
        # VBA: calcIntrst234BUptoPeriod = (mthdop - 4) + (yrdop - AssYear) * 12 + 1
        # Month count is purely calendar-month based; day-of-month is irrelevant.
        if filing_date < date(ay_start, 4, 1):
            return 0
        total_months = (filing_date.month - 4) + (filing_date.year - ay_start) * 12 + 1
        if total_months <= 0:
            return 0

        # Due date month offset (for adding 234F in that month)
        due_month_offset = (due_date.year - ay_start) * 12 + (due_date.month - 4) + 1

        # Month-by-month calculation with SAT adjustments
        carry_principal = Decimal(shortfall)
        carry_interest = Decimal("0")
        total_interest_234b = Decimal("0")

        for month_i in range(1, total_months + 1):
            balance_principal = carry_principal
            # Interest for this month: 1% of principal (floored to 100)
            monthly_interest = (
                Decimal("0.01") * Decimal(_floor_to_100(int(balance_principal)))
            )
            monthly_interest = _vba_round(monthly_interest)
            total_interest_234b += monthly_interest

            # Accumulate balance interest
            balance_interest = carry_interest + monthly_interest
            if month_i == 1:
                balance_interest += Decimal(interest_234c)
            if month_i == due_month_offset:
                balance_interest += Decimal(late_fee_234f)

            # Apply SAT payment for this month
            sat_payment = Decimal(sat_by_month.get(month_i, 0))
            if sat_payment > 0:
                # SAT first reduces interest, then principal
                adj_interest = min(sat_payment, balance_interest)
                remaining = sat_payment - adj_interest
                adj_principal = min(remaining, balance_principal)
                carry_principal = max(Decimal("0"), balance_principal - adj_principal)
                carry_interest = max(Decimal("0"), balance_interest - adj_interest)
            else:
                carry_principal = balance_principal
                carry_interest = balance_interest

        return max(0, int(_vba_round(total_interest_234b)))

    # ── 234C: Interest for deferment of advance tax ───────────────────────────
    #
    # VBA Reference (itr1_macros.txt lines 16564-16700):
    # ┌──────────────────────────────────────────────────────────────────────────┐
    # │  Sub calcIntrst234C()                                                   │
    # │      BalTaxPayable = Sheet1.Range("IncD.Q1Tax").Value                  │
    # │      BalTaxPayable = BalTaxPayable - Rebate87A                          │
    # │      BalTaxPayable = BalTaxPayable * 1.04                               │
    # │                                                                         │
    # │  If ((BalTaxPayable - TDS - TCS) >= 0) Then                             │
    # │      temp12PerQtr1 = Floor(0.12 * (BalTaxPayable - TDS - TCS), 100)     │
    # │                                                                         │
    # │      ' Q1: 15% by Jun 15                                               │
    # │      If (slab0 < ((BalTaxPayable-TDS-TCS) * 0.15)) Then                 │
    # │          tempintrst234C0i = IIf(slab0 >= temp12PerQtr1, 0,              │
    # │              ((BalTaxPayable-TDS-TCS) * 0.15) - slab0)                  │
    # │          If tempintrst234C0i > 100 Then                                 │
    # │              tempintrst234C0i = RoundDown(tempintrst234C0i, -2)         │
    # │          End If                                                         │
    # │          intrst234C0i = tempintrst234C0i * 0.01 * 3                     │
    # │      End If                                                             │
    # │                                                                         │
    # │      ' Q2: 45% by Sep 15                                               │
    # │      temp36PerQtr2 = Floor(0.36 * (BalTaxPayable-TDS-TCS), 100)         │
    # │      If (slab0+slab1 < ((BalTaxPayable-TDS-TCS) * 0.45)) Then           │
    # │          tempintrst234Ci = IIf((slab0+slab1) >= temp36PerQtr2, 0,       │
    # │              ((BalTaxPayable-TDS-TCS) * 0.45) - slab0 - slab1)          │
    # │          intrst234Ci = RoundDown(tempintrst234Ci, -2) * 0.01 * 3        │
    # │      End If                                                             │
    # │                                                                         │
    # │      ' Q3: 75% by Dec 15                                               │
    # │      If (slab0+slab1+slab2) < ((BalTaxPayable-TDS-TCS) * 0.75) Then     │
    # │          tempintrst234Cii = ((BalTaxPayable-TDS-TCS) * 0.75)            │
    # │              - slab0 - slab1 - slab2                                    │
    # │          intrst234Cii = RoundDown(tempintrst234Cii, -2) * 0.01 * 3      │
    # │      End If                                                             │
    # │                                                                         │
    # │      ' Q4: 100% by Mar 15                                              │
    # │      If ((slab0+slab1+slab2+slab3) < (BalTaxPayable-TDS-TCS)) Then      │
    # │          tempintrst234Ciii = (BalTaxPayable - TDS - TCS                  │
    # │              - slab0 - slab1 - slab2 - slab3)                           │
    # │          intrst234Ciii = RoundDown(tempintrst234Ciii, -2) * 0.01        │
    # │      End If                                                             │
    # │                                                                         │
    # │      ' Post-Q4 (Q5 cess adjustment)                                    │
    # │      BalTaxPayable = Sheet1.Range("IncD.Q5Tax").Value                  │
    # │      BalTaxPayable = (BalTaxPayable - Rebate87A) * 1.04 - slab4         │
    # │      intrst234Civ = RoundDown(BalTaxPayable, -2) * 0.01                 │
    # │                                                                         │
    # │  intrst234C = intrst234C0i + intrst234Ci + intrst234Cii                 │
    # │      + intrst234Ciii + intrst234Civ                                     │
    # │  If ((baseTax - TDS - TCS) < 10000) Then intrst234C = 0                 │
    # │  If (bacage > 59) Then intrst234C = 0                                   │
    # │  End Sub                                                                │
    # └──────────────────────────────────────────────────────────────────────────┘

    def _calc_234c(
        self,
        net_tax_liability: int,
        tds: int,
        tcs: int,
        advance_tax_payments: List[TaxPaidSelfModel],
        assessment_year: str,
    ) -> int:
        """
        Section 234C: Interest on quarterly advance-tax shortfall.

        Expected schedule (FY):
          Q1: 15% by Jun 15    — shortfall × 1% × 3 months
          Q2: 45% by Sep 15    — shortfall × 1% × 3 months
          Q3: 75% by Dec 15    — shortfall × 1% × 3 months
          Q4: 100% by Mar 15   — shortfall × 1% × 1 month

        net_tax_liability already includes cess; do NOT multiply by 1.04.
        (VBA's IncD.Q1Tax * 1.04 is because those cells exclude cess.)

        VBA ref: calcIntrst234C subroutine — uses per-quarter IncD.Q1Tax..Q5Tax.
        Simplified here to use NetTaxLiability as base (single assessment).
        """
        assessed_tax = net_tax_liability - tds - tcs
        if assessed_tax < self.NET_TAX_THRESHOLD:
            return 0

        ay_start = self._ay_start_year(assessment_year)
        fy_start_year = ay_start - 1

        # Quarter boundaries (FY)
        q1_end = date(fy_start_year, 6, 15)
        q2_end = date(fy_start_year, 9, 15)
        q3_end = date(fy_start_year, 12, 15)
        q4_end = date(ay_start, 3, 15)

        # Bucket advance tax payments by quarter
        slab = [0, 0, 0, 0, 0]  # Q1, Q2, Q3, Q4, post-Q4
        for payment in advance_tax_payments:
            pay_date = self._parse_date(payment.date_of_payment)
            amt = int(float(payment.tax_paid_amount or 0))
            if pay_date is None:
                continue

            if pay_date <= q1_end:
                slab[0] += amt
            elif pay_date <= q2_end:
                slab[1] += amt
            elif pay_date <= q3_end:
                slab[2] += amt
            elif pay_date <= q4_end:
                slab[3] += amt
            else:
                slab[4] += amt

        # net_tax_liability already includes cess; do NOT multiply by 1.04
        # (VBA's IncD.Q1Tax * 1.04 is because that cell excludes cess)
        net_base = net_tax_liability - tds - tcs

        if net_base <= 0:
            return 0

        interest_total = 0

        # Q1: 15% required by Jun 15
        required_q1 = Decimal(str(net_base)) * self.Q1_PCT
        cum_paid = slab[0]
        threshold_12pct = _floor_to_100(int(Decimal("0.12") * Decimal(str(net_base))))
        if cum_paid < int(required_q1):
            shortfall = int(required_q1) - cum_paid
            if cum_paid < threshold_12pct:
                shortfall = max(0, shortfall)
            else:
                shortfall = 0
            if shortfall > 100:
                shortfall = _round_down_100(shortfall)
            interest_total += int(Decimal(shortfall) * Decimal("0.01") * 3)

        # Q2: 45% required by Sep 15
        required_q2 = Decimal(str(net_base)) * self.Q2_PCT
        cum_paid += slab[1]
        threshold_36pct = _floor_to_100(int(Decimal("0.36") * Decimal(str(net_base))))
        if cum_paid < int(required_q2):
            shortfall = int(required_q2) - cum_paid
            if cum_paid >= threshold_36pct:
                shortfall = 0
            if shortfall > 100:
                shortfall = _round_down_100(shortfall)
            interest_total += int(Decimal(shortfall) * Decimal("0.01") * 3)

        # Q3: 75% required by Dec 15
        required_q3 = Decimal(str(net_base)) * self.Q3_PCT
        cum_paid += slab[2]
        if cum_paid < int(required_q3):
            shortfall = int(required_q3) - cum_paid
            if shortfall > 100:
                shortfall = _round_down_100(shortfall)
            interest_total += int(Decimal(shortfall) * Decimal("0.01") * 3)

        # Q4: 100% required by Mar 15
        required_q4 = Decimal(str(net_base)) * self.Q4_PCT
        cum_paid += slab[3]
        if cum_paid < int(required_q4):
            shortfall = int(required_q4) - cum_paid
            if shortfall > 100:
                shortfall = _round_down_100(shortfall)
            interest_total += int(Decimal(shortfall) * Decimal("0.01") * 1)

        # Check for excess paid that carries to post-Q4
        excess = cum_paid - int(required_q4)
        if excess < 0:
            excess = 0
        post_q4_total = slab[4] + excess

        # Post-Q4 (Mar 16–Mar 31): remaining shortfall × 1%
        total_due = int(Decimal(str(net_base)) * self.Q4_PCT)
        final_base = total_due - post_q4_total
        if final_base > 100:
            final_base = _round_down_100(final_base)
            interest_total += int(Decimal(final_base) * Decimal("0.01") * 1)

        return max(0, interest_total)

    # ── 234F: Late filing fee ─────────────────────────────────────────────────
    #
    # VBA Reference (itr1_macros.txt lines 17485-17630):
    # ┌──────────────────────────────────────────────────────────────────────────┐
    # │  Sub NEW234F()                                                          │
    # │      Returnfiledstatus = Mid(Range("sheet1.ReturnFileSec1"), 1, 2)     │
    # │      VerificationDate = Range("Ver.Date").Value                        │
    # │      dueDate = Dformat(Sheet5.Range("DueDate1").Value, "yyyy-mm-dd")  │
    # │      VerificationDate1 = Dformat(VerificationDate, "yyyy-mm-dd")       │
    # │                                                                         │
    # │  If (Returnfiledstatus="14" Or ... Or "20")                            │
    # │      Or (VerificationDate1 <= dueDate) Then                             │
    # │      intrst234F = 0                                                     │
    # │  ElseIf (Returnfiledstatus="13" Or "11" Or "12" Or UpdatedN)           │
    # │      And Range("IncD.TotalIncome_New").Value <= 500000 Then             │
    # │      intrst234F = 1000                                                  │
    # │  ElseIf (Returnfiledstatus="13" Or "11" Or "12" Or UpdatedN)           │
    # │      And Range("IncD.TotalIncome_New").Value > 500000                   │
    # │      And (VerificationDate1 > DueDate)                                  │
    # │      And (VerificationDate1 <= "2025-12-31") Then                       │
    # │      intrst234F = 5000                                                  │
    # │  ' ... (similar pattern for revised returns 17/18/19/UpdatedY           │
    # │  '       using DateOfFiling1 instead of VerificationDate1)              │
    # │  Else                                                                   │
    # │      intrst234F = 5000                                                  │
    # │  End If                                                                 │
    # │  End Sub                                                                │
    # └──────────────────────────────────────────────────────────────────────────┘

    def _calc_234f(
        self,
        filing_date: date,
        due_date: date,
        total_income: int,
    ) -> int:
        """
        Section 234F: Late filing fee.

        If return filed after due date:
          • Total income > ₹5 lakh → ₹5,000
          • Total income ≤ ₹5 lakh → ₹1,000

        VBA ref: Calculate234F — uses Range("IncD.GrossTotIncome_New")
        which is total taxable income, NOT tax liability.
        """
        if filing_date <= due_date:
            return 0
        return 1000 if total_income <= 500_000 else 5000

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _ay_start_year(assessment_year: str) -> int:
        """Extract the start year from assessment_year string like '2026-27'."""
        return int(assessment_year.split("-")[0])

    @staticmethod
    def _parse_date(value: Any) -> Optional[date]:
        """Parse date from various formats."""
        if value is None:
            return None
        if isinstance(value, date):
            return value
        s = str(value).strip()
        if not s:
            return None
        # Try common formats
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
            try:
                from datetime import datetime
                return datetime.strptime(s, fmt).date()
            except ValueError:
                continue
        return None


# ── Module-level helpers ──────────────────────────────────────────────────────

def _floor_to_100(value: int) -> int:
    """Floor to nearest 100 (VBA: Application.WorksheetFunction.Floor(x, 100))."""
    return (value // 100) * 100


def _round_down_100(value: int) -> int:
    """Round down to nearest 100 (VBA: RoundDown(x, -2))."""
    return (value // 100) * 100


def _months_between(start: date, end: date) -> int:
    """Count months (including partial) between two dates.

    VBA ref: EfilingCommon.calcNoOfMonths (itr1_macros.txt lines 7671-7740).
    Any part of a month counts as a full month.

    VBA Reference:
    ┌──────────────────────────────────────────────────────────────────────┐
    │  Function calcNoOfMonths(currentdate, startDate) As Long           │
    │      currentYear = Mid(currentdate, 7, 4)                          │
    │      startyear   = Mid(startDate, 7, 4)                            │
    │      currentMonth = Mid(currentdate, 4, 2)                         │
    │      startmonth   = Mid(startDate, 4, 2)                           │
    │      calcNoOfMonths = 0                                            │
    │                                                                    │
    │      If currentYear = startyear Then                               │
    │          calcNoOfMonths = currentMonth - startmonth                 │
    │          If (day(current) > day(start))                             │
    │              And (currentMonth = startmonth) Then                   │
    │              calcNoOfMonths = calcNoOfMonths + 1                    │
    │          ElseIf day(start) = 7                                     │
    │              And (currentMonth >= startmonth) Then                  │
    │              calcNoOfMonths = calcNoOfMonths + 1                    │
    │          End If                                                    │
    │      ElseIf currentYear = (startyear + 1) Then                     │
    │          If currentMonth < startmonth Then                          │
    │              calcNoOfMonths = 12-(startmonth-currentMonth)          │
    │          Else                                                      │
    │              calcNoOfMonths = 12+(currentMonth-startmonth)          │
    │          End If                                                    │
    │          If day(start) = 7 Then                                    │
    │              calcNoOfMonths = calcNoOfMonths + 1                    │
    │          End If                                                    │
    │      End If                                                        │
    │  End Function                                                      │
    └──────────────────────────────────────────────────────────────────────┘
    """
    if end <= start:
        return 0
    months = (end.year - start.year) * 12 + (end.month - start.month)
    if end.day > start.day:
        months += 1
        # VBA MonthDiff: undo the +1 when start is the last day of a 30-day month
        # (Apr 30, Jun 30, Sep 30, Nov 30) — these months have no day 31 so the
        # +1 over-counts by a month.
        if start.day == 30 and start.month in (4, 6, 9, 11):
            months -= 1
    elif start.day == 7 and end.day <= start.day:
        # VBA special case: if start date is the 7th and current day ≤ 7, add 1 month.
        months += 1
    return max(0, months)


def _vba_round(val: Decimal) -> Decimal:
    """Banker's rounding to nearest integer (VBA default)."""
    from decimal import ROUND_HALF_EVEN
    return val.quantize(Decimal("1"), rounding=ROUND_HALF_EVEN)
