from .api_base_model import ApiBaseModel


class SalaryDeduction16Model(ApiBaseModel):
    """Section 16 Deductions from salary income.
    
    Includes:
    - Standard Deduction (16(ia)) - Rs. 50,000 or salary amount, whichever is less
    - Entertainment Allowance (16(ii)) - For government employees
    - Professional Tax (16(iii)) - Tax on profession/employment
    """
    salary_deduction_id: int | None = None
    filing_id: int | None = None
    employer_id: int | None = None
    standard_deduction: float = 0.0
    entertainment_allowance: float = 0.0
    professional_tax: float = 0.0
# SalarySection16Model
