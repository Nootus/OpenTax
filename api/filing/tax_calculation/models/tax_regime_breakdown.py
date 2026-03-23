from decimal import Decimal
from typing import List, Optional

from pydantic import Field

from filing.models.api_base_model import ApiBaseModel
from filing.tax_calculation.models.tax_interest_breakdown import TaxInterestBreakdownModel
from filing.itr.itr1.models.itr1_model import (
    SalaryIncomePartModel,
    HousePropertyIncomePartModel,
    OtherSourcesIncomePartModel,
)


class TaxSlabEntry(ApiBaseModel):
    from_amount: Decimal = Field(..., description="Slab lower bound (inclusive)")
    to_amount: Optional[Decimal] = Field(None, description="Slab upper bound (inclusive); None for the top slab")
    rate: Decimal = Field(..., description="Tax rate for this slab (e.g. 5 = 5%)")
    taxable_amount: Decimal = Field(..., description="Income falling within this slab")
    tax: Decimal = Field(..., description="Tax computed for this slab")


class SurchargeBreakdown(ApiBaseModel):
    rate: Decimal = Field(..., description="Surcharge rate applied (e.g. 10 = 10%)")
    surcharge_before_relief: Decimal = Field(..., description="Surcharge computed before marginal relief")
    marginal_relief: Decimal = Field(..., description="Marginal relief applied")
    net_surcharge: Decimal = Field(..., description="Net surcharge after marginal relief")


class CessBreakdown(ApiBaseModel):
    rate: Decimal = Field(..., description="Cess rate applied (e.g. 4 = 4%)")
    base_amount: Decimal = Field(..., description="Tax + surcharge on which cess is computed")
    cess: Decimal = Field(..., description="Health and education cess amount")


class SpecialRateTaxEntry(ApiBaseModel):
    """A single row in the special-rate tax breakdown (one row per rate bucket)."""
    section: str = Field(..., description="Section code e.g. '111A', '112A', '115BB', '115BBE'")
    description: str = Field(..., description="Human-readable description of the income type")
    rate: Decimal = Field(..., description="Tax rate in percent (e.g. Decimal('15') = 15%)")
    income: Decimal = Field(..., description="Gross income in this rate bucket")
    taxable_income: Decimal = Field(..., description="Taxable income after applicable exemption (e.g. ₹1.25L for Sec 112A)")
    tax: Decimal = Field(..., description="Tax computed on taxable_income at this rate")


class CapitalGainsIncomePartModel(ApiBaseModel):
    # ── Aggregate totals ─────────────────────────────────────────────────
    short_term: Decimal = Field(default=Decimal("0"), description="Total short-term capital gains")
    long_term: Decimal = Field(default=Decimal("0"), description="Total long-term capital gains")
    total: Decimal = Field(default=Decimal("0"), description="Total capital gains (STCG + LTCG)")

    # ── STCG rate buckets ───────────────────────────────────────────────
    stcg_15_pct: Decimal = Field(default=Decimal("0"), description="STCG Sec 111A @15%")
    stcg_20_pct: Decimal = Field(default=Decimal("0"), description="STCG Sec 111A @20%")
    stcg_applicable_rate: Decimal = Field(default=Decimal("0"), description="STCG at applicable slab rate")

    # ── LTCG rate buckets ───────────────────────────────────────────────
    ltcg_10_pct: Decimal = Field(default=Decimal("0"), description="LTCG Sec 112A @10%")
    ltcg_12_5_pct: Decimal = Field(default=Decimal("0"), description="LTCG Sec 112A @12.5%")
    ltcg_12_5_pct_other: Decimal = Field(default=Decimal("0"), description="LTCG @12.5% other capital assets")
    ltcg_20_pct: Decimal = Field(default=Decimal("0"), description="LTCG Sec 112 @20% with indexation")
    ltcg_112_proviso_credit: Decimal = Field(default=Decimal("0"), description="Sec 112 proviso credit")

    # ── Special-rate OS income ──────────────────────────────────────────
    lottery_30_pct: Decimal = Field(default=Decimal("0"), description="Sec 115BB — Lottery @30%")
    vda_30_pct: Decimal = Field(default=Decimal("0"), description="Sec 115BBH — VDA/crypto @30%")
    online_gaming_30_pct: Decimal = Field(default=Decimal("0"), description="Sec 115BBJ — Online gaming @30%")
    unexplained_60_pct: Decimal = Field(default=Decimal("0"), description="Sec 115BBE — Unexplained @60%")


class IncomeBreakdown(ApiBaseModel):
    salary: Optional[SalaryIncomePartModel] = None
    house: Optional[HousePropertyIncomePartModel] = None
    capital_gains: Optional[CapitalGainsIncomePartModel] = None
    others: Optional[OtherSourcesIncomePartModel] = None
    gross_total: Decimal = Field(..., description="Gross total income from all sources")


class TaxRegimeBreakdownModel(ApiBaseModel):
    regime: str = Field(..., description="Regime for this computation (old/new)")

    gross_total_income: Decimal = Field(..., description="Gross total income")
    total_deductions: Decimal = Field(..., description="Total deductions considered")
    total_income: Decimal = Field(..., description="Total taxable income after deductions")

    tax_before_rebate: Decimal = Field(..., description="Tax before rebate")
    rebate_87a: Decimal = Field(..., description="Rebate under section 87A")
    surcharge: Decimal = Field(default=Decimal("0"), description="Surcharge amount")
    tax_after_rebate: Decimal = Field(..., description="Tax after rebate")
    health_education_cess: Decimal = Field(..., description="Health and education cess @4%")
    total_tax_liability: Decimal = Field(..., description="Total tax liability including cess")

    tds: Decimal = Field(..., description="Tax deducted at source")
    tcs: Decimal = Field(..., description="Tax collected at source")
    advance_tax: Decimal = Field(..., description="Advance / self-assessment tax")
    total_taxes_paid: Decimal = Field(..., description="Total taxes already paid")

    tax_payable: Decimal = Field(..., description="Net tax payable")
    refund: Decimal = Field(..., description="Refund due")

    tax_intrest: Decimal = Field(default=Decimal("0"), description="Total interest u/s 234A/B/C and late fee u/s 234F")
    tax_intrest_breakdown: TaxInterestBreakdownModel = Field(
        default_factory=TaxInterestBreakdownModel,
        description="Breakup of 234A/234B/234C interest and 234F late fee",
    )

    bel: Decimal = Field(default=Decimal("0"), description="Basic Exemption Limit")
    bel_shortfall: Decimal = Field(default=Decimal("0"), description="Shortfall of normal taxable income below BEL")

    special_rate_tax: Decimal = Field(default=Decimal("0"), description="Total tax at special rates")

    income_breakdown: Optional[IncomeBreakdown] = Field(None, description="Breakdown of income by head")
    slab_breakdown: Optional[List[TaxSlabEntry]] = Field(None, description="Tax slab-by-slab")
    special_rate_tax_breakdown: Optional[List[SpecialRateTaxEntry]] = Field(None, description="Special-rate tax details")
    surcharge_breakdown: Optional[SurchargeBreakdown] = Field(None, description="Surcharge computation detail")
    cess_breakdown: Optional[CessBreakdown] = Field(None, description="Cess computation detail")
