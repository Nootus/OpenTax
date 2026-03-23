from typing import Optional
from .api_base_model import ApiBaseModel
from .employer_model import EmployerModel
from .employer_address_model import EmployerAddressModel
from .employment_period_model import EmploymentPeriodModel
from .salary_deduction_16_model import SalaryDeduction16Model
from .salary_section_171_model import SalarySection171Model
from .salary_section_172_model import SalarySection172Model
from .salary_section_173_model import SalarySection173Model


class SalaryModel(ApiBaseModel):
    employer: EmployerModel
    employer_address: Optional[EmployerAddressModel] = None
    employment_period: Optional[EmploymentPeriodModel] = None
    salary_deduction_16: Optional[SalaryDeduction16Model] = None
    salary_section_171: list[SalarySection171Model] = []
    salary_section_172: list[SalarySection172Model] = []
    salary_section_173: list[SalarySection173Model] = []
# EmployerModel