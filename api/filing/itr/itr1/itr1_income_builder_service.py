"""
ITR1 Income Building Service - Handles all income-related building logic.
This includes Salary, House Property, and Other Sources income.
"""
import logging
from datetime import date
from typing import Any, Optional

from filing.itr.itr1.models.itr1_model import (
    AllwncExemptUs10Model,
    HousePropertyIncomePartModel,
    ITR1IncomePartModel,
    OtherSourcesIncomePartModel,
    OthersIncModel,
    SalaryIncomePartModel,
)
from filing.models.filing_model import FilingModel
from filing.tax_calculation.models.tax_regime_breakdown import IncomeBreakdown
from filing.utils.master_data_service import MasterDataService
from filing.itr.itr1.itr1_deduction_builder_service import Itr1ComputationContext

logger = logging.getLogger(__name__)


class Itr1IncomeBuilderService:
    """Service for building ITR1 income sections from FilingModel."""
    itr1: Optional[ITR1IncomePartModel] = None
    def __init__(self) -> None:
        pass

    async def build_income(self, filing: FilingModel, context: Itr1ComputationContext, regime: str = "old") -> ITR1IncomePartModel:
        """Build income part by combining salary, house property, and other sources → GrossTotIncome."""
        
        salary_part = await self.build_salary_income(filing, context, regime)
        hp_part = await self.build_house_property_income(filing, regime)
        other_part = await self.build_other_sources_income(filing)

        gross_tot_income = int(getattr(salary_part, "IncomeFromSal", None) or 0) + int(getattr(hp_part, "TotalIncomeOfHP", None) or 0) + int(getattr(other_part, "IncomeOthSrc", None) or 0)

        self.income_breakdown = IncomeBreakdown(
            salary=salary_part,
            house=hp_part,
            others=other_part,
            gross_total=gross_tot_income,
        )

        context.gross_salary = int(getattr(salary_part, "IncomeFromSal", None) or 0)
        context.income_house_property = int(getattr(hp_part, "TotalIncomeOfHP", None) or 0)
        context.income_other_sources = int(getattr(other_part, "IncomeOthSrc", None) or 0)
        context.gross_total_income = gross_tot_income

        return ITR1IncomePartModel(
            **salary_part.model_dump(),
            **hp_part.model_dump(),
            **other_part.model_dump(),
            Increliefus89A=0,
            Increliefus89AOS=0,
            GrossTotIncome=gross_tot_income,
        )

    async def build_salary_income(self, filing: FilingModel, context: Itr1ComputationContext, regime: str = "old") -> SalaryIncomePartModel:
        """Build salary income part: delegates to sub-methods for each section."""
        # In OpenTax, salary components are not fetched from DB.
        # The component_id on each item is sufficient for exempt allowance detection.
        salary_components: list[Any] = []

        section_171_salary = await self._build_section_171_salary(filing)
        section_172_perquisites = await self._build_section_172_perquisites(filing)
        section_173_profits = await self._build_section_173_profits_in_lieu(filing)
        section_89a_foreign = self._build_section_89a_foreign_income(filing)
        allowance_dtls, total_exempt_allowances = await self._build_allowances_exempt_us10(filing, salary_components, regime)
        ded_16ia, ent_16ii, prof_16iii, total_ded_16 = self._build_deductions_us16(filing, regime)

        gross_salary = section_171_salary + section_172_perquisites + section_173_profits + section_89a_foreign
        context.gross_salary = gross_salary
        net_salary = gross_salary - total_exempt_allowances
        income_from_sal = net_salary - total_ded_16

        return SalaryIncomePartModel(
            GrossSalary=gross_salary,
            Salary=section_171_salary,
            PerquisitesValue=section_172_perquisites,
            ProfitsInSalary=section_173_profits,
            AllwncExemptUs10=AllwncExemptUs10Model(
                AllwncExemptUs10Dtls=allowance_dtls,
                TotalAllwncExemptUs10=total_exempt_allowances,
            ),
            DeductionUs16=total_ded_16,
            DeductionUs16ia=ded_16ia,
            EntertainmentAlw16ii=ent_16ii,
            ProfessionalTaxUs16iii=prof_16iii,
            NetSalary=net_salary,
            IncomeFromSal=income_from_sal,
        )

    async def _build_section_171_salary(self, filing: FilingModel) -> int:
        """Build Section 17(1) - Salary Income."""
        salary_total = 0.0
        for sal in filing.salary or []:
            for item in sal.salary_section_171 or []:
                if item.amount:
                    salary_total += float(item.amount)
        return int(salary_total)

    async def _build_section_172_perquisites(self, filing: FilingModel) -> int:
        """Build Section 17(2) - Value of Perquisites."""
        perquisites_total = 0.0
        for sal in filing.salary or []:
            for item in sal.salary_section_172 or []:
                if item.amount:
                    perquisites_total += float(item.amount)
        return int(perquisites_total)

    async def _build_section_173_profits_in_lieu(self, filing: FilingModel) -> int:
        """Build Section 17(3) - Profit in Lieu of Salary."""
        profits_total = 0.0
        for sal in filing.salary or []:
            for item in sal.salary_section_173 or []:
                if item.amount:
                    profits_total += float(item.amount)
        return int(profits_total)

    def _build_section_89a_foreign_income(self, filing: FilingModel) -> int:
        """Build Section 89A - Income from Retirement Benefit Account in Notified Country."""
        # This is typically handled in other_sources_income, return 0 for now
        return 0

    async def _build_allowances_exempt_us10(
        self, filing: FilingModel, salary_components: list[Any], regime: str = "old"
    ) -> tuple[list[Any], int]:
        """Build Section II - Less: Allowances to the extent exempt u/s 10."""
        AllwncExemptUs10Dtls: list[Any] = []
        TotalAllwncExemptUs10 = 0.0
       
        for sal in filing.salary or []:
            for item in sal.salary_section_171 or []:
                if item.amount:
                    comp_id = int(item.component_id)
                    if regime.lower() == "new" and comp_id in {10, 11, 12, 13, 14, 38, 39}:
                        continue  # New regime: skip Conveyance (10), HRA (11), Medical (12), LTA (13), Other (14), Duty (38), Personal Expense (39)
                    
                    # Component IDs that are exempt allowances
                    if comp_id in [10, 11, 12, 13, 14, 21, 22, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42]:
                        if float(item.exemption_amount or 0.0) > float(item.amount):
                            TotalAllwncExemptUs10 += float(item.amount or 0.0)
                        elif item.exemption_amount is not None:
                            TotalAllwncExemptUs10 += float(item.exemption_amount or 0.0)
                        else:
                            TotalAllwncExemptUs10 += float(item.amount or 0.0)
                        current_component = next(
                            (c for c in salary_components if c["component_id"] == item.component_id), None
                        )
                        if current_component:
                            AllwncExemptUs10Dtls.append({
                                "SalNatureDesc": current_component.get("component_code", ""),
                                "SalOthNatOfInc": current_component.get("component_name") if current_component.get("component_code") != "OTH" else None,
                                "SalOthAmount": min(float(item.exemption_amount if item.exemption_amount is not None else item.amount or 0.0), float(item.amount or 0.0)),
                            })

        return AllwncExemptUs10Dtls, int(TotalAllwncExemptUs10)

    def _build_deductions_us16(self, filing: FilingModel, regime: str = "old") -> tuple[int, int, int, int]:
        """Build Section IV - Deductions u/s 16. Returns (DeductionUs16ia, EntertainmentAlw16ii, ProfessionalTaxUs16iii, TotalDeductionUs16)."""
        # Determine standard deduction limit based on regime
        entertainment_allowance_total = 0.0
        professional_tax_total = 0.0
        has_salary = False

        for sal in filing.salary or []:
            for item in sal.salary_section_171 or []:
                if item.amount:
                    has_salary = True
                    break
            if has_salary:
                break
            for item in sal.salary_section_172 or []:
                if item.amount:
                    has_salary = True
                    break
            if has_salary:
                break
            for item in sal.salary_section_173 or []:
                if item.amount:
                    has_salary = True
                    break
            if has_salary:
                break

        for sal in filing.salary or []:
            if sal.salary_deduction_16:
                entertainment_allowance_total += float(
                    sal.salary_deduction_16.entertainment_allowance
                    if getattr(sal.employer, "employer_type", None) in ("CGOV", "SGOV", "PE", "PESG")
                    else 0.0
                )
                professional_tax_total += float(sal.salary_deduction_16.professional_tax or 0.0)

        # Apply limits
        standard_deduction = 0
        if has_salary:
            standard_deduction = 75000 if regime.lower() == "new" else 50000
        entertainment_allowance_total = min(entertainment_allowance_total, 5000)
        professional_tax_total = min(professional_tax_total, 5000)
        if regime.lower() == "new":
            professional_tax_total = 0
        
        total_deductions = standard_deduction + entertainment_allowance_total + professional_tax_total

        return int(standard_deduction), int(entertainment_allowance_total), int(professional_tax_total), int(total_deductions)

    async def build_house_property_income(self, filing: FilingModel, regime: str = "old") -> HousePropertyIncomePartModel:
        """Build house property income part: delegates to sub-methods for each section."""
        if not filing.house_property:
            return HousePropertyIncomePartModel(
                TypeOfHP=None,
                GrossRentReceived=0,
                TaxPaidlocalAuth=0,
                AnnualValue=0,
                StandardDeduction=0,
                InterestPayable=0,
                ArrearsUnrealizedRentRcvd=0,
                TotalIncomeOfHP=0,
            )
        
        # Build each row/section
        type_of_hp = self._build_type_of_house_property(filing)
        gross_rent_received = self._build_gross_rent_received(filing)
        tax_paid_local_auth = self._build_tax_paid_to_local_authorities(filing)
        annual_value = self._build_annual_value(gross_rent_received, tax_paid_local_auth)
        standard_deduction_hp = self._build_standard_deduction_30_percent(annual_value)
        interest_payable = self._build_interest_payable_on_borrowed_capital(filing, regime)
        arrears_unrealized_rent_rcvd = self._build_arrears_unrealized_rent(filing)
        total_income_of_hp = self._build_total_income_of_house_property(
            annual_value, standard_deduction_hp, interest_payable, arrears_unrealized_rent_rcvd,
            regime=regime, property_type=type_of_hp,
        )

        return HousePropertyIncomePartModel(
            TypeOfHP=type_of_hp,
            GrossRentReceived=int(gross_rent_received),
            TaxPaidlocalAuth=int(tax_paid_local_auth),
            AnnualValue=int(annual_value),
            StandardDeduction=int(standard_deduction_hp),
            InterestPayable=int(interest_payable),
            ArrearsUnrealizedRentRcvd=int(arrears_unrealized_rent_rcvd),
            TotalIncomeOfHP=int(total_income_of_hp),
        )

    def _build_type_of_house_property(self, filing: FilingModel) -> Optional[str]:
        """Determine Type of House Property: L=Let Out, D=Deemed Let Out, S=Self Occupied."""
        if not filing.house_property:
            return None
        property_type = filing.house_property[0].property.property_type
        return property_type
    

    def _build_gross_rent_received(self, filing: FilingModel) -> float:
        """Build Row i - Gross rent received/receivable/lettable value during the year."""
        gross_rent_received = 0.0
        for hp in filing.house_property:
            gross_rent_received += float(hp.property.annual_rent_received or 0)
        return gross_rent_received

    def _build_tax_paid_to_local_authorities(self, filing: FilingModel) -> float:
        """Build Row ii - Tax paid to local authorities."""
        tax_paid_local_auth = 0.0
        for hp in filing.house_property:
            tax_paid_local_auth += float(hp.property.municipal_taxes_paid or 0)
        return tax_paid_local_auth

    def _build_annual_value(self, gross_rent_received: float, tax_paid_local_auth: float) -> float:
        """Build Row iii - Annual Value (i - ii). Cannot be negative."""
        return max(0.0, gross_rent_received - tax_paid_local_auth)

    def _build_standard_deduction_30_percent(self, annual_value: float) -> float:
        """Build Row iv - 30% of Annual Value (only when AnnualValue > 0)."""
        return annual_value * 0.30 if annual_value > 0 else 0.0

    def _build_interest_payable_on_borrowed_capital(self, filing: FilingModel, regime: str = "old") -> float:
        """Build Row v - Interest payable on borrowed capital.
        
        New regime: interest deduction only for let-out property (L/D); self-occupied (S) gets no deduction.
        """
        if regime.lower() == "new":
            property_type = self._build_type_of_house_property(filing)
            if property_type not in ("L", "D"):
                return 0
        _, total = self.build_scheduleUs24B(filing)
        return total

    def _build_arrears_unrealized_rent(self, filing: FilingModel) -> float:
        """Build Row vi - Arrears/Unrealised Rent received during the year Less 30%."""
        # This is typically 0 for most cases, can be enhanced if needed
        return 0.0

    def _build_total_income_of_house_property(
        self,
        annual_value: float,
        standard_deduction: float,
        interest_payable: float,
        arrears_unrealized_rent: float,
        regime: str = "old",
        property_type: Optional[str] = None,
    ) -> float:
        """Build Row vii - Income chargeable under the head 'House Property' (iii - iv - v + vi).
        
        Old regime: loss capped at ₹2,00,000.
        New regime, self-occupied (S): interest already 0, no loss possible.
        New regime, let-out/deemed (L/D): interest allowed but no loss setoff (floor at 0).
        """
        total_income = (annual_value - standard_deduction - interest_payable) + arrears_unrealized_rent
        if regime.lower() == "new" and property_type in ("L", "D"):
            return max(0, total_income)
        return max(-200000, total_income)

    async def build_other_sources_income(self, filing: FilingModel) -> OtherSourcesIncomePartModel:
        """Build other sources income: delegates to sub-methods for each section."""
        other_income_options = MasterDataService().get_interest_types()

        interest_dtls, interest_total = await self._build_interest_income_details(filing, other_income_options)
        div_detail, div_total = self._build_dividend_income_with_quarterly_breakup(filing)
        sec89a_detail, sec89a_total, sec89a_type = self._build_section_89a_foreign_retirement_income(filing)

        return OtherSourcesIncomePartModel(
            OthersInc=OthersIncModel(OthersIncDtlsOthSrc=interest_dtls + [div_detail, sec89a_detail]),
            IncomeOthSrc=interest_total + div_total + sec89a_total,
            IncomeNotified89AType=sec89a_type,
        )

    async def _build_interest_income_details(
        self, filing: FilingModel, other_income_options: list[Any]
    ) -> tuple[list[Any], int]:
        """Build interest income details (rows 1-4): Savings, FD, Tax-free, etc."""
        others_inc_dtls: list[Any] = []
        total_interest_income = 0.0
        
        excel_options = [
            o["value"] for o in other_income_options 
            if o.get("code") in ["SAV", "IFD", "TAX", "FAP", "10(11)(iP)", "10(11)(iiP)", "10(12)(iP)", "10(12)(iiP)", "OTH"]
        ]
        oth_option = next((o for o in other_income_options if o.get("code") == "OTH"), None)
        oth_type_id = int(oth_option["value"]) if oth_option else None
        
        # Aggregate by same option (code + optional OthSrcOthNatOfInc) so we sum amounts
        aggregated: dict[tuple[str, Optional[str]], float] = {}
        
        for other_income in filing.interest_income or []:
            if str(other_income.interest_type_id) not in excel_options:
                continue
            
            amount = float(other_income.amount or 0)
            total_interest_income += amount
            
            option = next(
                (o for o in other_income_options if o["value"] == str(other_income.interest_type_id)), 
                None
            )
            oth_src_code = option["code"] if option else "OTH"
            oth_nat = "Other Income" if (oth_type_id is not None and other_income.interest_type_id == oth_type_id) else None
            key = (oth_src_code, oth_nat)
            aggregated[key] = aggregated.get(key, 0) + amount
        
        # Build detail records
        for (oth_src_code, oth_nat), amt in aggregated.items():
            if oth_nat is not None:
                others_inc_dtls.append({
                    "OthSrcNatureDesc": oth_src_code,
                    "OthSrcOthNatOfInc": oth_nat,
                    "OthSrcOthAmount": int(amt)
                })
            else:
                others_inc_dtls.append({
                    "OthSrcNatureDesc": oth_src_code,
                    "OthSrcOthAmount": int(amt)
                })
        
        return others_inc_dtls, int(total_interest_income)

    def _build_dividend_income_with_quarterly_breakup(self, filing: FilingModel) -> tuple[Any, int]:
        """Build dividend income with quarterly date range breakup."""
        total_dividend_amount = 0
        
        # Initialize quarterly breakup
        Up16Of12To15Of3 = Up16Of3To31Of3 = Up16Of9To15Of12 = Upto15Of6 = Upto15Of9 = 0
        
        div_income = filing.dividend_income
        if div_income:
            # Process equity dividends
            if div_income.equity:
                for div in div_income.equity:
                    if div.date_of_receipt is not None and div.date_of_receipt > date(2026, 3, 31):
                        continue
                    
                    total_dividend_amount += int(div.amount or 0)
                    
                    # Quarterly breakup
                    if div.date_of_receipt:
                        if date(2025, 12, 16) <= div.date_of_receipt <= date(2026, 3, 15):
                            Up16Of12To15Of3 += int(div.amount or 0)
                        elif date(2026, 3, 16) <= div.date_of_receipt <= date(2026, 3, 31):
                            Up16Of3To31Of3 += int(div.amount or 0)
                        elif date(2025, 9, 16) <= div.date_of_receipt <= date(2025, 12, 15):
                            Up16Of9To15Of12 += int(div.amount or 0)
                        elif div.date_of_receipt <= date(2025, 6, 15):
                            Upto15Of6 += int(div.amount or 0)
                        elif date(2025, 6, 16) <= div.date_of_receipt <= date(2025, 9, 15):
                            Upto15Of9 += int(div.amount or 0)
            
            # Process RSU dividends
            if div_income.rsu:
                for div in div_income.rsu:
                    if div.date_of_receipt > date(2026, 3, 31):
                        continue
                    
                    total_dividend_amount += int(div.amount or 0)
                    
                    # Quarterly breakup
                    if div.date_of_receipt:
                        if date(2025, 12, 16) <= div.date_of_receipt <= date(2026, 3, 15):
                            Up16Of12To15Of3 += int(div.amount or 0)
                        elif date(2026, 3, 16) <= div.date_of_receipt <= date(2026, 3, 31):
                            Up16Of3To31Of3 += int(div.amount or 0)
                        elif date(2025, 9, 16) <= div.date_of_receipt <= date(2025, 12, 15):
                            Up16Of9To15Of12 += int(div.amount or 0)
                        elif div.date_of_receipt <= date(2025, 6, 15):
                            Upto15Of6 += int(div.amount or 0)
                        elif date(2025, 6, 16) <= div.date_of_receipt <= date(2025, 9, 15):
                            Upto15Of9 += int(div.amount or 0)
        
        dividend_detail = {
            "DividendInc": {
                "DateRange": {
                    "Up16Of12To15Of3": Up16Of12To15Of3,
                    "Up16Of3To31Of3": Up16Of3To31Of3,
                    "Up16Of9To15Of12": Up16Of9To15Of12,
                    "Upto15Of6": Upto15Of6,
                    "Upto15Of9": Upto15Of9,
                }
            },
            "OthSrcOthAmount": total_dividend_amount,
            "OthSrcNatureDesc": "DIV",
        }
        return dividend_detail, total_dividend_amount

    def _build_section_89a_foreign_retirement_income(self, filing: FilingModel) -> tuple[Any, int, list[Any]]:
        """Build Section 89A - Income from retirement benefit account in notified countries (USA, UK, Canada)."""
        section_89a = filing.foreign_income.section_89a if filing.foreign_income else None

        income_notified_89a_type: list[Any] = []
        notified_89a_amount = 0
        date_range = {
            "Up16Of12To15Of3": 0,
            "Up16Of3To31Of3": 0,
            "Up16Of9To15Of12": 0,
            "Upto15Of6": 0,
            "Upto15Of9": 0,
        }
        
        if section_89a:
            # Calculate total from three countries
            notified_89a_amount = int(
                (section_89a.usa_amount or 0) +
                (section_89a.uk_amount or 0) +
                (section_89a.canada_amount or 0)
            )
            
            # Build country-wise breakup
            income_notified_89a_type = [
                {"NOT89ACountrycode": "US", "NOT89AAmount": section_89a.usa_amount or 0},
                {"NOT89ACountrycode": "UK", "NOT89AAmount": section_89a.uk_amount or 0},
                {"NOT89ACountrycode": "CA", "NOT89AAmount": section_89a.canada_amount or 0},
            ]
            
            # Build quarterly breakup
            date_range = {
                "Up16Of12To15Of3": section_89a.period4 or 0,
                "Up16Of3To31Of3": section_89a.period5 or 0,
                "Up16Of9To15Of12": section_89a.period3 or 0,
                "Upto15Of6": section_89a.period1 or 0,
                "Upto15Of9": section_89a.period2 or 0
            }
        
        section_89a_detail = {
            "OthSrcNatureDesc": "NOT89A",
            "OthSrcOthAmount": notified_89a_amount,
            "NOT89A": income_notified_89a_type,
            "NOT89AInc": {"DateRange": date_range},
        }
        return section_89a_detail, notified_89a_amount, income_notified_89a_type

    def build_scheduleUs24B(self, filing: FilingModel) -> tuple[list[Any], int]:
        """Build Schedule Us24B (house property interest details)."""
        ScheduleUs24BDtls: list[Any] = []
        total_interest_us24b = 0

        for hp in filing.house_property:
            if hp.property_loan:
                ScheduleUs24BDtls.append({
                    "LoanTknFrom": hp.property_loan.lender_name,
                    "BankOrInstnName": hp.property_loan.lender_name,
                    "LoanAccNoOfBankOrInstnRefNo": hp.property_loan.loan_account_number,
                    "DateofLoan": hp.property_loan.loan_sanction_date,
                    "TotalLoanAmt": hp.property_loan.total_loan_amount,
                    "LoanOutstndngAmt": hp.property_loan.loan_outstanding,
                    "InterestUs24B": hp.property_loan.interest_paid,
                })
                total_interest_us24b += int(hp.property_loan.interest_paid or 0)

        return ScheduleUs24BDtls, total_interest_us24b
